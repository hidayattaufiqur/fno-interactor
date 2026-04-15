<script>
  import RelationGraph from '$lib/components/RelationGraph.svelte'

  /** @type {import('./$types').PageData} */
  export let data

  let roleFilter = 'All'

  $: flow = data.flow
  $: stage = data.stage

  // Only reset role filter when navigating to a *different* flow
  let activeFlowId = ''
  $: {
    if (flow && flow.id !== activeFlowId) {
      roleFilter = 'All'
      activeFlowId = flow.id
    }
  }

  $: flowRoles = ['All', ...new Set(flow.stages.flatMap((stage) => stage.roles))]

  $: filteredStages =
    roleFilter === 'All'
      ? flow.stages
      : flow.stages.filter((stage) => stage.roles.includes(roleFilter))

  $: currentIndex = filteredStages.findIndex((stageItem) => stageItem.id === stage.id)

  // For the stage relation graph: pick the most-connected table as center
  $: stageRelations = stage.relations ?? []
  $: graphHub = (() => {
    if (!stageRelations.length) return null
    /** @type {Record<string, number>} */
    const connectionCount = {}
    for (const relation of stageRelations) {
      connectionCount[relation.from] = (connectionCount[relation.from] ?? 0) + 1
      connectionCount[relation.to] = (connectionCount[relation.to] ?? 0) + 1
    }
    return Object.entries(connectionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  })()
</script>

<svelte:head>
  <title>{flow.title} — {stage.title} · D365FO Navigator</title>
</svelte:head>

<header class="flow-header" data-module={flow.module}>
  <div class="flow-header-main">
    <div class="flow-meta">
      <span class="module-badge" data-module={flow.module}>{flow.module}</span>
      <span class="eyebrow">{flow.title}</span>
    </div>
    <h2 class="stage-heading">{stage.title}</h2>
    <p class="lede">{stage.description}</p>
    <div class="chips">
      {#each stage.roles as role}
        <span class="chip" title="Business role">{role}</span>
      {/each}
    </div>
  </div>
  <div class="controls">
    <label>
      Filter by role
      <select bind:value={roleFilter}>
        {#each flowRoles as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </label>
    {#if currentIndex > 0}
      <a
        href="/flow/{flow.id}/{filteredStages[currentIndex - 1].id}"
        class="step-nav-btn"
        aria-label="Previous stage"
      >← Prev</a>
    {/if}
    {#if currentIndex < filteredStages.length - 1}
      <a
        href="/flow/{flow.id}/{filteredStages[currentIndex + 1].id}"
        class="step-nav-btn"
        aria-label="Next stage"
      >Next →</a>
    {/if}
  </div>
</header>

<nav class="stage-pipeline" aria-label="Flow stages">
  {#if filteredStages.length === 0}
    <div class="mini">No stages match this role.</div>
  {:else}
    {#each filteredStages as stageItem, i}
      <div class="pipeline-step">
        <a
          href="/flow/{flow.id}/{stageItem.id}"
          class="pipeline-node"
          class:active={stage.id === stageItem.id}
          aria-current={stage.id === stageItem.id ? 'page' : undefined}
        >
          <span class="step-num">Step {i + 1}</span>
          <span class="step-title">{stageItem.title}</span>
          <span class="pill" style="font-size:10px;padding:2px 6px;">{stageItem.roles.join(', ')}</span>
        </a>
        {#if i < filteredStages.length - 1}
          <div class="pipeline-arrow" aria-hidden="true">→</div>
        {/if}
      </div>
    {/each}
  {/if}
</nav>

<div class="stage-content">
  <!-- ── Left: Technical reference ── -->
  <div class="stage-main">
    {#if stage.relations?.length}
      <section class="stage-section">
        <h4 class="section-label">Table Relations</h4>
        {#if graphHub}
          <div style="margin-bottom: 14px;">
            <RelationGraph tableName={graphHub} relations={stageRelations} />
          </div>
        {/if}
        <div class="rel-card-list">
          {#each stage.relations as rel}
            <div class="rel-card">
              <div class="rel-card-header">
                <a href="/tables/{rel.from}" class="rel-table">{rel.from}</a>
                <span class="rel-dir">→</span>
                <a href="/tables/{rel.to}" class="rel-table">{rel.to}</a>
              </div>
              {#if rel.fields?.length}
                <div class="rel-fields-row">
                  {#each rel.fields as fieldLabel}
                    <code class="rel-field">{fieldLabel}</code>
                  {/each}
                </div>
              {/if}
              {#if rel.note}
                <p class="rel-note">{rel.note}</p>
              {/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <section class="stage-section">
      <h4 class="section-label">Tables &amp; Entities</h4>
      {#if stage.tables.length}
        <div class="table-chips">
          {#each stage.tables as tableName}
            <a href="/tables/{tableName}" class="table-chip">{tableName}</a>
          {/each}
        </div>
      {:else}
        <p class="mini">None documented yet.</p>
      {/if}
    </section>

    {#if !stage.relations?.length}
      <div class="empty" style="font-size:13px; padding: 12px 0;">
        No table relations mapped yet for this stage.
      </div>
    {/if}
  </div>

  <!-- ── Right: Process context ── -->
  <aside class="stage-aside">
    <div class="aside-card">
      <div class="card-label">D365FO Navigation</div>
      {#if stage.menuPaths.length}
        <ul>
          {#each stage.menuPaths as menuPath}
            <li class="mini">{menuPath}</li>
          {/each}
        </ul>
      {:else}
        <p class="mini" style="margin-top:6px;">—</p>
      {/if}
    </div>

    {#if stage.prerequisites.length}
      <div class="aside-card">
        <div class="card-label">Prerequisites</div>
        <ul>
          {#each stage.prerequisites as prerequisite}
            <li class="mini">{prerequisite}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if stage.pitfalls.length}
      <div class="aside-card aside-pitfalls">
        <div class="card-label">⚠ Common Pitfalls</div>
        <ul>
          {#each stage.pitfalls as pitfall}
            <li class="mini">{pitfall}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if stage.docs.length}
      <div class="aside-card">
        <div class="card-label">Learn More</div>
        <ul>
          {#each stage.docs as docLink}
            <li>
              <a href={docLink.url} target="_blank" rel="noreferrer" class="mini">{docLink.title} ↗</a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if stage.approvals?.length}
      <div class="aside-card">
        <div class="card-label">Approvals</div>
        <ul>
          {#each stage.approvals as approval}
            <li class="mini">{approval}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </aside>
</div>

<style>
  .step-nav-btn {
    font-size: 12px;
    color: rgba(232, 241, 255, 0.6);
    text-decoration: none;
    padding: 6px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    transition: all 0.15s;
  }
  .step-nav-btn:hover {
    border-color: rgba(138, 213, 255, 0.3);
    color: #e8f1ff;
  }
</style>
