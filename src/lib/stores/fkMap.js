import { writable } from 'svelte/store'

/** @typedef {[string, string, string]} FkEdge  [childTable, parentField, childField] */
/** @typedef {Record<string, FkEdge[]>} FkForwardMap */

// ── Module-level cache (survives navigation) ───────────────────────────────

/** @type {FkForwardMap | null} */
let forwardMap = null

/** @type {Record<string, [string, string, string][]>}  child → [[parentTable, parentField, childField], ...] */
let reverseMap = {}

// ── Reactive load state ────────────────────────────────────────────────────

export const fkLoadState = writable(/** @type {'idle'|'loading'|'ready'|'error'} */ ('idle'))
export const fkLoadError = writable('')

// ── Loader ─────────────────────────────────────────────────────────────────

export async function loadFkMap() {
  if (forwardMap) {
    fkLoadState.set('ready')
    return
  }
  fkLoadState.set('loading')
  try {
    const res = await fetch('/data/fk-map.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    forwardMap = await res.json()
    buildReverseMap()
    fkLoadState.set('ready')
  } catch (err) {
    fkLoadError.set(err instanceof Error ? err.message : String(err))
    fkLoadState.set('error')
  }
}

function buildReverseMap() {
  reverseMap = {}
  for (const [parentTable, children] of Object.entries(forwardMap)) {
    for (const [childTable, parentField, childField] of children) {
      if (!reverseMap[childTable]) reverseMap[childTable] = []
      reverseMap[childTable].push([parentTable, parentField, childField])
    }
  }
}

// ── Data accessors (only valid after load) ─────────────────────────────────

/**
 * Returns the raw forward map (for BFS pathfinding in /find).
 * @returns {FkForwardMap | null}
 */
export function getForwardMap() { return forwardMap }

/**
 * Returns the raw reverse map (for BFS pathfinding in /find).
 * @returns {Record<string, [string, string, string][]>}
 */
export function getReverseMap() { return reverseMap }
export function getAllFkTableNames() {
  if (!forwardMap) return []
  const names = new Set(Object.keys(forwardMap))
  for (const table of Object.keys(reverseMap)) names.add(table)
  return [...names].sort()
}

/**
 * Returns schema FK edges for `tableName`, optionally filtered to a
 * set of known tables (to avoid overwhelming graphs with 400+ neighbors).
 *
 * Each edge matches the RelationGraph / Stage.relations shape:
 *   { from, to, fields: ["ChildTable.childField → ParentTable.parentField"], source: 'schema' }
 *
 * @param {string} tableName
 * @param {Set<string>} [knownTables]  If provided, only include neighbors in this set
 * @param {number} [limit]             Max edges to return (default 24)
 * @returns {{ from: string; to: string; fields: string[]; source: 'schema' }[]}
 */
export function getSchemaEdgesForTable(tableName, knownTables, limit = 24) {
  if (!forwardMap) return []

  /** @type {{ from: string; to: string; fields: string[]; source: 'schema' }[]} */
  const edges = []

  // Outgoing: tableName is the child → it has FK fields pointing to parents
  for (const [parentTable, parentField, childField] of reverseMap[tableName] ?? []) {
    if (knownTables && !knownTables.has(parentTable)) continue
    edges.push({
      from: tableName,
      to: parentTable,
      fields: [`${tableName}.${childField} → ${parentTable}.${parentField}`],
      source: 'schema',
    })
    if (edges.length >= limit) return edges
  }

  // Incoming: tableName is the parent → other tables have FK fields pointing to it
  for (const [childTable, parentField, childField] of forwardMap[tableName] ?? []) {
    if (knownTables && !knownTables.has(childTable)) continue
    edges.push({
      from: childTable,
      to: tableName,
      fields: [`${childTable}.${childField} → ${tableName}.${parentField}`],
      source: 'schema',
    })
    if (edges.length >= limit) return edges
  }

  return edges
}

/**
 * Returns all FK connections between any two tables in `tableSet`
 * (for auto-enriching a stage that lists multiple tables).
 *
 * @param {string[]} tables
 * @returns {{ from: string; to: string; fields: string[]; source: 'schema' }[]}
 */
export function getFkEdgesBetween(tables) {
  if (!forwardMap) return []
  const tableSet = new Set(tables)
  /** @type {{ from: string; to: string; fields: string[]; source: 'schema' }[]} */
  const edges = []
  for (const tableName of tables) {
    for (const [parentTable, parentField, childField] of reverseMap[tableName] ?? []) {
      if (tableSet.has(parentTable)) {
        edges.push({
          from: tableName,
          to: parentTable,
          fields: [`${tableName}.${childField} → ${parentTable}.${parentField}`],
          source: 'schema',
        })
      }
    }
  }
  return edges
}
