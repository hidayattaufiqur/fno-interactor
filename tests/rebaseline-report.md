# Golden diff (fc48af8 -> HEAD, top-20 each)

## InventTable->CustTable@4 — CHANGED (18 rank positions differ, old count 20 -> new 20)
    1. OLD: InventTable>InventTrans>InventTransOrigin>SalesQuotationLine>CustTable  16.000000 c3
      1. NEW: InventTable>InventTrans>InventTransOrigin>SalesQuotationLine>CustTable  16.000000 c3
    2. OLD: InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable  16.000000 c3
      2. NEW: InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable  16.000000 c3
  * 3. OLD: InventTable>WMSJournalTrans>SalesLine>CustTable  14.000000 c3
      3. NEW: InventTable>SMAAgreementLine>SMAServiceOrderLine>SMAServiceOrderTable>CustTable  18.000000 c2
  * 4. OLD: InventTable>SMAAgreementLine>SMAServiceOrderLine>SMAServiceOrderTable>CustTable  18.000000 c2
      4. NEW: InventTable>CustInvoiceTrans>InventPackagingMaterialTrans>SalesTable>CustTable  17.000000 c2
  * 5. OLD: InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable  18.000000 c2
      5. NEW: InventTable>VendInvoiceTrans>ProjItemTrans>SalesLine>CustTable  17.000000 c2
  * 6. OLD: InventTable>CustInvoiceTrans>InventPackagingMaterialTrans>SalesTable>CustTable  17.000000 c2
      6. NEW: InventTable>VendInvoiceTrans>ProjItemTrans>ProjProposalItem>CustTable  17.000000 c2
  * 7. OLD: InventTable>VendInvoiceTrans>ProjItemTrans>ProjProposalItem>CustTable  17.000000 c2
      7. NEW: InventTable>VendInvoiceInfoLine>PurchLine>VendTable>CustTable  16.000000 c2
  * 8. OLD: InventTable>VendInvoiceTrans>ProjItemTrans>SalesLine>CustTable  17.000000 c2
      8. NEW: InventTable>SMAServiceOrderLine>SMAAgreementLine>ProjTable>CustTable  16.000000 c2
  * 9. OLD: InventTable>VendInvoiceInfoLine>PurchLine>VendTable>CustTable  16.000000 c2
      9. NEW: InventTable>VendPackingSlipTrans>SourceDocumentLine>CustInvoiceTable>CustTable  16.000000 c2
  * 10. OLD: InventTable>SMAServiceOrderLine>SMAAgreementLine>ProjTable>CustTable  16.000000 c2
      10. NEW: InventTable>SalesLine>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2
  * 11. OLD: InventTable>VendPackingSlipTrans>SourceDocumentLine>CustInvoiceTable>CustTable  16.000000 c2
      11. NEW: InventTable>SMAAgreementLine>SMAServiceOrderLine>ProjTable>CustTable  16.000000 c2
  * 12. OLD: InventTable>SalesLine>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2
      12. NEW: InventTable>CustPackingSlipTrans>SourceDocumentLine>SalesLine>CustTable  16.000000 c2
  * 13. OLD: InventTable>SMAAgreementLine>SMAServiceOrderLine>ProjTable>CustTable  16.000000 c2
      13. NEW: InventTable>CustPackingSlipTrans>SourceDocumentLine>CustInvoiceTable>CustTable  16.000000 c2
  * 14. OLD: InventTable>CustPackingSlipTrans>SourceDocumentLine>SalesLine>CustTable  16.000000 c2
      14. NEW: InventTable>VendInvoiceTrans>ProjItemTrans>ProjTable>CustTable  16.000000 c2
  * 15. OLD: InventTable>CustPackingSlipTrans>SourceDocumentLine>CustInvoiceTable>CustTable  16.000000 c2
      15. NEW: InventTable>InventJournalTrans>ProjItemTrans>SalesLine>CustTable  16.000000 c2
  * 16. OLD: InventTable>VendInvoiceTrans>ProjItemTrans>ProjTable>CustTable  16.000000 c2
      16. NEW: InventTable>PurchLine>ProjItemTrans>SalesLine>CustTable  16.000000 c2
  * 17. OLD: InventTable>InventJournalTrans>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2
      17. NEW: InventTable>PurchReqLine>ProjItemTrans>SalesLine>CustTable  16.000000 c2
  * 18. OLD: InventTable>PurchLine>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2
      18. NEW: InventTable>InventJournalTrans>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2
  * 19. OLD: InventTable>InventJournalTrans>ProjItemTrans>SalesLine>CustTable  16.000000 c2
      19. NEW: InventTable>PurchLine>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2
  * 20. OLD: InventTable>PurchLine>ProjItemTrans>SalesLine>CustTable  16.000000 c2
      20. NEW: InventTable>PurchReqLine>ProjItemTrans>ProjProposalItem>CustTable  16.000000 c2

## PurchLine->SalesLine@2 — CHANGED (1 rank positions differ, old count 20 -> new 20)
  * 1. OLD: PurchLine>AgreementLineReleasedLine>SalesLine  11.000000 c2
      1. NEW: PurchLine>AgreementLineReleasedLine>SalesLine  11.000000 c3
    2. OLD: PurchLine>BarcodeSetup>SalesLine  11.000000 c2
      2. NEW: PurchLine>BarcodeSetup>SalesLine  11.000000 c2
    3. OLD: PurchLine>InterCompanyInventSum>SalesLine  11.000000 c2
      3. NEW: PurchLine>InterCompanyInventSum>SalesLine  11.000000 c2
    4. OLD: PurchLine>InventDimCombination>SalesLine  11.000000 c2
      4. NEW: PurchLine>InventDimCombination>SalesLine  11.000000 c2
    5. OLD: PurchLine>InventItemBarcode>SalesLine  11.000000 c2
      5. NEW: PurchLine>InventItemBarcode>SalesLine  11.000000 c2
    6. OLD: PurchLine>InventQualityOrderTable>SalesLine  11.000000 c2
      6. NEW: PurchLine>InventQualityOrderTable>SalesLine  11.000000 c2
    7. OLD: PurchLine>PBATable>SalesLine  11.000000 c2
      7. NEW: PurchLine>PBATable>SalesLine  11.000000 c2
    8. OLD: PurchLine>PdsMRCDocument>SalesLine  11.000000 c2
      8. NEW: PurchLine>PdsMRCDocument>SalesLine  11.000000 c2
    9. OLD: PurchLine>PdsMRCEventTracker>SalesLine  11.000000 c2
      9. NEW: PurchLine>PdsMRCEventTracker>SalesLine  11.000000 c2
    10. OLD: PurchLine>ProdTable>SalesLine  11.000000 c2
      10. NEW: PurchLine>ProdTable>SalesLine  11.000000 c2
    11. OLD: PurchLine>ReturnDispositionCode>SalesLine  11.000000 c2
      11. NEW: PurchLine>ReturnDispositionCode>SalesLine  11.000000 c2
    12. OLD: PurchLine>SalesTable>SalesLine  11.000000 c2
      12. NEW: PurchLine>SalesTable>SalesLine  11.000000 c2
    13. OLD: PurchLine>WMSJournalTrans>SalesLine  11.000000 c2
      13. NEW: PurchLine>WMSJournalTrans>SalesLine  11.000000 c2
    14. OLD: PurchLine>WMSOrder>SalesLine  11.000000 c2
      14. NEW: PurchLine>WMSOrder>SalesLine  11.000000 c2
    15. OLD: PurchLine>WMSOrderTrans>SalesLine  11.000000 c2
      15. NEW: PurchLine>WMSOrderTrans>SalesLine  11.000000 c2
    16. OLD: PurchLine>PurchTable>SalesLine  10.000000 c2
      16. NEW: PurchLine>PurchTable>SalesLine  10.000000 c2
    17. OLD: PurchLine>BOMTable>SalesLine  9.000000 c2
      17. NEW: PurchLine>BOMTable>SalesLine  9.000000 c2
    18. OLD: PurchLine>IntrastatPort>SalesLine  9.000000 c2
      18. NEW: PurchLine>IntrastatPort>SalesLine  9.000000 c2
    19. OLD: PurchLine>IntrastatStatProc>SalesLine  9.000000 c2
      19. NEW: PurchLine>IntrastatStatProc>SalesLine  9.000000 c2
    20. OLD: PurchLine>IntrastatTransactionCode>SalesLine  9.000000 c2
      20. NEW: PurchLine>IntrastatTransactionCode>SalesLine  9.000000 c2

## SalesTable->PurchTable@2 — CHANGED (17 rank positions differ, old count 20 -> new 20)
    1. OLD: SalesTable>AgreementReleaseHeaderMatch>PurchTable  11.000000 c2
      1. NEW: SalesTable>AgreementReleaseHeaderMatch>PurchTable  11.000000 c2
    2. OLD: SalesTable>InventCostTrans>PurchTable  11.000000 c2
      2. NEW: SalesTable>InventCostTrans>PurchTable  11.000000 c2
    3. OLD: SalesTable>InventNonConformanceTable>PurchTable  11.000000 c2
      3. NEW: SalesTable>InventNonConformanceTable>PurchTable  11.000000 c2
  * 4. OLD: SalesTable>InventQuarantineOrder>PurchTable  11.000000 c2
      4. NEW: SalesTable>InventQualityOrderTable>PurchTable  11.000000 c2
  * 5. OLD: SalesTable>InventSumLogTTS>PurchTable  11.000000 c2
      5. NEW: SalesTable>InventQuarantineOrder>PurchTable  11.000000 c2
  * 6. OLD: SalesTable>PriceDiscGroup>PurchTable  11.000000 c2
      6. NEW: SalesTable>InventSumLogTTS>PurchTable  11.000000 c2
  * 7. OLD: SalesTable>ReturnReasonCode>PurchTable  11.000000 c2
      7. NEW: SalesTable>PriceDiscGroup>PurchTable  11.000000 c2
  * 8. OLD: SalesTable>SalesLine>PurchTable  11.000000 c2
      8. NEW: SalesTable>ReturnReasonCode>PurchTable  11.000000 c2
  * 9. OLD: SalesTable>WMSJournalTable>PurchTable  11.000000 c2
      9. NEW: SalesTable>SalesLine>PurchTable  11.000000 c2
  * 10. OLD: SalesTable>WMSJournalTrans>PurchTable  11.000000 c2
      10. NEW: SalesTable>WMSJournalTable>PurchTable  11.000000 c2
  * 11. OLD: SalesTable>WMSOrderTrans>PurchTable  11.000000 c2
      11. NEW: SalesTable>WMSJournalTrans>PurchTable  11.000000 c2
  * 12. OLD: SalesTable>ContactPerson>PurchTable  10.000000 c2
      12. NEW: SalesTable>WMSOrderTrans>PurchTable  11.000000 c2
  * 13. OLD: SalesTable>InventLocation>PurchTable  10.000000 c2
      13. NEW: SalesTable>PurchLine>PurchTable  10.000000 c2
  * 14. OLD: SalesTable>PurchLine>PurchTable  10.000000 c2
      14. NEW: SalesTable>InterCompanyPurchSalesReference>PurchTable  9.000000 c2
  * 15. OLD: SalesTable>InterCompanyPurchSalesReference>PurchTable  9.000000 c2
      15. NEW: SalesTable>IntrastatPort>PurchTable  9.000000 c2
  * 16. OLD: SalesTable>IntrastatPort>PurchTable  9.000000 c2
      16. NEW: SalesTable>IntrastatStatProc>PurchTable  9.000000 c2
  * 17. OLD: SalesTable>IntrastatStatProc>PurchTable  9.000000 c2
      17. NEW: SalesTable>IntrastatTransactionCode>PurchTable  9.000000 c2
  * 18. OLD: SalesTable>IntrastatTransactionCode>PurchTable  9.000000 c2
      18. NEW: SalesTable>IntrastatTransportMode>PurchTable  9.000000 c2
  * 19. OLD: SalesTable>IntrastatTransportMode>PurchTable  9.000000 c2
      19. NEW: SalesTable>InventTestRelatedOperations>PurchTable  9.000000 c2
  * 20. OLD: SalesTable>InventSite>PurchTable  9.000000 c2
      20. NEW: SalesTable>NumberSequenceGroup>PurchTable  9.000000 c2

## Currency->CompanyInfo@4 — CHANGED (19 rank positions differ, old count 20 -> new 20)
    1. OLD: Currency>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo  14.000000 c2
      1. NEW: Currency>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo  14.000000 c2
  * 2. OLD: Currency>BankAccountTrans>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      2. NEW: Currency>BankAccountTrans>BankAccountTable>CompanyInfo  9.000000 c2
  * 3. OLD: Currency>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      3. NEW: Currency>CustBillOfExchangeTrans>BankAccountTable>CompanyInfo  8.000000 c2
  * 4. OLD: Currency>CustPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  4.000000 c1
      4. NEW: Currency>VendPromissoryNoteTrans>BankAccountTable>CompanyInfo  8.000000 c2
  * 5. OLD: Currency>LvCashStateTrans>LogisticsAddressCountryRegion>CompanyInfo  4.000000 c1
      5. NEW: Currency>BankChequePaymTrans>BankAccountTable>CompanyInfo  7.000000 c2
  * 6. OLD: Currency>LogisticsAddressCountryRegion>CompanyInfo  1.000000 c1
      6. NEW: Currency>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  5.000000 c1
  * 7. OLD: Currency>BankAccountTrans>BankChequeTable>BankAccountTable>CompanyInfo  13.000000 c0
      7. NEW: Currency>CustVendPaymProposalLine>BankAccountTable>CompanyInfo  5.000000 c1
  * 8. OLD: Currency>ProjectRevenueLine>SourceDocumentLine>TrvRequisitionLine>CompanyInfo  12.000000 c0
      8. NEW: Currency>CustPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  3.000000 c1
  * 9. OLD: Currency>SMAServiceOrderLine>ProjCostTrans>ProjInvoiceCost>CompanyInfo  12.000000 c0
      9. NEW: Currency>LvCashStateTrans>LogisticsAddressCountryRegion>CompanyInfo  3.000000 c1
  * 10. OLD: Currency>SMAServiceOrderLine>ProjCostTrans>ProjTransPosting>CompanyInfo  12.000000 c0
      10. NEW: Currency>BankAccountTable>CompanyInfo  2.000000 c1
  * 11. OLD: Currency>ProjCostTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  12.000000 c0
      11. NEW: Currency>LogisticsAddressCountryRegion>CompanyInfo  0.000000 c1
  * 12. OLD: Currency>SMAAgreementLine>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  12.000000 c0
      12. NEW: Currency>InventTransferLine>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  13.000000 c0
  * 13. OLD: Currency>SMAAgreementLine>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  12.000000 c0
      13. NEW: Currency>ProjectRevenueLine>SourceDocumentLine>TrvRequisitionLine>CompanyInfo  11.000000 c0
  * 14. OLD: Currency>VendPackingSlipTrans>SourceDocumentLine>ProjectRevenueLine>CompanyInfo  11.000000 c0
      14. NEW: Currency>InventTrans>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  11.000000 c0
  * 15. OLD: Currency>ProjectRevenueLine>SourceDocumentLine>PurchReqLine>CompanyInfo  11.000000 c0
      15. NEW: Currency>ProjCostTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  11.000000 c0
  * 16. OLD: Currency>ProjEmplTrans>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  11.000000 c0
      16. NEW: Currency>SMAAgreementLine>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  11.000000 c0
  * 17. OLD: Currency>ProjItemTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  11.000000 c0
      17. NEW: Currency>SMAAgreementLine>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  11.000000 c0
  * 18. OLD: Currency>ProjRevenueTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  11.000000 c0
      18. NEW: Currency>ProjEmplTrans>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  10.000000 c0
  * 19. OLD: Currency>ProjItemTrans>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  11.000000 c0
      19. NEW: Currency>ProjRevenueTrans>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  10.000000 c0
  * 20. OLD: Currency>ProjRevenueTrans>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  11.000000 c0
      20. NEW: Currency>ProjRevenueTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  10.000000 c0

## InventDim->CompanyInfo@5 — CHANGED (18 rank positions differ, old count 20 -> new 20)
    1. OLD: InventDim>ProdCalcTrans>VendTable>TaxVATNumTable>CompanyInfo  19.000000 c2
      1. NEW: InventDim>ProdCalcTrans>VendTable>TaxVATNumTable>CompanyInfo  19.000000 c2
    2. OLD: InventDim>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo  15.000000 c2
      2. NEW: InventDim>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo  15.000000 c2
  * 3. OLD: InventDim>InventBatch>LogisticsAddressCountryRegion>CompanyInfo  8.000000 c1
      3. NEW: InventDim>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  5.000000 c1
  * 4. OLD: InventDim>InventGTD_RU>LogisticsAddressCountryRegion>CompanyInfo  8.000000 c1
      4. NEW: InventDim>CustPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  5.000000 c1
  * 5. OLD: InventDim>CustInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      5. NEW: InventDim>VendInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo  5.000000 c1
  * 6. OLD: InventDim>CustPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      6. NEW: InventDim>CustInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo  5.000000 c1
  * 7. OLD: InventDim>ProjInvoiceItem>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      7. NEW: InventDim>CustomJournalTrans_RU>LogisticsAddressCountryRegion>CompanyInfo  4.000000 c1
  * 8. OLD: InventDim>VendInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      8. NEW: InventDim>InventTrans>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  14.000000 c0
  * 9. OLD: InventDim>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo  6.000000 c1
      9. NEW: InventDim>InventTransferLine>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  13.000000 c0
  * 10. OLD: InventDim>CustomJournalTrans_RU>LogisticsAddressCountryRegion>CompanyInfo  5.000000 c1
      10. NEW: InventDim>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  11.000000 c0
  * 11. OLD: InventDim>InventTrans>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  14.000000 c0
      11. NEW: InventDim>InventJournalTrans>ProjItemTrans>PurchReqLine>CompanyInfo  11.000000 c0
  * 12. OLD: InventDim>InventJournalTrans>ProjItemTrans>ProjTransPosting>CompanyInfo  13.000000 c0
      12. NEW: InventDim>PurchLine>PurchReqLine>PurchReqTable>CompanyInfo  11.000000 c0
  * 13. OLD: InventDim>InventTransferLine>InventTransOrigin>InventPendingRegistrationDetail>CompanyInfo  13.000000 c0
      13. NEW: InventDim>SMAAgreementLine>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  11.000000 c0
  * 14. OLD: InventDim>ProdCalcTrans>VendTable>WorkCalendarTable>CompanyInfo  13.000000 c0
      14. NEW: InventDim>VendInvoiceTrans>ProjItemTrans>ProjTransPosting>CompanyInfo  11.000000 c0
  * 15. OLD: InventDim>PurchLine>PurchReqLine>PurchReqTable>CompanyInfo  12.000000 c0
      15. NEW: InventDim>SMAServiceOrderLine>ProjCostTrans>ProjInvoiceCost>CompanyInfo  11.000000 c0
  * 16. OLD: InventDim>SMAServiceOrderLine>ProjCostTrans>ProjInvoiceCost>CompanyInfo  12.000000 c0
      16. NEW: InventDim>SMAAgreementLine>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  11.000000 c0
  * 17. OLD: InventDim>ProjItemTrans>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  12.000000 c0
      17. NEW: InventDim>SMAServiceOrderLine>ProjCostTrans>ProjTransPosting>CompanyInfo  11.000000 c0
  * 18. OLD: InventDim>SMAAgreementLine>SMAServiceOrderLine>ProjEmplTrans>CompanyInfo  12.000000 c0
      18. NEW: InventDim>CustInvoiceTrans>SourceDocumentLine>TrvRequisitionLine>CompanyInfo  10.000000 c0
  * 19. OLD: InventDim>ProjItemTrans>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  12.000000 c0
      19. NEW: InventDim>CustPackingSlipTrans>SourceDocumentLine>ProjectRevenueLine>CompanyInfo  10.000000 c0
  * 20. OLD: InventDim>SMAAgreementLine>SMAServiceOrderLine>ProjCostTrans>CompanyInfo  12.000000 c0
      20. NEW: InventDim>CustInvoiceTrans>SourceDocumentLine>ProjectRevenueLine>CompanyInfo  10.000000 c0

## SalesTable->VendTable@4 — CHANGED (16 rank positions differ, old count 20 -> new 20)
  * 1. OLD: SalesTable>WMSJournalTrans>PurchLine>VendInvoiceInfoLine>VendTable  19.000000 c3
      1. NEW: SalesTable>WMSJournalTrans>PurchLine>PurchReqLine>VendTable  20.000000 c3
  * 2. OLD: SalesTable>WMSOrderTrans>PurchLine>VendTable  15.000000 c3
      2. NEW: SalesTable>WMSJournalTrans>PurchLine>VendInvoiceInfoLine>VendTable  19.000000 c3
  * 3. OLD: SalesTable>WMSJournalTrans>PurchLine>VendTable  15.000000 c3
      3. NEW: SalesTable>WMSOrderTrans>PurchLine>VendTable  15.000000 c3
  * 4. OLD: SalesTable>SalesLine>CustTable>VendTable  14.000000 c3
      4. NEW: SalesTable>WMSJournalTrans>PurchLine>VendTable  15.000000 c3
    5. OLD: SalesTable>RetailTransactionOrderInvoiceTrans>RetailTerminalTable>NumberSequenceGroup>VendTable  20.000000 c2
      5. NEW: SalesTable>RetailTransactionOrderInvoiceTrans>RetailTerminalTable>NumberSequenceGroup>VendTable  20.000000 c2
    6. OLD: SalesTable>PurchLine>VendInvoiceInfoLine>VendInvoiceInfoTable>VendTable  19.000000 c2
      6. NEW: SalesTable>PurchLine>VendInvoiceInfoLine>VendInvoiceInfoTable>VendTable  19.000000 c2
    7. OLD: SalesTable>CustInvoiceTrans>AgreementLineReleasedLine>PurchLine>VendTable  19.000000 c2
      7. NEW: SalesTable>CustInvoiceTrans>AgreementLineReleasedLine>PurchLine>VendTable  19.000000 c2
  * 8. OLD: SalesTable>RetailTransactionOrderInvoiceTrans>RetailTerminalTable>RetailTMPTransactionSalesTrans>VendTable  18.000000 c2
      8. NEW: SalesTable>CreditCardAuthTrans>CustInvoiceJour>CustTable>VendTable  18.000000 c2
    9. OLD: SalesTable>CustInvoiceTrans>InventPackagingMaterialTrans>InventTable>VendTable  18.000000 c2
      9. NEW: SalesTable>CustInvoiceTrans>InventPackagingMaterialTrans>InventTable>VendTable  18.000000 c2
  * 10. OLD: SalesTable>CreditCardAuthTrans>CustInvoiceJour>CustTable>VendTable  18.000000 c2
      10. NEW: SalesTable>RetailTransactionOrderInvoiceTrans>RetailTerminalTable>RetailTMPTransactionSalesTrans>VendTable  18.000000 c2
  * 11. OLD: SalesTable>SalesLine>ProjItemTrans>InventTable>VendTable  18.000000 c2
      11. NEW: SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>InventTable>VendTable  18.000000 c2
  * 12. OLD: SalesTable>SalesLine>ProjItemTrans>PurchLine>VendTable  18.000000 c2
      12. NEW: SalesTable>SalesLine>ProjItemTrans>PurchReqLine>VendTable  18.000000 c2
  * 13. OLD: SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>InventTable>VendTable  18.000000 c2
      13. NEW: SalesTable>SalesLine>ProjItemTrans>PurchLine>VendTable  18.000000 c2
  * 14. OLD: SalesTable>CustPackingSlipTrans>SourceDocumentLine>VendInvoiceInfoLine>VendTable  17.000000 c2
      14. NEW: SalesTable>CustInvoiceBackorderLine>InventTransOrigin>VendInvoiceInfoLine>VendTable  17.000000 c2
  * 15. OLD: SalesTable>CustInvoiceBackorderLine>InventTransOrigin>VendInvoiceInfoLine>VendTable  17.000000 c2
      15. NEW: SalesTable>CustPackingSlipBackorderLine>InventTransOrigin>VendInvoiceInfoLine>VendTable  17.000000 c2
  * 16. OLD: SalesTable>CustPackingSlipBackorderLine>InventTransOrigin>VendInvoiceInfoLine>VendTable  17.000000 c2
      16. NEW: SalesTable>CustPackingSlipTrans>SourceDocumentLine>PurchReqLine>VendTable  17.000000 c2
  * 17. OLD: SalesTable>CreditCardAuthTrans>CustInvoiceJour>CustInvoiceTable>VendTable  16.000000 c2
      17. NEW: SalesTable>CustPackingSlipTrans>SourceDocumentLine>VendInvoiceInfoLine>VendTable  17.000000 c2
  * 18. OLD: SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>PdsRebateTable>VendTable  16.000000 c2
      18. NEW: SalesTable>CreditCardAuthTrans>CustInvoiceJour>CustInvoiceTable>VendTable  16.000000 c2
  * 19. OLD: SalesTable>InventCostTrans>PurchTable>VendTable  15.000000 c2
      19. NEW: SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>PdsRebateTable>VendTable  16.000000 c2
  * 20. OLD: SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>AssetTable>VendTable  15.000000 c2
      20. NEW: SalesTable>InventCostTrans>PurchTable>VendTable  15.000000 c2

## InventTrans->CustTable@3 — CHANGED (14 rank positions differ, old count 20 -> new 20)
    1. OLD: InventTrans>InventTransOrigin>SalesLine>CustTable  13.000000 c3
      1. NEW: InventTrans>InventTransOrigin>SalesLine>CustTable  13.000000 c3
    2. OLD: InventTrans>InventTransOrigin>SalesQuotationLine>CustTable  13.000000 c3
      2. NEW: InventTrans>InventTransOrigin>SalesQuotationLine>CustTable  13.000000 c3
    3. OLD: InventTrans>InventBaileeCalcTable_RU>InventLocation>CustTable  15.000000 c2
      3. NEW: InventTrans>InventBaileeCalcTable_RU>InventLocation>CustTable  15.000000 c2
    4. OLD: InventTrans>InventBaileeCalcTable_RU>InventOwner_RU>CustTable  15.000000 c2
      4. NEW: InventTrans>InventBaileeCalcTable_RU>InventOwner_RU>CustTable  15.000000 c2
  * 5. OLD: InventTrans>InventSum>SalesLine>CustTable  13.000000 c2
      5. NEW: InventTrans>InventTransPosting>ProjTable>CustTable  13.000000 c2
  * 6. OLD: InventTrans>InventSum>SalesQuotationLine>CustTable  13.000000 c2
      6. NEW: InventTrans>InventSum>SalesLine>CustTable  13.000000 c2
  * 7. OLD: InventTrans>ProjCategory>SalesLine>CustTable  13.000000 c2
      7. NEW: InventTrans>InventSum>SalesQuotationLine>CustTable  13.000000 c2
  * 8. OLD: InventTrans>ProjCategory>SalesQuotationLine>CustTable  13.000000 c2
      8. NEW: InventTrans>ProjCategory>SalesLine>CustTable  13.000000 c2
  * 9. OLD: InventTrans>InventDim>SalesQuotationLine>CustTable  12.000000 c2
      9. NEW: InventTrans>ProjCategory>SalesQuotationLine>CustTable  13.000000 c2
  * 10. OLD: InventTrans>InventTransPosting>ProjTable>CustTable  11.000000 c2
      10. NEW: InventTrans>InventTransferJour>InventTransferTable>CustTable  12.000000 c2
  * 11. OLD: InventTrans>InventTable>SalesLine>CustTable  11.000000 c2
      11. NEW: InventTrans>InventDim>SalesQuotationLine>CustTable  12.000000 c2
  * 12. OLD: InventTrans>InventTable>SalesQuotationLine>CustTable  11.000000 c2
      12. NEW: InventTrans>InventTransferJour>VendTable>CustTable  11.000000 c2
  * 13. OLD: InventTrans>ProjTable>SalesLine>CustTable  11.000000 c2
      13. NEW: InventTrans>InventTable>SalesLine>CustTable  11.000000 c2
  * 14. OLD: InventTrans>InventTransferJour>InventTransferTable>CustTable  10.000000 c2
      14. NEW: InventTrans>InventTable>SalesQuotationLine>CustTable  11.000000 c2
  * 15. OLD: InventTrans>InventTransferJour>VendTable>CustTable  9.000000 c2
      15. NEW: InventTrans>ProjTable>SalesLine>CustTable  11.000000 c2
    16. OLD: InventTrans>InventDim>PriceDiscAdmTrans>CustTable  9.000000 c2
      16. NEW: InventTrans>InventDim>PriceDiscAdmTrans>CustTable  9.000000 c2
    17. OLD: InventTrans>ProjTable>CustTable  8.000000 c2
      17. NEW: InventTrans>ProjTable>CustTable  8.000000 c2
  * 18. OLD: InventTrans>smmActivities>SalesQuotationLine>CustTable  8.000000 c2
      18. NEW: InventTrans>Currency>CustTable  -1.000000 c1
  * 19. OLD: InventTrans>smmActivities>SalesLine>CustTable  7.000000 c2
      19. NEW: InventTrans>ProjTable>SpecTrans>CustTable  8.000000 c0
  * 20. OLD: InventTrans>Currency>PriceDiscAdmTrans>CustTable  2.000000 c1
      20. NEW: InventTrans>ProjTable>PSATmpProjProposalTrans>CustTable  5.000000 c0

## SalesLine->CustTable@1 — UNCHANGED (top-1 identical)

## ProjGrant->ProjGrantType@1 — UNCHANGED (top-1 identical)

## SalesLine->TaxTable@5 — NEW pair (no before)


# Per-fixture before/after (top-10, unique/shortest mode)
Note: the fixture dump runs the UI default maxResults=50 (the app calls findPaths without maxResults);
the golden contract runs maxResults=20. Bucket caps scale with maxResults (levelCap=maxResults,
branchCap=maxResults/2, levelAttempts=max(3*levelCap, 16*maxResults)), so pool composition can differ
between the two runs even on the same map — each is internally consistent before vs after.

## inventtable-custtable-story  (InventTable->CustTable, unique, maxHops=4, bar=top-10)
  BEFORE (old map):
    1. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesQuotationLine>CustTable
    2. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable
    3. 14.000000 c3 h3  InventTable>WMSJournalTrans>SalesLine>CustTable
    4. 14.000000 c3 h3  InventTable>WMSOrderTrans>SalesLine>CustTable
    5. 18.000000 c2 h4  InventTable>SMAAgreementLine>SMAServiceOrderLine>SMAServiceOrderTable>CustTable
    6. 18.000000 c2 h4  InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable
    7. 17.000000 c2 h4  InventTable>CustInvoiceTrans>InventPackagingMaterialTrans>SalesTable>CustTable
    8. 17.000000 c2 h4  InventTable>ProjItemTrans>SalesLine>SMAServiceOrderTable>CustTable
    9. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>ProjProposalItem>CustTable
   10. 17.000000 c2 h4  InventTable>VendInvoiceInfoLine>PurchLine>SalesTable>CustTable
  AFTER (new map):
    1. 18.000000 c3 h4  InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable
    2. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesQuotationLine>CustTable
    3. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable
    4. 14.000000 c3 h3  InventTable>WMSOrderTrans>SalesLine>CustTable
    5. 18.000000 c2 h4  InventTable>SMAAgreementLine>SMAServiceOrderLine>SMAServiceOrderTable>CustTable
    6. 17.000000 c2 h4  InventTable>CustInvoiceTrans>InventPackagingMaterialTrans>SalesTable>CustTable
    7. 17.000000 c2 h4  InventTable>VendInvoiceInfoLine>PurchLine>SalesTable>CustTable
    8. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>ProjProposalItem>CustTable
    9. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>SalesLine>CustTable
   10. 16.000000 c2 h4  InventTable>SMAServiceOrderLine>SMAAgreementLine>ProjTable>CustTable
  ASSERTED-PATH RANK CHANGES / CLASS FLIPS:
    InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable: old rank 2 -> new rank 3
    InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable: class 2->3 (same rank area)
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventtrans-custtable-story2  (InventTrans->CustTable, unique, maxHops=3, bar=top-10)
  BEFORE (old map):
    1. 13.000000 c3 h3  InventTrans>InventTransOrigin>SalesQuotationLine>CustTable
    2. 13.000000 c3 h3  InventTrans>InventTransOrigin>SalesLine>CustTable
    3. 15.000000 c2 h3  InventTrans>InventBaileeCalcTable_RU>InventLocation>CustTable
    4. 15.000000 c2 h3  InventTrans>InventBaileeCalcTable_RU>InventOwner_RU>CustTable
    5. 13.000000 c2 h3  InventTrans>InventTransOrigin>PlInventPackageTrans>CustTable
    6. 13.000000 c2 h3  InventTrans>InventSum>SalesQuotationLine>CustTable
    7. 13.000000 c2 h3  InventTrans>InventSum>SalesLine>CustTable
    8. 13.000000 c2 h3  InventTrans>ProjCategory>SalesQuotationLine>CustTable
    9. 13.000000 c2 h3  InventTrans>ProjCategory>SalesLine>CustTable
   10. 12.000000 c2 h3  InventTrans>InventDim>SalesQuotationLine>CustTable
  AFTER (new map):
    1. 13.000000 c3 h3  InventTrans>InventTransOrigin>SalesQuotationLine>CustTable
    2. 13.000000 c3 h3  InventTrans>InventTransOrigin>SalesLine>CustTable
    3. 15.000000 c2 h3  InventTrans>InventBaileeCalcTable_RU>InventLocation>CustTable
    4. 15.000000 c2 h3  InventTrans>InventBaileeCalcTable_RU>InventOwner_RU>CustTable
    5. 13.000000 c2 h3  InventTrans>InventTransOrigin>PlInventPackageTrans>CustTable
    6. 13.000000 c2 h3  InventTrans>InventTransPosting>ProjTable>CustTable
    7. 13.000000 c2 h3  InventTrans>InventSum>SalesQuotationLine>CustTable
    8. 13.000000 c2 h3  InventTrans>InventSum>SalesLine>CustTable
    9. 13.000000 c2 h3  InventTrans>ProjCategory>SalesQuotationLine>CustTable
   10. 13.000000 c2 h3  InventTrans>ProjCategory>SalesLine>CustTable
  TRUNCATION: before=true (levelCap) after=false (none fired); results@50 before=50 after=44; caps: levelCap=50 totalCap=250 maxIterations=200000

## purchline-salesline-inventsum  (PurchLine->SalesLine, unique, maxHops=2, bar=top-25)
  BEFORE (old map):
    1. 11.000000 c2 h2  PurchLine>AgreementLineReleasedLine>SalesLine
    2. 11.000000 c2 h2  PurchLine>BarcodeSetup>SalesLine
    3. 11.000000 c2 h2  PurchLine>InterCompanyInventSum>SalesLine
    4. 11.000000 c2 h2  PurchLine>InventDimCombination>SalesLine
    5. 11.000000 c2 h2  PurchLine>InventItemBarcode>SalesLine
    6. 11.000000 c2 h2  PurchLine>InventQualityOrderTable>SalesLine
    7. 11.000000 c2 h2  PurchLine>PBATable>SalesLine
    8. 11.000000 c2 h2  PurchLine>PdsMRCDocument>SalesLine
    9. 11.000000 c2 h2  PurchLine>PdsMRCEventTracker>SalesLine
   10. 11.000000 c2 h2  PurchLine>ProdTable>SalesLine
  AFTER (new map):
    1. 11.000000 c3 h2  PurchLine>AgreementLineReleasedLine>SalesLine
    2. 11.000000 c2 h2  PurchLine>BarcodeSetup>SalesLine
    3. 11.000000 c2 h2  PurchLine>InterCompanyInventSum>SalesLine
    4. 11.000000 c2 h2  PurchLine>InventDimCombination>SalesLine
    5. 11.000000 c2 h2  PurchLine>InventItemBarcode>SalesLine
    6. 11.000000 c2 h2  PurchLine>InventQualityOrderTable>SalesLine
    7. 11.000000 c2 h2  PurchLine>PBATable>SalesLine
    8. 11.000000 c2 h2  PurchLine>PdsMRCDocument>SalesLine
    9. 11.000000 c2 h2  PurchLine>PdsMRCEventTracker>SalesLine
   10. 11.000000 c2 h2  PurchLine>ProdTable>SalesLine
  ASSERTED-PATH RANK CHANGES / CLASS FLIPS:
    PurchLine>AgreementLineReleasedLine>SalesLine: class 2->3 (same rank area)
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## salestable-purchtable-direct  (SalesTable->PurchTable, shortest, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 5.000000 c2 h1  SalesTable>PurchTable
  AFTER (new map):
    1. 6.000000 c2 h1  SalesTable>PurchTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## salestable-purchtable-wms  (SalesTable->PurchTable, unique, maxHops=2, bar=top-10)
  BEFORE (old map):
    1. 11.000000 c2 h2  SalesTable>AgreementReleaseHeaderMatch>PurchTable
    2. 11.000000 c2 h2  SalesTable>InventCostTrans>PurchTable
    3. 11.000000 c2 h2  SalesTable>InventNonConformanceTable>PurchTable
    4. 11.000000 c2 h2  SalesTable>InventQuarantineOrder>PurchTable
    5. 11.000000 c2 h2  SalesTable>InventSumLogTTS>PurchTable
    6. 11.000000 c2 h2  SalesTable>PriceDiscGroup>PurchTable
    7. 11.000000 c2 h2  SalesTable>ReturnReasonCode>PurchTable
    8. 11.000000 c2 h2  SalesTable>SalesLine>PurchTable
    9. 11.000000 c2 h2  SalesTable>WMSJournalTable>PurchTable
   10. 11.000000 c2 h2  SalesTable>WMSJournalTrans>PurchTable
  AFTER (new map):
    1. 11.000000 c2 h2  SalesTable>AgreementReleaseHeaderMatch>PurchTable
    2. 11.000000 c2 h2  SalesTable>InventCostTrans>PurchTable
    3. 11.000000 c2 h2  SalesTable>InventNonConformanceTable>PurchTable
    4. 11.000000 c2 h2  SalesTable>InventQualityOrderTable>PurchTable
    5. 11.000000 c2 h2  SalesTable>InventQuarantineOrder>PurchTable
    6. 11.000000 c2 h2  SalesTable>InventSumLogTTS>PurchTable
    7. 11.000000 c2 h2  SalesTable>PriceDiscGroup>PurchTable
    8. 11.000000 c2 h2  SalesTable>ReturnReasonCode>PurchTable
    9. 11.000000 c2 h2  SalesTable>SalesLine>PurchTable
   10. 11.000000 c2 h2  SalesTable>WMSJournalTable>PurchTable
  ASSERTED-PATH RANK CHANGES / CLASS FLIPS:
    SalesTable>WMSJournalTable>PurchTable: old rank 9 -> new rank 10
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## currency-companyinfo-diverse  (Currency->CompanyInfo, unique, maxHops=4, bar=top-10)
  BEFORE (old map):
    1. 14.000000 c2 h4  Currency>PriceDiscAdmTrans>CustTable>CompanyNAFCode>CompanyInfo
    2. 14.000000 c2 h4  Currency>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo
    3. 10.000000 c1 h4  Currency>ProjItemTrans>VendInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo
    4. 6.000000 c1 h3  Currency>BankAccountTrans>LogisticsAddressCountryRegion>CompanyInfo
    5. 6.000000 c1 h3  Currency>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo
    6. 5.000000 c1 h3  Currency>TrvExpTrans>LogisticsAddressCountryRegion>CompanyInfo
    7. 4.000000 c1 h3  Currency>LvCashStateTrans>LogisticsAddressCountryRegion>CompanyInfo
    8. 4.000000 c1 h3  Currency>CustPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo
    9. 3.000000 c1 h3  Currency>CustInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo
   10. 3.000000 c1 h3  Currency>VendInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo
  AFTER (new map):
    1. 15.000000 c2 h4  Currency>BankAccountTrans>BankChequeTable>BankAccountTable>CompanyInfo
    2. 14.000000 c2 h4  Currency>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo
    3. 14.000000 c2 h4  Currency>PriceDiscAdmTrans>CustTable>WorkCalendarTable>CompanyInfo
    4. 9.000000 c2 h3  Currency>BankAccountTrans>BankAccountTable>CompanyInfo
    5. 8.000000 c2 h3  Currency>CustBillOfExchangeTrans>BankAccountTable>CompanyInfo
    6. 8.000000 c2 h3  Currency>VendPromissoryNoteTrans>BankAccountTable>CompanyInfo
    7. 7.000000 c2 h3  Currency>BankChequePaymTrans>BankAccountTable>CompanyInfo
    8. 6.000000 c2 h3  Currency>VendTrans>BankAccountTable>CompanyInfo
    9. 7.000000 c1 h3  Currency>BankAccountTrans>BankCentralBankPurpose>CompanyInfo
   10. 5.000000 c1 h3  Currency>CustVendPaymProposalLine>BankAccountTable>CompanyInfo
  TRUNCATION: before=true (levelCap) after=false (none fired); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventdim-companyinfo-sane  (InventDim->CompanyInfo, unique, maxHops=5, bar=top-10)
  BEFORE (old map):
    1. 19.000000 c2 h4  InventDim>ProdCalcTrans>VendTable>CompanyNAFCode>CompanyInfo
    2. 19.000000 c2 h4  InventDim>ProdCalcTrans>VendTable>TaxVATNumTable>CompanyInfo
    3. 15.000000 c2 h4  InventDim>PriceDiscAdmTrans>CustTable>CompanyNAFCode>CompanyInfo
    4. 15.000000 c2 h4  InventDim>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo
    5. 11.000000 c1 h4  InventDim>ProjItemTrans>VendInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo
    6. 8.000000 c1 h3  InventDim>InventBatch>LogisticsAddressCountryRegion>CompanyInfo
    7. 8.000000 c1 h3  InventDim>InventGTD_RU>LogisticsAddressCountryRegion>CompanyInfo
    8. 6.000000 c1 h3  InventDim>ProjInvoiceItem>LogisticsAddressCountryRegion>CompanyInfo
    9. 6.000000 c1 h3  InventDim>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo
   10. 6.000000 c1 h3  InventDim>CustInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo
  AFTER (new map):
    1. 19.000000 c2 h4  InventDim>ProdCalcTrans>VendTable>TaxVATNumTable>CompanyInfo
    2. 19.000000 c2 h4  InventDim>ProdCalcTrans>VendTable>WorkCalendarTable>CompanyInfo
    3. 15.000000 c2 h3  InventDim>InventLocation>WorkCalendarTable>CompanyInfo
    4. 15.000000 c2 h4  InventDim>PriceDiscAdmTrans>CustTable>TaxVATNumTable>CompanyInfo
    5. 15.000000 c2 h4  InventDim>PriceDiscAdmTrans>CustTable>WorkCalendarTable>CompanyInfo
    6. 7.000000 c1 h3  InventDim>InventBatch>LogisticsAddressCountryRegion>CompanyInfo
    7. 7.000000 c1 h3  InventDim>InventGTD_RU>LogisticsAddressCountryRegion>CompanyInfo
    8. 5.000000 c1 h3  InventDim>ProjInvoiceItem>LogisticsAddressCountryRegion>CompanyInfo
    9. 5.000000 c1 h3  InventDim>VendInvoiceTrans>LogisticsAddressCountryRegion>CompanyInfo
   10. 5.000000 c1 h3  InventDim>VendPackingSlipTrans>LogisticsAddressCountryRegion>CompanyInfo
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## salestable-vendtable-no-payment-noise  (SalesTable->VendTable, unique, maxHops=4, bar=top-10)
  BEFORE (old map):
    1. 19.000000 c3 h4  SalesTable>WMSJournalTrans>PurchLine>VendInvoiceInfoLine>VendTable
    2. 15.000000 c3 h3  SalesTable>WMSOrderTrans>PurchLine>VendTable
    3. 15.000000 c3 h3  SalesTable>WMSJournalTrans>PurchLine>VendTable
    4. 14.000000 c3 h3  SalesTable>SalesLine>CustTable>VendTable
    5. 20.000000 c2 h4  SalesTable>RetailTransactionOrderInvoiceTrans>RetailTerminalTable>NumberSequenceGroup>VendTable
    6. 20.000000 c2 h4  SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>NumberSequenceGroup>VendTable
    7. 19.000000 c2 h4  SalesTable>SalesLine>ProjItemTrans>ProdBOM>VendTable
    8. 19.000000 c2 h4  SalesTable>CreditCardAuthTrans>CustInvoiceJour>AssetBook>VendTable
    9. 19.000000 c2 h4  SalesTable>CreditCardAuthTrans>CustInvoiceJour>RAssetTable>VendTable
   10. 19.000000 c2 h4  SalesTable>CustInvoiceTrans>AgreementLineReleasedLine>PurchLine>VendTable
  AFTER (new map):
    1. 20.000000 c3 h4  SalesTable>WMSJournalTrans>PurchLine>PurchReqLine>VendTable
    2. 19.000000 c3 h4  SalesTable>WMSJournalTrans>PurchLine>VendInvoiceInfoLine>VendTable
    3. 15.000000 c3 h3  SalesTable>WMSOrderTrans>PurchLine>VendTable
    4. 15.000000 c3 h3  SalesTable>WMSJournalTrans>PurchLine>VendTable
    5. 14.000000 c3 h3  SalesTable>SalesLine>CustTable>VendTable
    6. 20.000000 c2 h4  SalesTable>RetailTransactionOrderInvoiceTrans>RetailTerminalTable>NumberSequenceGroup>VendTable
    7. 20.000000 c2 h4  SalesTable>InventPackagingMaterialTrans>CustInvoiceTrans>NumberSequenceGroup>VendTable
    8. 19.000000 c2 h4  SalesTable>CreditCardAuthTrans>CustInvoiceJour>RAssetTable>VendTable
    9. 19.000000 c2 h4  SalesTable>SalesLine>ProjItemTrans>ProdBOM>VendTable
   10. 19.000000 c2 h4  SalesTable>CustInvoiceTrans>AgreementLineReleasedLine>PurchLine>VendTable
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## salestable-custtable-direct  (SalesTable->CustTable, shortest, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 5.000000 c2 h1  SalesTable>CustTable
  AFTER (new map):
    1. 5.000000 c2 h1  SalesTable>CustTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## purchtable-vendtable-direct  (PurchTable->VendTable, shortest, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 5.000000 c2 h1  PurchTable>VendTable
  AFTER (new map):
    1. 5.000000 c2 h1  PurchTable>VendTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventtable-inventsum-direct  (InventTable->InventSum, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 4.000000 c2 h1  InventTable>InventSum
  AFTER (new map):
    1. 4.000000 c2 h1  InventTable>InventSum
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## custinvoicejour-salestable-direct  (CustInvoiceJour->SalesTable, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 6.000000 c2 h1  CustInvoiceJour>SalesTable
  AFTER (new map):
    1. 6.000000 c2 h1  CustInvoiceJour>SalesTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## salesline-inventtransorigin-direct  (SalesLine->InventTransOrigin, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 4.000000 c2 h1  SalesLine>InventTransOrigin
  AFTER (new map):
    1. 4.000000 c2 h1  SalesLine>InventTransOrigin
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## salesline-custtable-direct  (SalesLine->CustTable, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 5.000000 c2 h1  SalesLine>CustTable
  AFTER (new map):
    1. 5.000000 c2 h1  SalesLine>CustTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## projgrant-projgranttype-rule1  (ProjGrant->ProjGrantType, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 5.000000 c2 h1  ProjGrant>ProjGrantType
  AFTER (new map):
    1. 5.000000 c2 h1  ProjGrant>ProjGrantType
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## workflowassignment-workflowstep-rule1  (WorkflowAssignmentTable->WorkflowStepTable, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 5.000000 c2 h1  WorkflowAssignmentTable>WorkflowStepTable
  AFTER (new map):
    1. 5.000000 c2 h1  WorkflowAssignmentTable>WorkflowStepTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventtable-vendtable-direct  (InventTable->VendTable, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 6.000000 c2 h1  InventTable>VendTable
  AFTER (new map):
    1. 6.000000 c2 h1  InventTable>VendTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## salestable-salesline-direct  (SalesTable->SalesLine, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 6.000000 c2 h1  SalesTable>SalesLine
  AFTER (new map):
    1. 6.000000 c2 h1  SalesTable>SalesLine
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventtable-prodtable-direct  (InventTable->ProdTable, unique, maxHops=1, bar=top-10)
  BEFORE (old map):
    1. 4.000000 c2 h1  InventTable>ProdTable
  AFTER (new map):
    1. 4.000000 c2 h1  InventTable>ProdTable
  TRUNCATION: before=false (none) after=false (none fired); results@50 before=1 after=1; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventtable-custtable-negatives  (InventTable->CustTable, unique, maxHops=4, bar=top-10)
  BEFORE (old map):
    1. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesQuotationLine>CustTable
    2. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable
    3. 14.000000 c3 h3  InventTable>WMSJournalTrans>SalesLine>CustTable
    4. 14.000000 c3 h3  InventTable>WMSOrderTrans>SalesLine>CustTable
    5. 18.000000 c2 h4  InventTable>SMAAgreementLine>SMAServiceOrderLine>SMAServiceOrderTable>CustTable
    6. 18.000000 c2 h4  InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable
    7. 17.000000 c2 h4  InventTable>CustInvoiceTrans>InventPackagingMaterialTrans>SalesTable>CustTable
    8. 17.000000 c2 h4  InventTable>ProjItemTrans>SalesLine>SMAServiceOrderTable>CustTable
    9. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>ProjProposalItem>CustTable
   10. 17.000000 c2 h4  InventTable>VendInvoiceInfoLine>PurchLine>SalesTable>CustTable
  AFTER (new map):
    1. 18.000000 c3 h4  InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable
    2. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesQuotationLine>CustTable
    3. 16.000000 c3 h4  InventTable>InventTrans>InventTransOrigin>SalesLine>CustTable
    4. 14.000000 c3 h3  InventTable>WMSOrderTrans>SalesLine>CustTable
    5. 18.000000 c2 h4  InventTable>SMAAgreementLine>SMAServiceOrderLine>SMAServiceOrderTable>CustTable
    6. 17.000000 c2 h4  InventTable>CustInvoiceTrans>InventPackagingMaterialTrans>SalesTable>CustTable
    7. 17.000000 c2 h4  InventTable>VendInvoiceInfoLine>PurchLine>SalesTable>CustTable
    8. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>ProjProposalItem>CustTable
    9. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>SalesLine>CustTable
   10. 16.000000 c2 h4  InventTable>SMAServiceOrderLine>SMAAgreementLine>ProjTable>CustTable
  ASSERTED-PATH RANK CHANGES / CLASS FLIPS:
    InventTable>CustInvoiceTrans>AgreementLineReleasedLine>SalesLine>CustTable: class 2->3 (same rank area)
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## inventtable-vendtable-analogue  (InventTable->VendTable, unique, maxHops=4, bar=top-20)
  BEFORE (old map):
    1. 18.000000 c2 h4  InventTable>CustInvoiceTrans>AgreementLineReleasedLine>PurchLine>VendTable
    2. 18.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>ProdBOM>VendTable
    3. 17.000000 c2 h4  InventTable>InventTrans>InventTransOrigin>RetailTMPTransactionSalesTrans>VendTable
    4. 17.000000 c2 h4  InventTable>SalesLine>ProjItemTrans>ProdBOM>VendTable
    5. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>PurchLineHistory>VendTable
    6. 17.000000 c2 h4  InventTable>PurchLine>VendInvoiceInfoLine>VendInvoiceInfoTable>VendTable
    7. 17.000000 c2 h4  InventTable>InventJournalTrans>ProjItemTrans>ProdBOM>VendTable
    8. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>PurchLine>VendTable
    9. 16.000000 c2 h3  InventTable>ReqTrans>BOM>VendTable
   10. 16.000000 c2 h3  InventTable>ReqTrans>ReqPO>VendTable
  AFTER (new map):
    1. 18.000000 c2 h4  InventTable>CustInvoiceTrans>AgreementLineReleasedLine>PurchLine>VendTable
    2. 18.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>ProdBOM>VendTable
    3. 17.000000 c2 h4  InventTable>InventTrans>InventTransOrigin>RetailTMPTransactionSalesTrans>VendTable
    4. 17.000000 c2 h4  InventTable>VendInvoiceInfoLine>PurchLine>PurchReqLine>VendTable
    5. 17.000000 c2 h4  InventTable>PurchLine>VendInvoiceInfoLine>VendInvoiceInfoTable>VendTable
    6. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>PurchReqLineHistory>VendTable
    7. 17.000000 c2 h4  InventTable>InventJournalTrans>ProjItemTrans>ProdBOM>VendTable
    8. 17.000000 c2 h4  InventTable>PurchReqLine>PurchLine>VendInvoiceInfoLine>VendTable
    9. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>PurchLine>VendTable
   10. 17.000000 c2 h4  InventTable>VendInvoiceTrans>ProjItemTrans>PurchReqLine>VendTable
  ASSERTED-PATH RANK CHANGES / CLASS FLIPS:
    InventTable>InventTrans>InventTransOrigin>PurchLine>VendTable: old rank 15 -> new rank 17
  TRUNCATION: before=true (levelCap) after=true (levelCap (bucket eviction active)); results@50 before=50 after=50; caps: levelCap=50 totalCap=250 maxIterations=200000

## salesline-taxtable-preposting-legs  (SalesLine->TaxTable, unique, maxHops=5, bar=existence)
  NEW fixture — no before baseline on the old map.

## salesline-taxtable-posted-truth  (SalesLine->TaxTable, unique, maxHops=5, bar=top-5)
  NEW fixture — no before baseline on the old map.


# Summary
- fixtures run (after): 23
- golden pairs before: 9, after: 10, with deltas: 8
- golden unchanged: 2, changed: 7, new: 1
- truncated@50: before 9/21, after 7/23

# Honesty findings & verdicts

## Truncation flags (item 4)
- Caps in pathfinder.js (findPaths defaults): maxResults=50, maxIterations=200000, levelCap=maxResults=50,
  totalCap=maxResults*5=250, branchCap=maxResults/2=25, levelAttempts=max(3*levelCap,16*maxResults)=800.
- Run at the UI default (maxResults=50): BEFORE 9/21 pairs truncated, AFTER 7/23 pairs truncated.
- ALL truncation is levelCap only (per-hop-level bucket full at 50, eviction active). NO query anywhere on
  either map ever hit totalCap or maxIterations. The 7 truncated pairs all return exactly 50 rows (the pool is
  capped at the sampled-sweep level); the non-truncated deep pairs (e.g. inventtrans-custtable-story2 44 rows,
  both SalesLine->TaxTable pairs 50 rows, shortest ones 1 row) enumerate fully within budgets.
- UI condition: +page.svelte renders "Search space sampled: showing {N} of many more possible paths. Reduce
  max hops for a shorter list." exactly when the same truncated flag is set (line 640-646), and appends a "+"
  to the result count. Tooltip sampled-note: "Best paths found in a limited search sample, not exhaustive."
  Copy still holds on the new map: 7 fixture queries legitimately show the sampled note; nothing is silently
  mislabeled and no list is truncated without the flag.

## Stale dataset stats found + fixed (bonus honesty item)
- The map went 5,561 tables / 37,443 edges (old) -> 5,587 tables / 43,584 edges (new, manifest fingerprint
  342774f9933f). Hardcoded copy in 4 tracked files still claimed the OLD numbers ("37,443 verified
  associations across 5,607 tables" — the 5,607 figure was already stale pre-change).
- Fixed to 43,584 / 5,587 in: src/routes/find/+page.svelte (hero lede, loader note, missing-table note),
  src/lib/findLegendCopy.js (legend tooltip copy), src/routes/tables/[name]/+page.svelte (schema note),
  find-legend-copy.md (legend source doc). Build artifacts (build/, .svelte-kit/) regenerated by npm run build.
- Verified: tests/check-legend-copy.mjs OK after the edit; npm run build OK.

## Perf verdict (item 3)
- Real cached-map harness (module-level maps embedded in tests/.scratch stubs, exactly the F2-correct pattern;
  never an uncached stub). Bench samples: before 126 (18 unique fixtures x 7), after 140 (20 x 7).
- p95 BEFORE 192.3ms -> AFTER 245.5ms. Worst AFTER 280.1ms (inventtable-custtable-story), still under the
  300ms budget. Budget MET. The +53ms p95 / +62ms worst cost tracks the +6,141-edge map growth; no hotspot
  blowout, nothing to block on.

## Golden parity verdict (item 2)
- JS tests/golden-test.mjs: 10/10 green against committed tests/golden-results.json (regenerated by parent
  card on this exact map, fp 342774f9933f).
- Python fno-dev-copilot-spike/server/tests/golden_test.py (uv run): 10/10 green against the SAME golden file.
  Both suites compare tables + score (6 decimals, round6) + qualityClass + reasonCodes, so JS == Python
  transitively at 6 decimals. golden-results.json was NOT regenerated by this card (committed state already
  matches the map; regenerating would be a no-op).

## Ranking-change causes (item 1)
- pathfinder.js + pathScoring.js + edge-specificity.json are byte-identical between fc48af8 (before) and HEAD:
  every ranking difference is map-driven (new edges: +6,141 added, 0 removed vs the old map; +26 tables).
- Asserted-path rank moves: inventtable-custtable-story 2->3, salestable-purchtable-wms 9->10,
  inventtable-vendtable-analogue 15->17. Class re-derivation (2->3) on same-rank paths: PurchLine>AgreementLine
  ReleasedLine>SalesLine (now business-flow class 3; was class 2 via business-key joins), plus the class-3
  story path in the negatives fixture. No mustNotSurface path surfaced (all five Tmp/Dimension detours + the
  payment-packing chain stay out of top-10). No weight or comparator changes made (acceptance clause respected).
- The two new tax fixtures have no before baseline by design: preposting-legs is an existence gate (both legs
  walkable, ghost guard green) and posted-truth asserts the wildcard SalesLine>SourceDocumentLine>TaxTrans>*>
  TaxTable within top-5 (current best leaf TaxTransExtensionTH at rank 3, class 2, score 13, matches the
  parent card's pinned expectation).
