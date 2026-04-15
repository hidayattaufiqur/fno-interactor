<script>
  /** @type {import('./$types').PageData} */
  export let data

  let persona = 'All'
  let showApprovals = false
  let viewMode = 'process'

  $: flow = data.flow
  $: stage = data.stage

  // Reset persona when navigating to a different flow
  $: if (flow) persona = 'All'

  $: flowPersonas = ['All', ...new Set(flow.stages.flatMap((s) => s.persona))]

  $: filteredStages =
    persona === 'All'
      ? flow.stages
      : flow.stages.filter((s) => s.persona.includes(persona))

  $: relationEdges = flow.stages.flatMap((s) => s.relations ?? [])
  $: relationNodes = Array.from(new Set(relationEdges.flatMap((e) => [e.from, e.to])))
</script>

<svelte:head>
  <title>{flow.title} — {stage.title} · D365FO Navigator</title>
</svelte:head>

<header class="hero">
  <div>
    <p class="eyebrow">Dynamics 365 Finance &amp; Operations · {flow.module}</p>
    <h2>{flow.title}</h2>
    <p class="lede">{flow.summary}</p>
  </div>
  <div class="controls">
    <label>
      Persona
      <select bind:value={persona}>
        {#each flowPersonas as p}
          <option value={p}>{p}</option>
        {/each}
      </select>
    </label>

    <div class="view-toggle" role="group" aria-label="View mode">
      <button class:view-selected={viewMode === 'process'} on:click={() => (viewMode = 'process')}>
        Process
      </button>
      <button class:view-selected={viewMode === 'tables'} on:click={() => (viewMode = 'tables')}>
        Tables / relations
      </button>
    </div>

    <label class="toggle">
      <input type="checkbox" bind:checked={showApprovals} />
      <span>Show approvals</span>
    </label>
  </div>
</header>

<section class="flow-map">
  {#if viewMode === 'process'}
    {#if filteredStages.length === 0}
      <div class="empty">No stages match this persona yet.</div>
    {:else}
      <div class="nodes">
        {#each filteredStages as s, i}
          <div class="node-wrapper">
            <a
              href="/flow/{flow.id}/{s.id}"
              class="node"
              class:active={stage.id === s.id}
              aria-current={stage.id === s.id ? 'page' : undefined}
            >
              <div class="node-title">{s.title}</div>
              <div class="node-meta">
                <span class="pill">{s.persona.join(', ')}</span>
                {#if s.prerequisites.length}
                  <span class="mini">{s.prerequisites.join(' • ')}</span>
                {/if}
              </div>
            </a>
            {#if i < filteredStages.length - 1}
              <div class="connector"></div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    {#if relationEdges.length === 0}
      <div class="empty">No relations mapped yet for this flow.</div>
    {:else}
      <div class="relation-grid">
        <div class="relation-nodes">
          {#each relationNodes as node}
            <a href="/tables/{node}" class="rel-node">{node}</a>
          {/each}
        </div>
        <div class="relation-edges">
          {#each relationEdges as edge}
            <div class="rel-edge">
              <a href="/tables/{edge.from}" class="rel-from">{edge.from}</a>
              <span class="rel-arrow">→</span>
              <a href="/tables/{edge.to}" class="rel-to">{edge.to}</a>
              {#if edge.note}
                <span class="mini">{edge.note}</span>
              {/if}
              {#if edge.fields?.length}
                <span class="mini fields">Fields: {edge.fields.join(', ')}</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>

<section class="stage-detail">
  <div class="stage-head">
    <div>
      <p class="eyebrow">Stage</p>
      <h3>{stage.title}</h3>
      <p class="lede">{stage.description}</p>
    </div>
    <div class="chips">
      {#each stage.persona as p}
        <span class="chip">{p}</span>
      {/each}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Navigate to</div>
      <ul>
        {#each stage.pages as pg}
          <li>{pg}</li>
        {/each}
      </ul>
    </div>

    <div class="card">
      <div class="card-label">Prerequisites</div>
      {#if stage.prerequisites.length}
        <ul>
          {#each stage.prerequisites as pre}
            <li>{pre}</li>
          {/each}
        </ul>
      {:else}
        <p class="mini">None</p>
      {/if}
    </div>

    <div class="card">
      <div class="card-label">Tables / entities</div>
      <ul>
        {#each stage.tables as tbl}
          <li><a href="/tables/{tbl}">{tbl}</a></li>
        {/each}
      </ul>
    </div>

    <div class="card">
      <div class="card-label">Common pitfalls</div>
      {#if stage.pitfalls.length}
        <ul>
          {#each stage.pitfalls as pit}
            <li>{pit}</li>
          {/each}
        </ul>
      {:else}
        <p class="mini">None documented yet.</p>
      {/if}
    </div>

    <div class="card">
      <div class="card-label">Docs</div>
      <ul>
        {#each stage.docs as doc}
          <li>
            <a href={doc.url} target="_blank" rel="noreferrer">{doc.title}</a>
          </li>
        {/each}
      </ul>
    </div>

    {#if showApprovals && stage.approvals?.length}
      <div class="card">
        <div class="card-label">Approvals</div>
        <ul>
          {#each stage.approvals as app}
            <li>{app}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if stage.relations?.length}
      <div class="card card-wide">
        <div class="card-label">Table relations at this stage</div>
        <div class="inline-relations">
          {#each stage.relations as rel}
            <div class="inline-rel">
              <a href="/tables/{rel.from}" class="rel-from">{rel.from}</a>
              <span class="rel-arrow">→</span>
              <a href="/tables/{rel.to}" class="rel-to">{rel.to}</a>
              {#if rel.fields?.length}
                <code class="rel-fields">{rel.fields.join(', ')}</code>
              {/if}
              {#if rel.note}
                <span class="mini">{rel.note}</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>
