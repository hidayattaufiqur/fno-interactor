<script>
  import { onMount } from 'svelte'
  import RelationGraph from '$lib/components/RelationGraph.svelte'
  import { canonicalModule } from '$lib/utils'
  import { flows, tableDefs } from '$lib/data/flows'
  import { fkLoadState, loadFkMap, getSchemaEdgesForTable } from '$lib/stores/fkMap'

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
      These FK links are detected automatically from the full D365FO database schema (39,380 associations)
      and filtered to tables referenced in documented flows. They may not all be relevant to every business process.
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
</style>
