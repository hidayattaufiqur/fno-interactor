import { getForwardMap, getReverseMap } from '$lib/stores/fkMap'
import { tableDefs } from '$lib/data/flows'
import { scoreEdge, scorePath } from '$lib/pathScoring'

/**
 * Table Path Finder — improved pathfinding for the 5.6k-node FK graph.
 *
 * Why this algorithm instead of the old BFS:
 *  - The old BFS (`findPaths` inside /find) used per-path visited sets and
 *    `queue.shift()`, which explodes combinatorially through hub tables
 *    (Currency has 615 neighbours, InventTable 552, VendTable 401…).
 *    A 3-hop query like InventDim → CompanyInfo took ~3.6 s.
 *  - This implementation runs a bounded bidirectional BFS to compute the
 *    distance from every node to the target, then enumerates paths with a
 *    guided DFS that only steps towards the target (distance must strictly
 *    decrease, and the neighbour must still be able to reach the target
 *    within the remaining hop budget). Work is bounded by maxIterations so a
 *    pathological query degrades to "show first N paths" instead of hanging.
 *  - Results are deduped by table sequence (parallel FK edges between the
 *    same two tables previously produced identical duplicate paths) and
 *    ranked by either "shortest" (fewest hops first, then semantic score,
 *    the default) or "most unique" (semantic score desc, then hops). The
 *    semantic score is the sum of per-edge weights from src/lib/pathScoring.js:
 *    plumbing and hub links penalised, business-key and documented-table
 *    links promoted, plus a path-diversity term (edges used by few paths in
 *    the result set boost the path).
 */

// ── Degree index (computed once, lazily) ───────────────────────────────────

/** @type {Map<string, number> | null}  table → number of distinct FK neighbours */
let degreeMap = null

/**
 * Builds table → distinct-neighbour count on first use.
 * @returns {Map<string, number>}
 */
function getDegrees() {
  if (degreeMap) return degreeMap
  const forward = getForwardMap()
  const reverse = getReverseMap()
  degreeMap = new Map()
  const touch = (table) => {
    if (!degreeMap.has(table)) degreeMap.set(table, 0)
  }
  const bump = (table) => {
    touch(table)
    degreeMap.set(table, degreeMap.get(table) + 1)
  }
  for (const [parent, children] of Object.entries(forward ?? {})) {
    touch(parent)
    for (const [child] of children) {
      touch(child)
      bump(child)
      bump(parent)
    }
  }
  return degreeMap
}

/** @type {Set<string> | null}  tables with a curated tableDef entry */
let documentedSet = null

/** @returns {Set<string>} */
function getDocumented() {
  if (!documentedSet) documentedSet = new Set(Object.keys(tableDefs))
  return documentedSet
}

/**
 * All undirected FK neighbours of `table`, as `{ table, via, edge }` where
 * `via` is the field-level join label shown in the UI and `edge` is the
 * structured join in traversal direction (from = current table).
 * @param {string} table
 * @returns {{ table: string; via: string; edge: { from: string; fromField: string; to: string; toField: string } }[]}
 */
function neighbours(table) {
  const forward = getForwardMap()
  const reverse = getReverseMap()
  const out = []
  for (const [childTable, parentField, childField] of forward?.[table] ?? []) {
    if (childTable !== table) {
      out.push({
        table: childTable,
        via: `${childTable}.${childField} → ${table}.${parentField}`,
        edge: { from: table, fromField: parentField, to: childTable, toField: childField },
      })
    }
  }
  for (const [parentTable, parentField, childField] of reverse?.[table] ?? []) {
    if (parentTable !== table) {
      out.push({
        table: parentTable,
        via: `${table}.${childField} → ${parentTable}.${parentField}`,
        edge: { from: table, fromField: childField, to: parentTable, toField: parentField },
      })
    }
  }
  return out
}

/**
 * Bounded BFS from `start`, recording distance to every reachable node
 * (cap: maxHops). Returns Map<table, distance>.
 * @param {string} start
 * @param {number} maxHops
 * @returns {Map<string, number>}
 */
function boundedBfs(start, maxHops) {
  const dist = new Map([[start, 0]])
  const queue = [start]
  let head = 0
  while (head < queue.length) {
    const table = queue[head++]
    const d = dist.get(table)
    if (d >= maxHops) continue
    for (const { table: next } of neighbours(table)) {
      if (!dist.has(next)) {
        dist.set(next, d + 1)
        queue.push(next)
      }
    }
  }
  return dist
}

/**
 * Path-diversity term: within the final deduped result set (≤ maxResults),
 * count how many paths share each directed edge; edges used by few paths
 * boost the path (uniqueness). Adds `diversity` and folds it into `score`.
 * @param {{ steps: { edge: { from: string; fromField: string; to: string; toField: string } }[] }[]} results
 */
function applyDiversity(results) {
  if (results.length <= 1) {
    for (const r of results) r.diversity = 0
    return
  }
  const counts = new Map()
  for (const r of results) {
    for (const step of r.steps.slice(1)) {
      const key = `${step.edge.from}.${step.edge.fromField}->${step.edge.to}.${step.edge.toField}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  for (const r of results) {
    let diversity = 0
    for (const step of r.steps.slice(1)) {
      const key = `${step.edge.from}.${step.edge.fromField}->${step.edge.to}.${step.edge.toField}`
      diversity += 1 / counts.get(key)
    }
    r.diversity = diversity
    r.score += diversity
  }
}

/**
 * Finds all FK paths from `source` to `target` with at most `maxHops` hops.
 *
 * @param {string} source
 * @param {string} target
 * @param {number} maxHops
 * @param {{ maxResults?: number; maxIterations?: number; sort?: 'shortest' | 'unique' }} [opts]
 * @returns {{ results: { steps: { table: string; via: string; edge: object }[]; score: number; diversity: number; breakdown: { plumbing: number; generic: number } }[]; shortest: number | null; truncated: boolean }}
 */
export function findPaths(source, target, maxHops, { maxResults = 50, maxIterations = 200000, sort = 'shortest' } = {}) {
  if (source === target) {
    return {
      results: [{ steps: [{ table: source, via: '' }], score: 0, diversity: 0, breakdown: { plumbing: 0, generic: 0 } }],
      shortest: 0,
      truncated: false,
    }
  }

  // Distance from target (used to steer the DFS) and reachability check.
  const distToTarget = boundedBfs(target, maxHops)
  const shortest = distToTarget.get(source) ?? null
  if (shortest === null) {
    return { results: [], shortest: null, truncated: false }
  }

  const degrees = getDegrees()
  const documented = getDocumented()

  const results = []
  const seen = new Map() // table-sequence key → index into results (dedupe)
  let iterations = 0
  let truncated = false
  const path = [{ table: source, via: '' }]
  const inPath = new Set([source])

  // Enumerate per hop-count bucket (shortest → maxHops). The guided DFS is
  // depth-first and score-ordered, so a single high-scoring subtree can fill
  // a flat cap before shorter paths are reached — bucketing guarantees every
  // hop level is represented (default "fewest hops first" stays correct)
  // while the longest level still surfaces the best-scored paths.
  const levelCap = maxResults
  const totalCap = Math.max(maxResults * 5, maxResults)
  const buckets = Array.from({ length: maxHops + 1 }, () => [])

  /**
   * Guided DFS for exactly `level` hops. Invariant: each step goes to a
   * neighbour that can still reach the target within the remaining hop
   * budget — so every edge is on some valid path and we never wander off
   * into hub-sprawl. Neighbours are ordered by distance to the target first
   * (closer branches complete sooner, keeping enumeration cheap), then by
   * semantic edge score (high-quality branches before generic ones, so the
   * capped pool is rich in meaningful paths), then by degree (specific
   * tables before hubs).
   */
  function dfs(current, level) {
    if (buckets[level].length >= levelCap || results.length >= totalCap) return
    if (current === target) {
      const edges = path.slice(1).map((step) => step.edge)
      const { score, breakdown } = scorePath(edges, (t) => degrees.get(t) ?? 0, documented)
      // Dedupe by table sequence: parallel FK edges between the same tables
      // produce identical paths differing only in the via label. Keep the
      // best-scoring variant (business-key bonus depends on the join fields).
      const key = path.map((step) => step.table).join('>')
      const lvl = path.length - 1
      if (seen.has(key)) {
        const idx = seen.get(key)
        if (score > results[idx].score) {
          results[idx] = { steps: path.map((step) => ({ ...step })), score, breakdown }
        }
      } else if (buckets[lvl].length < levelCap) {
        seen.set(key, results.length)
        results.push({ steps: path.map((step) => ({ ...step })), score, breakdown })
        buckets[lvl].push(results.length - 1)
      }
      return
    }
    const hopsUsed = path.length - 1
    if (hopsUsed >= level) return
    const remainingAfterStep = level - hopsUsed - 1
    if (remainingAfterStep < 0) return

    const nexts = neighbours(current)
      .filter((n) => {
        // Any neighbour that can still reach the target within the remaining
        // hop budget is a valid next step (sideways steps allowed, matching
        // the old BFS result semantics). Neighbours that cannot reach the
        // target in time are pruned — that is where the old BFS wasted work.
        const d = distToTarget.get(n.table)
        return d !== undefined && d <= remainingAfterStep && !inPath.has(n.table)
      })
      .map((n) => ({ n, es: scoreEdge(n.edge, (t) => degrees.get(t) ?? 0, documented).score }))
      .sort(
        (a, b) =>
          (distToTarget.get(a.n.table) - distToTarget.get(b.n.table)) ||
          (b.es - a.es) ||
          // Prefer specific (low-degree) intermediates over hubs on ties, so
          // business-table branches are explored before generic/stats ones.
          ((degrees.get(a.n.table) ?? 0) - (degrees.get(b.n.table) ?? 0))
      )

    for (const { n } of nexts) {
      if (buckets[level].length >= levelCap || results.length >= totalCap) break
      if (++iterations > maxIterations) {
        truncated = true
        return
      }
      path.push({ table: n.table, via: n.via, edge: n.edge })
      inPath.add(n.table)
      dfs(n.table, level)
      inPath.delete(n.table)
      path.pop()
    }
  }

  for (let level = shortest; level <= maxHops && !truncated; level++) {
    dfs(source, level)
  }

  // Rank the candidate pool by the requested mode, slice to maxResults, then
  // compute the diversity term on the final set (bounded — ≤ maxResults) and
  // re-sort, since diversity can shift ordering within the slice.
  const byMode =
    sort === 'unique'
      ? (a, b) => b.score - a.score || a.steps.length - b.steps.length
      : (a, b) => a.steps.length - b.steps.length || b.score - a.score
  results.sort(byMode)
  if (results.length > maxResults) results.length = maxResults
  applyDiversity(results)
  results.sort(byMode)

  return { results, shortest, truncated }
}
