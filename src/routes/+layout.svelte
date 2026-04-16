<script>
  import '../app.css'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { afterNavigate } from '$app/navigation'
  import { flows, tableDefs } from '$lib/data/flows'

  let search = ''
  let sidebarOpen = false
  let isLight = false

  onMount(() => {
    isLight = document.documentElement.classList.contains('light')
  })

  function toggleTheme() {
    isLight = !isLight
    document.documentElement.classList.toggle('light', isLight)
    localStorage.setItem('theme', isLight ? 'light' : 'dark')
  }

  // Close sidebar on any navigation (back button, programmatic goto, etc.)
  afterNavigate(() => { sidebarOpen = false })

  // Close sidebar when a nav link is clicked (immediate feedback before navigation)
  function closeOnNavLink(e) {
    if (e.target.closest('a')) sidebarOpen = false
  }

  $: currentFlowId = $page.params.flowId
  $: isTablesPage = $page.url.pathname.startsWith('/tables')
  $: isFindPage = $page.url.pathname.startsWith('/find')

  $: filteredFlows =
    search.trim().length < 1
      ? flows
      : flows.filter(
          (f) =>
            f.title.toLowerCase().includes(search.toLowerCase()) ||
            f.module.toLowerCase().includes(search.toLowerCase())
        )

  // Group filtered flows by module, preserving order of first appearance
  $: groupedFlows = (() => {
    const seen = /** @type {string[]} */ ([])
    const result = /** @type {{ module: string; flows: typeof flows }[]} */ ([])
    for (const flow of filteredFlows) {
      if (!seen.includes(flow.module)) {
        seen.push(flow.module)
        result.push({ module: flow.module, flows: filteredFlows.filter((otherFlow) => otherFlow.module === flow.module) })
      }
    }
    return result
  })()

  $: tableCount = Object.keys(tableDefs).length
</script>

<div class="mobile-bar">
  <button class="hamburger" aria-label="Open navigation" on:click={() => (sidebarOpen = true)}>
    <span></span><span></span><span></span>
  </button>
  <span class="mobile-title">D365FO Navigator</span>
</div>

<!-- Backdrop overlay — click to close sidebar -->
<div
  class="nav-overlay"
  class:visible={sidebarOpen}
  on:click={() => (sidebarOpen = false)}
  role="presentation"
  aria-hidden="true"
></div>

<div class="page">
  <aside class="nav" class:open={sidebarOpen} on:click={closeOnNavLink}>
    <button class="nav-close-btn" aria-label="Close navigation" on:click|stopPropagation={() => (sidebarOpen = false)}>✕</button>

    <a href="/" class="brand" aria-label="Home">
      <div class="dot"></div>
      <div>
        <div class="eyebrow">D365FO helper</div>
        <h1>Process Navigator</h1>
      </div>
    </a>

    <div class="nav-search">
      <input
        type="text"
        placeholder="Filter flows…"
        bind:value={search}
        aria-label="Filter flows by name or module"
      />
      {#if search}
        <button class="nav-search-clear" on:click={() => (search = '')} aria-label="Clear filter">
          ✕
        </button>
      {/if}
    </div>

    <div class="flow-list">
      {#if groupedFlows.length === 0}
        <div class="mini" style="padding: 8px 4px;">No flows match "{search}".</div>
      {:else}
        {#each groupedFlows as group}
          <div class="flow-group" data-module={group.module}>
            <div class="flow-group-label">{group.module}</div>
            {#each group.flows as flow}
              <a
                href="/flow/{flow.id}/{flow.stages[0].id}"
                class:selected={flow.id === currentFlowId}
                data-module={flow.module}
                aria-label="Open {flow.title}"
              >
                <span class="flow-list-dot"></span>
                <div class="flow-list-text">
                  <span>{flow.title}</span>
                  <small>{flow.summary}</small>
                </div>
              </a>
            {/each}
          </div>
        {/each}
      {/if}
    </div>

    <a href="/tables" class="nav-link" class:selected={isTablesPage && !isFindPage}>
      <span class="nav-link-icon">⬡</span>
      <span>Table Reference</span>
      <span class="nav-link-count">{tableCount}</span>
    </a>

    <a href="/find" class="nav-link" class:selected={isFindPage}>
      <span class="nav-link-icon">⇢</span>
      <span>Find Table Path</span>
    </a>

    <button class="theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
      {#if isLight}
        <span class="theme-icon">☾</span> Dark
      {:else}
        <span class="theme-icon">☀</span> Light
      {/if}
    </button>
  </aside>

  <main class="content">
    <slot />
  </main>
</div>

<style>
  .nav-link-count {
    margin-left: auto;
    font-size: 11px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--clr-text-muted);
    padding: 1px 7px;
    border-radius: 10px;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: auto;
    padding: 7px 10px;
    background: transparent;
    border: 1px solid var(--clr-border-subtle);
    border-radius: 5px;
    color: var(--clr-text-muted);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    width: 100%;
    text-align: left;
  }

  .theme-toggle:hover {
    border-color: var(--clr-border);
    color: var(--clr-text);
  }

  .theme-icon {
    font-size: 13px;
    line-height: 1;
  }
</style>
