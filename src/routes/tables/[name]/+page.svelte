<script>
  /** @type {import('./$types').PageData} */
  export let data
</script>

<svelte:head>
  <title>{data.name} · Table Reference · D365FO Navigator</title>
</svelte:head>

<div class="breadcrumb">
  <a href="/tables">Table Reference</a>
  <span>/</span>
  <span>{data.name}</span>
</div>

<header class="table-def-header">
  <p class="eyebrow">{data.def?.module ?? 'D365FO'} Table</p>
  <h2 class="table-def-name">{data.name}</h2>
  {#if data.def?.description}
    <p class="lede">{data.def.description}</p>
  {/if}
  {#if data.def?.docsUrl}
    <a href={data.def.docsUrl} target="_blank" rel="noreferrer" class="docs-link">
      Microsoft Learn docs →
    </a>
  {/if}
</header>

{#if data.def?.fields?.length}
  <section class="detail-section">
    <div class="section-heading">Key fields</div>
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
      No detailed field definitions yet for <strong>{data.name}</strong>. They'll be added as flows are enriched.
    </p>
  </div>
{/if}

{#if data.relationsUsing.length > 0}
  <section class="detail-section">
    <div class="section-heading">Relations involving this table</div>
    <div class="inline-relations">
      {#each data.relationsUsing as rel}
        <div class="inline-rel">
          <a href="/tables/{rel.from}" class="rel-from" class:self={rel.from === data.name}>{rel.from}</a>
          <span class="rel-arrow">→</span>
          <a href="/tables/{rel.to}" class="rel-to" class:self={rel.to === data.name}>{rel.to}</a>
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
  </section>
{/if}

{#if data.usedIn.length > 0}
  <section class="detail-section">
    <div class="section-heading">Used in {data.usedIn.length} stage{data.usedIn.length !== 1 ? 's' : ''}</div>
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
