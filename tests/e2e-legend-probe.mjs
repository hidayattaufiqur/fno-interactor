// E2E probe for the /find badge tooltips + legend (task t_581a4aa6).
//
// Runs against the production preview build (npm run preview). Verifies:
//   - legend toggles open, contains 3 groups / 10 sections / 11 code rows
//   - tooltip targets exist on badges, chips, captions and notes
//   - hover / keyboard-focus show the shared tooltip with dossier copy
//   - Escape dismisses, outside click dismisses
//   - both sort modes render cleanly
//   - no console/page errors
//
// Usage: node tests/e2e-legend-probe.mjs [baseUrl]

import { chromium as chromiumPkg } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:4173'

const failures = []
const pass = (label) => console.log(`  ok  ${label}`)
const fail = (label, detail = '') => {
  failures.push(label)
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
}
const section = (s) => console.log(`\n## ${s}`)

// ── Helpers ─────────────────────────────────────────────────────────────────

async function tooltipText(page) {
  const tip = page.locator('#find-tip')
  if (!(await tip.count())) return null
  return (await tip.textContent()).trim()
}

async function hoverAndRead(page, selector) {
  await page.hover(selector)
  await page.waitForSelector('#find-tip', { state: 'visible', timeout: 2500 })
  return tooltipText(page)
}

// Commits a table selection: focuses + types the name (real keypresses;
// programmatic fill does not trigger Svelte's input handler here), waits for
// the FK-map-backed suggestion list to render, then clicks the first entry,
// which is the exact match for a full table name.
// @param {import('playwright').Page} page
// @param {string} inputSelector @param {string} name
async function pickTable(page, inputSelector, name) {
  await page.click(inputSelector)
  // clear any pre-existing value from an earlier search
  await page.keyboard.press('ControlOrMeta+a')
  await page.type(inputSelector, name, { delay: 15 })
  const opt = page.locator('.suggestions li').first()
  await opt.waitFor({ state: 'visible', timeout: 15000 })
  await opt.click()
  await page.waitForFunction(
    ({ sel, name }) => document.querySelector(sel).value === name,
    { sel: inputSelector, name },
  )
}

// ── Boot ────────────────────────────────────────────────────────────────────

section('legend')
// The npm playwright is an alpha build whose expected browser revision
// (1219) is absent; the cache holds 1234 and NixOS hosts a system chromium.
// Try each in order, launching with an explicit executablePath.
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join as pjoin } from 'node:path'

const candidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  pjoin(homedir(), '.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell'),
  pjoin(homedir(), '.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'),
  '/home/smolpanda/.nix-profile/bin/chromium',
].filter(Boolean)

let browser = null
for (const exe of candidates) {
  if (!existsSync(exe)) continue
  try {
    browser = await chromiumPkg.launch({ executablePath: exe })
    console.log(`  (launched chromium: ${exe})`)
    break
  } catch (err) {
    console.log(`  (launch failed for ${exe}: ${String(err.message).split('\n')[0]})`)
  }
}
if (!browser) {
  console.error('No usable chromium binary found')
  process.exit(2)
}
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`))

await page.goto(`${BASE}/find`, { waitUntil: 'domcontentloaded' })

// Legend: closed by default, toggles open, dossier content present.
{
  const summary = page.locator('.legend-summary')
  const details = page.locator('details.legend')
  if ((await summary.textContent()).trim() !== 'What do these mean?') {
    fail('legend summary label', JSON.stringify((await summary.textContent()).trim()))
  } else pass('legend summary label')

  if (await details.evaluate((el) => el.open)) fail('legend closed by default')
  else pass('legend closed by default')

  await summary.click()
  await page.waitForSelector('details.legend[open]', { timeout: 2500 })
  pass('legend toggles open on click')

  const groups = await page.locator('.legend-group-heading').allTextContents()
  const wantGroups = ['Path ranking', 'Path quality', 'Notes']
  if (JSON.stringify(groups) !== JSON.stringify(wantGroups)) {
    fail('legend group headings', JSON.stringify(groups))
  } else pass('legend group headings (3 groups)')

  const sectTitles = (await page.locator('.legend-section-title').allTextContents()).map((s) => s.trim())
  const wantSections = [
    'Cleanest path and Top-ranked path',
    'Shortest: N hops',
    'Ranked by class and score',
    'Business flow',
    'Curated',
    'Reason chips',
    'Search space sampled, showing N of M+',
    'X is not in the dataset',
    'Canonical path exists at N hops',
    'Known canonical path',
  ]
  const missing = wantSections.filter((s) => !sectTitles.includes(s))
  if (missing.length) fail('legend section titles (all 9 vocabulary groups)', `missing: ${missing.join(', ')}`)
  else pass(`legend section titles (${wantSections.length} sections, all vocabulary groups)`)
  if (sectTitles.length !== wantSections.length) fail('legend section count', `${sectTitles.length} vs ${wantSections.length}`)

  const codeRows = await page.locator('.legend-table tbody tr').count()
  if (codeRows !== 11) fail('legend reason-code table rows', `${codeRows} vs 11`)
  else pass('legend reason-code table rows (11)')

  const bodyText = await page.locator('.legend-body').textContent()
  const spotchecks = [
    'deterministic tie-breakers after that',
    'Master → Transaction → Origin → Document Line → Party',
    'pinned canonical example selected by the app team',
    '5,607-table dataset',
    'exceeds the selected hop limit',
    'not ranked by the search algorithm',
  ]
  const unFound = spotchecks.filter((s) => !bodyText.includes(s))
  if (unFound.length) fail('legend verbatim copy spot-checks', `missing: ${unFound.join(' | ')}`)
  else pass('legend verbatim copy spot-checks')

  // close it again to keep the page tidy
  await summary.click()
  await page.waitForFunction(() => !document.querySelector('details.legend')?.open)
}

// ── Search 1: InventTable → CustTable, 4 hops, unique ───────────────────────

section('search 1: InventTable → CustTable (4 hops, unique)')
await pickTable(page, '#source-input', 'InventTable')
await pickTable(page, '#target-input', 'CustTable')
await page.selectOption('.hops-select', '4')
await page.getByRole('button', { name: 'Most unique' }).click()
await page.getByRole('button', { name: 'Find paths' }).click()
await page.waitForSelector('.path-list li', { timeout: 30000 })
pass('results rendered')

// Row badges carry tooltip copy.
{
  const badgeCounts = {}
  for (const sel of ['.shortest-badge', '.cleanest-badge', '.class3-badge', '.curated-badge']) {
    const n = await page.locator(sel).count()
    badgeCounts[sel] = n
    const withTip = await page.locator(`${sel}[data-tip]`).count()
    if (n > 0 && withTip !== n) fail(`${sel} missing data-tip (${withTip}/${n})`)
    else if (n > 0) pass(`${sel} present with data-tip (${n})`)
  }
  if (badgeCounts['.class3-badge'] === 0) fail('class3 (Business flow) badge present')
  if (badgeCounts['.cleanest-badge'] === 0) fail('cleanest-path badge present')
}

// Reason chips: container concept tooltip + per-code chip tooltips.
{
  const chips = await page.locator('.reason-chip').count()
  if (chips === 0) fail('reason chips present')
  else {
    pass(`reason chips present (${chips})`)
    const chipWithTip = await page.locator('.reason-chip[data-tip]').count()
    if (chipWithTip !== chips) fail(`every reason chip has data-tip (${chipWithTip}/${chips})`)
    else pass('every reason chip has data-tip')
    const containerTip = await page.locator('.reason-chips[data-tip]').count()
    if (containerTip === 0) fail('reason-chips container carries concept tooltip')
    else pass(`reason-chips container carries concept tooltip (${containerTip})`)
  }
}

// Header caption tooltip targets.
{
  for (const sel of ['[data-tip="Fewest verified FK hops, independent of business meaning."]',
    '[data-tip="Class shows quality tier. Score totals weighted evidence."]']) {
    if (await page.locator(sel).count()) pass(`header caption tooltip target: ${sel.slice(0, 40)}…`)
    else fail(`header caption tooltip target missing: ${sel}`)
  }
}

// Truncated note (4 hops, unique → 20 of many) with tooltip.
{
  const n = await page.locator('[data-tip="Best paths found in a limited search sample, not exhaustive."]').count()
  if (n) pass('sampled/truncated note tooltip target present')
  else fail('sampled/truncated note tooltip target present')
}

// Hover tooltips show dossier one-liners.
{
  const cases = [
    ['.cleanest-badge', 'The #1 row under class, score, and hop ranking.'],
    ['.class3-badge', 'Follows a document flow with continuous document IDs.'],
  ]
  for (const [sel, want] of cases) {
    if (!(await page.locator(sel).count())) continue
    const text = await hoverAndRead(page, sel)
    if (text !== want) fail(`hover ${sel} tooltip`, `"${text}"`)
    else pass(`hover ${sel} → "${want}"`)
  }
  const chipCopy = await page.locator('.reason-chip').first().getAttribute('data-tip')
  const chipText = await hoverAndRead(page, '.reason-chip >> nth=0')
  if (chipText !== chipCopy) fail('hover reason chip tooltip', `"${chipText}" vs "${chipCopy}"`)
  else pass(`hover reason chip → "${chipCopy}"`)

  // Shortest badge (only when it exists for this pair)
  if (await page.locator('.shortest-badge').count()) {
    const text = await hoverAndRead(page, '.shortest-badge')
    if (text !== 'This path uses the fewest verified FK hops found.') fail('hover shortest tooltip', `"${text}"`)
    else pass('hover shortest badge tooltip')
  }
}

// Keyboard focus shows the tooltip; Escape dismisses it.
{
  await page.evaluate(() => document.querySelector('.cleanest-badge').focus())
  await page.waitForSelector('#find-tip', { state: 'visible', timeout: 2500 })
  const text = await tooltipText(page)
  if (text !== 'The #1 row under class, score, and hop ranking.') fail('focus tooltip', `"${text}"`)
  else pass('keyboard focus shows tooltip')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('#find-tip'))
  pass('Escape dismisses tooltip')

  // outside click dismisses a hover-shown tooltip
  await page.hover('.cleanest-badge')
  await page.waitForSelector('#find-tip', { state: 'visible', timeout: 2500 })
  await page.mouse.click(600, 150)
  await page.waitForFunction(() => !document.querySelector('#find-tip'))
  pass('outside click dismisses tooltip')
}

// Tooltip is positioned on-screen (fixed, clamped).
{
  await hoverAndRead(page, '.cleanest-badge')
  const box = await page.locator('#find-tip').boundingBox()
  if (!box || box.x < 0 || box.y < 0 || box.x + box.width > 1280) {
    fail('tooltip positioned within viewport', JSON.stringify(box))
  } else pass('tooltip positioned within viewport')
  await page.mouse.move(0, 0) // leave
}

// ── Sort mode switch ─────────────────────────────────────────────────────────

section('sort modes')
await page.getByRole('button', { name: 'Shortest' }).click()
await page.waitForSelector('.path-list li', { timeout: 30000 })
{
  const mini = await page.locator('.results-header .mini').textContent()
  if (!mini.includes('Fewest hops first')) fail('shortest mode caption', mini.trim())
  else pass('shortest mode caption')
  if (await page.locator('.shortest-badge').count()) pass('shortest badge after mode switch')
  if (await page.locator('.cleanest-badge[data-tip]').count()) pass('cleanest badge still tooltipped')
}
await page.getByRole('button', { name: 'Most unique' }).click()
await page.waitForSelector('.path-list li', { timeout: 30000 })
{
  const mini = await page.locator('.results-header .mini').textContent()
  if (!mini.includes('ranked by class & score')) fail('unique mode caption', mini.trim())
  else pass('unique mode caption (ranked by class & score)')
}

// ── Search 2: InventTable → VendTable, 3 hops → canonical hint + block ───────

section('search 2: InventTable → VendTable (3 hops) — canonical surfaces')
await pickTable(page, '#source-input', 'InventTable')
await pickTable(page, '#target-input', 'VendTable')
await page.selectOption('.hops-select', '3')
await page.getByRole('button', { name: 'Find paths' }).click()
await page.waitForSelector('.path-list li', { timeout: 30000 })

{
  const hint = page.locator('.canonical-hint')
  if (await hint.count()) {
    if (!(await hint.getAttribute('data-tip'))) fail('canonical hint data-tip')
    else pass('canonical hint tooltip target present')
    const text = await hoverAndRead(page, '.canonical-hint')
    if (text !== 'A verified canonical path needs more hops than selected.') fail('canonical hint tooltip', `"${text}"`)
    else pass('canonical hint tooltip copy')
    await page.mouse.move(0, 0)
  } else {
    fail('canonical hint present (expected for InventTable→VendTable at 3 hops)')
  }

  const block = page.locator('.canonical-block')
  if (await block.count()) {
    pass('Known canonical path block present')
    const title = block.locator('.canonical-title')
    if (!(await title.getAttribute('data-tip'))) fail('Known canonical path title data-tip')
    else {
      const text = await hoverAndRead(page, '.canonical-block .canonical-title')
      if (text !== 'Verified chain pinned from documented flows, not algorithm-ranked.') fail('Known canonical path tooltip', `"${text}"`)
      else pass('Known canonical path tooltip copy')
      await page.mouse.move(0, 0)
    }
    if (!(await block.locator('.curated-badge[data-tip]').count())) fail('canonical-block curated badge data-tip')
    else pass('canonical-block curated badge tooltip target')
  } else {
    fail('Known canonical path block present (expected: fixture path exceeds 3 hops)')
  }
}

// ── Search 3: missing-table note ─────────────────────────────────────────────

section('search 3: missing table note')
await page.goto(`${BASE}/find?from=InventTable&to=NoSuchTable`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.finder-empty', { timeout: 30000 })
{
  const note = page.locator('.finder-empty p[data-tip]').first()
  if (!(await note.count())) fail('missing-table note tooltip target')
  else {
    pass('missing-table note tooltip target present')
    const text = await hoverAndRead(page, '.finder-empty p[data-tip]')
    if (text !== 'The named table is absent from the dataset.') fail('missing-table tooltip', `"${text}"`)
    else pass('missing-table tooltip copy')
    await page.mouse.move(0, 0)
  }
}

// ── Errors & verdict ─────────────────────────────────────────────────────────

section('errors')
const realErrors = consoleErrors.filter((e) => !e.includes('favicon'))
if (realErrors.length) fail('no console/page errors', realErrors.join(' | '))
else pass('no console/page errors')

// Tooltip target census
const totalTipTargets = await page.evaluate(() => document.querySelectorAll('[data-tip]').length)
console.log(`\n[tip targets across last page state: ${totalTipTargets}]`)

await browser.close()

const mod = await import('../src/lib/findLegendCopy.js')
const distinctTooltips = Object.keys(mod.TOOLTIP_COPY).length + Object.keys(mod.REASON_TOOLTIP_COPY).length

console.log(`\n=== ${failures.length ? `FAILED (${failures.length})` : 'ALL PASSED'} ===`)
console.log(`tooltip copy sources: ${distinctTooltips} · exercise e2e-ok=${failures.length === 0}`)
process.exit(failures.length ? 1 : 0)