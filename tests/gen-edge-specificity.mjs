// Generate the edge-specificity artifact for v2 ranking (Q7+Q9).
//
// Precomputes edge-use counts from static/data/fk-map.json and ships the
// INVERTED form: common overrides only (pair use-count > 10 → bucket 0-2),
// absent = bucket 3 (rare). Both the web pathfinder (JS) and the FnO MCP
// server (Python) load this exact file, so scores stay identical across
// languages.
//
//   node tests/gen-edge-specificity.mjs
//
// Output: static/data/edge-specificity.json
//   { "<fromField>@<toTable>": bucket, ... }
//
// Bucketing (Q7): uses >1000 → 0, 101-1000 → 1, 11-100 → 2, ≤10 → 3 (absent).
// Deterministic by construction: integer counts only, keys sorted before emit
// so the committed artifact is stable across regenerations.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'static/data/fk-map.json')
const OUT = join(ROOT, 'static/data/edge-specificity.json')

const raw = JSON.parse(readFileSync(SRC, 'utf8'))

// Edge-use count per (childField, parentTable) pair (E3's pair level). For
// every relation triple (parent, parentField, child, childField) the anchor
//   key = `${childField}@${parent}`
// counts how many relations point at the same parent through the same
// child-side field. Because fk-map is ~98% mirrored, a traversal edge
// {from, fromField, to, toField} is looked up with BOTH candidate anchors
// (`fromField@to` and `toField@from`) and the more common one wins (see
// specificityBucketForEdge in pathScoring.js).
const counts = new Map()
for (const [parent, children] of Object.entries(raw)) {
  for (const [_child, _parentField, childField] of children) {
    const key = `${childField}@${parent}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
}

/** Q7 bucket for a raw use count (integers only). */
function bucketFromCount(count) {
  if (count > 1000) return 0
  if (count > 100) return 1
  if (count > 10) return 2
  return 3
}

// Inverted artifact: only entries that are NOT bucket 3 (count > 10).
// Absent keys resolve to bucket 3 at lookup time.
const overrides = {}
let kept = 0
for (const [key, count] of [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
  const bucket = bucketFromCount(count)
  if (bucket < 3) {
    overrides[key] = bucket
    kept++
  }
}

const out = JSON.stringify(overrides, null, 1) + '\n'
writeFileSync(OUT, out)
console.log(`wrote ${OUT}`)
console.log(`${kept} common-override entries (count > 10), ${(out.length / 1024).toFixed(1)} KB (raw counts: ${counts.size} distinct keys)`)