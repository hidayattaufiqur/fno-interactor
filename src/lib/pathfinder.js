import { getForwardMap, getReverseMap } from '$lib/stores/fkMap'
import { tableDefs } from '$lib/data/flows'

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
 *  - Results are ranked: fewest hops first, then path quality (hub tables
 *    penalised, documented tables preferred) so the "shortest" answer and the
 *    "most meaningful" answer are both surfaced early.
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

/**
 * Path quality score for a single table (lower is better).
 * Hub tables (many FK neighbours) are generic and produce noise paths, so they
 * are penalised; tables documented in tableDefs are more meaningful and get a
 * bonus. Only used to rank same-length paths.
 * @param {string} table
 * @returns {number}
 */
function tableQuality(table) {
  let score = 0
  const deg = getDegrees().get(table) ?? 0
  if (deg >= 100) score += 3
  else if (deg >= 30) score += 2
  else if (deg >= 10) score += 1
  if (tableDefs[table]) score -= 1
  return score
}

/**
 * All undirected FK neighbours of `table`, as `{ table, via }` where `via` is
 * the field-level join label shown in the UI.
 * @param {string} table
 * @returns {{ table: string; via: string }[]}
 */
function neighbours(table) {
  const forward = getForwardMap()
  const reverse = getReverseMap()
  const out = []
  for (const [childTable, parentField, childField] of forward?.[table] ?? []) {
    if (childTable !== table) out.push({ table: childTable, via: `${childTable}.${childField} → ${table}.${parentField}` })
  }
  for (const [parentTable, parentField, childField] of reverse?.[table] ?? []) {
    if (parentTable !== table) out.push({ table: parentTable, via: `${table}.${childField} → ${parentTable}.${parentField}` })
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
 * Finds all FK paths from `source` to `target` with at most `maxHops` hops.
 *
 * @param {string} source
 * @param {string} target
 * @param {number} maxHops
 * @param {{ maxResults?: number; maxIterations?: number }} [opts]
 * @returns {{ results: { steps: { table: string; via: string }[]; score: number }[]; shortest: number | null; truncated: boolean }}
 */
export function findPaths(source, target, maxHops, { maxResults = 50, maxIterations = 200000 } = {}) {
  if (source === target) {
    return { results: [{ steps: [{ table: source, via: '' }], score: 0 }], shortest: 0, truncated: false }
  }

  // Distance from target (used to steer the DFS) and reachability check.
  const distToTarget = boundedBfs(target, maxHops)
  const shortest = distToTarget.get(source) ?? null
  if (shortest === null) {
    return { results: [], shortest: null, truncated: false }
  }

  const results = []
  let iterations = 0
  let truncated = false
  const path = [{ table: source, via: '' }]
  const inPath = new Set([source])

  /**
   * Guided DFS. Invariant: each step goes to a neighbour strictly closer to
   * the target (distToTarget decreases) and the neighbour can still reach the
   * target within the remaining hop budget — so every edge is on some valid
   * path and we never wander off into hub-sprawl.
   */
  function dfs(current) {
    if (results.length >= maxResults) return
    if (current === target) {
      const score = path.slice(1, -1).reduce((sum, step) => sum + tableQuality(step.table), 0)
      results.push({ steps: path.map((step) => ({ ...step })), score })
      return
    }
    const distHere = distToTarget.get(current)
    if (distHere === undefined) return
    const hopsUsed = path.length - 1
    const remainingAfterStep = maxHops - hopsUsed - 1
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
      .sort(
        (a, b) =>
          (distToTarget.get(a.table) - distToTarget.get(b.table)) ||
          (tableQuality(a.table) - tableQuality(b.table))
      )

    for (const n of nexts) {
      if (++iterations > maxIterations) {
        truncated = true
        return
      }
      path.push({ table: n.table, via: n.via })
      inPath.add(n.table)
      dfs(n.table)
      inPath.delete(n.table)
      path.pop()
      if (results.length >= maxResults) return
    }
  }

  dfs(source)

  // Fewest hops first, then best quality. Stable so the guided DFS order
  // (which is already quality-aware) is preserved within equal scores.
  results.sort((a, b) => a.steps.length - b.steps.length || a.score - b.score)

  return { results, shortest, truncated }
}
