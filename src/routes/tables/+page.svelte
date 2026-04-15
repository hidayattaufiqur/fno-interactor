<script>
  /** @type {import('./$types').PageData} */
  export let data

  let query = ''

  $: tableNames = Object.keys(data.tableIndex).sort()

  $: results =
    query.trim().length < 2
      ? []
      : tableNames.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()))

  $: browseable = query.trim().length < 2 ? tableNames : []
</script>

<svelte:head>
  <title>Table Reference · D365FO Navigator</title>
</svelte:head>

<header class="hero">
  <div>
    <p class="eyebrow">Dynamics 365 Finance &amp; Operations</p>
    <h2>Table Reference</h2>
    <p class="lede">
      Look up any D365FO table to see which business processes reference it, what fields link tables
      together, and where to find documentation.
    </p>
  </div>
  <div class="controls">
    <div class="search search-standalone">
      <label for="table-search">Search table / entity name</label>
      <input
        id="table-search"
        type="text"
        placeholder="e.g. SalesTable, CustTrans, InventTrans"
        bind:value={query}
      />
    </div>
  </div>
</header>

<section class="tables-section">
  {#if results.length > 0}
    <div class="section-heading">{results.length} result{results.length !== 1 ? 's' : ''}</div>
    <div class="table-results">
      {#each results as name}
        {@const usages = data.tableIndex[name]}
        {@const def = data.tableDefs[name]}
        <div class="table-result-group">
          <div class="table-result-header">
            <a href="/tables/{name}" class="table-name">{name}</a>
            {#if def}
              <span class="pill">{def.module}</span>
              <span class="mini">{def.description}</span>
            {/if}
          </div>
          <div class="table-usages">
            {#each usages as usage}
              <a href="/flow/{usage.flowId}/{usage.stageId}" class="table-usage">
                <span class="pill">{usage.flowTitle}</span>
                <span>{usage.stageTitle}</span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else if query.trim().length >= 2}
    <div class="empty">No tables match "{query.trim()}".</div>
  {:else}
    <div class="section-heading">All tables ({tableNames.length})</div>
    <div class="table-browse-grid">
      {#each browseable as name}
        {@const def = data.tableDefs[name]}
        <a href="/tables/{name}" class="table-browse-item">
          <span class="table-name-sm">{name}</span>
          {#if def}
            <span class="mini">{def.description}</span>
          {:else}
            <span class="mini usage-count">{data.tableIndex[name].length} stage{data.tableIndex[name].length !== 1 ? 's' : ''}</span>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</section>
