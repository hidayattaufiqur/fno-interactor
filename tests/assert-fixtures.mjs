// Assert the fixture suite against the live pathfinder (Q9: CI-asserted
// top-K surfacing). Every mustSurface path must appear within `bar`
// (default top-10) of the given mode; named asserts implement the extra
// quality gates (single-subtree, sane top, payment noise).
//
//   node tests/assert-fixtures.mjs
//
// Exit code 0 = all assertions pass. Any failure prints the actual rank and
// the top-10 for that pair.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findPaths } from './harness.mjs'

const ROOT = join(import.meta.dirname, '..')
const FIXTURES = JSON.parse(readFileSync(join(ROOT, 'static/data/path-fixtures.json'), 'utf8'))

// --- named asserts -----------------------------------------------------------

/** Currency->CompanyInfo top-10 must not all route through one subtree. */
function assertTop10NotSingleSubtree(results) {
  const top10 = results.slice(0, 10)
  if (top10.length < 2) return { ok: true } // nothing to diversify
  const firstHops = new Set(top10.map((r) => r.steps[1]?.table))
  return firstHops.size >= 2
    ? { ok: true }
    : { ok: false, detail: `all top-10 share first hop ${[...firstHops].join(', ')} (single subtree)` }
}

const PLUMBING_PATTERN = /Tmp|Dimension|Statistics|Totaling|Snapshot|BIAnalysis|Printout|Buffer|WorkTable|Parm|ForProcessing/

// Top-10 must contain no Tmp-star / Dimension-star plumbing intermediates
// and the top score must be positive.
function assertTop10Sane(results) {
  const top10 = results.slice(0, 10)
  const problems = []
  if (top10[0]?.score <= 0) problems.push(`top score ${top10[0]?.score} is not positive`)
  for (const [i, r] of top10.entries()) {
    const inter = r.steps.slice(1, -1).map((s) => s.table)
    const dirty = inter.filter((t) => PLUMBING_PATTERN.test(t))
    if (dirty.length) problems.push(`rank ${i + 1} has plumbing intermediate(s): ${dirty.join(', ')}`)
  }
  return problems.length ? { ok: false, detail: problems.join('; ') } : { ok: true }
}

/** Top-10 must not be dominated by payment-posting noise tables. */
const PAYMENT_NOISE = new Set([
  'CustTrans', 'VendTrans', 'LedgerTrans', 'TaxTrans', 'SpecTrans',
  'CustSettlement', 'VendSettlement', 'LedgerJournalTrans',
  'GeneralJournalEntry', 'GeneralJournalAccountEntry',
])
function assertTop10NoPaymentNoise(results) {
  const top10 = results.slice(0, 10)
  const hits = []
  for (const [i, r] of top10.entries()) {
    const noise = r.steps.filter((s) => PAYMENT_NOISE.has(s.table))
    if (noise.length) hits.push(`rank ${i + 1} contains ${noise.map((s) => s.table).join(',')}`)
  }
  if (hits.length >= 3) return { ok: false, detail: `payment noise in ${hits.length}/10 of top-10: ${hits.slice(0, 3).join('; ')}` }
  return { ok: true }
}

const ASSERT_IMPL = {
  'top10-not-single-subtree': assertTop10NotSingleSubtree,
  'top10-sane': assertTop10Sane,
  'top10-no-payment-noise': assertTop10NoPaymentNoise,
}

// --- run ---------------------------------------------------------------------

let failures = 0
for (const f of FIXTURES.pairs) {
  const res = findPaths(f.source, f.target, f.maxHops, { sort: f.mode ?? 'unique' })
  const bar = f.bar === 'top-10' ? 10 : Number.parseInt(String(f.bar).replace('top-', ''), 10) || 10
  const top = res.results.slice(0, bar)
  const problems = []

  for (const must of f.mustSurface ?? []) {
    const seq = must.join('>')
    const rank = top.findIndex((r) => r.steps.map((s) => s.table).join('>') === seq)
    if (rank === -1) {
      problems.push(`mustSurface ${seq} NOT in top-${bar} (shortest=${res.shortest}, truncated=${res.truncated} ${JSON.stringify(res.truncation)})`)
    }
  }
  for (const a of f.asserts ?? []) {
    const impl = ASSERT_IMPL[a]
    if (!impl) {
      problems.push(`unknown assert: ${a}`)
      continue
    }
    const verdict = impl(res.results)
    if (!verdict.ok) problems.push(`assert ${a}: ${verdict.detail}`)
  }

  if (problems.length) {
    failures++
    console.log(`FAIL ${f.id} (${f.source}->${f.target}, ${f.mode ?? 'unique'}, maxHops=${f.maxHops}):`)
    for (const p of problems) console.log(`   - ${p}`)
    console.log('   top results:')
    for (const [i, r] of res.results.slice(0, bar).entries()) {
      console.log(`     ${i + 1}. ${r.score.toFixed(3)}  ${r.steps.map((s) => s.table).join('>')}`)
    }
  } else {
    console.log(`ok   ${f.id}`)
  }
}

console.log(`\n${FIXTURES.pairs.length} fixtures asserted.`)
if (failures) {
  console.log(`${failures} fixture(s) FAILED.`)
  process.exit(1)
}
console.log('All fixtures pass.')
