<script>
  import { tableDefs } from '$lib/data/flows'
  import { canonicalModule } from '$lib/utils'
  import { findState } from '$lib/stores/findState'

  // ── FK map (module-level cache — survives navigation) ──────────────────────

  /** Forward adjacency map loaded from static/data/fk-map.json
   *  Shape: { parentTable: [[childTable, parentField, childField], ...] }
   *  @type {Record<string, [string, string, string][]> | null}
   */
  let fkMapForward = null

  /** Reverse map built at runtime: child → [[parentTable, parentField, childField], ...] */
  let fkMapReverse = /** @type {Record<string, [string, string, string][]>} */ ({})

  /** All 5,633 D365FO table names, sorted (prefix matches first in getSuggestions) */
  let allKnownTables = /** @type {string[]} */ ([])

  let loadState = /** @type {'idle' | 'loading' | 'error'} */ ('idle')
  let loadError = ''

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

  // ── Autocomplete suggestions ───────────────────────────────────────────────

  /** @type {string[]} */
  let sourceSuggestions = []
  /** @type {string[]} */
  let targetSuggestions = []

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
      if (lower === q) return [tableName] // exact — no need to show anything else
      if (lower.startsWith(q)) prefixMatches.push(tableName)
      else if (lower.includes(q)) substringMatches.push(tableName)
      if (prefixMatches.length + substringMatches.length >= 40) break // early exit
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

  // ── Data loading ───────────────────────────────────────────────────────────

  async function loadFkMap() {
    if (fkMapForward) return
    loadState = 'loading'
    try {
      const response = await fetch('/data/fk-map.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      fkMapForward = await response.json()
      buildReverseMap()
      const parentSet = new Set(Object.keys(fkMapForward))
      allKnownTables = [...parentSet]
      for (const table of Object.keys(fkMapReverse)) {
        if (!parentSet.has(table)) allKnownTables.push(table)
      }
      allKnownTables.sort()
      loadState = 'idle'
    } catch (err) {
      loadState = 'error'
      loadError = err instanceof Error ? err.message : String(err)
    }
  }

  function buildReverseMap() {
    fkMapReverse = {}
    for (const [parentTable, children] of Object.entries(fkMapForward)) {
      for (const [childTable, parentField, childField] of children) {
        if (!fkMapReverse[childTable]) fkMapReverse[childTable] = []
        fkMapReverse[childTable].push([parentTable, parentField, childField])
      }
    }
  }

  // Kick off pre-loading on first keypress to reduce perceived latency
  function handleFirstType() {
    if (loadState === 'idle' && !fkMapForward) loadFkMap()
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
    if (!fkMapForward) return []
    if (source === target) return [{ steps: [{ table: source, via: '' }] }]

    const results = []
    /** @type {{ steps: { table: string; via: string }[], visited: Set<string> }[]} */
    const queue = [{ steps: [{ table: source, via: '' }], visited: new Set([source]) }]

    while (queue.length > 0 && results.length < MAX_RESULTS) {
      const { steps, visited } = queue.shift()
      const currentTable = steps[steps.length - 1].table

      if (steps.length > maxDepth + 1) continue

      // Forward edges: currentTable is the parent → expand to children
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

      // Reverse edges: currentTable is the child → expand to parents
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

    if (!fkMapForward) {
      searchState = 'running'
      await loadFkMap()
      if (loadState === 'error') {
        searchState = 'idle'
        searchError = `Failed to load FK data: ${loadError}`
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
          {loadState === 'loading' ? 'Loading data…' : 'Searching…'}
        {:else}
          Find paths
        {/if}
      </button>
    </div>
  </div>

  {#if searchError}
    <p class="finder-error">{searchError}</p>
  {/if}

  <!-- Results -->
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
            <span class="hop-badge">{hops} hop{hops !== 1 ? 's' : ''}</span>
            <div class="path-chain">
              {#each result.steps as step, stepIndex}
                <span class="path-node">
                  <a href="/tables/{step.table}" class="path-table-link"
                    class:path-source={stepIndex === 0}
                    class:path-target={stepIndex === result.steps.length - 1}
                  >{step.table}</a>
                  {#if tableDefs[step.table]}
                    <span class="path-mod" data-module={canonicalModule(tableDefs[step.table].module)}
                      title={tableDefs[step.table].description}>
                      {canonicalModule(tableDefs[step.table].module)}
                    </span>
                  {/if}
                </span>
                {#if stepIndex < result.steps.length - 1}
                  <span class="path-edge" title={result.steps[stepIndex + 1].via}>
                    <span class="path-arrow">→</span>
                    <span class="path-field">{result.steps[stepIndex + 1].via}</span>
                  </span>
                {/if}
              {/each}
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
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 9px;
    padding: 14px 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .path-index {
    font-size: 11px;
    color: rgba(232, 241, 255, 0.3);
    min-width: 28px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .hop-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(138, 213, 255, 0.1);
    color: rgba(138, 213, 255, 0.7);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .path-chain {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .path-node {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .path-table-link {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    font-weight: 600;
    color: rgba(232, 241, 255, 0.75);
    text-decoration: none;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    transition: background 0.1s, color 0.1s;
  }

  .path-table-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }

  .path-table-link.path-source {
    border-color: rgba(138, 213, 255, 0.3);
    color: #8ad5ff;
  }

  .path-table-link.path-target {
    border-color: rgba(114, 233, 163, 0.3);
    color: #72e9a3;
  }

  .path-mod {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--mod-clr-bg, rgba(138, 213, 255, 0.1));
    color: var(--mod-clr, #c4e7ff);
  }

  .path-edge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 0 4px;
  }

  .path-arrow {
    color: rgba(232, 241, 255, 0.2);
    font-size: 14px;
  }

  .path-field {
    font-size: 10px;
    color: rgba(232, 241, 255, 0.35);
    font-family: var(--font-mono, monospace);
    white-space: normal;
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
</style>
