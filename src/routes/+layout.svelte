<script>
  import '../app.css'
  import { page } from '$app/stores'
  import { flows, modules } from '$lib/data/flows'

  let moduleFilter = 'All'

  $: moduleFilteredFlows =
    moduleFilter === 'All' ? flows : flows.filter((f) => f.module === moduleFilter)

  $: currentFlowId = $page.params.flowId
  $: isTablesPage = $page.url.pathname.startsWith('/tables')
</script>

<div class="page">
  <aside class="nav">
    <a href="/" class="brand" aria-label="Home">
      <div class="dot"></div>
      <div>
        <div class="eyebrow">D365FO helper</div>
        <h1>Process Navigator</h1>
      </div>
    </a>

    <label>
      Module
      <select bind:value={moduleFilter}>
        {#each modules as m}
          <option value={m}>{m}</option>
        {/each}
      </select>
    </label>

    <div class="nav-label">Flows</div>
    <div class="flow-list">
      {#each moduleFilteredFlows as flow}
        <a
          href="/flow/{flow.id}/{flow.stages[0].id}"
          class:selected={flow.id === currentFlowId}
          aria-label="Open {flow.title}"
        >
          <span>{flow.title}</span>
          <small>{flow.summary}</small>
        </a>
      {/each}
    </div>

    <a href="/tables" class="nav-link" class:selected={isTablesPage}>
      <span class="nav-link-icon">⬡</span>
      Table Reference
    </a>
  </aside>

  <main class="content">
    <slot />
  </main>
</div>
