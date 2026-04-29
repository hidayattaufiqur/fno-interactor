# FnO Navigator — D365FO Process Navigator

A static SvelteKit app for navigating Dynamics 365 Finance & Operations (D365FO) business processes, tracing table relationships, and exploring technical customisations.

Overview
--------
FnO Navigator provides a fast reference that helps answer questions such as: what tables are involved in this process, how does a purchase order flow through the system, and where a customisation plugs in. The app is a static site that maps process flows, exposes a searchable table reference, and includes a Table Path Finder that computes relationships between tables.

Problem
-------
D365FO is a deep, interconnected ERP. When joining a project or debugging an unfamiliar module it's time-consuming to answer high-level questions using only the AOT or sprawling documentation. FnO Navigator surfaces those answers without opening Visual Studio or digging through internal wikis.

Role
----
Solo author: problem definition, data modelling, UI design, and implementation.

Solution & Features
-------------------
- Process Flows: grouped by D365FO module (AP, AR, Inventory, etc.) with stages and linked tables.
- Table Reference: searchable list of key tables with descriptions, fields, and relationships.
- Table Path Finder: finds how two tables are related through the data model.

Stack
-----
- Framework: SvelteKit (static adapter)
- Build tool: Vite
- Data: Static TypeScript data files (data-as-code)
 - Table relations dataset: included as static/data/fk-map.json (sourced from and inspired by https://github.com/ameyer505/MicrosoftDynamicsTableAssociations)

Key decisions
-------------
- Static site for zero-server cost and fast loads. Offline capability is not implemented yet (planned).
- Data-as-code (TypeScript) for type safety and ease of extension.

Status
------
Live and in active use. The site is deployed at https://fno.hidayattaufiqur.dev and the source code for this project is publicly available in this repository.

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
- This repository's .gitignore excludes node_modules, build outputs, and local environment files; do not commit .env or other secret files.
- Do not commit storage-state.json, Playwright auth/state files, or any files containing tokens.
- If you need to purge sensitive data from history, use a specialized tool such as git-filter-repo or BFG (this is a destructive operation; contact the repo owner before proceeding).

Source & Data Attribution
------
This README and the project's case study content were adapted from the companion site at `../hidayattaufiqur.dev/src/content/projects/fno-navigator-case-study.md` and `data.ts`.

The table relationship dataset used by the Table Path Finder feature is included as `static/data/fk-map.json`. The dataset was produced by converting table relationship data from HTML ERD files originally published by Microsoft and by using approaches from Alex Meyer's MicrosoftDynamicsTableAssociations project.

Primary sources:

- Microsoft: ax-2012-doc-tools — source table data (HTML ERD files in the Module-Erd directory). https://github.com/Microsoft/ax-2012-doc-tools
- Alex Meyer: MicrosoftDynamicsTableAssociations — published table relationship data (tables.json, tablefieldassociations.json) derived from Microsoft's ERD information; conversion approach and tooling used as inspiration. https://github.com/ameyer505/MicrosoftDynamicsTableAssociations

Both upstream projects are licensed under the MIT License. The data in `static/data/fk-map.json` is included in this repository under the MIT License with attribution to the upstream sources above. When redistributing or adapting the dataset, keep this attribution and the original license notices.
