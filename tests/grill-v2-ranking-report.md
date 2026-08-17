# GRILL REPORT: v2 ranking design (staging + specificity + directed semantics + candidate buckets)

Date: 2026-08-17
Grill: devils-advocate, task t_3bf36e2e
Evidence base: GPT-5.6 and Claude Opus 4.6 Max full texts, src/lib/pathScoring.js, src/lib/pathfinder.js, tests/* (all green: 19/19 fixtures, golden parity), live measurements against static/data/fk-map.json (37,443 directed edges, 5.6k tables) via tests/harness.mjs.

## 1. What survived the grill (no further questions needed)

- ONE flagship ranking, no mode split: sound. The product claim "best natural way from A to B, deterministic and most unique" is coherent, and the lexicographic comparator is the right tool for it. Locked, no grill needed.
- Lexicographic staged comparator over additive score: APPROVED, survives. Additive per-edge scoring is provably flat for this dataset (E4 below), and the class-first comparator is the only mechanism that can separate the story path from the pool. The comparator design needs two fixes (tie handling Q3, window anchor Q6) but the paradigm holds.
- "Algorithm is the brain, curated canonical paths are a thin labeled layer": survives. The editorial badge and existence-bar surfacing stay as designed.
- Diversity demoted: survives, with one mechanical fix (see Q3): it must be a pure comparator tiebreak, never folded into the displayed score, and never a thresholded epsilon pass (float-epsilon comparisons are a JS/Python parity hazard).
- Documented bonus once per path: survives, trivial to implement, kills per-hop inflation.
- Reason codes + editorial badge: survive, with one contract note (Q5): reason codes must be deterministic strings and part of the golden parity contract.
- All three phases: the shape survives; Phase 1 and Phase 3 need the corrections in Q1-Q2 and Q12-Q13.

## 2. Measured findings (the evidence)

E1. The map does NOT encode FK direction. 16,349 of 16,724 undirected pairs (97.8%) appear in BOTH orientations in fk-map.json (e.g. fwd[InventTrans] contains [InventTransOrigin, RecId, InventTransOrigin] AND fwd[InventTransOrigin] contains [InventTrans, InventTransOrigin, RecId]). Claude's claim "the FK map already encodes which side is child/parent" is false for this dataset. Traversal direction of a step is decided by neighbor enumeration order and dedupe, not by schema semantics.

E2. Field-level IDF is useless as a discriminator here. Distribution over 5,595 distinct join fields: min 1.40 (RecId, 14,196 uses), 99.5% of fields have IDF >= 7 (uses <= ~290). Claude's worked examples are wrong for this dataset (he quotes ItemId ~7.5, actual 4.2 with 1,976 uses; RecId ~3.2, actual 1.40). The proposed 0-3 buckets would collapse 99.5% of fields into the top bucket.

E3. Specificity cannot separate the flagship story path from the current #1 noise path. Story path (InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable) field IDFs: 4.2, 8.9, 5.9, 7.5. Noise path (InventTable>VendPackingSlipTrans>VendPackingSlipJour>VendTable>CustTable) field IDFs: 4.2, 11.6, 8.1, 9.0. Noise wins on raw field rarity. At (childField,parent) pair level, story bucket-sum ~7 vs noise ~8 (buckets 0-3 by count): still a tie. Specificity is tiebreak-grade, not primary.

E4. The story path is excluded from the pool by SCORE, not by reach. With default caps the pool is 50 score-best paths; the story path scores 11.21 (named-ref + business-key + documented bonuses) and sits at rank 528 of 4,081 completions when maxResults is raised to 5,000. Raising budgets does not fix it: branchCap 5,000 / levelAttempts 500,000 still yields pool=50 with no story path (score eviction), 1.6s. A brute sweep (iterations cap hit) takes 2.1s and still fails. Conclusion: pure budget-raising is a dead end; the pool must retain by the v2 comparator and order the DFS class-aware (Q12).

E5. The default sweep is fast: 129ms at maxHops 4 for InventTable>CustTable (current caps). There is ~170ms of headroom against the 300ms budget without any window. The window is not needed for speed on this pair; it only caps depth for pairs with small shortest.

E6. Raw shortest is plumbing-dominated. InventTable>CustTable shortest = 2 hops, and every 2-hop path runs through temp/derived tables: CustInvoiceSpecTmp, BusinessStatisticsData, TmpLedgerBase, DimensionAttributeValueSet, InventItemSalesAnalysisTmp_CN. A window anchored on raw shortest is itself noise, and would silently exclude coherent 4-hop stories for any pair that has a Tmp shortcut (Q6).

E7. The name-contains-parent-stem signal is weak and direction-dependent. It fires on the story's named-RecId edge and on CustAccount>CustTable (via the shared "Cust" token), misses ItemId>InventTable and InventTransId>InventTransOrigin, and fires differently on reverse traversal of the same join. v1's Rule 1 (fieldNamesTable, isNamedSystemKeyReference) already implements the reliable part of this signal. No new stem term needed (Q10).

E8. The cross-module motif analogue exists in the dataset: InventTable>InventTrans>InventTransOrigin>PurchLine>VendTable has 2/12/2/2 parallel edges per hop. It is a valid generalization fixture. The same-hop saturation case also exists: the story path and the noise path are both 4 hops and both score flat 12.0 pre-diversity today, which is exactly the pair a v2 fixture must separate.

## 3. The questionnaire (numbered, recommended answers)

Q1. The qualityClass function is the entire design and it is undefined. It is the ONLY signal that separates the story path (score 11.21) from the current #1 noise path (score 15.33): specificity ties (E3), hops tie, diversity is demoted. Recommend: class 3 = coherent business-flow path, defined as a role-transition sequence matching a document-flow pattern (Master, Transaction, Origin, DocumentLine, Party roles derived from table-name stems and degree profile, e.g. Master>Trans>Origin>Line>Party) with document-identifier continuity across at least two consecutive edges (InventTransId, SalesId, PurchId, Voucher, CustAccount families), zero plumbing and zero generic intermediates; class 2 = business-key path (>=1 business-key or named-RecId edge, no plumbing, no role pattern); class 1 = valid but weak; class 0 = any plumbing edge or Tmp/Dimension/derived intermediate. Acceptance test: story path class 3, noise path class <= 2, on all 19 existing fixtures. Accept this as the spec skeleton for nix to implement and tune against fixtures?

Q2. Class boundary cases must be pinned before implementation: a path with one generic edge among four business edges; a path with one plumbing edge but otherwise a perfect story; a 1-hop direct business-key edge (SalesTable.CustAccount>CustTable.AccountNum) that competes with a 3-hop story for the same pair. Recommend: any plumbing edge forces class 0; any generic intermediate caps the class at 1; a direct business-key edge is class 2 and the product question is whether a class-3 story should outrank it for 1-hop-adjacent pairs. Recommend yes: the flagship claim is "best natural way", and a coherent flow is more informative than a direct master lookup; the direct edge still ranks top-10 (fixture bar) because class-2 paths cluster above weak paths. Accept?

Q3. Tie handling inside a class: with raw float semantic scores, ties are measure-zero, so the diversity tiebreak and stable key would almost never engage, and JS/Python float ordering could disagree on near-ties. Recommend: comparator uses the semantic score rounded to 2 decimals (display keeps 6), then -hops, then diversity, then stable path key. The round is identical on both sides, ties become meaningful, and diversity actually fires. Accept?

Q4. Score/rank inversion is real and has a live bug. Under lexicographic ordering a rank-1 path can display a LOWER score than rank-5 (story 11.21 vs noise 15.33). The UI computes the "best" row as max score (find/+page.svelte:213), which would highlight the wrong path, and MCP consumers could re-sort by score. Recommend: displayed score stays the intrinsic semantic score, rank is authoritative, fix the UI to use results[0], and state in the MCP tool description that results are rank-ordered and must not be re-sorted. Accept?

Q5. Golden-test impact: the contract asserts (tables, score@6dp) top-20. v2 changes scores and ordering, and the score alone no longer explains rank. Recommend: extend the golden schema per row with qualityClass and reason codes (deterministic strings), regenerate golden-results.json with --update, keep 6-decimal score parity, and extend the Python golden_test.py to assert the same fields. Accept?

Q6. Window anchoring: raw shortest is plumbing-dominated (E6). The +2 window would exclude coherent stories whenever a Tmp shortcut exists, and it contradicts GPT's own intent ("a coherent five-hop business path may beat a noisy four-hop path"). Recommend: compute the window on plumbing-filtered shortest (ignore Tmp*/Dimension*/derived intermediates), or equivalently window = max(plumbing-filtered shortest + 2, 4). For the flagship pair this admits the 4-hop story (filtered shortest = 2? verify during implementation) and keeps absurdly long paths out. Accept?

Q7. Specificity bucket boundaries: the doc's implied bucket scheme collapses on the real distribution (E2). Recommend: bucket by absolute edge-use counts, not IDF: uses > 1000 -> 0, 101-1000 -> 1, 11-100 -> 2, <= 10 -> 3. RecId/DataAreaId/Partition/ItemId/AccountNum land in 0, InventTransId (618) in 1, CustAccount (208) in 1, named refs (80) in 2. This is deterministic, portable, and testable. Accept?

Q8. Specificity is demoted to secondary: the measurements (E3) prove it cannot be the primary separator for the flagship pair. Recommend: semantic score = existing v1 terms (plumbing/generic/hub/businessKey/documented, with documented once per path) + specificity term, and the comparator puts class first, so specificity only differentiates within a class. Accept this demotion explicitly?

Q9. JSON artifact size: full field map is 121KB, (childField,parent) pair map is 763KB, not ~20KB. Recommend: invert the artifact. Ship only common overrides: pairs with count >= 10 (340 entries, 11.2KB), absent pairs default to bucket 3 (rare). Optionally also the ~30 most common field buckets for the field-level term. The generator script lives in the repo, is deterministic (stable sort, integer counts only, no floats), and both JS and Python load the same committed JSON. Accept?

Q10. Drop parent in-degree (endpoint selectivity) as a separate term: the story path's own anchors are hubs (CustTable 403 children, InventTable 596, InventTransOrigin 192), so the term penalizes the flagship path. The (childField,parent) pair count already carries endpoint context. Also drop the new name-contains-parent-stem term: v1 Rule 1 already covers its reliable part (E7). Accept?

Q11. Directed semantics: the alternation signal as specified is unbuildable on this dataset. The map is 97.8% mirrored (E1), so "drill-down vs lookup" per step is an artifact of neighbor order and dedupe, and the same physical path can be assigned different direction patterns across pairs or after sorting changes. Both models' alternation claims (Claude's "story paths alternate", GPT's "all-lookup chains are noise") are untestable here without a direction convention the dataset does not provide. Recommend: DROP the alternation term entirely and let Q1's role-transition coherence carry the semantics (it is direction-agnostic and robust to mirroring). Accept?

Q12. Candidate-pool budget: the numbers (E4, E5) show the 300ms budget is achievable only with three changes: (a) pool retention by the v2 comparator (class first), not the additive score, otherwise the story path is always evicted; (b) DFS nexts ordering by a class-aware edge score, so the story branch is reached within existing branch budgets (it currently sits ~29th of 1,184 branches); (c) the +2 window as a depth cap for the semantic pass. With these, the measured 129ms default sweep leaves ~170ms headroom. Recommend: Phase 3 = (a)+(b)+(c), keep truncation flags honest, and do NOT add a second shortest+semantic dual search (redundant with class-aware ordering). Accept?

Q13. Pool-exclusion fixtures need an observable contract. The API returns only the sliced top-N, so "path exists but must not be cut by candidate buckets" is untestable from outside. Recommend: no new pool-dump API. The fixture asserts the path surfaces at top-N with maxHops set to the exact path length (window covers it, so only bucket logic can cut it). Accept?

Q14. Fixture schema for negatives: recommend adding mustNotSurface (array of table paths with the same bar semantics: must NOT appear in the top-N), plus pattern-level asserts (regex over table sequences, e.g. no top-10 path at a given pair may contain a Tmp*/Dimension*/derived intermediate, no top-10 payment-noise domination for sales/purchasing pairs). Existing top10-sane and top10-no-payment-noise asserts stay. Concrete candidates already verified in the dataset: negative, InventTable>CustInvoiceSpecTmp>...>CustTable style temp detours; positive analogue, InventTable>InventTrans>InventTransOrigin>PurchLine>VendTable (E8); same-hop saturation, the story vs noise 4-hop pair (E8). Accept?

Q15. Upgrade fixture #1 (inventtable-custtable-story) from bar='existence' to bar='top-10' as the v2 acceptance gate. The entire design exists to make the flagship story path rank. If the new comparator cannot put it in the top-10 for its own flagship pair, v2 has failed regardless of everything else. The editorial badge and canonical-row UI remain, but they must no longer be the only way the story surfaces. Accept?

## 4. External docs: do NOT adopt

- Claude: edge betweenness artifact (~150KB, unclear benefit over role+pair signals, extra parity surface). Skip.
- Claude: harmonic-mean rescoring (requires a positive-only weight rework of the entire penalty model). Skip.
- Claude: embedding/vector similarity of paths (parity and determinism risk). Skip.
- Claude: the field-rarity worked numbers (ItemId ~7.5 etc.) are factually wrong for this dataset (E2). Do not carry them into bucket calibration.
- Claude: "the FK map already encodes which side is child/parent". False for this dataset (E1). This is the basis for dropping alternation in Q11.
- GPT: the 4-mode split. Already rejected by Hidayat, do not resurrect.
- GPT: "run one shortest search and one semantic search, then merge". Redundant with Q12's class-aware ordering; a second search doubles enumeration cost for no recall gain.
- GPT: "~20KB" artifact estimate. Off by 6-38x for the naive maps; achievable only via the inverted common-override map (Q9).

## 5. What survives if every recommendation is accepted

- Lexicographic comparator with class first, rounded semantic score, hops, diversity, stable key.
- Role-transition coherence as the class backbone (replaces alternation).
- Specificity as a secondary per-edge term with count-based buckets and an 11KB override map.
- Diversity as a pure tiebreak, removed from the displayed score.
- Documented bonus once per path.
- Window = plumbing-filtered shortest + 2, floor 4, as both depth cap and eligibility filter.
- Class-aware pool retention and ordering, honest truncation flags.
- Reason codes + editorial badge, both deterministic and parity-tested.
- Expanded fixture suite with positives, negatives, analogues, same-hop saturation, and pool-exclusion cases, plus the story fixture upgraded to top-10 as the acceptance gate.
