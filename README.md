# FnO Navigator — D365FO Process Navigator

A static SvelteKit app for navigating Dynamics 365 Finance & Operations (D365FO) business processes, tracing table relationships, and exploring technical customisations.

Overview
--------
FnO Navigator provides a fast, offline-capable reference that helps answer questions such as: what tables are involved in this process, how does a purchase order flow through the system, and where a customisation plugs in. The app is a static site that maps process flows, exposes a searchable table reference, and includes a Table Path Finder that computes relationships between tables.

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

Key decisions
-------------
- Static site for zero-server cost, instant loads, and offline capability.
- Data-as-code (TypeScript) for type safety and ease of extension.

Status
------
Live and in active use. Source is not yet public (contains proprietary process knowledge from client work).

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

Source
------
This README was adapted from the project case study and data maintained in the companion site at `../hidayattaufiqur.dev/src/pages/projects/fno-navigator-case-study.astro` and `data.ts`.
