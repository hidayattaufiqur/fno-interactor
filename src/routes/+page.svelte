<script>
  import { flows, modules } from '$lib/data/flows'

  $: grouped = modules
    .filter((m) => m !== 'All')
    .map((m) => ({
      module: m,
      flows: flows.filter((f) => f.module === m),
    }))
    .filter((g) => g.flows.length > 0)
</script>

<svelte:head>
  <title>D365FO Process Navigator</title>
</svelte:head>

<header class="home-hero">
  <p class="eyebrow">Dynamics 365 Finance &amp; Operations</p>
  <h2>Process Navigator</h2>
  <p class="lede">
    Understand business processes, trace table relations, and navigate technical customisations —
    without diving into the AOT blind.
  </p>
  <a href="/tables" class="cta-button">⬡ Table Reference →</a>
</header>

<div class="module-grid">
  {#each grouped as group}
    <div class="module-card">
      <div class="module-card-header">
        <span class="pill">{group.module}</span>
      </div>
      {#each group.flows as flow}
        <a href="/flow/{flow.id}/{flow.stages[0].id}" class="flow-link">
          <div class="flow-link-title">{flow.title}</div>
          <div class="flow-link-summary">{flow.summary}</div>
        </a>
      {/each}
    </div>
  {/each}
</div>
