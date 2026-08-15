<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { tableDefs } from '$lib/data/flows'
  import { canonicalModule } from '$lib/utils'
  import { findState } from '$lib/stores/findState'
  import { fkLoadState, fkLoadError, loadFkMap, getAllFkTableNames } from '$lib/stores/fkMap'
  import { findPaths } from '$lib/pathfinder'

  // ── Bind store fields to local vars for template convenience ───────────────

  let sourceInput = $findState.sourceInput
  let targetInput = $findState.targetInput
  let sourceTable = $findState.sourceTable
  let targetTable = $findState.targetTable
  let maxHops = $findState.maxHops
  let sortMode = $findState.sortMode
  let pathResults = $findState.pathResults
  let searchState = $findState.searchState
  let searchError = $findState.searchError
  let truncated = $findState.truncated
  let shortestHops = $findState.shortestHops
  let missing = $findState.missing

  // Sync local vars back to store on any change
  $: findState.set({ sourceInput, targetInput, sourceTable, targetTable, maxHops, sortMode, pathResults, searchState, searchError, truncated, shortestHops, missing })

  // ── Deep links (?from=X&to=Y) ──────────────────────────────────────────────

  // Reads ?from=&to= on first load and kicks off a search if both are valid.
  onMount(() => {
    const from = $page.url.searchParams.get('from')
    const to = $page.url.searchParams.get('to')
    if (from && to) {
      sourceTable = from
      sourceInput = from
      targetTable = to
      targetInput = to
      handleFind()
    } else if (from) {
      sourceTable = from
      sourceInput = from
    } else if (to) {
      targetTable = to
      targetInput = to
    }
  })

  // ── Autocomplete ───────────────────────────────────────────────────────────

  // @type {string[]}
  let sourceSuggestions = []
  // @type {string[]}
  let targetSuggestions = []

  // Rebuilt once FK map loads; empty until then
  $: allKnownTables = $fkLoadState === 'ready' ? getAllFkTableNames() : []

  // Returns up to 12 matches, ranking exact prefix matches above substring matches.
  // @param {string} query @param {string} selected
  function getSuggestions(query, selected) {
    const q = query.trim().toLowerCase()
    if (q.length < 2 || query === selected) return []
    const prefixMatches = []
    const substringMatches = []
    for (const tableName of allKnownTables) {
      const lower = tableName.toLowerCase()
      if (lower === q) return [tableName]
      if (lower.startsWith(q)) prefixMatches.push(tableName)
      else if (lower.includes(q)) substringMatches.push(tableName)
      if (prefixMatches.length + substringMatches.length >= 40) break
    }
    return [...prefixMatches, ...substringMatches].slice(0, 12)
  }

  $: sourceSuggestions = getSuggestions(sourceInput, sourceTable)
  $: targetSuggestions = getSuggestions(targetInput, targetTable)

  // @param {string} name
  function selectSource(name) {
    sourceTable = name
    sourceInput = name
    sourceSuggestions = []
  }

  // @param {string} name
  function selectTarget(name) {
    targetTable = name
    targetInput = name
    targetSuggestions = []
  }

  // Swap source and target tables.
  function swapTables() {
    const s = sourceTable || sourceInput
    const t = targetTable || targetInput
    sourceTable = t
    sourceInput = t
    targetTable = s
    targetInput = s
    sourceSuggestions = []
    targetSuggestions = []
  }

  // @param {KeyboardEvent} e @param {'source' | 'target'} which
  function handleInputKey(e, which) {
    const suggestions = which === 'source' ? sourceSuggestions : targetSuggestions
    if (e.key === 'Enter' && suggestions.length > 0) {
      which === 'source' ? selectSource(suggestions[0]) : selectTarget(suggestions[0])
    } else if (e.key === 'Escape') {
      which === 'source' ? (sourceSuggestions = []) : (targetSuggestions = [])
    }
  }

  // Kick off pre-loading on first keypress to reduce perceived latency
  function handleFirstType() {
    if ($fkLoadState === 'idle') loadFkMap()
  }

  // ── Pathfinding ────────────────────────────────────────────────────────────

  async function handleFind() {
    searchError = ''
    pathResults = []
    truncated = false
    shortestHops = null
    missing = []

    if (!sourceTable || !targetTable) {
      searchError = 'Pick both a source and a target table first.'
      return
    }

    if ($fkLoadState !== 'ready') {
      searchState = 'running'
      await loadFkMap()
      if ($fkLoadState === 'error') {
        searchState = 'idle'
        searchError = `Failed to load FK data: ${$fkLoadError}`
        return
      }
    }

    searchState = 'running'
    await new Promise((resolve) => setTimeout(resolve, 0))
    const { results, shortest, truncated: wasTruncated, missing: missingTables } = findPaths(sourceTable, targetTable, maxHops, { sort: sortMode })
    pathResults = results
    shortestHops = shortest
    truncated = wasTruncated
    missing = missingTables
    searchState = 'done'
    // Fixture file is optional enrichment for hints / known paths. Load it
    // lazily after the search so it never sits on the main data path.
    loadCanonicalFixtures()
  }

  // ── Fixture-driven canonical paths (Q8) ────────────────────────────────────

  // Lazy, cached, failure-silent: the fixture file only powers the
  // "canonical path" hint and pinned row. If it fails to load, the search
  // results are unaffected.
  // @type {Array<object> | null}
  let canonicalFixtures = null
  let canonicalLoadAttempted = false

  async function loadCanonicalFixtures() {
    if (canonicalLoadAttempted) return
    canonicalLoadAttempted = true
    try {
      const res = await fetch('/data/path-fixtures.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      canonicalFixtures = (await res.json()).pairs ?? []
    } catch {
      canonicalFixtures = []
    }
  }

  // Fixtures whose source/target match the queried pair, in the same
  // direction (a fixture asserts a directed chain; flipping it would imply
  // a different statement than the one validated against the dataset).
  $: canonicalForPair = canonicalFixtures
    ? canonicalFixtures.filter((f) => f.source === sourceTable && f.target === targetTable)
    : []

  // Every mustSurface path from the matched fixtures, deduped by sequence.
  $: canonicalPaths = (() => {
    const seen = new Set()
    const out = []
    for (const f of canonicalForPair) {
      for (const path of f.mustSurface ?? []) {
        const key = path.join('>')
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ fixtureId: f.id, path, hops: path.length - 1 })
      }
    }
    return out
  })()

  // Canonical paths that are not already in the result list get pinned as
  // known-good rows (fixture #1's story path never ranks; this is its home).
  $: resultKeys = new Set(pathResults.map((r) => r.steps.map((s) => s.table).join('>')))
  $: canonicalToShow = canonicalPaths.filter((c) => !resultKeys.has(c.path.join('>')))

  // Q8 hint: a canonical path exists above the current maxHops selection.
  $: canonicalHint = (() => {
    const above = canonicalPaths.filter((c) => c.hops > maxHops)
    return above.length ? { hops: Math.min(...above.map((c) => c.hops)) } : null
  })()

  // Index of the top-scoring (cleanest) path in the current result set.
  $: cleanestIndex = pathResults.reduce(
    (best, r, i, arr) => (r.score > (arr[best]?.score ?? -Infinity) ? i : best),
    0
  )

  // Switch sort order: re-run the search so the result pool is sliced for the
  // active mode (shortest vs unique pick different top-50 sets).
  function changeSort(mode) {
    if (mode === sortMode) return
    sortMode = mode
    if (sourceTable && targetTable) handleFind()
  }
</script>

<svelte:head>
  <title>Find Table Path · D365FO Navigator</title>
</svelte:head>

<header class="hero">
  <div>
    <p class="eyebrow">Dynamics 365 Finance &amp; Operations</p>
    <h2>Table Path Finder</h2>
    <p class="lede">
      Discover the FK relationship chain between any two D365FO tables. Uses
      <strong>37,443 verified associations</strong> across 5,607 tables — the full Microsoft Dynamics
      database graph.
    </p>
  </div>
</header>

<section class="finder-section">
  <div class="finder-form">
    <!-- Source table input -->
    <div class="table-input-group">
      <label for="source-input">From table</label>
      <div class="autocomplete-wrap">
        <input
          id="source-input"
          type="text"
          placeholder="e.g. SalesLine"
          bind:value={sourceInput}
          on:input={() => { handleFirstType(); sourceTable = '' }}
          on:keydown={(e) => handleInputKey(e, 'source')}
          autocomplete="off"
          spellcheck="false"
        />
        {#if sourceSuggestions.length > 0}
          <ul class="suggestions" role="listbox">
            {#each sourceSuggestions as name}
              <li role="option" aria-selected="false">
                <button on:click={() => selectSource(name)}>
                  <span class="suggest-name">{name}</span>
                  {#if tableDefs[name]}
                    <span class="suggest-mod" data-module={canonicalModule(tableDefs[name].module)}>
                      {canonicalModule(tableDefs[name].module) ?? ''}
                    </span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <div class="finder-arrow" aria-hidden="true">
      <button class="swap-btn" on:click={swapTables} title="Swap source and target" aria-label="Swap source and target tables">
        ⇄
      </button>
    </div>

    <!-- Target table input -->
    <div class="table-input-group">
      <label for="target-input">To table</label>
      <div class="autocomplete-wrap">
        <input
          id="target-input"
          type="text"
          placeholder="e.g. CustTable"
          bind:value={targetInput}
          on:input={() => { handleFirstType(); targetTable = '' }}
          on:keydown={(e) => handleInputKey(e, 'target')}
          autocomplete="off"
          spellcheck="false"
        />
        {#if targetSuggestions.length > 0}
          <ul class="suggestions" role="listbox">
            {#each targetSuggestions as name}
              <li role="option" aria-selected="false">
                <button on:click={() => selectTarget(name)}>
                  <span class="suggest-name">{name}</span>
                  {#if tableDefs[name]}
                    <span class="suggest-mod" data-module={canonicalModule(tableDefs[name].module)}>
                      {canonicalModule(tableDefs[name].module) ?? ''}
                    </span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <!-- Options + action -->
    <div class="finder-controls">
      <label class="hops-label">
        Max hops
        <select bind:value={maxHops} class="hops-select">
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </label>

      <fieldset class="sort-fieldset">
        <legend class="sort-label">Sort</legend>
        <div class="sort-toggle" role="group" aria-label="Path sort order">
          <button
            type="button"
            class="sort-btn"
            class:sort-active={sortMode === 'shortest'}
            on:click={() => changeSort('shortest')}
          >Shortest</button>
          <button
            type="button"
            class="sort-btn"
            class:sort-active={sortMode === 'unique'}
            on:click={() => changeSort('unique')}
          >Most unique</button>
        </div>
      </fieldset>

      <button class="find-btn" on:click={handleFind} disabled={searchState === 'running'}>
        {#if searchState === 'running'}
          {$fkLoadState === 'loading' ? 'Loading data…' : 'Searching…'}
        {:else}
          Find paths
        {/if}
      </button>
    </div>
  </div>

  {#if searchError}
    <p class="finder-error">{searchError}</p>
  {/if}

  <!-- Loading state -->
  {#if searchState === 'running'}
    <div class="finder-loading">
      <span class="spinner" aria-hidden="true"></span>
      <div class="loading-text">
        {#if $fkLoadState === 'loading'}
          <strong>Loading FK map…</strong>
          <span class="mini">Fetching 37,443 verified table associations for the first time (~2 MB). This only happens once per session.</span>
        {:else}
          <strong>Searching for paths…</strong>
          <span class="mini">Running a guided search across the FK graph from <em>{sourceTable}</em> to <em>{targetTable}</em>.</span>
        {/if}
      </div>
    </div>
  {/if}
  {#if searchState === 'done'}
    {#if missing.length > 0}
      <div class="finder-empty">
        <p><strong>{missing.join(', ')}</strong> {missing.length === 1 ? 'is' : 'are'} not in the 5,607-table dataset.</p>
        <p class="mini">Check the spelling, then try again. Table names are case-sensitive (for example SalesLine, CustTable).</p>
      </div>
    {:else if pathResults.length === 0}
      <div class="finder-empty">
        <p>No path found between <strong>{sourceTable}</strong> and <strong>{targetTable}</strong>
        within {maxHops} hop{maxHops !== 1 ? 's' : ''}.</p>
        <p class="mini">Try increasing the max hops, or check that both table names are correct.</p>
      </div>
    {:else}
      <div class="results-header">
        <span class="section-heading">
          {pathResults.length}{truncated ? '+' : ''} path{pathResults.length !== 1 ? 's' : ''}
          from <strong>{sourceTable}</strong> to <strong>{targetTable}</strong>
        </span>
        <span class="mini">
          {#if shortestHops !== null}
            Shortest: <strong>{shortestHops}</strong> hop{shortestHops !== 1 ? 's' : ''} ·
          {/if}
          {sortMode === 'shortest' ? 'Fewest hops first' : 'Most unique first (semantic score)'} · click a table name to view its reference
        </span>
      </div>

      {#if truncated}
        <p class="finder-note">Search space sampled: showing {pathResults.length} of many more possible paths. Reduce max hops for a shorter list.</p>
      {/if}
    {/if}

    {#if canonicalHint}
      <p class="finder-note canonical-hint">A canonical path for this pair exists at {canonicalHint.hops} hop{canonicalHint.hops !== 1 ? 's' : ''}. Increase max hops to include it.</p>
    {/if}

    {#if canonicalToShow.length > 0}
      <div class="canonical-block">
        <div class="canonical-heading">
          <span class="canonical-title">Known canonical path</span>
          <span class="canonical-caption">A verified chain for this pair in the D365FO dataset</span>
        </div>
        {#each canonicalToShow as c}
          <div class="canonical-path">
            {#each c.path as table, i}
              {#if i > 0}
                <span class="path-arrow">→</span>
              {/if}
              <a href="/tables/{table}" class="path-table-link">{table}</a>
            {/each}
            <span class="canonical-badge">{c.hops} hop{c.hops !== 1 ? 's' : ''}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if pathResults.length > 0}
      <ol class="path-list">
        {#each pathResults as result, i}
          {@const hops = result.steps.length - 1}
          {@const isShortest = shortestHops !== null && hops === shortestHops}
          <li class="path-item">
            <span class="path-index">#{i + 1}</span>
            <div class="path-body">
              <!-- Row 1: clean horizontal chain — table names + arrows only -->
              <div class="path-chain">
                {#each result.steps as step, stepIndex}
                  {#if stepIndex > 0}
                    <span class="path-arrow">→</span>
                  {/if}
                  <a href="/tables/{step.table}" class="path-table-link"
                    class:path-source={stepIndex === 0}
                    class:path-target={stepIndex === result.steps.length - 1}
                  >{step.table}</a>
                {/each}
                {#if isShortest}
                  <span class="shortest-badge" title="Shortest path">shortest</span>
                {/if}
                {#if i === cleanestIndex}
                  <span class="cleanest-badge" title="Top semantic score">cleanest path</span>
                {/if}
              </div>
              <!-- Row 2: FK field labels, one per hop -->
              {#if result.steps.some((s) => s.via)}
                <div class="path-fk-list">
                  {#each result.steps.slice(1) as step}
                    {#if step.via}
                      <span class="path-fk-field">{step.via}</span>
                    {/if}
                  {/each}
                </div>
              {/if}
              <!-- Row 3: breakdown — hops · semantic link counts · via tables -->
              <div class="path-breakdown">
                {hops} hop{hops !== 1 ? 's' : ''}
                {#if result.breakdown.generic > 0}
                  <span aria-hidden="true"> · </span>{result.breakdown.generic} generic link{result.breakdown.generic !== 1 ? 's' : ''}
                {/if}
                {#if result.breakdown.plumbing > 0}
                  <span aria-hidden="true"> · </span>{result.breakdown.plumbing} plumbing link{result.breakdown.plumbing !== 1 ? 's' : ''}
                {/if}
                {#if hops > 0}
                  <span aria-hidden="true"> · </span>via {result.steps.slice(1, -1).map((s) => s.table).join(', ')}
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</section>

<style>
  /* ── Form layout ── */
  .finder-section {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .finder-form {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border-subtle);
    border-radius: 12px;
    padding: 24px;
  }

  .table-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 180px;
  }

  .table-input-group label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--clr-text-muted);
  }

  .finder-arrow {
    font-size: 22px;
    color: var(--clr-text-faint);
    padding-bottom: 4px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .swap-btn {
    background: transparent;
    border: 1px solid var(--clr-border);
    color: var(--clr-text-muted);
    border-radius: 8px;
    width: 38px;
    height: 34px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, color 0.15s;
  }

  .swap-btn:hover {
    border-color: var(--clr-border-accent);
    color: var(--clr-text);
  }

  .finder-controls {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex-shrink: 0;
  }

  .hops-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--clr-text-muted);
  }

  .hops-select {
    background: var(--clr-surface);
    color: var(--clr-text);
    border: 1px solid var(--clr-border);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 14px;
    cursor: pointer;
    color-scheme: inherit;
    min-width: 64px;
  }

  .find-btn {
    padding: 9px 20px;
    background: var(--accent, #4fc3f7);
    color: #fff;
    border: none;
    border-radius: 7px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    white-space: nowrap;
  }

  .find-btn:hover:not(:disabled) { opacity: 0.85; }
  .find-btn:disabled { opacity: 0.45; cursor: default; }

  /* ── Autocomplete ── */
  .autocomplete-wrap {
    position: relative;
  }

  .autocomplete-wrap input {
    width: 100%;
    box-sizing: border-box;
    background: var(--clr-surface-raised);
    color: var(--clr-text);
    border: 1px solid var(--clr-border);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }

  .autocomplete-wrap input:focus {
    border-color: var(--clr-border-accent);
  }

  .autocomplete-wrap input::placeholder {
    color: var(--clr-text-faint);
  }

  .suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--clr-surface-raised);
    border: 1px solid var(--clr-border);
    border-radius: 8px;
    list-style: none;
    margin: 0;
    padding: 4px;
    z-index: 40;
    max-height: 280px;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .suggestions li { margin: 0; }

  .suggestions button {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 7px 10px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--clr-text);
    font-size: 13px;
  }

  .suggestions button:hover {
    background: var(--clr-surface-raised);
  }

  .suggest-name { flex: 1; font-family: var(--font-mono, monospace); }

  .suggest-mod {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--mod-clr-bg, var(--clr-border));
    color: var(--mod-clr, var(--clr-blue-strong));
    flex-shrink: 0;
  }

  /* ── States ── */
  .finder-error {
    color: #f87171;
    font-size: 14px;
    padding: 10px 14px;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 7px;
  }

  .finder-note {
    color: var(--clr-text-muted);
    font-size: 12px;
    padding: 8px 12px;
    background: rgba(255, 180, 0, 0.08);
    border: 1px solid rgba(255, 180, 0, 0.18);
    border-radius: 7px;
  }

  .canonical-hint {
    background: rgba(79, 195, 247, 0.07);
    border-color: rgba(79, 195, 247, 0.2);
  }

  /* ── Fixture-driven canonical path (Q8) ── */
  .canonical-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(79, 195, 247, 0.06);
    border: 1px solid rgba(79, 195, 247, 0.28);
    border-radius: 9px;
    padding: 12px 16px;
  }

  .canonical-heading {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }

  .canonical-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--clr-blue, #4fc3f7);
  }

  .canonical-caption {
    font-size: 11px;
    color: var(--clr-text-muted);
  }

  .canonical-path {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
  }

  .canonical-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(76, 175, 80, 0.12);
    border: 1px solid rgba(76, 175, 80, 0.3);
    color: var(--clr-green);
    margin-left: 4px;
    flex-shrink: 0;
  }

  .finder-empty {
    text-align: center;
    padding: 40px 24px;
    color: var(--clr-text-muted);
    border: 1px dashed var(--clr-border-subtle);
    border-radius: 10px;
  }

  .finder-empty strong { color: var(--clr-text); }

  /* ── Results ── */
  .results-header {
    display: flex;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;
  }

  .path-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .path-item {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border-subtle);
    border-radius: 9px;
    padding: 10px 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .path-index {
    font-size: 11px;
    color: var(--clr-text-faint);
    min-width: 24px;
    flex-shrink: 0;
    padding-top: 3px;
  }

  /* Body holds both the chain row and the FK labels row */
  .path-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Row 1: table names + arrows, no extra decorations */
  .path-chain {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
  }

  .path-arrow {
    color: var(--clr-text-faint);
    font-size: 12px;
    flex-shrink: 0;
  }

  .shortest-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(76, 175, 80, 0.12);
    border: 1px solid rgba(76, 175, 80, 0.3);
    color: var(--clr-green);
    margin-left: 4px;
    flex-shrink: 0;
  }

  .cleanest-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(79, 195, 247, 0.14);
    border: 1px solid rgba(79, 195, 247, 0.35);
    color: var(--clr-blue, #4fc3f7);
    margin-left: 4px;
    flex-shrink: 0;
  }

  .path-table-link {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    font-weight: 600;
    color: var(--clr-text);
    text-decoration: none;
    transition: color 0.1s;
  }

  .path-table-link:hover {
    color: var(--clr-text);
    text-decoration: underline;
  }

  .path-table-link.path-source { color: var(--clr-blue); }
  .path-table-link.path-target { color: var(--clr-green); }

  /* Row 2: FK field labels, one per hop — very secondary */
  .path-fk-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-left: 2px solid var(--clr-border-subtle);
    margin-left: 2px;
    padding-left: 8px;
  }

  .path-fk-field {
    font-size: 10px;
    color: var(--clr-text-faint);
    font-family: var(--font-mono, monospace);
    word-break: break-all;
  }

  /* Row 3: breakdown — hops · generic/plumbing links · via tables */
  .path-breakdown {
    font-size: 10px;
    color: var(--clr-text-muted);
    font-family: var(--font-mono, monospace);
  }

  /* ── Sort toggle ── */
  .sort-fieldset {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sort-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--clr-text-muted);
    padding: 0;
  }

  .sort-toggle {
    display: inline-flex;
    border: 1px solid var(--clr-border);
    border-radius: 10px;
    overflow: hidden;
  }

  .sort-btn {
    background: var(--clr-surface);
    color: var(--clr-text-muted);
    border: none;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .sort-btn + .sort-btn {
    border-left: 1px solid var(--clr-border);
  }

  .sort-btn:hover:not(.sort-active) {
    background: var(--clr-surface-raised);
    color: var(--clr-text);
  }

  .sort-btn.sort-active {
    background: rgba(79, 195, 247, 0.16);
    color: var(--clr-blue, #4fc3f7);
  }

  @media (max-width: 900px) {
    .finder-form {
      flex-direction: column;
      align-items: stretch;
    }

    .finder-arrow { display: none; }
    .finder-controls { flex-direction: row; justify-content: flex-end; }
  }

  /* ── Loading state ── */
  .finder-loading {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px 24px;
    background: rgba(138, 213, 255, 0.05);
    border: 1px solid var(--clr-border);
    border-radius: 12px;
  }

  .loading-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .loading-text strong {
    font-size: 14px;
    color: var(--clr-text);
  }

  .loading-text .mini {
    color: var(--clr-text-faint);
  }

  .loading-text em {
    font-style: normal;
    color: var(--clr-blue);
  }

  .spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-top: 1px;
    border: 2px solid var(--clr-border);
    border-top-color: var(--clr-border-accent);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
