// Dump top-10 unique-mode + full shortest-mode results for all fixture pairs
// plus the 5 canonical pairs. Used for before/after evidence.
//   node tests/evidence.mjs [outdir]   (outdir defaults to ./tests/.evidence)
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findPaths } from './harness.mjs'

const outdir = process.argv[2] ?? join(import.meta.dirname, '.evidence')
mkdirSync(outdir, { recursive: true })

const ROOT = join(import.meta.dirname, '..')
const FIXTURES = JSON.parse(readFileSync(join(ROOT, 'static/data/path-fixtures.json'), 'utf8'))

// Canonical pairs (grill F2) + every fixture pair, deduped by id.
const CANONICAL = [
  { id: 'canon-inventdim-companyinfo', source: 'InventDim', target: 'CompanyInfo', maxHops: 5 },
  { id: 'canon-inventtable-custtable', source: 'InventTable', target: 'CustTable', maxHops: 4 },
  { id: 'canon-purchline-salesline', source: 'PurchLine', target: 'SalesLine', maxHops: 2 },
  { id: 'canon-salestable-purchtable', source: 'SalesTable', target: 'PurchTable', maxHops: 2 },
  { id: 'canon-currency-companyinfo', source: 'Currency', target: 'CompanyInfo', maxHops: 4 },
]
const PAIRS = [...CANONICAL]
for (const f of FIXTURES.pairs) {
  if (!PAIRS.some((p) => p.source === f.source && p.target === f.target && p.maxHops === f.maxHops)) {
    PAIRS.push({ id: f.id, source: f.source, target: f.target, maxHops: f.maxHops })
  }
}

const report = { generated: new Date().toISOString(), pairs: [] }
for (const p of PAIRS) {
  const unique = findPaths(p.source, p.target, p.maxHops, { sort: 'unique' })
  const shortest = findPaths(p.source, p.target, p.maxHops, { sort: 'shortest' })
  report.pairs.push({
    ...p,
    shortestHops: unique.shortest,
    truncated: unique.truncated,
    truncation: unique.truncation,
    uniqueTop10: unique.results.slice(0, 10).map((r) => ({
      tables: r.steps.map((s) => s.table),
      score: Math.round(r.score * 1e6) / 1e6,
      hops: r.steps.length - 1,
    })),
    uniquePoolSize: unique.results.length,
    shortestTop10: shortest.results.slice(0, 10).map((r) => ({
      tables: r.steps.map((s) => s.table),
      score: Math.round(r.score * 1e6) / 1e6,
      hops: r.steps.length - 1,
    })),
    shortestFull: shortest.results.map((r) => ({
      steps: r.steps.map((s) => ({ table: s.table, via: s.via })),
      score: Math.round(r.score * 1e6) / 1e6,
      diversity: Math.round(r.diversity * 1e6) / 1e6,
      breakdown: r.breakdown,
    })),
  })
}

writeFileSync(join(outdir, 'report.json'), JSON.stringify(report, null, 2))
console.log(`wrote ${join(outdir, 'report.json')} (${PAIRS.length} pairs)`)
