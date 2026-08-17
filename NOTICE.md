NOTICE

This repository includes a derived dataset: `static/data/fk-map.json`, plus its
provenance manifest `static/data/map-manifest.json`.

Provenance and attribution:
- The dataset derives from table relationship data originally published by
  Microsoft as HTML ERD files in the ax-2012-doc-tools repository:
  https://github.com/Microsoft/ax-2012-doc-tools
- The HTML ERD files were processed into structured data by Alex Meyer's
  MicrosoftDynamicsTableAssociations project, which is the sole data source
  for this derived file: https://github.com/ameyer505/MicrosoftDynamicsTableAssociations
- `static/data/fk-map.json` is regenerated from that public source by
  `tools/generate-map.mjs` (deterministic, see README "Dataset provenance &
  regeneration"). Current build: 5,588 tables, 44,202 directed edges from the
  39,380-entry source (map-manifest.json record, git SHA 433cc8d). Composite
  multi-field relations are expanded into one edge per constituent field pair;
  marker-only specs and duplicate triples are dropped, all counted in the
  manifest.
- No other source (including licensed D365FO standard-source material) feeds
  data into this repository.

License:
The upstream repositories referenced above are MIT licensed. The derived
dataset in this repository is provided under the MIT License with attribution
to the upstream sources. If you reuse or redistribute the dataset, include the
above attribution and the MIT license text.