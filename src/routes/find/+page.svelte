<script>
  import { tableDefs } from '$lib/data/flows'
  import { canonicalModule } from '$lib/utils'
  import { findState } from '$lib/stores/findState'
  import { fkLoadState, fkLoadError, loadFkMap, getAllFkTableNames, getForwardMap, getReverseMap } from '$lib/stores/fkMap'

  // ── Bind store fields to local vars for template convenience ───────────────

  let sourceInput = $findState.sourceInput
  let targetInput = $findState.targetInput
  let sourceTable = $findState.sourceTable
  let targetTable = $findState.targetTable
  let maxHops = $findState.maxHops
  let pathResults = $findState.pathResults
  let searchState = $findState.searchState
  let searchError = $findState.searchError

  // Sync local vars back to store on any change
  $: findState.set({ sourceInput, targetInput, sourceTable, targetTable, maxHops, pathResults, searchState, searchError })

  // ── Autocomplete ───────────────────────────────────────────────────────────

  /** @type {string[]} */
  let sourceSuggestions = []
  /** @type {string[]} */
  let targetSuggestions = []

  // Rebuilt once FK map loads; empty until then
  $: allKnownTables = $fkLoadState === 'ready' ? getAllFkTableNames() : []

  /**
   * Returns up to 12 matches, ranking exact prefix matches above substring matches.
   * @param {string} query @param {string} selected
   */
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

  /** @param {string} name */
  function selectSource(name) {
    sourceTable = name
    sourceInput = name
    sourceSuggestions = []
  }

  /** @param {string} name */
  function selectTarget(name) {
    targetTable = name
    targetInput = name
    targetSuggestions = []
  }

  /** @param {KeyboardEvent} e @param {'source' | 'target'} which */
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

  // ── Pathfinding (BFS) ──────────────────────────────────────────────────────

  const MAX_RESULTS = 50

  /**
   * @param {string} source
   * @param {string} target
   * @param {number} maxDepth
   * @returns {{ steps: { table: string; via: string }[] }[]}
   */
  function findPaths(source, target, maxDepth) {
    const fkMapForward = getForwardMap()
    const fkMapReverse = getReverseMap()
    if (!fkMapForward) return []
    if (source === target) return [{ steps: [{ table: source, via: '' }] }]

    const results = []
    /** @type {{ steps: { table: string; via: string }[], visited: Set<string> }[]} */
    const queue = [{ steps: [{ table: source, via: '' }], visited: new Set([source]) }]

    while (queue.length > 0 && results.length < MAX_RESULTS) {
      const { steps, visited } = queue.shift()
      const currentTable = steps[steps.length - 1].table
      if (steps.length > maxDepth + 1) continue

      for (const [childTable, parentField, childField] of fkMapForward[currentTable] ?? []) {
        const edgeLabel = `${childTable}.${childField} → ${currentTable}.${parentField}`
        if (childTable === target) {
          results.push({ steps: [...steps, { table: childTable, via: edgeLabel }] })
          if (results.length >= MAX_RESULTS) break
        } else if (!visited.has(childTable) && steps.length < maxDepth + 1) {
          queue.push({ steps: [...steps, { table: childTable, via: edgeLabel }], visited: new Set([...visited, childTable]) })
        }
      }
      if (results.length >= MAX_RESULTS) break

      for (const [parentTable, parentField, childField] of fkMapReverse[currentTable] ?? []) {
        const edgeLabel = `${currentTable}.${childField} → ${parentTable}.${parentField}`
        if (parentTable === target) {
          results.push({ steps: [...steps, { table: parentTable, via: edgeLabel }] })
          if (results.length >= MAX_RESULTS) break
        } else if (!visited.has(parentTable) && steps.length < maxDepth + 1) {
          queue.push({ steps: [...steps, { table: parentTable, via: edgeLabel }], visited: new Set([...visited, parentTable]) })
        }
      }
    }
    return results
  }

  async function handleFind() {
    searchError = ''
    pathResults = []

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
    pathResults = findPaths(sourceTable, targetTable, maxHops)
    searchState = 'done'
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
      <strong>39,380 associations</strong> across 5,633 tables — the full Microsoft Dynamics
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

    <div class="finder-arrow" aria-hidden="true">→</div>

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
          <span class="mini">Fetching 39,380 table associations for the first time (~2 MB). This only happens once per session.</span>
        {:else}
          <strong>Searching for paths…</strong>
          <span class="mini">Running BFS across the FK graph from <em>{sourceTable}</em> to <em>{targetTable}</em>.</span>
        {/if}
      </div>
    </div>
  {/if}
  {#if searchState === 'done'}
    {#if pathResults.length === 0}
      <div class="finder-empty">
        <p>No path found between <strong>{sourceTable}</strong> and <strong>{targetTable}</strong>
        within {maxHops} hop{maxHops !== 1 ? 's' : ''}.</p>
        <p class="mini">Try increasing the max hops, or check that both table names are correct.</p>
      </div>
    {:else}
      <div class="results-header">
        <span class="section-heading">
          {pathResults.length}{pathResults.length >= MAX_RESULTS ? '+' : ''} path{pathResults.length !== 1 ? 's' : ''}
          from <strong>{sourceTable}</strong> to <strong>{targetTable}</strong>
        </span>
        <span class="mini">Shortest paths shown first · click a table name to view its reference</span>
      </div>

      <ol class="path-list">
        {#each pathResults as result, i}
          {@const hops = result.steps.length - 1}
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
                <span class="hop-count">{hops} hop{hops !== 1 ? 's' : ''}</span>
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
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
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
    color: rgba(232, 241, 255, 0.45);
  }

  .finder-arrow {
    font-size: 22px;
    color: rgba(232, 241, 255, 0.25);
    padding-bottom: 4px;
    flex-shrink: 0;
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
    color: rgba(232, 241, 255, 0.45);
  }

  .hops-select {
    background: var(--surface);
    color: var(--text);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 14px;
    cursor: pointer;
    color-scheme: dark;
    min-width: 64px;
  }

  .find-btn {
    padding: 9px 20px;
    background: var(--accent);
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
    background: rgba(255, 255, 255, 0.06);
    color: #e8f1ff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }

  .autocomplete-wrap input:focus {
    border-color: rgba(138, 213, 255, 0.4);
  }

  .autocomplete-wrap input::placeholder {
    color: rgba(232, 241, 255, 0.3);
  }

  .suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--surface-raised, #0d1826);
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    color: var(--text);
    font-size: 13px;
  }

  .suggestions button:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .suggest-name { flex: 1; font-family: var(--font-mono, monospace); }

  .suggest-mod {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--mod-clr-bg, rgba(138, 213, 255, 0.12));
    color: var(--mod-clr, #c4e7ff);
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

  .finder-empty {
    text-align: center;
    padding: 40px 24px;
    color: rgba(232, 241, 255, 0.55);
    border: 1px dashed rgba(255, 255, 255, 0.07);
    border-radius: 10px;
  }

  .finder-empty strong { color: var(--text); }

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
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 9px;
    padding: 10px 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .path-index {
    font-size: 11px;
    color: rgba(232, 241, 255, 0.22);
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
    color: rgba(232, 241, 255, 0.2);
    font-size: 12px;
    flex-shrink: 0;
  }

  .hop-count {
    font-size: 10px;
    color: rgba(232, 241, 255, 0.2);
    margin-left: 4px;
    flex-shrink: 0;
  }

  .path-table-link {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    font-weight: 600;
    color: rgba(232, 241, 255, 0.7);
    text-decoration: none;
    transition: color 0.1s;
  }

  .path-table-link:hover {
    color: var(--text);
    text-decoration: underline;
  }

  .path-table-link.path-source { color: #8ad5ff; }
  .path-table-link.path-target { color: #72e9a3; }

  /* Row 2: FK field labels, one per hop — very secondary */
  .path-fk-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-left: 1px;
    border-left: 2px solid rgba(255, 255, 255, 0.05);
    margin-left: 2px;
    padding-left: 8px;
  }

  .path-fk-field {
    font-size: 10px;
    color: rgba(232, 241, 255, 0.28);
    font-family: var(--font-mono, monospace);
    word-break: break-all;
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
    border: 1px solid rgba(138, 213, 255, 0.15);
    border-radius: 12px;
  }

  .loading-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .loading-text strong {
    font-size: 14px;
    color: rgba(232, 241, 255, 0.85);
  }

  .loading-text .mini {
    color: rgba(232, 241, 255, 0.4);
  }

  .loading-text em {
    font-style: normal;
    color: #8ad5ff;
  }

  .spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-top: 1px;
    border: 2px solid rgba(138, 213, 255, 0.2);
    border-top-color: rgba(138, 213, 255, 0.8);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
