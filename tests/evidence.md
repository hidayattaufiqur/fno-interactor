# Pathfinder before/after evidence (story-path surfacing hardening)

Old = commit 3bac410 (pre-change scoring/enumeration). New = Rule 1 (Q3) +
Rule 2 (Q4, added because the story fixture failed) + named-reference
business-key extension + A+C' enumeration (Q5, score-first branch order,
best-per-hop-level retention, branch-balanced sweep). Both runs use the
cached-map harness (tests/harness.mjs) against static/data/fk-map.json.

## Unique-mode top-10, old vs new, with scores

| pair | old #1 | old top-10 | new #1 | new top-10 | story path |
|---|---|---|---|---|---|
| canon-inventdim-companyinfo | InventDim>SMAServiceOrderLine>ProjCostTrans>CompanyInfo (5.50) | InventDim>SMAServiceOrderLine>ProjCostTrans>CompanyInfo (5.50); InventDim>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo (5.00); InventDim>ProdCalcTrans>PlanReference>CompanyInfo (4 | InventDim>VendPackingSlipTrans>VendPackingSlipJour>VendTable>CompanyNAFCode>CompanyInfo (16.53) | InventDim>VendPackingSlipTrans>VendPackingSlipJour>VendTable>CompanyNAFCode>CompanyInfo (16.53); InventDim>ReqItemTable>VendTable>TaxVATNumTable>CompanyInfo (12.42); InventDim>Prod | absent |
| canon-inventtable-custtable | InventTable>SuppItemTable>SuppItemGroup>CustTable (7.50) | InventTable>SuppItemTable>SuppItemGroup>CustTable (7.50); InventTable>CustVendExternalItem>CustVendItemGroup>CustTable (7.33); InventTable>RetailConcessionContractTable>RetailConse | InventTable>VendPackingSlipTrans>VendPackingSlipJour>VendTable>CustTable (15.33) | InventTable>VendPackingSlipTrans>VendPackingSlipJour>VendTable>CustTable (15.33); InventTable>InventSettlement>InventItemGroup>ForecastSales>CustTable (14.50); InventTable>InventTa | absent |
| canon-purchline-salesline | PurchLine>InventSum>SalesLine (7.00) | PurchLine>InventSum>SalesLine (7.00); PurchLine>RouteTable>SalesLine (7.00); PurchLine>BOMTable>SalesLine (7.00); PurchLine>ProjItemTrans>SalesLine (7.00); PurchLine>InterCompanyIn | PurchLine>InventSum>SalesLine (8.00) | PurchLine>InventSum>SalesLine (8.00); PurchLine>RouteTable>SalesLine (8.00); PurchLine>BOMTable>SalesLine (8.00); PurchLine>ProjItemTrans>SalesLine (8.00); PurchLine>ProdTable>Sale | absent |
| canon-salestable-purchtable | SalesTable>InterCompanyPurchSalesReference>PurchTable (5.00) | SalesTable>InterCompanyPurchSalesReference>PurchTable (5.00); SalesTable>InventTestRelatedOperations>PurchTable (5.00); SalesTable>ReturnReasonCode>PurchTable (5.00); SalesTable>In | SalesTable>SalesLine>PurchTable (8.00) | SalesTable>SalesLine>PurchTable (8.00); SalesTable>PurchLine>PurchTable (8.00); SalesTable>ProjTable>PurchTable (8.00); SalesTable>InterCompanyPurchSalesReference>PurchTable (7.00) | absent |
| canon-currency-companyinfo | Currency>ProjCostTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo (6.14) | Currency>ProjCostTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo (6.14); Currency>ProjCostTrans>PSAContractLineItems>ProjEmplTrans>CompanyInfo (4.47); Currency>ProjCostTrans>Pr | Currency>VendPackingSlipTrans>InventDim>Kanban>CompanyInfo (6.50) | Currency>VendPackingSlipTrans>InventDim>Kanban>CompanyInfo (6.50); Currency>ProjectAccountingDistribution>ProjFundingSource>ProjTransPosting>CompanyInfo (6.34); Currency>ProjRevenu | absent |
| inventtrans-custtable-story2 | InventTrans>ProjTable>SMAServiceOrderTable>CustTable (7.03) | InventTrans>ProjTable>SMAServiceOrderTable>CustTable (7.03); InventTrans>ProjTable>SalesTableDelete>CustTable (6.03); InventTrans>ProjTable>PSAComponentGroupAssignment>CustTable (6 | InventTrans>ProjTable>SMAServiceOrderTable>CustTable (10.70) | InventTrans>ProjTable>SMAServiceOrderTable>CustTable (10.70); InventTrans>ProjTable>SalesTable>CustTable (10.70); InventTrans>InventSum>SalesQuotationLine>CustTable (10.67); Invent | absent |
| salestable-purchtable-direct | SalesTable>PurchTable (1.00) | SalesTable>PurchTable (1.00) | SalesTable>PurchTable (3.00) | SalesTable>PurchTable (3.00) | absent |
| salestable-vendtable-no-payment-noise | SalesTable>InventTestCertOfAnalysisTable>InventQualityOrderTable>InventNonConformanceTable>VendTable (9.20) | SalesTable>InventTestCertOfAnalysisTable>InventQualityOrderTable>InventNonConformanceTable>VendTable (9.20); SalesTable>InventTestCertOfAnalysisTable>InventQualityOrderTable>WrkCtr | SalesTable>PurchTable>ReqPO>InventTable>VendTable (13.90) | SalesTable>PurchTable>ReqPO>InventTable>VendTable (13.90); SalesTable>SalesLine>InventTransferTable>ReqPO>VendTable (13.75); SalesTable>SalesLine>InventTransferTable>ProdBOM>VendTa | absent |
| salestable-custtable-direct | SalesTable>CustTable (1.00) | SalesTable>CustTable (1.00) | SalesTable>CustTable (3.00) | SalesTable>CustTable (3.00) | absent |
| purchtable-vendtable-direct | PurchTable>VendTable (1.00) | PurchTable>VendTable (1.00) | PurchTable>VendTable (3.00) | PurchTable>VendTable (3.00) | absent |
| inventtable-inventsum-direct | InventTable>InventSum (3.00) | InventTable>InventSum (3.00) | InventTable>InventSum (3.00) | InventTable>InventSum (3.00) | absent |
| custinvoicejour-salestable-direct | CustInvoiceJour>SalesTable (1.00) | CustInvoiceJour>SalesTable (1.00) | CustInvoiceJour>SalesTable (3.00) | CustInvoiceJour>SalesTable (3.00) | absent |
| salesline-inventtransorigin-direct | SalesLine>InventTransOrigin (0.00) | SalesLine>InventTransOrigin (0.00) | SalesLine>InventTransOrigin (2.00) | SalesLine>InventTransOrigin (2.00) | absent |
| salesline-custtable-direct | SalesLine>CustTable (1.00) | SalesLine>CustTable (1.00) | SalesLine>CustTable (3.00) | SalesLine>CustTable (3.00) | absent |
| projgrant-projgranttype-rule1 | ProjGrant>ProjGrantType (-3.00) | ProjGrant>ProjGrantType (-3.00) | ProjGrant>ProjGrantType (2.00) | ProjGrant>ProjGrantType (2.00) | absent |
| workflowassignment-workflowstep-rule1 | WorkflowAssignmentTable>WorkflowStepTable (-3.00) | WorkflowAssignmentTable>WorkflowStepTable (-3.00) | WorkflowAssignmentTable>WorkflowStepTable (2.00) | WorkflowAssignmentTable>WorkflowStepTable (2.00) | absent |
| inventtable-vendtable-direct | InventTable>VendTable (1.00) | InventTable>VendTable (1.00) | InventTable>VendTable (3.00) | InventTable>VendTable (3.00) | absent |
| salestable-salesline-direct | SalesTable>SalesLine (2.00) | SalesTable>SalesLine (2.00) | SalesTable>SalesLine (3.00) | SalesTable>SalesLine (3.00) | absent |
| inventtable-prodtable-direct | InventTable>ProdTable (2.00) | InventTable>ProdTable (2.00) | InventTable>ProdTable (3.00) | InventTable>ProdTable (3.00) | absent |

## Story path (fixture #1): InventTable → InventTrans → InventTransOrigin → SalesLine → CustTable

- Old: not in the top-10 at maxHops 4 (pre-diversity 1 under old scoring; enumeration never reached the branch).
- New: pre-diversity (see below) — measured pre-diversity 11 (Rule 1 + Rule 2 + named-ref business key), pool cut is a flat 12.0 (documented business-key chains saturate at 4 × (2+1)); the story path therefore does NOT enter the top-50 pool, and the diversity term (which differentiates the flat pool) cannot lift it. Even with InventTransOrigin added to the documented set (+1 → 12), the tie-break and the low diversity of its shared core-chain edges (InventTrans/InventTransOrigin/SalesLine are the domain's most-connected chain) keep it out of the top-10.
- Enumeration cost: the story branch sits ~29th among 1,184 qualifying source branches (score-order) and its path completes ~940 completions into the branch; surfacing it costs ~27k completions at level 4 (>1.5s), beyond the 300ms budget.

## Shortest-mode contract (default sort)

- API shape unchanged: results[].steps[].{table,via}, score, diversity, breakdown; shortest; truncated (boolean). New additive fields: truncation {levelCap,totalCap,iterations}, missing[].
- hops-first ranking preserved for every pair (fewest hops first, then score).
- shortest values identical old vs new for all 19 pairs.
- Scores and same-hop ordering shift by design: Rule 1/2/named-ref are scoring changes (every named FK→PK edge gains, hub penalties waive on business-key edges). The top-1 2-hop path of each pair changed where a higher-scoring business chain now outranks the old first-found path.

## Truncation honesty (Q12) and missing tables (Q13)

- Old: truncated only fired on the iteration cap; pool caps were silent.
- New: truncated = any of levelCap/totalCap/iterations; truncation detail returned. All 19 evidence pairs report truncation flags (levelCap bites whenever a hop level has more paths than the cap — the honest "sampled pool" signal).
- missing[] distinguishes absent tables from "no path within maxHops" (verified: missing ['NopeTable'] on a typo'd query).
