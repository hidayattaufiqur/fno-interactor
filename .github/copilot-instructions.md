# Copilot Instructions

## Commands

```bash
npm run dev       # Start dev server (Vite HMR on localhost:5173)
npm run build     # Production build → build/
npm run preview   # Preview production build locally
npm run prepare   # Run svelte-kit sync (auto-runs on npm install)
```

No test or lint scripts are configured.

## Architecture

**SvelteKit SPA** — SSR disabled (`ssr = false` in `+layout.js`), static adapter with `fallback: 'index.html'`. All data is bundled at build time from `src/lib/data/flows.ts`.

### Route structure

```
/                              → Home: module overview cards
/flow/[flowId]                 → Redirects to first stage of that flow
/flow/[flowId]/[stageId]       → Flow map + stage detail (main content)
/tables                        → Cross-table lookup: search any D365FO table
/tables/[name]                 → Table reference page: fields, FK links, used-in
```

### Data layer (`src/lib/data/flows.ts`)

Single source of truth for all content. Key exports:

| Export | Type | Purpose |
|---|---|---|
| `flows` | `Flow[]` | All business process flows |
| `personas` | `string[]` | Full persona list (first entry is `'All'`) |
| `modules` | `string[]` | Full module list (first entry is `'All'`) |
| `tableDefs` | `Record<string, TableDef>` | Mini data-dictionary; populated progressively |

**`Flow`** → `id`, `title`, `summary`, `module`, `stages[]`, `edges[]`

**`Stage`** → `id`, `title`, `description`, `persona[]`, `pages[]`, `docs[]`, `pitfalls[]`, `prerequisites[]`, `tables[]`, `relations?[]`, `approvals?[]`

**`Stage.relations`** — field-level FK links between tables at a stage:
```ts
{ from: string; to: string; note: string; fields?: string[] }
// fields format: "ChildTable.FieldName → ParentTable.PrimaryKey"
```

**`TableDef`** / **`TableField`** — per-table data dictionary:
```ts
TableDef  = { name, description, module, fields: TableField[], docsUrl? }
TableField = { name, type, fkTarget?, note }
```
Adding a new `TableDef`: add an entry to `tableDefs` in `flows.ts`.

### Layout and state

- `+layout.svelte` owns the sidebar nav: module filter (component state) + flow list + "Table Reference" link
- Module filter state stays in the layout and persists across navigation
- Persona filter, view mode, and showApprovals are **per-page state** in `[stageId]/+page.svelte` — they reset on route change (by design; `$: if (flow) persona = 'All'`)
- Current flow/stage is derived from URL params via `$page.params`

## Key Conventions

**Svelte version split:** `+layout.svelte` and all route `+page.svelte` files use **Svelte 4 syntax** (`$:` reactive declarations, `on:click`). New utility components in `src/lib/` may use Svelte 5 runes (`$state`, `onclick`).

**JS with TypeScript types:** The project is `.js`/`.svelte` (not `.ts` except for `flows.ts`). `jsconfig.json` has `checkJs: true` and `verbatimModuleSyntax: true` — use `import type` when importing types.

**Data enrichment pattern:** When enriching a flow with MS Learn data:
1. Fill `Stage.relations[]` with `from`, `to`, `fields` (FK field → PK format), and a plain-English `note`
2. Add a `TableDef` entry to `tableDefs` with key fields, FK targets, and a `docsUrl`
3. Replace generic/placeholder `docs[]` links on stages with specific MS Learn URLs
4. OTC (`id: 'otc'`) is the gold-standard reference; use it as a template for other flows

**Table name links:** Anywhere a D365FO table name appears in stage detail, it links to `/tables/[name]`. The tables route handles tables that have no `TableDef` yet (shows "used in" only).

**`[name]` route case-sensitivity:** D365FO table names are PascalCase (e.g., `SalesTable`). URLs use the exact name as-is. The load function returns a 404 only if the table doesn't appear in any stage AND has no `TableDef`.

**`edges[]` on Flow:** Defined in the type but not used by any route currently — it was an earlier design artifact for a graph view. Leave it populated for future use.

