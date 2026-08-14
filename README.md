# FnO Navigator - D365FO Process Navigator

A static SvelteKit app for navigating Dynamics 365 Finance & Operations (D365FO) business processes, tracing table relationships, and exploring technical customisations.

Overview
--------
FnO Navigator provides a fast reference that helps answer questions such as which tables are involved in a process, how a purchase order flows through the system, and where a customisation plugs into the process. The app is a static site that maps process flows, exposes a searchable table reference, and includes a Table Path Finder that computes relationships between tables.

Problem
-------
D365FO is a deep, interconnected ERP. When joining a project or debugging an unfamiliar module, it's time-consuming to answer high-level questions using only the AOT or sprawling documentation. FnO Navigator surfaces those answers without opening Visual Studio or digging through internal wikis.

Role
----
Solo author: problem definition, data modelling, UI design, and implementation.

Solution & Features
-------------------
- Process Flows: grouped by D365FO module (AP, AR, Inventory, etc.) with stages and linked tables.
- Table Reference: searchable list of key tables with descriptions, fields, and relationships.
- Table Path Finder: finds paths between two tables through the data model.

Stack
-----
- Framework: SvelteKit (static adapter)
- Build tool: Vite
- Data: Static TypeScript data files (data-as-code)
  - Table relations dataset: included as static/data/fk-map.json (sourced from and inspired by https://github.com/ameyer505/MicrosoftDynamicsTableAssociations)

Key decisions
-------------
- Static site for zero-server cost and fast loads. Offline capability is planned but not yet implemented.
- Data-as-code (TypeScript) for type safety and ease of extension.

Status
------
Live and in active use. The site is deployed at https://fno.hidayattaufiqur.dev and the source code is available at https://github.com/hidayattaufiqur/fno-interactor.

What's inside
-------------
- `src/routes/` - SvelteKit pages: the process-flow overview (`/`), the searchable table reference (`/tables`, `/tables/[name]`), the guided Table Path Finder (`/find`), and per-module flow pages (`/flow/[flowId]`).
- `src/lib/` - shared components, pathfinding logic, and the flow/table metadata kept as TypeScript data files (data-as-code).
- `static/data/fk-map.json` - the verified table-relationship dataset that powers the Table Path Finder (see NOTICE.md for provenance and licensing).

Local development
-----------------
Prerequisites: Node.js and npm (or your preferred package manager).

Install and run locally:

```sh
npm install
npm run dev
```

Build and preview:

```sh
npm run build
npm run preview
```

Deployment
----------
The app is built as a static site (SvelteKit adapter-static) and can be deployed to any static hosting provider (Netlify, GitHub Pages, static web server, etc.).

Repository hygiene & security notes
---------------------------------
- This repository's .gitignore excludes node_modules, build outputs, and local environment files. Do not commit .env or other secret files.
- Do not commit storage-state.json, Playwright auth/state files, or any files containing tokens.
- If you need to purge sensitive data from history, use a specialized tool such as git-filter-repo or BFG (this is a destructive operation, so contact the repo owner before proceeding).

Source & Data Attribution
------------------------
This README and the project's case study content were adapted from the companion case study on the author's portfolio site (hidayattaufiqur.dev).

The table relationship dataset used by the Table Path Finder feature is included as `static/data/fk-map.json`. The dataset derives from table relationship data converted from HTML ERD files originally published by Microsoft and processed by Alex Meyer's MicrosoftDynamicsTableAssociations project, and has since been **verified against the real D365FO standard-source metadata** (version 10.0.2645.32): every relation in the shipped file is confirmed by the Alex Meyer (ameyer505) dataset plus table/field existence, by the D365FO AxTable relations in the synced standard source, or by Microsoft Learn documentation.

Verification details: of the original 39,380 relations, 32,313 were confirmed consistent with the Alex Meyer (ameyer505) dataset, and 5,299 previously unusable composite/ambiguous specs (`Pky?`/`Fky?` parser artifacts) were resolved against real metadata and are included with their real field pairs. 1,768 could not be confirmed (tables outside the synced model set that are undocumented on Microsoft Learn, plus relations contradicted by the real metadata). Those are excluded from this file and preserved, with per-entry reasons, in a private companion verification project. After deduping 169 duplicate triples created by the resolution pass (37,612 verified minus 169 = 37,443), the shipped file holds 37,443 relations: 32,293 confirmed + 5,150 metadata-resolved.

Primary sources:

- Microsoft: ax-2012-doc-tools - source table data (HTML ERD files in the Module-Erd directory). https://github.com/Microsoft/ax-2012-doc-tools
- Alex Meyer: MicrosoftDynamicsTableAssociations - published table relationship data (tables.json, tablefieldassociations.json) derived from Microsoft's ERD information. His conversion approach and tooling served as inspiration. https://github.com/ameyer505/MicrosoftDynamicsTableAssociations
- Microsoft Learn (https://learn.microsoft.com/api/mcp) - field/relation confirmation for tables outside the synced model set.
- D365FO standard-source mirror (local, 10.0.2645.32) - AxTable relation metadata used for verification and resolution.

Both upstream projects are licensed under the MIT License. The data in `static/data/fk-map.json` is included in this repository under the MIT License with attribution to the upstream sources above. When redistributing or adapting the dataset, keep this attribution and the original license notices.
