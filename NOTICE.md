NOTICE

This repository includes a derived dataset: `static/data/fk-map.json`.

Provenance and attribution:
- The dataset derives from table relationship data originally published by Microsoft as HTML ERD files in the ax-2012-doc-tools repository: https://github.com/Microsoft/ax-2012-doc-tools
- The HTML ERD files were processed into structured data by Alex Meyer's MicrosoftDynamicsTableAssociations project, which served as the conversion approach and tooling inspiration: https://github.com/ameyer505/MicrosoftDynamicsTableAssociations
- The shipped file contains only VERIFIED relations: 32,313 confirmed consistent with the alexdmeyer dataset, plus 5,299 additionally confirmed against the D365FO standard-source metadata (local mirror of 10.0.2645.32) or Microsoft Learn. 1,768 unconfirmable or contradicted relations are excluded and preserved with per-entry reasons in a private companion verification project.

License:
Both upstream repositories referenced above are MIT licensed. The derived dataset in this repository is provided under the MIT License with attribution to the upstream sources. If you reuse or redistribute the dataset, include the above attribution and the MIT license text.