<script>
  import { onMount } from 'svelte'
  import RelationGraph from '$lib/components/RelationGraph.svelte'
  import { canonicalModule } from '$lib/utils'
  import { flows, tableDefs } from '$lib/data/flows'
  import { fkLoadState, loadFkMap, getSchemaEdgesForTable } from '$lib/stores/fkMap'
  import { COMMON_METHODS, METHOD_CATEGORIES } from '$lib/data/tableMethods'

  /** @type {import('./$types').PageData} */
  export let data

  // ── Known tables set (for filtering schema edges to relevant neighbors) ────
  // Includes every table referenced in any flow stage, plus all tableDefs
  const knownTables = new Set([
    ...Object.keys(tableDefs),
    ...flows.flatMap((flow) => flow.stages.flatMap((stage) => stage.tables)),
  ])

  // ── Schema FK enrichment (loaded lazily, non-blocking) ─────────────────────
  onMount(() => { loadFkMap() })

  $: schemaEdges = $fkLoadState === 'ready'
    ? getSchemaEdgesForTable(data.name, knownTables, 24)
    : []

  // Remove schema edges that duplicate a hand-written relation (same from+to pair)
  $: manualEdgePairs = new Set(data.relationsUsing.map((r) => `${r.from}|${r.to}`))
  $: dedupedSchemaEdges = schemaEdges.filter((e) => !manualEdgePairs.has(`${e.from}|${e.to}`))

  // Combined edges for the graph
  $: allEdges = [...data.relationsUsing, ...dedupedSchemaEdges]

  // ── Split by direction ─────────────────────────────────────────────────────
  $: outgoing = data.relationsUsing.filter((r) => r.from === data.name)
  $: incoming = data.relationsUsing.filter((r) => r.to === data.name)
  $: schemaOutgoing = dedupedSchemaEdges.filter((e) => e.from === data.name)
  $: schemaIncoming = dedupedSchemaEdges.filter((e) => e.to === data.name)

  $: mod = canonicalModule(data.def?.module)

  // ── Methods section state ──────────────────────────────────────────────────
  let methodSearch = ''
  let methodCategory = 'all'
  let showCommonOnly = true

  $: filteredMethods = COMMON_METHODS.filter((m) => {
    if (showCommonOnly && !m.common) return false
    if (methodCategory !== 'all' && m.category !== methodCategory) return false
    if (methodSearch) {
      const q = methodSearch.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    }
    return true
  })

  const categoryKeys = ['all', ...Object.keys(METHOD_CATEGORIES)]
</script>

<svelte:head>
  <title>{data.name} · Table Reference · D365FO Navigator</title>
</svelte:head>

<div class="breadcrumb">
  <a href="/tables">Table Reference</a>
  <span>/</span>
  <span>{data.name}</span>
</div>

<header class="table-def-header" data-module={mod}>
  {#if mod}
    <span class="module-badge" data-module={mod} title={data.def?.module}>{mod}</span>
  {:else if data.def?.module}
    <span class="module-badge">{data.def.module}</span>
  {:else}
    <p class="eyebrow">D365FO Table</p>
  {/if}
  <h2 class="table-def-name">{data.name}</h2>
  {#if data.def?.description}
    <p class="lede">{data.def.description}</p>
  {/if}
  {#if data.def?.docsUrl}
    <a href={data.def.docsUrl} target="_blank" rel="noreferrer" class="docs-link">
      Microsoft Learn docs ↗
    </a>
  {/if}
</header>

{#if data.def?.fields?.length}
  <section class="detail-section">
    <div class="section-heading">Key fields ({data.def.fields.length})</div>
    <div class="field-table-wrap">
      <table class="field-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>FK / Reference</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {#each data.def.fields as field}
            <tr>
              <td class="field-name">{field.name}</td>
              <td class="field-type">{field.type}</td>
              <td class="field-fk">
                {#if field.fkTarget}
                  <a href="/tables/{field.fkTarget}">{field.fkTarget}</a>
                {:else}
                  <span class="mini">—</span>
                {/if}
              </td>
              <td>{field.note}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{:else}
  <div class="card no-def-notice">
    <div class="card-label">Field definitions</div>
    <p class="mini">
      No detailed field definitions yet for <strong>{data.name}</strong>. They'll be added as flows
      are enriched.
    </p>
  </div>
{/if}

{#if allEdges.length > 0}
  <section class="detail-section">
    <div class="section-heading">
      Relation graph — {data.relationsUsing.length} documented{dedupedSchemaEdges.length > 0 ? ` + ${dedupedSchemaEdges.length} schema FK` : ''}
      {#if $fkLoadState === 'loading'}<span class="mini" style="margin-left:8px;opacity:0.5">loading schema…</span>{/if}
    </div>
    <RelationGraph tableName={data.name} relations={allEdges} />
  </section>
{/if}

{#if outgoing.length > 0 || incoming.length > 0}
  <section class="detail-section">
    <div class="section-heading">
      Table relations — documented ({data.relationsUsing.length})
    </div>

    {#if outgoing.length > 0}
      <div class="rel-direction-section">
        <p class="rel-direction-label">Outgoing — {data.name} references these tables</p>
        <div class="inline-relations">
          {#each outgoing as rel}
            <div class="inline-rel">
              <a href="/tables/{rel.from}" class="rel-from self">{rel.from}</a>
              <span class="rel-arrow">→</span>
              <a href="/tables/{rel.to}" class="rel-to">{rel.to}</a>
              {#if rel.fields?.length}
                <code class="rel-fields">{rel.fields.join(', ')}</code>
              {/if}
              {#if rel.note}
                <span class="mini">{rel.note}</span>
              {/if}
              <a href="/flow/{rel.flowId}/{rel.stageId}" class="pill rel-source">{rel.stageTitle}</a>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if incoming.length > 0}
      <div class="rel-direction-section">
        <p class="rel-direction-label">Incoming — tables that reference {data.name}</p>
        <div class="inline-relations">
          {#each incoming as rel}
            <div class="inline-rel">
              <a href="/tables/{rel.from}" class="rel-from">{rel.from}</a>
              <span class="rel-arrow">→</span>
              <a href="/tables/{rel.to}" class="rel-to self">{rel.to}</a>
              {#if rel.fields?.length}
                <code class="rel-fields">{rel.fields.join(', ')}</code>
              {/if}
              {#if rel.note}
                <span class="mini">{rel.note}</span>
              {/if}
              <a href="/flow/{rel.flowId}/{rel.stageId}" class="pill rel-source">{rel.stageTitle}</a>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </section>
{/if}

{#if dedupedSchemaEdges.length > 0}
  <section class="detail-section">
    <div class="section-heading schema-section-heading">
      Schema FK connections — auto-detected ({dedupedSchemaEdges.length})
      <span class="schema-badge">from FK schema</span>
    </div>
    <p class="mini schema-note">
      These FK links come directly from the D365FO database schema (39,380 associations across 5,633 tables),
      filtered to tables already referenced in documented flows. Self-referencing FKs (a table pointing to itself)
      are excluded. They show the physical FK field — not all of them are relevant to every business process.
    </p>

    {#if schemaOutgoing.length > 0}
      <div class="rel-direction-section">
        <p class="rel-direction-label">Outgoing — {data.name} has FK fields pointing to</p>
        <div class="inline-relations">
          {#each schemaOutgoing as rel}
            <div class="inline-rel schema-rel">
              <a href="/tables/{rel.from}" class="rel-from self">{rel.from}</a>
              <span class="rel-arrow">→</span>
              <a href="/tables/{rel.to}" class="rel-to">{rel.to}</a>
              {#if rel.fields?.length}
                <code class="rel-fields">{rel.fields[0]}</code>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if schemaIncoming.length > 0}
      <div class="rel-direction-section">
        <p class="rel-direction-label">Incoming — tables with FK fields pointing to {data.name}</p>
        <div class="inline-relations">
          {#each schemaIncoming as rel}
            <div class="inline-rel schema-rel">
              <a href="/tables/{rel.from}" class="rel-from">{rel.from}</a>
              <span class="rel-arrow">→</span>
              <a href="/tables/{rel.to}" class="rel-to self">{rel.to}</a>
              {#if rel.fields?.length}
                <code class="rel-fields">{rel.fields[0]}</code>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </section>
{:else if $fkLoadState === 'idle'}
  <!-- FK map not yet loaded; will auto-populate once user interacts with the page -->
{/if}

{#if data.usedIn.length > 0}
  <section class="detail-section">
    <div class="section-heading">
      Used in {data.usedIn.length} stage{data.usedIn.length !== 1 ? 's' : ''}
    </div>
    <div class="table-usages">
      {#each data.usedIn as usage}
        <a href="/flow/{usage.flowId}/{usage.stageId}" class="table-usage">
          <span class="pill">{usage.flowTitle}</span>
          <span>{usage.stageTitle}</span>
        </a>
      {/each}
    </div>
  </section>
{/if}

<section class="detail-section methods-section">
  <div class="section-heading">
    Table Methods
    <a
      href="https://learn.microsoft.com/dynamics365/fin-ops-core/dev-itpro/dev-ref/system-tables#common"
      target="_blank"
      rel="noreferrer"
      class="section-docs-link"
    >Common docs ↗</a>
  </div>
  <p class="mini methods-note">
    Every D365FO table inherits these methods from the <code>Common</code> base table.
    Static methods (<code>find</code>, <code>exist</code>, <code>findRecId</code>) are a
    near-universal convention — not on Common itself, but present on almost every table.
    Methods marked <span class="method-badge overridable-inline">overridable</span> are the ones
    you'll typically override in an extension class.
  </p>

  <div class="method-controls">
    <input
      class="method-search"
      type="text"
      placeholder="Search methods…"
      bind:value={methodSearch}
    />

    <div class="method-cat-pills">
      {#each categoryKeys as cat}
        <button
          class="cat-pill"
          class:active={methodCategory === cat}
          on:click={() => (methodCategory = cat)}
        >
          {cat === 'all' ? 'All' : METHOD_CATEGORIES[cat].label}
        </button>
      {/each}
    </div>

    <label class="common-toggle">
      <input type="checkbox" bind:checked={showCommonOnly} />
      Common only
    </label>
  </div>

  {#if filteredMethods.length === 0}
    <p class="mini" style="opacity:0.4;margin-top:12px">No methods match your filters.</p>
  {:else}
    <div class="method-count mini" style="opacity:0.45;margin-bottom:8px">
      Showing {filteredMethods.length} method{filteredMethods.length !== 1 ? 's' : ''}
    </div>
    <div class="method-grid">
      {#each filteredMethods as method (method.name)}
        <div class="method-card" data-category={method.category}>
          <div class="method-header">
            <code class="method-name">{method.name}</code>
            <div class="method-badges">
              {#if method.overridable}
                <span class="method-badge overridable">overridable</span>
              {/if}
              <span class="method-badge cat-badge cat-{method.category}">
                {METHOD_CATEGORIES[method.category].label}
              </span>
            </div>
          </div>
          <code class="method-sig">{method.signature}</code>
          <p class="method-desc">{method.description}</p>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .schema-section-heading {
    color: rgba(232, 241, 255, 0.45);
  }

  .schema-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(232, 241, 255, 0.4);
    margin-left: 8px;
    vertical-align: middle;
    letter-spacing: 0.3px;
  }

  .schema-note {
    color: rgba(232, 241, 255, 0.35);
    margin-bottom: 12px;
  }

  .schema-rel {
    opacity: 0.65;
  }

  .schema-rel:hover {
    opacity: 1;
  }

  /* ── Methods section ──────────────────────────────────────────────────────── */
  .methods-section {
    container-type: inline-size;
  }

  .section-docs-link {
    font-size: 11px;
    font-weight: 500;
    margin-left: 10px;
    color: var(--accent, #4fc3f7);
    opacity: 0.7;
    text-decoration: none;
  }
  .section-docs-link:hover {
    opacity: 1;
  }

  .methods-note {
    color: rgba(232, 241, 255, 0.4);
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .overridable-inline {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(124, 77, 255, 0.15);
    border: 1px solid rgba(124, 77, 255, 0.3);
    color: rgb(180, 140, 255);
    vertical-align: middle;
  }

  .method-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .method-search {
    flex: 0 0 220px;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }
  .method-search::placeholder {
    color: rgba(232, 241, 255, 0.3);
  }
  .method-search:focus {
    border-color: rgba(79, 195, 247, 0.5);
  }

  .method-cat-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cat-pill {
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: transparent;
    color: rgba(232, 241, 255, 0.55);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cat-pill:hover {
    background: rgba(255, 255, 255, 0.07);
    color: rgba(232, 241, 255, 0.85);
  }
  .cat-pill.active {
    background: rgba(79, 195, 247, 0.15);
    border-color: rgba(79, 195, 247, 0.4);
    color: #4fc3f7;
  }

  .common-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(232, 241, 255, 0.55);
    cursor: pointer;
    user-select: none;
    margin-left: auto;
  }
  .common-toggle input {
    cursor: pointer;
    accent-color: #4fc3f7;
  }

  .method-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 10px;
  }

  .method-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.15s, background 0.15s;
  }
  .method-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.14);
  }

  .method-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .method-name {
    font-size: 14px;
    font-weight: 700;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    color: rgba(232, 241, 255, 0.95);
    letter-spacing: -0.3px;
  }

  .method-badges {
    display: flex;
    gap: 5px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .method-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.3px;
  }

  .method-badge.overridable {
    background: rgba(124, 77, 255, 0.15);
    border: 1px solid rgba(124, 77, 255, 0.3);
    color: rgb(180, 140, 255);
  }

  /* Category colours */
  .cat-badge.cat-crud      { background: rgba(76,175,80,0.12);  border: 1px solid rgba(76,175,80,0.3);  color: #81c784; }
  .cat-badge.cat-validation{ background: rgba(255,152,0,0.12); border: 1px solid rgba(255,152,0,0.3); color: #ffb74d; }
  .cat-badge.cat-init      { background: rgba(33,150,243,0.12); border: 1px solid rgba(33,150,243,0.3); color: #64b5f6; }
  .cat-badge.cat-events    { background: rgba(156,39,176,0.12); border: 1px solid rgba(156,39,176,0.3); color: #ce93d8; }
  .cat-badge.cat-dataAccess{ background: rgba(0,188,212,0.12);  border: 1px solid rgba(0,188,212,0.3);  color: #4dd0e1; }
  .cat-badge.cat-utility   { background: rgba(96,125,139,0.15); border: 1px solid rgba(96,125,139,0.35);color: #90a4ae; }
  .cat-badge.cat-static    { background: rgba(233,30,99,0.12);  border: 1px solid rgba(233,30,99,0.3);  color: #f48fb1; }

  .method-sig {
    font-size: 11.5px;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    color: rgba(232, 241, 255, 0.45);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .method-desc {
    font-size: 12.5px;
    color: rgba(232, 241, 255, 0.65);
    line-height: 1.55;
    margin: 0;
  }

  @container (max-width: 500px) {
    .method-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
