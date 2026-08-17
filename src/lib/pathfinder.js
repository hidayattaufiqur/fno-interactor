import { getForwardMap, getReverseMap } from '$lib/stores/fkMap'
import { tableDefs } from '$lib/data/flows'
import { getSpecificityMap } from '$lib/stores/specificity'
import { scoreEdge, scorePath, compareV2, classHintFor, isPlumbingTable } from '$lib/pathScoring'

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
 *    ranked by either "shortest" (fewest hops first, then the v2 hierarchy)
 *    or "most unique" (v2 lexicographic comparator, the default).
 *
 * v2 ranking (grill t_3bf36e2e, user-approved 2026-08-17):
 *  - qualityClass (see pathScoring.js) is the PRIMARY separator; the staged
 *    comparator (class → score@2dp → hops → diversity → stable key) ranks the
 *    pool instead of the additive score (Q3, Q12a).
 *  - DFS neighbour ordering is class-aware: branches through document-flow
 *    tables (Transaction/Origin/Line/Party) are explored first so coherent
 *    story paths are never starved by branch budgets (Q12b).
 *  - unique mode is depth-capped by a WINDOW anchored on the plumbing-
 *    filtered shortest distance: effective maxHops = min(requested,
 *    max(filteredShortest + 2, 4)), where the filtered distance ignores
 *    Tmp-star / Dimension-star / derived intermediates (Q6). Raw shortest
 *    stays the reported `shortest` and the shortest-mode behavior.
 *  - Diversity is demoted to a pure post-ranking tiebreak; it never enters
 *    the score (Q3-Q4).
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
 * Plumbing-filtered BFS (Q6): same as boundedBfs but never steps INTO a
 * plumbing table (Tmp-star / Dimension-star / derived) — plumbing tables
 * cannot be intermediates of a coherent path. Distances of plumbing tables
 * themselves are absent (they are not expanded), so a plumbing-only route
 * never anchors the window.
 * @param {string} start
 * @param {number} maxHops
 * @returns {Map<string, number>}
 */
function plumbingFilteredBfs(start, maxHops) {
  const dist = new Map([[start, 0]])
  const queue = [start]
  let head = 0
  while (head < queue.length) {
    const table = queue[head++]
    const d = dist.get(table)
    if (d >= maxHops) continue
    for (const { table: next } of neighbours(table)) {
      if (isPlumbingTable(next)) continue
      if (!dist.has(next)) {
        dist.set(next, d + 1)
        queue.push(next)
      }
    }
  }
  return dist
}

/**
 * Path-diversity term (demoted, Q3-Q4): within the final deduped result set
 * (≤ maxResults), count how many paths share each directed edge; edges used
 * by few paths boost the path (uniqueness). Sets `diversity` on every result
 * — it NEVER enters `score`; it only breaks near-equal ties in the comparator.
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
  }
}

/**
 * Finds all FK paths from `source` to `target` with at most `maxHops` hops.
 *
 * @param {string} source
 * @param {string} target
 * @param {number} maxHops
 * @param {{ maxResults?: number; maxIterations?: number; sort?: 'shortest' | 'unique' }} [opts]
 * @returns {{ results: { steps: { table: string; via: string; edge: object }[]; score: number; diversity: number; breakdown: { plumbing: number; generic: number }; qualityClass: 0|1|2|3; reasonCodes: string[] }[]; shortest: number | null; truncated: boolean; truncation: { levelCap: boolean; totalCap: boolean; iterations: boolean }; missing: string[] }}
 */
export function findPaths(source, target, maxHops, { maxResults = 50, maxIterations = 200000, sort = 'shortest' } = {}) {
  // Missing tables (Q13): a table that appears nowhere in the dataset is
  // reported in `missing`, distinct from "no path within maxHops".
  const forwardMap = getForwardMap()
  const reverseMap = getReverseMap()
  const allTables = new Set()
  if (forwardMap) for (const t of Object.keys(forwardMap)) allTables.add(t)
  if (reverseMap) for (const t of Object.keys(reverseMap)) allTables.add(t)
  const missing = [...new Set([source, target])].filter((t) => !allTables.has(t))
  if (missing.length > 0) {
    return {
      results: [],
      shortest: null,
      truncated: false,
      truncation: { levelCap: false, totalCap: false, iterations: false },
      missing,
    }
  }

  if (source === target) {
    return {
      results: [{
        steps: [{ table: source, via: '' }],
        score: 0,
        diversity: 0,
        breakdown: { plumbing: 0, generic: 0 },
        qualityClass: 0,
        reasonCodes: ['same-table'],
      }],
      shortest: 0,
      truncated: false,
      truncation: { levelCap: false, totalCap: false, iterations: false },
      missing: [],
    }
  }

  // Distance from target (used to steer the DFS) and reachability check.
  const distToTarget = boundedBfs(target, maxHops)
  const shortest = distToTarget.get(source) ?? null
  if (shortest === null) {
    return {
      results: [],
      shortest: null,
      truncated: false,
      truncation: { levelCap: false, totalCap: false, iterations: false },
      missing: [],
    }
  }

  const degrees = getDegrees()
  const documented = getDocumented()
  const specMap = getSpecificityMap()

  // v2 depth window (Q6): unique mode caps the sweep at
  // max(plumbing-filtered shortest + 2, 4); the raw reported `shortest` and
  // shortest-mode behavior stay untouched. No dual shortest+semantic search
  // (Q12c): the window replaces it.
  let effectiveMaxHops = maxHops
  if (sort === 'unique') {
    const filteredShortest = plumbingFilteredBfs(target, maxHops).get(source)
    const window = filteredShortest === undefined ? 4 : Math.max(filteredShortest + 2, 4)
    effectiveMaxHops = Math.min(maxHops, window)
  }

  const results = []
  const seqKeys = [] // parallel to results: table-sequence key per index (eviction bookkeeping)
  const seen = new Map() // table-sequence key → index into results (dedupe)
  let iterations = 0
  let hitLevelCap = false
  let hitTotalCap = false
  let hitIterations = false
  const path = [{ table: source, via: '' }]
  const inPath = new Set([source])

  // Enumerate per hop-count bucket (shortest → effectiveMaxHops). The guided
  // DFS is depth-first, so a single high-scoring subtree can fill a flat cap
  // before shorter paths are reached — bucketing guarantees every hop level
  // is represented (default "fewest hops first" stays correct) while the
  // longest level still surfaces the best-ranked paths.
  const levelCap = maxResults
  const totalCap = Math.max(maxResults * 5, maxResults)
  const buckets = Array.from({ length: effectiveMaxHops + 1 }, () => [])
  // Per-level evaluation budget (Q5): a level is swept until this many
  // completions have been evaluated, so eviction has candidates to choose
  // from without letting one hub level starve the rest of the iteration
  // budget. Per-source-branch cap: each top-level branch contributes at most
  // branchCap completions, so no single subtree (SalesQuotationLine alone
  // yields ~12k level-4 completions) can monopolize the sweep before later
  // branches. Tunable via env for calibration (PF_BRANCH_CAP,
  // PF_LEVEL_ATTEMPTS). Browser-safe env read: the tunables degrade silently
  // when `process` is absent (client bundle).
  const env = typeof process !== 'undefined' ? process.env : {}
  const branchCap = Number(env.PF_BRANCH_CAP) || maxResults / 2
  const levelAttempts = Number(env.PF_LEVEL_ATTEMPTS) || Math.max(levelCap * 3, maxResults * 16)
  const levelEvaluated = Array.from({ length: effectiveMaxHops + 1 }, () => 0)
  const trace = env.PF_TRACE === '1'

  /**
   * Build a result row from a completed path (dedupe/eviction bookkeeping
   * lives in `key`/`hops`).
   */
  function row(steps, score, breakdown, cls, reasons) {
    return {
      steps: steps.map((s) => ({ ...s })),
      score,
      breakdown,
      qualityClass: cls,
      reasonCodes: reasons,
      key: steps.map((s) => s.table).join('>'),
      hops: steps.length - 1,
    }
  }

  /**
   * Sorted valid nexts of a table (memoized — the sort key is independent of
   * the level; only the distance filter varies per hop budget). v2 order
   * (Q12b): class hint desc FIRST — document-flow branches (Transaction/
   * DocumentLine, then Origin, Party) must be explored before the swarm of
   * same-scoring business-key masters, or the story branch starves inside the
   * sweep budgets (measured: the story branch is unreachable under v1 score-
   * first order — the level-4 eval budget dies ~35 branches before it). Then
   * edge score desc, distance asc, degree asc. Distance remains a hard
   * pruning constraint via the filter.
   * @type {Map<string, { n: object; es: number }[]>}
   */
  const nextsCache = new Map()
  function sortedNexts(table) {
    let cached = nextsCache.get(table)
    if (!cached) {
      cached = neighbours(table)
        .map((n) => ({ n, es: scoreEdge(n.edge, (t) => degrees.get(t) ?? 0, documented).score }))
        .sort((a, b) => {
          const ha = classHintFor(a.n.table)
          const hb = classHintFor(b.n.table)
          const da = distToTarget.get(a.n.table) ?? Infinity
          const db = distToTarget.get(b.n.table) ?? Infinity
          return (hb - ha) || (b.es - a.es) || (da - db) || ((degrees.get(a.n.table) ?? 0) - (degrees.get(b.n.table) ?? 0))
        })
      nextsCache.set(table, cached)
    }
    return cached
  }

  /**
   * Guided DFS for exactly `level` hops, confined to one top-level branch.
   * Invariant: each step goes to a neighbour that can still reach the target
   * within the remaining hop budget — so every edge is on some valid path
   * and we never wander off into hub-sprawl. Pool retention (Q12a): a level
   * bucket keeps its BEST paths by the v2 comparator (class → score@2dp →
   * hops → stable key; diversity is unknown in the pool), not the first-found
   * or highest-score ones — when the bucket is full, a newly completed path
   * evicts the bucket's worst by that comparator. The sweep is bounded per
   * branch (branchBudget), per level (levelAttempts) and globally (totalCap,
   * maxIterations), so a pathological query degrades to "best sampled pool"
   * instead of hanging.
   */
  function dfs(current, level, branchBudget) {
    if (results.length >= totalCap) {
      hitTotalCap = true
      return
    }
    if (levelEvaluated[level] >= levelAttempts) return
    if (branchBudget.remaining <= 0) return
    if (current === target) {
      const edges = path.slice(1).map((step) => step.edge)
      const { score, breakdown, qualityClass: cls, reasonCodes: reasons } = scorePath(edges, (t) => degrees.get(t) ?? 0, documented, specMap)
      // Dedupe by table sequence: parallel FK edges between the same tables
      // produce identical paths differing only in the via label. Keep the
      // best-ranking variant (business-key bonus depends on the join fields).
      const candidate = row(path, score, breakdown, cls, reasons)
      const lvl = candidate.hops
      levelEvaluated[lvl] += 1
      branchBudget.remaining -= 1
      if (trace) {
        const srcBranch = path[1]?.table ?? ''
        console.error(`TRACE c${cls} s${score} [${srcBranch}] ${candidate.key} (branchRemaining=${branchBudget.remaining} levelEval=${levelEvaluated[lvl]})`)
      }
      if (seen.has(candidate.key)) {
        const idx = seen.get(candidate.key)
        if (trace) console.error(`TRACE keep-vs idx=${idx} old=c${results[idx].qualityClass}s${results[idx].score} ${results[idx].key} new=c${cls}s${score} ${candidate.key}`)
        if (compareV2(candidate, results[idx], false) < 0) {
          results[idx] = candidate
        }
      } else if (buckets[lvl].length < levelCap) {
        if (trace) console.error(`TRACE add-new idx=${results.length} ${candidate.key}`)
        seen.set(candidate.key, results.length)
        results.push(candidate)
        seqKeys.push(candidate.key)
        buckets[lvl].push(results.length - 1)
      } else {
        // Level bucket full: keep the best-ranked per hop level, not
        // first-found and not highest-score.
        hitLevelCap = true
        let worstIdx = -1
        let worstRow = null
        for (const idx of buckets[lvl]) {
          const r = results[idx]
          if (worstRow === null || compareV2(r, worstRow, false) > 0) {
            worstRow = r
            worstIdx = idx
          }
        }
        if (compareV2(candidate, worstRow, false) < 0) {
          const oldKey = seqKeys[worstIdx]
          if (trace) console.error(`TRACE EVICT c${worstRow.qualityClass}s${worstRow.score} ${oldKey} <- c${candidate.qualityClass}s${candidate.score} ${candidate.key}`)
          if (seen.get(oldKey) === worstIdx) seen.delete(oldKey)
          results[worstIdx] = candidate
          seqKeys[worstIdx] = candidate.key
          seen.set(candidate.key, worstIdx)
        }
      }
      return
    }
    const hopsUsed = path.length - 1
    if (hopsUsed >= level) return
    const remainingAfterStep = level - hopsUsed - 1
    if (remainingAfterStep < 0) return

    for (const { n } of sortedNexts(current)) {
      // Any neighbour that can still reach the target within the remaining
      // hop budget is a valid next step (sideways steps allowed, matching
      // the old BFS result semantics). Neighbours that cannot reach the
      // target in time are pruned — that is where the old BFS wasted work.
      const d = distToTarget.get(n.table)
      if (d === undefined || d > remainingAfterStep) continue
      if (inPath.has(n.table)) continue
      if (results.length >= totalCap) {
        hitTotalCap = true
        break
      }
      if (levelEvaluated[level] >= levelAttempts) break
      if (branchBudget.remaining <= 0) break
      if (++iterations > maxIterations) {
        hitIterations = true
        return
      }
      path.push({ table: n.table, via: n.via, edge: n.edge })
      inPath.add(n.table)
      dfs(n.table, level, branchBudget)
      inPath.delete(n.table)
      path.pop()
    }
  }

  for (let level = shortest; level <= effectiveMaxHops && !hitIterations && results.length < totalCap; level++) {
    // Expand the source's branches one at a time, each with its own budget,
    // so the sweep reaches later branches instead of drowning in the first.
    for (const { n } of sortedNexts(source)) {
      const d = distToTarget.get(n.table)
      if (d === undefined || d > level - 1) continue
      if (n.table === source) continue
      if (results.length >= totalCap) {
        hitTotalCap = true
        break
      }
      if (levelEvaluated[level] >= levelAttempts) break
      if (++iterations > maxIterations) {
        hitIterations = true
        break
      }
      const branchBudget = { remaining: branchCap }
      path.push({ table: n.table, via: n.via, edge: n.edge })
      inPath.add(n.table)
      dfs(n.table, level, branchBudget)
      inPath.delete(n.table)
      path.pop()
    }
  }

  const truncated = hitLevelCap || hitTotalCap || hitIterations

  // Rank the candidate pool by the requested mode, slice to maxResults, then
  // compute the diversity term on the final set (bounded — ≤ maxResults) and
  // re-sort with it as the tiebreak (diversity never enters the score).
  const byMode =
    sort === 'unique'
      ? (a, b) => compareV2(a, b, true)
      : (a, b) => a.hops - b.hops || compareV2(a, b, true)
  if (trace) {
    const c3 = results.filter((x) => x.qualityClass === 3).map((x) => `c${x.qualityClass}s${x.score} ${x.key}`)
    console.error(`POOL-RAW n=${results.length} c3count=${c3.length}\n` + c3.join('\n'))
  }
  results.sort(byMode)
  if (results.length > maxResults) results.length = maxResults
  applyDiversity(results)
  results.sort(byMode)

  return {
    results,
    shortest,
    truncated,
    truncation: { levelCap: hitLevelCap, totalCap: hitTotalCap, iterations: hitIterations },
    missing: [],
  }
}
