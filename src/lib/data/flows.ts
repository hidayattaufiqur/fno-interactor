export type Stage = {
  id: string
  title: string
  description: string
  roles: string[]
  menuPaths: string[]
  docs: { title: string; url: string }[]
  pitfalls: string[]
  prerequisites: string[]
  tables: string[]
  relations?: { from: string; to: string; note?: string; fields?: string[] }[]
  approvals?: string[]
}

export type Flow = {
  id: string
  title: string
  summary: string
  module: string
  stages: Stage[]
  edges: { from: string; to: string }[]
}

export type TableField = {
  name: string
  /** e.g. "Int64", "String", "Enum", "RecId", "Date" */
  type: string
  /** Target table name if this is a FK/RecId reference */
  fkTarget?: string
  /** Plain-English description of what this field means in business context */
  note: string
}

export type TableDef = {
  name: string
  /** One-liner describing what this table stores in business terms */
  description: string
  /** D365FO module this table primarily belongs to */
  module: string
  fields: TableField[]
  docsUrl?: string
}

export const roles = [
  'All',
  'Sales',
  'CSR',
  'Warehouse',
  'AR',
  'AP',
  'Buyer',
  'Controller',
  'Planner',
  'Production',
  'Project',
  'Service',
  'HR',
  'IT'
]

export const modules = [
  'All',
  'Sales',
  'Procurement',
  'Production',
  'Inventory',
  'Project',
  'Finance',
  'HR',
  'Service'
]

export const flows: Flow[] = [
  {
    id: 'otc',
    title: 'Order to Cash',
    summary: 'Quote to invoice to cash collection for customer sales.',
    module: 'Sales',
    stages: [
      {
        id: 'quote',
        title: 'Create Quote',
        description: 'Capture a customer offer with pricing, validity dates, and item lines before converting to a sales order.',
        roles: ['Sales'],
        menuPaths: ['Sales and marketing > Sales quotes > All sales quotes'],
        docs: [
          {
            title: 'Sales quotations overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/sales-marketing/tasks/create-edit-sales-quotations'
          },
          {
            title: 'Trade agreements (price/discount)',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/sales-marketing/price-simulation'
          }
        ],
        pitfalls: [
          'Customer credit limit missing or zero — quote can be confirmed but SO may fail credit check',
          'Price/discount agreement not active for the quote date — wrong price pulled',
          'Expiry date not set — quote stays open indefinitely',
        ],
        prerequisites: ['Customer account (CustTable)', 'Price/discount agreement (optional)'],
        tables: ['SalesQuotationTable', 'SalesQuotationLine', 'CustTable', 'PriceDiscTable', 'PriceDiscAdmTrans'],
        relations: [
          {
            from: 'SalesQuotationTable',
            to: 'CustTable',
            fields: ['SalesQuotationTable.CustAccount → CustTable.AccountNum'],
            note: 'Quote header references the customer being quoted',
          },
          {
            from: 'SalesQuotationLine',
            to: 'SalesQuotationTable',
            fields: ['SalesQuotationLine.QuotationId → SalesQuotationTable.QuotationId'],
            note: 'Each quote line belongs to its parent quote header',
          },
          {
            from: 'SalesQuotationLine',
            to: 'InventTable',
            fields: ['SalesQuotationLine.ItemId → InventTable.ItemId'],
            note: 'Quote lines reference released products in the item master',
          },
          {
            from: 'PriceDiscAdmTrans',
            to: 'PriceDiscTable',
            fields: ['PriceDiscAdmTrans.PriceDiscTableRecId → PriceDiscTable.RecId'],
            note: 'Active trade-agreement lines are stored in PriceDiscAdmTrans; the journal source is PriceDiscTable',
          },
        ],
        approvals: ['Quote approval workflow'],
      },
      {
        id: 'so',
        title: 'Confirm Sales Order',
        description: 'Convert quote (or create directly) into a confirmed sales order, setting delivery dates, dimensions, and inventory reservations.',
        roles: ['Sales', 'CSR'],
        menuPaths: ['Sales and marketing > Sales orders > All sales orders'],
        docs: [
          {
            title: 'Create sales orders',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/sales-marketing/tasks/create-sales-orders',
          },
          {
            title: 'Sales orders overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/sales-marketing/overview-sales-marketing',
          },
        ],
        pitfalls: [
          'Delivery terms or mode of delivery not set on the order',
          'InventDim mismatch: site/warehouse required fields not defaulted',
          'SalesTable.InvoiceAccount ≠ CustAccount — the invoice goes to a different customer than the order',
        ],
        prerequisites: ['Released product (InventTable)', 'Site and warehouse configured'],
        tables: ['SalesTable', 'SalesLine', 'CustTable', 'InventDim', 'InventTable'],
        relations: [
          {
            from: 'SalesTable',
            to: 'CustTable',
            fields: ['SalesTable.CustAccount → CustTable.AccountNum'],
            note: 'Order header links to the ordering customer; SalesTable.InvoiceAccount may point to a different billing customer',
          },
          {
            from: 'SalesLine',
            to: 'SalesTable',
            fields: ['SalesLine.SalesId → SalesTable.SalesId'],
            note: 'Each sales line belongs to its parent order header',
          },
          {
            from: 'SalesLine',
            to: 'InventTable',
            fields: ['SalesLine.ItemId → InventTable.ItemId'],
            note: 'Lines reference released products in the item master',
          },
          {
            from: 'SalesLine',
            to: 'InventDim',
            fields: ['SalesLine.InventDimId → InventDim.InventDimId'],
            note: 'InventDimId is a system-generated hash that encodes the combination of site, warehouse, batch, serial, and tracking dimensions for the line',
          },
        ],
        approvals: ['Credit check or order approval workflow'],
      },
      {
        id: 'pickpack',
        title: 'Pick / Pack / Ship',
        description: 'Reserve inventory, generate warehouse work orders, pick, pack, and ship goods to the customer.',
        roles: ['Warehouse'],
        menuPaths: [
          'Warehouse management > Work > All work',
          'Warehouse management > Shipments > All shipments',
          'Warehouse management > Loads > All loads',
        ],
        docs: [
          {
            title: 'Warehouse management overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/warehousing/warehouse-management-overview',
          },
          {
            title: 'Wave processing',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/warehousing/wave-processing',
          },
        ],
        pitfalls: [
          'Reservation hierarchy blocks batch/serial from being auto-reserved',
          'Wave template or work template not configured for the warehouse',
          'Location directive not covering the item type or zone',
        ],
        prerequisites: ['Location directives', 'Work templates', 'Wave templates'],
        tables: ['WHSWorkTable', 'WHSWorkLine', 'WHSShipment', 'WHSLoadTable', 'InventTrans'],
        relations: [
          {
            from: 'WHSWorkLine',
            to: 'WHSWorkTable',
            fields: ['WHSWorkLine.WorkId → WHSWorkTable.WorkId'],
            note: 'Work lines belong to a work order header',
          },
          {
            from: 'WHSWorkTable',
            to: 'WHSShipment',
            fields: ['WHSWorkTable.ShipmentId → WHSShipment.ShipmentId'],
            note: 'Work is generated for a specific outbound shipment',
          },
          {
            from: 'WHSShipment',
            to: 'WHSLoadTable',
            fields: ['WHSShipment.LoadId → WHSLoadTable.LoadId'],
            note: 'One or more shipments are consolidated onto a load for transport planning',
          },
          {
            from: 'WHSWorkTable',
            to: 'SalesTable',
            fields: ['WHSWorkTable.OrderNum = SalesTable.SalesId'],
            note: 'Work is traceable back to the originating sales order',
          },
          {
            from: 'WHSWorkLine',
            to: 'InventTrans',
            fields: ['Linked via ItemId + InventDimId + work context (no direct FK)'],
            note: 'Picking writes InventTrans records; StatusIssue goes Picked → Sold when the invoice is posted',
          },
        ],
      },
      {
        id: 'invoice',
        title: 'Post Invoice',
        description: 'Generate and post a customer invoice, creating AR subledger (CustTrans) and general-ledger entries.',
        roles: ['AR'],
        menuPaths: ['Accounts receivable > Invoices > Open customer invoices'],
        docs: [
          {
            title: 'Customer invoicing',
            url: 'https://learn.microsoft.com/dynamics365/finance/accounts-receivable/configure-customer-invoices',
          },
          {
            title: 'Sales tax overview',
            url: 'https://learn.microsoft.com/dynamics365/finance/general-ledger/indirect-taxes-overview',
          },
        ],
        pitfalls: [
          'Posting profile missing for the customer group — invoice post will error',
          'Sales tax group / item tax group mismatch produces wrong tax amount',
          'CustInvoiceTable (pending/unposted) vs CustInvoiceJour (posted) — two different tables, easy to confuse in extensions',
        ],
        prerequisites: ['Customer posting profiles', 'Sales tax codes and groups'],
        tables: ['CustInvoiceJour', 'CustInvoiceTrans', 'CustTrans', 'TaxTrans', 'LedgerTrans'],
        relations: [
          {
            from: 'CustInvoiceJour',
            to: 'SalesTable',
            fields: ['CustInvoiceJour.SalesId → SalesTable.SalesId'],
            note: 'Posted invoice header references the originating sales order',
          },
          {
            from: 'CustInvoiceTrans',
            to: 'CustInvoiceJour',
            fields: ['CustInvoiceTrans.InvoiceId = CustInvoiceJour.InvoiceId (via RecId FK on CustInvoiceRelationshipId)'],
            note: 'Invoice lines belong to their posted invoice header',
          },
          {
            from: 'CustInvoiceTrans',
            to: 'SalesLine',
            fields: ['CustInvoiceTrans.SalesId = SalesLine.SalesId', 'CustInvoiceTrans.LineNum = SalesLine.LineNum'],
            note: 'Each invoice line traces back to the originating sales order line',
          },
          {
            from: 'CustInvoiceJour',
            to: 'CustTrans',
            fields: ['CustTrans.Invoice = CustInvoiceJour.InvoiceId', 'CustTrans.AccountNum = CustInvoiceJour.OrderAccount'],
            note: 'Posting creates an open CustTrans debit record; it stays open until payment and settlement close it',
          },
          {
            from: 'CustTrans',
            to: 'TaxTrans',
            fields: ['TaxTrans.Voucher = CustTrans.Voucher'],
            note: 'Tax transactions share the same voucher number as the AR customer transaction',
          },
        ],
        approvals: ['Invoice review workflow (optional)'],
      },
      {
        id: 'payment',
        title: 'Receive Payment',
        description: 'Enter, post, and settle customer payment against the open invoice, clearing the AR balance.',
        roles: ['AR'],
        menuPaths: [
          'Accounts receivable > Payments > Customer payment journal',
          'Accounts receivable > Transactions > Settle open transactions',
        ],
        docs: [
          {
            title: 'Customer payment overview',
            url: 'https://learn.microsoft.com/dynamics365/finance/accounts-receivable/accounts-receivable',
          },
          {
            title: 'Settlement overview',
            url: 'https://learn.microsoft.com/dynamics365/finance/cash-bank-management/settlement-overview',
          },
        ],
        pitfalls: [
          'Method of payment not configured for the bank account',
          'Auto-settlement not enabled in AR parameters — payment posts but invoice stays open',
          'Bank reconciliation timing: payment posted but not yet matched on bank statement',
        ],
        prerequisites: ['Bank account (BankAccountTable)', 'Method of payment'],
        tables: ['CustTrans', 'CustSettlement', 'LedgerJournalTable', 'LedgerJournalTrans', 'BankAccountTable'],
        relations: [
          {
            from: 'LedgerJournalTrans',
            to: 'LedgerJournalTable',
            fields: ['LedgerJournalTrans.JournalNum → LedgerJournalTable.JournalNum'],
            note: 'Payment journal lines belong to the payment journal header',
          },
          {
            from: 'LedgerJournalTrans',
            to: 'CustTrans',
            fields: ['LedgerJournalTrans.Voucher → CustTrans.Voucher (after posting)'],
            note: 'Posting the payment journal creates a CustTrans credit record that offsets the invoice debit',
          },
          {
            from: 'CustSettlement',
            to: 'CustTrans',
            fields: [
              'CustSettlement.TransRecId → CustTrans.RecId (invoice transaction)',
              'CustSettlement.OffsetRecId → CustTrans.RecId (payment transaction)',
            ],
            note: 'CustSettlement is the linking record between the invoice CustTrans and payment CustTrans; settling closes both records',
          },
          {
            from: 'LedgerJournalTrans',
            to: 'BankAccountTable',
            fields: ['LedgerJournalTrans.OffsetAccountType = Bank', 'LedgerJournalTrans.OffsetLedgerDimension → BankAccountTable.RecId'],
            note: 'Payment journal line specifies which bank account receives the cash',
          },
        ],
      },
    ],
    edges: [
      { from: 'quote', to: 'so' },
      { from: 'so', to: 'pickpack' },
      { from: 'pickpack', to: 'invoice' },
      { from: 'invoice', to: 'payment' },
    ],
  },
  {
    id: 'p2p',
    title: 'Procure to Pay',
    summary: 'Request, purchase, receive, and pay vendors.',
    module: 'Procurement',
    stages: [
      {
        id: 'req',
        title: 'Create Requisition',
        description: 'Request items/services for approval.',
        roles: ['Buyer', 'CSR'],
        menuPaths: ['Procurement and sourcing > Purchase requisitions'],
        docs: [
          {
            title: 'Purchase requisitions overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/procurement/purchase-requisitions-overview'
          }
        ],
        pitfalls: ['Financial dimensions missing', 'Catalog access not set'],
        prerequisites: ['Vendors and products released', 'Financial dimensions'],
        tables: ['PurchReqTable', 'PurchReqLine', 'VendTable', 'ReqPlanData', 'DimensionAttributeValueCombination'],
        approvals: ['Requisition approval workflow']
      },
      {
        id: 'po',
        title: 'Issue Purchase Order',
        description: 'Convert approved req or create PO direct.',
        roles: ['Buyer'],
        menuPaths: ['Procurement and sourcing > Purchase orders > All purchase orders'],
        docs: [
          {
            title: 'Purchase orders overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/procurement/purchase-order-overview'
          }
        ],
        pitfalls: ['Posting profile not set', 'Vendor delivery terms missing'],
        prerequisites: ['Vendor, terms, charges, taxes'],
        tables: ['PurchTable', 'PurchLine', 'VendTable', 'TaxGroup', 'ChargesSetup'],
        relations: [
          {
            from: 'PurchTable',
            to: 'VendTable',
            note: 'PO header references vendor',
            fields: ['PurchTable.OrderAccount = VendTable.AccountNum']
          },
          {
            from: 'PurchLine',
            to: 'InventTable',
            note: 'PO line references released product',
            fields: ['PurchLine.ItemId = InventTable.ItemId']
          }
        ],
        approvals: ['PO approval workflow']
      },
      {
        id: 'receipt',
        title: 'Product Receipt',
        description: 'Receive goods/services and update on-hand.',
        roles: ['Warehouse'],
        menuPaths: ['Procurement and sourcing > Purchase orders > Product receipt'],
        docs: [
          {
            title: 'Product receipts against purchase orders',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/procurement/product-receipt-against-purchase-orders'
          }
        ],
        pitfalls: ['Unit mismatch vs invoice', '3-way match tolerance exceeded'],
        prerequisites: ['Item model group', 'Unit conversions'],
        tables: ['PurchTable', 'PurchLine', 'VendPackingSlipJour', 'VendPackingSlipTrans', 'InventTrans']
      },
      {
        id: 'vendor-invoice',
        title: 'Vendor Invoice',
        description: 'Match invoice to receipt and post liabilities.',
        roles: ['AP'],
        menuPaths: ['Accounts payable > Invoices > Pending vendor invoices'],
        docs: [
          {
            title: 'Vendor invoices overview',
            url: 'https://learn.microsoft.com/dynamics365/finance/accounts-payable/vendor-invoices-overview'
          }
        ],
        pitfalls: ['Tax code mismatch', 'Posting profile missing', '3-way match failed'],
        prerequisites: ['Vendor posting profiles', 'Tax groups'],
        tables: ['VendInvoiceJour', 'VendInvoiceTrans', 'VendTrans', 'TaxTrans', 'LedgerTrans'],
        relations: [
          {
            from: 'VendInvoiceTrans',
            to: 'PurchLine',
            note: 'Invoice lines match PO lines',
            fields: ['VendInvoiceTrans.PurchId = PurchLine.PurchId', 'VendInvoiceTrans.LineNum = PurchLine.LineNumber']
          },
          {
            from: 'VendInvoiceJour',
            to: 'VendTrans',
            note: 'Posting creates vendor transactions',
            fields: ['VendInvoiceJour.InvoiceId → VendTrans.Invoice', 'VendTrans.Voucher from posting']
          }
        ],
        approvals: ['Invoice approval workflow']
      },
      {
        id: 'vendor-payment',
        title: 'Vendor Payment',
        description: 'Propose and settle vendor payments.',
        roles: ['AP'],
        menuPaths: ['Accounts payable > Payments > Payment journal'],
        docs: [
          {
            title: 'Vendor payment overview',
            url: 'https://learn.microsoft.com/dynamics365/finance/accounts-payable/vendor-payments-overview'
          }
        ],
        pitfalls: ['Method of payment / bank not set', 'Settlement parameters wrong'],
        prerequisites: ['Bank account', 'Method of payment', 'Vendor terms'],
        tables: ['VendTrans', 'VendSettlement', 'LedgerJournalTable', 'LedgerJournalTrans', 'BankAccountTable']
      }
    ],
    edges: [
      { from: 'req', to: 'po' },
      { from: 'po', to: 'receipt' },
      { from: 'receipt', to: 'vendor-invoice' },
      { from: 'vendor-invoice', to: 'vendor-payment' }
    ]
  },
  {
    id: 'ptp',
    title: 'Plan to Produce',
    summary: 'Forecast, plan, execute production, and cost it.',
    module: 'Production',
    stages: [
      {
        id: 'forecast',
        title: 'Forecast / Master Plan',
        description: 'Create demand forecasts and run master planning.',
        roles: ['Planner'],
        menuPaths: ['Master planning > Forecast > Demand forecast'],
        docs: [
          {
            title: 'Demand forecasting setup',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/master-planning/demand-forecasting-setup'
          }
        ],
        pitfalls: ['Coverage groups missing', 'Forecast model not selected'],
        prerequisites: ['Coverage groups', 'Forecast model', 'Master plan'],
        tables: ['ReqTrans', 'ReqPlanSched', 'ReqPO', 'ReqPOPlanVersion', 'InventForecastTable'],
        relations: [
          { from: 'ReqTrans', to: 'InventForecastTable', note: 'Forecast demand drives planned orders' },
          { from: 'ReqPO', to: 'PurchTable', note: 'Planned purchase orders firm into POs' }
        ]
      },
      {
        id: 'bom',
        title: 'BOM / Route',
        description: 'Model materials and operations.',
        roles: ['Production'],
        menuPaths: ['Product information management > BOMs', 'Production control > Routes'],
        docs: [
          {
            title: 'Bills of materials and formulas',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/production-control/bill-of-material-bom'
          }
        ],
        pitfalls: ['Resource group capacity not set', 'BOM version not approved/activated'],
        prerequisites: ['Resources, resource groups, calendars', 'Cost groups'],
        tables: ['BOM', 'BOMVersion', 'RouteTable', 'RouteOpr', 'WrkCtrTable', 'ReqItemTable'],
        relations: [
          {
            from: 'BOMVersion',
            to: 'BOM',
            note: 'Approved/activated BOM versions',
            fields: ['BOMVersion.BOMId = BOM.BOMId']
          },
          {
            from: 'RouteOpr',
            to: 'RouteTable',
            note: 'Operations tied to route header',
            fields: ['RouteOpr.RouteId = RouteTable.RouteId']
          }
        ]
      },
      {
        id: 'release',
        title: 'Release to Warehouse',
        description: 'Release planned/firmed orders to execution.',
        roles: ['Production', 'Warehouse'],
        menuPaths: ['Production control > Production orders > All production orders'],
        docs: [
          {
            title: 'Production process overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/production-control/production-process-overview'
          }
        ],
        pitfalls: ['Reservation hierarchies wrong', 'Route operation times missing'],
        prerequisites: ['Route/BOM approved', 'Warehouse parameters set'],
        tables: ['ProdTable', 'ProdBOM', 'ProdRoute', 'WHSWorkTable', 'WHSLoadTable', 'InventTrans'],
        relations: [
          {
            from: 'ProdBOM',
            to: 'BOM',
            note: 'Production order BOM explosion',
            fields: ['ProdBOM.BOMId = BOM.BOMId', 'ProdBOM.ProdId = ProdTable.ProdId']
          },
          {
            from: 'ProdRoute',
            to: 'RouteTable',
            note: 'Route copied to production order',
            fields: ['ProdRoute.RouteId = RouteTable.RouteId', 'ProdRoute.ProdId = ProdTable.ProdId']
          }
        ]
      },
      {
        id: 'execute',
        title: 'Execute / Report as Finished',
        description: 'Start, register, RAF, and end production.',
        roles: ['Production'],
        menuPaths: ['Production control > Production orders > All production orders'],
        docs: [
          {
            title: 'Report production orders as finished',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/production-control/report-production-orders-as-finished'
          }
        ],
        pitfalls: ['Backflushing not set', 'License plate tracking mismatches'],
        prerequisites: ['Flushing principles', 'Operational resources and routes'],
        tables: ['ProdTable', 'ProdJournalTable', 'ProdJournalTrans', 'ProdRouteJob', 'InventTrans'],
        relations: [
          {
            from: 'ProdJournalTrans',
            to: 'ProdTable',
            note: 'Production journals tied to order',
            fields: ['ProdJournalTrans.ProdId = ProdTable.ProdId']
          },
          {
            from: 'ProdJournalTrans',
            to: 'InventTrans',
            note: 'RAF and consumption update inventory transactions',
            fields: ['ProdJournalTrans.InventTransId = InventTrans.InventTransId']
          }
        ]
      },
      {
        id: 'cost',
        title: 'Cost and Close',
        description: 'End job, post cost, and reconcile variances.',
        roles: ['Controller'],
        menuPaths: ['Production control > Periodic > End production orders'],
        docs: [
          {
            title: 'Production order cost analysis',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/cost-management/production-order-cost-analysis'
          }
        ],
        pitfalls: ['Costing version not active', 'Inventory close blocked'],
        prerequisites: ['Costing version', 'Inventory close schedule'],
        tables: ['InventSettlement', 'InventTrans', 'CostCalculationResult', 'ProdCalcTrans', 'LedgerTrans'],
        relations: [
          {
            from: 'ProdCalcTrans',
            to: 'ProdTable',
            note: 'Production costing by order',
            fields: ['ProdCalcTrans.ProdId = ProdTable.ProdId']
          },
          {
            from: 'InventSettlement',
            to: 'LedgerTrans',
            note: 'Inventory close settles to ledger',
            fields: ['InventSettlement.Voucher = LedgerTrans.Voucher', 'InventSettlement.TransRecId → InventTrans.RecId']
          }
        ]
      }
    ],
    edges: [
      { from: 'forecast', to: 'bom' },
      { from: 'bom', to: 'release' },
      { from: 'release', to: 'execute' },
      { from: 'execute', to: 'cost' }
    ]
  },
  {
    id: 'inv',
    title: 'Inventory & Costing',
    summary: 'Set up items, manage on-hand, move, count, and close.',
    module: 'Inventory',
    stages: [
      {
        id: 'setup',
        title: 'Item Setup',
        description: 'Dimensions, tracking, and storage policies.',
        roles: ['Warehouse', 'Controller'],
        menuPaths: ['Product information management > Released products'],
        docs: [
          {
            title: 'Product information overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/pim/product-information'
          }
        ],
        pitfalls: ['Dimension group wrong for scenario', 'Tracking not aligned with WMS'],
        prerequisites: ['Storage/tracking dimension groups', 'Item model group'],
        tables: ['InventTable', 'InventTableModule', 'InventModelGroup', 'InventDim', 'EcoResProduct'],
        relations: [
          {
            from: 'InventTable',
            to: 'EcoResProduct',
            note: 'Released product (per legal entity) links back to the shared global product definition',
            fields: ['InventTable.Product → EcoResProduct.RecId'],
          },
          {
            from: 'InventTableModule',
            to: 'InventTable',
            note: 'Up to three rows per item (ModuleType 1/2/3) carry module-specific unit, price, and discount',
            fields: ['InventTableModule.ItemId → InventTable.ItemId'],
          },
          {
            from: 'InventTable',
            to: 'InventModelGroup',
            note: 'Determines costing method (FIFO/StdCost/etc.) and physical/financial posting policy',
            fields: ['InventTable.ModelGroupId → InventModelGroup.ModelGroupId'],
          },
        ],
      },
      {
        id: 'onhand',
        title: 'On-hand and Reservations',
        description: 'Monitor availability and reservations.',
        roles: ['Warehouse', 'Sales', 'Planner'],
        menuPaths: ['Inventory management > Inquiries > On-hand'],
        docs: [
          {
            title: 'Inventory on-hand list',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/inventory/inventory-on-hand-list'
          }
        ],
        pitfalls: ['Reservation hierarchies conflicting', 'Negative inventory settings wrong'],
        prerequisites: ['Reservation hierarchies', 'Coverage groups'],
        tables: ['InventSum', 'WHSInventReserve', 'InventDim', 'WHSReservationHierarchy'],
        relations: [
          {
            from: 'InventSum',
            to: 'InventDim',
            note: 'On-hand summary per dimension',
            fields: ['InventSum.InventDimId = InventDim.InventDimId']
          },
          {
            from: 'WHSInventReserve',
            to: 'InventDim',
            note: 'Warehouse reservation per LP/location',
            fields: ['WHSInventReserve.InventDimId = InventDim.InventDimId']
          }
        ]
      },
      {
        id: 'movement',
        title: 'Transfer / Movement',
        description: 'Transfers across sites/warehouses/locations.',
        roles: ['Warehouse'],
        menuPaths: ['Inventory management > Periodic > Transfer orders'],
        docs: [
          {
            title: 'Transfer orders',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/warehousing/create-transfer-order-from-warehouse-app'
          }
        ],
        pitfalls: ['In-transit warehouse missing', 'Dimensions not aligned on transfer'],
        prerequisites: ['Transfer orders setup', 'In-transit settings'],
        tables: ['InventTransferTable', 'InventTransferLine', 'InventTrans', 'WHSWorkTable', 'WHSLoadTable'],
        relations: [
          {
            from: 'InventTransferLine',
            to: 'InventTrans',
            note: 'Transfer issue/receipt creates inventory transactions',
            fields: ['InventTrans.InventTransId from transfer posting', 'InventTrans.ReferenceId = InventTransferLine.TransferId']
          },
          {
            from: 'InventTransferLine',
            to: 'WHSWorkTable',
            note: 'If WMS, transfer lines generate work',
            fields: ['WHSWorkTable.LoadId / WorkId linked via transfer wave']
          }
        ]
      },
      {
        id: 'count',
        title: 'Cycle Counting',
        description: 'Count and reconcile on-hand.',
        roles: ['Warehouse', 'Controller'],
        menuPaths: ['Warehouse management > Inquiries and reports > Counting journals'],
        docs: [
          {
            title: 'Cycle counting',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/warehousing/cycle-counting'
          }
        ],
        pitfalls: ['Counting journals blocked by open work', 'Thresholds not set'],
        prerequisites: ['Counting groups', 'Work policy'],
        tables: ['WHSCountingJournalTable', 'WHSCountingJournalLine', 'InventJournalTable', 'InventJournalTrans'],
        relations: [
          {
            from: 'WHSCountingJournalLine',
            to: 'InventJournalTrans',
            note: 'Counting updates inventory journal lines',
            fields: ['WHSCountingJournalLine.JournalId = InventJournalTrans.JournalId']
          },
          {
            from: 'InventJournalTrans',
            to: 'InventTrans',
            note: 'Posting creates inventory transactions',
            fields: ['InventJournalTrans.InventTransId = InventTrans.InventTransId']
          }
        ]
      },
      {
        id: 'close',
        title: 'Inventory Close',
        description: 'Close period and settle receipts/issues.',
        roles: ['Controller'],
        menuPaths: ['Inventory management > Periodic tasks > Close and adjust'],
        docs: [
          {
            title: 'Inventory close',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/cost-management/inventory-close'
          }
        ],
        pitfalls: ['Open production or transfers blocking', 'High variance from costing version'],
        prerequisites: ['Costing version final', 'All POs/SOs posted'],
        tables: ['InventSettlement', 'InventTrans', 'InventCostListTable', 'LedgerTrans'],
        relations: [
          {
            from: 'InventSettlement',
            to: 'InventTrans',
            note: 'Close settles receipts/issues',
            fields: ['InventSettlement.TransRecId = InventTrans.RecId']
          },
          {
            from: 'InventSettlement',
            to: 'LedgerTrans',
            note: 'Adjustments post to ledger',
            fields: ['InventSettlement.Voucher = LedgerTrans.Voucher']
          }
        ]
      }
    ],
    edges: [
      { from: 'setup', to: 'onhand' },
      { from: 'onhand', to: 'movement' },
      { from: 'movement', to: 'count' },
      { from: 'count', to: 'close' }
    ]
  },
  {
    id: 'proj',
    title: 'Project to Profit',
    summary: 'Quote, contract, deliver, and recognize revenue for projects.',
    module: 'Project',
    stages: [
      {
        id: 'proj-quote',
        title: 'Project Quotation',
        description: 'Scope, pricing, and quote approvals.',
        roles: ['Project', 'Sales'],
        menuPaths: ['Project management and accounting > Quotes'],
        docs: [
          {
            title: 'Project quotations',
            url: 'https://learn.microsoft.com/en-us/dynamics365/finance/project-management/project-quotations'
          }
        ],
        pitfalls: ['Funding source not set', 'Category setup incomplete'],
        prerequisites: ['Project groups', 'Categories', 'Funding sources'],
        tables: ['ProjTable', 'ProjQuotationTable', 'ProjGroup', 'ProjFundingSource'],
        approvals: ['Quote approval workflow']
      },
      {
        id: 'proj-contract',
        title: 'Project Contract & WBS',
        description: 'Contracts, subprojects, WBS planning.',
        roles: ['Project'],
        menuPaths: ['Project management and accounting > Projects'],
        docs: [
          {
            title: 'Project contracts',
            url: 'https://learn.microsoft.com/en-us/dynamics365/finance/project-management/project-contracts'
          }
        ],
        pitfalls: ['WBS not published', 'Funding rules incomplete'],
        prerequisites: ['Project contract', 'Funding rules', 'WBS'],
        tables: ['ProjTable', 'ProjInvoiceTable', 'ProjFundingSource', 'ProjWBSActivity', 'ProjWBSLineProperty'],
        relations: [
          {
            from: 'ProjWBSActivity',
            to: 'ProjTable',
            note: 'WBS activities belong to project',
            fields: ['ProjWBSActivity.ProjId = ProjTable.ProjId']
          },
          {
            from: 'ProjFundingSource',
            to: 'ProjInvoiceTable',
            note: 'Funding rules drive billing',
            fields: ['ProjFundingSource.ProjId = ProjInvoiceTable.ProjId']
          }
        ]
      },
      {
        id: 'proj-exec',
        title: 'Execute & Track',
        description: 'Timesheets, expenses, item consumption.',
        roles: ['Project'],
        menuPaths: ['Project management and accounting > Timesheets'],
        docs: [
          {
            title: 'Project transactions overview',
            url: 'https://learn.microsoft.com/en-us/dynamics365/project-operations/prod-pma/project-transactions-overview'
          }
        ],
        pitfalls: ['Category validation failing', 'Resource not assigned'],
        prerequisites: ['Categories allowed on project', 'Worker setup'],
        tables: ['ProjEmplTrans', 'ProjItemTrans', 'ProjCostTrans', 'HcmWorker', 'ProjCategory'],
        relations: [
          {
            from: 'ProjEmplTrans',
            to: 'HcmWorker',
            note: 'Timesheets reference workers',
            fields: ['ProjEmplTrans.Worker = HcmWorker.RecId']
          },
          {
            from: 'ProjEmplTrans',
            to: 'ProjTable',
            note: 'Transactions posted to project',
            fields: ['ProjEmplTrans.ProjId = ProjTable.ProjId']
          }
        ]
      },
      {
        id: 'proj-invoice',
        title: 'Invoice (On-account/Progress)',
        description: 'Create invoice proposals and post revenue.',
        roles: ['Project', 'AR'],
        menuPaths: ['Project management and accounting > Periodic > Invoice proposals'],
        docs: [
          {
            title: 'Manage project invoice proposals',
            url: 'https://learn.microsoft.com/en-us/dynamics365/project-operations/invoicing/format-update-project-invoice-proposals'
          }
        ],
        pitfalls: ['On-account setup missing', 'Retainage not configured'],
        prerequisites: ['On-account setup', 'Funding rules'],
        tables: ['ProjInvoiceTable', 'ProjInvoiceTrans', 'CustInvoiceTable', 'ProjOnAccTrans'],
        relations: [
          {
            from: 'ProjOnAccTrans',
            to: 'ProjInvoiceTrans',
            note: 'On-account lines become invoice lines',
            fields: ['ProjOnAccTrans.InvoiceId = ProjInvoiceTrans.InvoiceId', 'ProjOnAccTrans.ProjId = ProjInvoiceTrans.ProjId']
          },
          {
            from: 'ProjInvoiceTrans',
            to: 'CustInvoiceTable',
            note: 'Project invoices create customer invoices',
            fields: ['ProjInvoiceTrans.InvoiceId = CustInvoiceTable.InvoiceId']
          }
        ],
        approvals: ['Invoice approval workflow (optional)']
      },
      {
        id: 'proj-revrec',
        title: 'Revenue Recognition',
        description: 'Recognize and post revenue/deferrals.',
        roles: ['Controller'],
        menuPaths: ['Project management and accounting > Periodic > Revenue recognition'],
        docs: [
          {
            title: 'Recognize project revenue',
            url: 'https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/project-to-profit-recognize-project-revenue'
          }
        ],
        pitfalls: ['Schedule not set', 'Allocation method wrong'],
        prerequisites: ['Revenue recognition schedule', 'Project group rules'],
        tables: ['ProjRevenueTrans', 'ProjCostTrans', 'LedgerTrans', 'ProjTable'],
        relations: [
          {
            from: 'ProjRevenueTrans',
            to: 'ProjTable',
            note: 'Revenue posted per project',
            fields: ['ProjRevenueTrans.ProjId = ProjTable.ProjId']
          },
          {
            from: 'ProjRevenueTrans',
            to: 'LedgerTrans',
            note: 'Recognition posts to ledger',
            fields: ['ProjRevenueTrans.Voucher = LedgerTrans.Voucher']
          }
        ]
      }
    ],
    edges: [
      { from: 'proj-quote', to: 'proj-contract' },
      { from: 'proj-contract', to: 'proj-exec' },
      { from: 'proj-exec', to: 'proj-invoice' },
      { from: 'proj-invoice', to: 'proj-revrec' }
    ]
  },
  {
    id: 'rtr',
    title: 'Record to Report',
    summary: 'Journal, allocate, consolidate, and close periods.',
    module: 'Finance',
    stages: [
      {
        id: 'gl-setup',
        title: 'GL & Calendar Setup',
        description: 'Ledger, currency, periods, and dimensions.',
        roles: ['Controller'],
        menuPaths: ['General ledger > Ledger setup'],
        docs: [
          {
            title: 'Plan your chart of accounts',
            url: 'https://learn.microsoft.com/dynamics365/finance/general-ledger/plan-chart-of-accounts'
          }
        ],
        pitfalls: ['Ledger calendar closed', 'Posting layers misused'],
        prerequisites: ['Ledger, calendars, currencies', 'Dimensions'],
        tables: ['Ledger', 'LedgerCalendar', 'Currency', 'DimensionHierarchy', 'DimensionAttributeValueCombination'],
        relations: [
          {
            from: 'MainAccount',
            to: 'LedgerChartOfAccounts',
            note: 'Each main account belongs to exactly one chart of accounts',
            fields: ['MainAccount.LedgerChartOfAccounts → LedgerChartOfAccounts.RecId'],
          },
          {
            from: 'Ledger',
            to: 'LedgerChartOfAccounts',
            note: 'A legal entity ledger is assigned to one chart of accounts; chart can be shared across entities',
            fields: ['Ledger.ChartOfAccounts → LedgerChartOfAccounts.RecId'],
          },
          {
            from: 'FiscalCalendarPeriod',
            to: 'FiscalCalendar',
            note: 'Each accounting period belongs to a fiscal calendar',
            fields: ['FiscalCalendarPeriod.FiscalCalendar → FiscalCalendar.RecId'],
          },
          {
            from: 'Ledger',
            to: 'FiscalCalendar',
            note: 'Legal entity ledger references its fiscal calendar, governing which periods are available for posting',
            fields: ['Ledger.FiscalCalendar → FiscalCalendar.RecId'],
          },
        ],
      },
      {
        id: 'journals',
        title: 'Journals & Allocations',
        description: 'Daily journals and allocation rules.',
        roles: ['Controller'],
        menuPaths: ['General ledger > Journal entries > General journal'],
        docs: [
          {
            title: 'Ledger and subledger accounting overview',
            url: 'https://learn.microsoft.com/dynamics365/finance/general-ledger/ledger-subledger'
          }
        ],
        pitfalls: ['Approval workflow missing', 'Posting profile errors'],
        prerequisites: ['Journal names', 'Approval workflow (optional)'],
        tables: ['LedgerJournalTable', 'LedgerJournalTrans', 'LedgerAllocationRule', 'LedgerTrans'],
        relations: [
          { from: 'LedgerJournalTrans', to: 'LedgerJournalTable', note: 'Lines tied to journal header', fields: ['LedgerJournalTrans.JournalNum → LedgerJournalTable.JournalNum'] },
          {
            from: 'LedgerJournalTrans',
            to: 'LedgerTrans',
            note: 'Posting creates ledger entries',
            fields: ['LedgerJournalTrans.Voucher = LedgerTrans.Voucher', 'LedgerJournalTrans.Account = LedgerTrans.AccountNum']
          }
        ],
        approvals: ['Journal approval workflow']
      },
      {
        id: 'consol',
        title: 'Consolidation & Elimination',
        description: 'Combine entities and eliminate intercompany.',
        roles: ['Controller'],
        menuPaths: ['General ledger > Consolidations'],
        docs: [
          {
            title: 'Prepare a legal entity for the consolidation process',
            url: 'https://learn.microsoft.com/dynamics365/finance/general-ledger/prepare-company-for-consolidation'
          }
        ],
        pitfalls: ['Currency translation setup wrong', 'Main account mapping missing'],
        prerequisites: ['Consolidation group', 'Exchange rates', 'Account mappings'],
        tables: ['LedgerConsolidate', 'LedgerConsolidateTrans', 'MainAccount', 'ExchangeRate'],
        relations: [
          {
            from: 'LedgerConsolidateTrans',
            to: 'MainAccount',
            note: 'Consolidation lines mapped to accounts',
            fields: ['LedgerConsolidateTrans.MainAccount = MainAccount.MainAccountId']
          },
          {
            from: 'LedgerConsolidateTrans',
            to: 'ExchangeRate',
            note: 'Currency translation applied',
            fields: ['LedgerConsolidateTrans.CurrencyCode = ExchangeRate.CurrencyCode']
          }
        ]
      },
      {
        id: 'close',
        title: 'Period Close & Reporting',
        description: 'Close subledgers, run close checklist, report.',
        roles: ['Controller'],
        menuPaths: ['General ledger > Period close'],
        docs: [
          {
            title: 'Year-end close',
            url: 'https://learn.microsoft.com/dynamics365/finance/general-ledger/year-end-close'
          }
        ],
        pitfalls: ['Subledger not closed', 'Financial reporter trees incomplete'],
        prerequisites: ['Close checklist', 'Financial reporter trees'],
        tables: ['LedgerPeriodClose', 'LedgerTrans', 'FinancialReportingTree', 'SubledgerVoucherGeneralJournalEntry'],
        relations: [
          {
            from: 'LedgerPeriodClose',
            to: 'LedgerTrans',
            note: 'Close tasks depend on ledger postings completion',
            fields: ['Period/ledger linkage via LedgerPeriodClose.Ledger = LedgerTrans.Ledger']
          },
          {
            from: 'SubledgerVoucherGeneralJournalEntry',
            to: 'LedgerTrans',
            note: 'Subledger vouchers summarized in ledger',
            fields: ['SubledgerVoucherGeneralJournalEntry.Voucher = LedgerTrans.Voucher']
          }
        ]
      }
    ],
    edges: [
      { from: 'gl-setup', to: 'journals' },
      { from: 'journals', to: 'consol' },
      { from: 'consol', to: 'close' }
    ]
  },
  {
    id: 'hr',
    title: 'Hire to Retire',
    summary: 'Onboard workers, manage compensation, and exit.',
    module: 'HR',
    stages: [
      {
        id: 'positions',
        title: 'Positions & Workers',
        description: 'Create positions, assign workers, and employment.',
        roles: ['HR'],
        menuPaths: ['Human resources > Workers'],
        docs: [
          {
            title: 'Positions — Dynamics 365 Human Resources',
            url: 'https://learn.microsoft.com/dynamics365/human-resources/hr-personnel-positions'
          }
        ],
        pitfalls: ['Position hierarchies broken', 'Personnel actions not enabled'],
        prerequisites: ['Departments, jobs, positions'],
        tables: ['HcmWorker', 'HcmPosition', 'HcmEmployment', 'DirPerson', 'HcmPositionHierarchy'],
        relations: [
          {
            from: 'HcmEmployment',
            to: 'HcmWorker',
            note: 'Employment records per worker',
            fields: ['HcmEmployment.Worker = HcmWorker.RecId']
          },
          {
            from: 'HcmPositionHierarchy',
            to: 'HcmPosition',
            note: 'Positions tied into hierarchy',
            fields: ['HcmPositionHierarchy.PositionId = HcmPosition.RecId']
          }
        ]
      },
      {
        id: 'onboard',
        title: 'Onboard',
        description: 'Tasks, documents, and access.',
        roles: ['HR', 'IT'],
        menuPaths: ['Human resources > Workers > Onboarding'],
        docs: [
          {
            title: 'Task management (onboarding, offboarding, transitions)',
            url: 'https://learn.microsoft.com/dynamics365/human-resources/hr-task-mgmt'
          }
        ],
        pitfalls: ['Missing delegation', 'Security roles not assigned'],
        prerequisites: ['Checklists', 'Security roles'],
        tables: ['HcmOnboardingTask', 'HcmChecklist', 'SecurityUserRole', 'HcmWorker'],
        relations: [
          {
            from: 'HcmChecklist',
            to: 'HcmWorker',
            note: 'Assigned onboarding tasks to worker',
            fields: ['HcmChecklist.Worker = HcmWorker.RecId']
          },
          {
            from: 'SecurityUserRole',
            to: 'HcmWorker',
            note: 'Roles assigned to worker\'s user',
            fields: ['SecurityUserRole.UserId linked to worker user']
          }
        ]
      },
      {
        id: 'comp',
        title: 'Compensation & Benefits',
        description: 'Plans, eligibility, enrollment.',
        roles: ['HR'],
        menuPaths: ['Human resources > Compensation management'],
        docs: [
          {
            title: 'Compensation plans overview',
            url: 'https://learn.microsoft.com/dynamics365/human-resources/hr-compensation-overview'
          }
        ],
        pitfalls: ['Eligibility rules wrong', 'Plan periods not active'],
        prerequisites: ['Comp plans', 'Benefit plans', 'Eligibility rules'],
        tables: ['HcmCompPlan', 'HcmCompFixedPlan', 'HcmBenefitPlan', 'HcmEligibilityRule', 'HcmWorker'],
        relations: [
          {
            from: 'HcmCompFixedPlan',
            to: 'HcmWorker',
            note: 'Worker enrolled in comp plan',
            fields: ['HcmCompFixedPlan.Worker = HcmWorker.RecId']
          },
          {
            from: 'HcmBenefitPlan',
            to: 'HcmEligibilityRule',
            note: 'Eligibility rules applied to benefit plan',
            fields: ['Eligibility rules per benefit plan config']
          }
        ]
      },
      {
        id: 'absence',
        title: 'Leave / Absence',
        description: 'Accruals, requests, approvals.',
        roles: ['HR'],
        menuPaths: ['Human resources > Leave and absence'],
        docs: [
          {
            title: 'Configure leave and absence types',
            url: 'https://learn.microsoft.com/dynamics365/human-resources/hr-leave-and-absence-types'
          }
        ],
        pitfalls: ['Accrual schedule not run', 'Approval workflow missing'],
        prerequisites: ['Leave types', 'Accrual schedules'],
        tables: ['HcmLeaveType', 'HcmLeaveBank', 'HcmLeaveRequest', 'HcmLeaveAccrualSchedule'],
        relations: [
          {
            from: 'HcmLeaveRequest',
            to: 'HcmLeaveBank',
            note: 'Requests consume leave balances',
            fields: ['HcmLeaveRequest.BankId = HcmLeaveBank.BankId']
          },
          {
            from: 'HcmLeaveAccrualSchedule',
            to: 'HcmLeaveBank',
            note: 'Accruals feed balance',
            fields: ['HcmLeaveAccrualSchedule.BankId = HcmLeaveBank.BankId']
          }
        ],
        approvals: ['Leave approval workflow']
      },
      {
        id: 'offboard',
        title: 'Offboard',
        description: 'Terminate, final pay, and revoke access.',
        roles: ['HR', 'IT'],
        menuPaths: ['Human resources > Workers > Terminate'],
        docs: [
          {
            title: 'Overview of the Terminate workers business process',
            url: 'https://learn.microsoft.com/dynamics365/guidance/business-processes/hire-to-retire-onboard-terminate-employment'
          }
        ],
        pitfalls: ['Benefits not ended', 'Security not revoked'],
        prerequisites: ['Offboarding checklist', 'Final pay rules'],
        tables: ['HcmEmployment', 'HcmSeparation', 'HcmChecklist', 'SecurityUserRole'],
        relations: [
          {
            from: 'HcmSeparation',
            to: 'HcmEmployment',
            note: 'Termination closes employment',
            fields: ['HcmSeparation.Employment = HcmEmployment.RecId']
          },
          {
            from: 'SecurityUserRole',
            to: 'HcmWorker',
            note: 'Roles removed at termination',
            fields: ['SecurityUserRole.UserId linked to worker user']
          }
        ]
      }
    ],
    edges: [
      { from: 'positions', to: 'onboard' },
      { from: 'onboard', to: 'comp' },
      { from: 'comp', to: 'absence' },
      { from: 'absence', to: 'offboard' }
    ]
  },
  {
    id: 'service',
    title: 'Service Lifecycle',
    summary: 'Service agreements, orders, dispatch, and billing.',
    module: 'Service',
    stages: [
      {
        id: 'agreement',
        title: 'Service Agreement',
        description: 'Define coverage, SLA, and billing rules.',
        roles: ['Service'],
        menuPaths: ['Service management > Service agreements'],
        docs: [
          {
            title: 'Develop and establish service agreements overview',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/service-management/service-agreements'
          }
        ],
        pitfalls: ['Coverage group not set', 'Subscription timing wrong'],
        prerequisites: ['Service agreements', 'Billing rules'],
        tables: ['SMASubscriptionTable', 'SMAAgreementTable', 'SMAAgreementLine', 'CustTable'],
        relations: [
          { from: 'SMAAgreementLine', to: 'SMAAgreementTable', note: 'Lines belong to their agreement header', fields: ['SMAAgreementLine.AgreementId → SMAAgreementTable.AgreementId'] },
          {
            from: 'SMAAgreementLine',
            to: 'SMASubscriptionTable',
            note: 'Subscription details per agreement',
            fields: ['SMAAgreementLine.SubscriptionId = SMASubscriptionTable.SubscriptionId']
          }
        ],
        approvals: ['Agreement approval (optional)']
      },
      {
        id: 'service-order',
        title: 'Service Orders',
        description: 'Create orders, assign items/hours, schedule.',
        roles: ['Service'],
        menuPaths: ['Service management > Service orders'],
        docs: [
          {
            title: 'Service orders',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/service-management/service-orders'
          }
        ],
        pitfalls: ['Service item not linked', 'Contract lines missing'],
        prerequisites: ['Service items', 'Technician resources'],
        tables: ['SMAServiceOrderTable', 'SMAServiceOrderLine', 'SMAServiceObjectTable', 'SMAAgreementLine'],
        relations: [
          {
            from: 'SMAServiceOrderLine',
            to: 'SMAAgreementLine',
            note: 'Lines consume agreement coverage',
            fields: ['SMAServiceOrderLine.AgreementLineId = SMAAgreementLine.AgreementLineId']
          },
          {
            from: 'SMAServiceOrderLine',
            to: 'SMAServiceObjectTable',
            note: 'Lines reference service objects/assets',
            fields: ['SMAServiceOrderLine.ServiceObjectId = SMAServiceObjectTable.ServiceObjectId']
          }
        ]
      },
      {
        id: 'dispatch',
        title: 'Dispatch',
        description: 'Schedule technicians and manage visits.',
        roles: ['Service'],
        menuPaths: ['Service management > Periodic tasks > Dispatch board'],
        docs: [
          {
            title: 'Dispatch board',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/service-management/dispatch-board'
          }
        ],
        pitfalls: ['Calendar not set', 'Travel time not considered'],
        prerequisites: ['Resource calendars', 'Skills/skills mapping'],
        tables: ['SMAServiceOrderTable', 'SMADispatchBoard', 'WrkCtrTable', 'ResResource'],
        relations: [
          {
            from: 'SMADispatchBoard',
            to: 'SMAServiceOrderTable',
            note: 'Dispatch assigns technicians to orders',
            fields: ['Work assignment references SMAServiceOrderTable.ServiceOrderId']
          }
        ]
      },
      {
        id: 'service-bill',
        title: 'Bill Service',
        description: 'Invoice time/materials and subscriptions.',
        roles: ['Service', 'AR'],
        menuPaths: ['Service management > Service orders > Service invoices'],
        docs: [
          {
            title: 'Service subscriptions',
            url: 'https://learn.microsoft.com/dynamics365/supply-chain/service-management/service-subscriptions'
          }
        ],
        pitfalls: ['Posting profiles missing', 'Subscription period misaligned'],
        prerequisites: ['Posting profiles', 'Subscription setup'],
        tables: ['SMAServiceOrderTable', 'SMAServiceOrderLine', 'CustInvoiceTable', 'CustInvoiceTrans', 'SMAContractTable'],
        relations: [
          {
            from: 'SMAServiceOrderLine',
            to: 'CustInvoiceTrans',
            note: 'Service order lines become invoice lines',
            fields: ['CustInvoiceTrans.ServiceOrderLineId = SMAServiceOrderLine.LineNum']
          },
          {
            from: 'SMAContractTable',
            to: 'CustInvoiceTable',
            note: 'Contract billing drives customer invoices',
            fields: ['SMAContractTable.ContractId → CustInvoiceTable.ContractId']
          }
        ],
        approvals: ['Invoice approval workflow (optional)']
      }
    ],
    edges: [
      { from: 'agreement', to: 'service-order' },
      { from: 'service-order', to: 'dispatch' },
      { from: 'dispatch', to: 'service-bill' }
    ]
  }
]

export const tableDefs: Record<string, TableDef> = {
  CustTable: {
    name: "CustTable",
    description: "Customer master record holding all account-level attributes for AR, pricing, delivery, and credit management.",
    module: "Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/common/customer/main/custtable",
    fields: [
      {
        name: "AccountNum",
        type: "String",
        note: "Primary key \u2014 unique customer account identifier used as FK across the entire OTC chain.",
      },
      {
        name: "CustGroup",
        type: "String",
        fkTarget: "CustGroup",
        note: "Customer group that drives posting profiles, payment terms defaults, and trade-agreement group lookups.",
      },
      {
        name: "Currency",
        type: "String",
        fkTarget: "Currency",
        note: "Default transaction currency for invoices and payments issued to this customer.",
      },
      {
        name: "PaymTermId",
        type: "String",
        fkTarget: "PaymTerm",
        note: "Default payment terms (e.g. Net30) inherited by quotations and sales orders.",
      },
      {
        name: "DlvMode",
        type: "String",
        fkTarget: "DlvMode",
        note: "Default mode of delivery (e.g. truck, air) carried onto sales orders.",
      },
      {
        name: "SalesTaxGroup",
        type: "String",
        fkTarget: "TaxGroupHeading",
        note: "Sales tax group assigned to customer, combined with item tax group to determine applicable taxes.",
      },
      {
        name: "CreditMax",
        type: "Decimal",
        note: "Credit limit in the account currency; 0 means no limit enforced.",
      },
    ],
  },
  PriceDiscTable: {
    name: "PriceDiscTable",
    description: "Posted (active) trade agreement lines storing approved prices and discounts for customer\u2013item combinations.",
    module: "Sales and Marketing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/group/pricedisctable",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System-generated primary key.",
      },
      {
        name: "Relation",
        type: "Enum",
        note: "Agreement type: PriceSales, LineDiscSales, MultiLineDiscSales, EndDiscSales \u2014 determines how Amount/Percent is applied.",
      },
      {
        name: "AccountCode",
        type: "Enum",
        note: "Scope of the customer side: Table (specific account), Group (price group), or All customers.",
      },
      {
        name: "AccountRelation",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "FK to CustTable.AccountNum when AccountCode=Table; to CustPriceGroup when AccountCode=Group.",
      },
      {
        name: "ItemCode",
        type: "Enum",
        note: "Scope of the item side: Table (specific item), Group (item price group), or All items.",
      },
      {
        name: "ItemRelation",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "FK to InventTable.ItemId when ItemCode=Table.",
      },
      {
        name: "Amount",
        type: "Decimal",
        note: "Agreed price (when Relation=PriceSales) or flat discount amount.",
      },
      {
        name: "FromDate",
        type: "Date",
        note: "Validity start date; engine only applies lines where today is within [FromDate, ToDate].",
      },
    ],
  },
  PriceDiscAdmTrans: {
    name: "PriceDiscAdmTrans",
    description: "Draft trade-agreement journal lines staged in a worksheet before posting to PriceDiscTable.",
    module: "Sales and Marketing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/worksheetline/pricediscadmtrans",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System-generated primary key.",
      },
      {
        name: "JournalNum",
        type: "String",
        fkTarget: "PriceDiscAdmTable.JournalNum",
        note: "Links back to the parent trade-agreement journal header.",
      },
      {
        name: "Relation",
        type: "Enum",
        note: "Type of price/discount being staged (mirrors PriceDiscTable.Relation).",
      },
      {
        name: "AccountCode",
        type: "Enum",
        note: "Customer scope: Table / Group / All.",
      },
      {
        name: "AccountRelation",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Specific customer account when AccountCode=Table.",
      },
      {
        name: "ItemRelation",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "Specific item when ItemCode=Table.",
      },
      {
        name: "Amount",
        type: "Decimal",
        note: "Proposed price or discount amount.",
      },
      {
        name: "Percent1",
        type: "Decimal",
        note: "Primary discount percentage (used for line/multiline/end discounts).",
      },
    ],
  },
  SalesQuotationTable: {
    name: "SalesQuotationTable",
    description: "Sales quotation header tracking customer proposals through Created \u2192 Sent \u2192 Confirmed/Lost states before converting to a sales order.",
    module: "Sales and Marketing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/worksheetheader/salesquotationtable",
    fields: [
      {
        name: "QuotationId",
        type: "String",
        note: "Primary key \u2014 quotation number assigned from number sequence.",
      },
      {
        name: "CustAccount",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Customer account this quotation is addressed to.",
      },
      {
        name: "QuotationStatus",
        type: "Enum",
        note: "Lifecycle status: Created / Sent / Confirmed / Lost / Cancelled.",
      },
      {
        name: "ExpiryDate",
        type: "Date",
        note: "Date after which the quoted prices/terms are no longer valid.",
      },
      {
        name: "SalesId",
        type: "String",
        fkTarget: "SalesTable.SalesId",
        note: "Populated when the quotation is converted to a sales order \u2014 links the two documents.",
      },
      {
        name: "CurrencyCode",
        type: "String",
        fkTarget: "Currency",
        note: "Transaction currency for all amounts on this quotation.",
      },
      {
        name: "VersionNum",
        type: "Int",
        note: "Revision counter incremented when a sent quote is re-opened and edited.",
      },
    ],
  },
  SalesQuotationLine: {
    name: "SalesQuotationLine",
    description: "Individual product or service lines within a sales quotation, each carrying quantity, pricing, and inventory dimension data.",
    module: "Sales and Marketing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/worksheetline/salesquotationline",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key.",
      },
      {
        name: "QuotationId",
        type: "String",
        fkTarget: "SalesQuotationTable.QuotationId",
        note: "Parent quotation header reference \u2014 composite logical PK with LineNum.",
      },
      {
        name: "LineNum",
        type: "Decimal",
        note: "Line sequence number within the quotation.",
      },
      {
        name: "ItemId",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "Product being quoted.",
      },
      {
        name: "InventDimId",
        type: "String",
        fkTarget: "InventDim.InventDimId",
        note: "Inventory dimension combination (site, warehouse, color, size, etc.).",
      },
      {
        name: "SalesQty",
        type: "Decimal",
        note: "Quoted quantity in the sales unit of measure.",
      },
      {
        name: "SalesPrice",
        type: "Decimal",
        note: "Unit price proposed; may be derived from PriceDiscTable trade agreement.",
      },
      {
        name: "LineAmount",
        type: "Decimal",
        note: "Extended line value (SalesQty \u00d7 SalesPrice minus any line discounts).",
      },
    ],
  },
  SalesTable: {
    name: "SalesTable",
    description: "Sales order header governing the full lifecycle of a customer order from creation through invoicing.",
    module: "Sales and Marketing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/worksheetheader/salestable",
    fields: [
      {
        name: "SalesId",
        type: "String",
        note: "Primary key \u2014 sales order number from number sequence.",
      },
      {
        name: "CustAccount",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Ordering/ship-to customer account.",
      },
      {
        name: "InvoiceAccount",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Invoice-to customer account \u2014 may differ from CustAccount in third-party billing scenarios.",
      },
      {
        name: "SalesStatus",
        type: "Enum",
        note: "Overall order status: Open order / Delivered / Invoiced / Cancelled.",
      },
      {
        name: "DocumentStatus",
        type: "Enum",
        note: "Furthest document produced: None / Confirmation / PickingList / PackingSlip / Invoice.",
      },
      {
        name: "QuotationId",
        type: "String",
        fkTarget: "SalesQuotationTable.QuotationId",
        note: "Source quotation if the order was converted from a quote.",
      },
      {
        name: "CurrencyCode",
        type: "String",
        fkTarget: "Currency",
        note: "Transaction currency inherited from the customer or overridden at entry.",
      },
      {
        name: "DeliveryDate",
        type: "Date",
        note: "Requested delivery date; drives ATP/CTP promise date calculations.",
      },
    ],
  },
  SalesLine: {
    name: "SalesLine",
    description: "Individual product or service lines on a sales order, tracking quantities through confirmation, picking, delivery, and invoicing.",
    module: "Sales and Marketing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/worksheetline/salesline",
    fields: [
      {
        name: "SalesId",
        type: "String",
        fkTarget: "SalesTable.SalesId",
        note: "Parent sales order \u2014 part of the composite logical primary key.",
      },
      {
        name: "LineNum",
        type: "Decimal",
        note: "Line sequence; together with SalesId forms the natural compound key.",
      },
      {
        name: "ItemId",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "Ordered product.",
      },
      {
        name: "InventDimId",
        type: "String",
        fkTarget: "InventDim.InventDimId",
        note: "Inventory dimension combination specifying site, warehouse, batch, serial, etc.",
      },
      {
        name: "SalesQty",
        type: "Decimal",
        note: "Originally ordered quantity.",
      },
      {
        name: "RemainSalesPhysical",
        type: "Decimal",
        note: "Quantity not yet physically delivered; decremented as packing slips are posted.",
      },
      {
        name: "SalesPrice",
        type: "Decimal",
        note: "Unit sales price resolved from trade agreements or manual entry.",
      },
      {
        name: "SalesStatus",
        type: "Enum",
        note: "Line-level status mirroring the order status but tracked per-line.",
      },
    ],
  },
  InventDim: {
    name: "InventDim",
    description: "Lookup/hash table of every unique combination of inventory dimension values (site, warehouse, location, batch, serial, config, color, size).",
    module: "Inventory Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/main/inventdim",
    fields: [
      {
        name: "InventDimId",
        type: "String",
        note: "Primary key \u2014 SHA1 hash of the dimension value combination; referenced as FK across all inventory-touching tables.",
      },
      {
        name: "InventSiteId",
        type: "String",
        fkTarget: "InventSite.SiteId",
        note: "Site (plant/facility) dimension.",
      },
      {
        name: "InventLocationId",
        type: "String",
        fkTarget: "InventLocation.InventLocationId",
        note: "Warehouse identifier.",
      },
      {
        name: "wMSLocationId",
        type: "String",
        fkTarget: "WMSLocation",
        note: "Bin/aisle location within the warehouse.",
      },
      {
        name: "InventBatchId",
        type: "String",
        fkTarget: "InventBatch",
        note: "Batch/lot number \u2014 only populated when batch tracking is active.",
      },
      {
        name: "InventSerialId",
        type: "String",
        note: "Serial number \u2014 only populated when serial tracking is active.",
      },
      {
        name: "ConfigId",
        type: "String",
        fkTarget: "InventDimConfiguration",
        note: "Product configuration dimension (used in product configurator scenarios).",
      },
    ],
  },
  InventTable: {
    name: "InventTable",
    description: "Released product (item) master holding product type, dimension group assignments, unit of measure, and procurement defaults.",
    module: "Product Information Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/productinformationmanagement/main/inventtable",
    fields: [
      {
        name: "ItemId",
        type: "String",
        note: "Primary key \u2014 item number used as FK in every transaction table.",
      },
      {
        name: "ItemGroupId",
        type: "String",
        fkTarget: "InventItemGroup.ItemGroupId",
        note: "Drives inventory posting profiles for GL account resolution.",
      },
      {
        name: "ItemType",
        type: "Enum",
        note: "Item / Service / BOM \u2014 controls whether inventory transactions are created.",
      },
      {
        name: "UnitId",
        type: "String",
        fkTarget: "UnitOfMeasure",
        note: "Primary stocking unit of measure.",
      },
      {
        name: "DimGroupId",
        type: "String",
        fkTarget: "InventDimGroup",
        note: "Tracking dimension group controlling batch and serial number policy.",
      },
      {
        name: "StorageDimGroupId",
        type: "String",
        fkTarget: "StorageDimGroup",
        note: "Storage dimension group controlling site/warehouse/location policy.",
      },
      {
        name: "NameAlias",
        type: "String",
        note: "Short search name used in item lookups across forms.",
      },
    ],
  },
  WHSWorkTable: {
    name: "WHSWorkTable",
    description: "Warehouse work header representing a unit of directed work (e.g. a pick-and-put instruction set) assigned to a warehouse worker.",
    module: "Warehouse Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetheader/whsworktable",
    fields: [
      {
        name: "WorkId",
        type: "String",
        note: "Primary key \u2014 work order ID assigned by WMS wave processing.",
      },
      {
        name: "WorkStatus",
        type: "Enum",
        note: "Open / InProcess / Closed / Cancelled \u2014 drives availability in the mobile device app.",
      },
      {
        name: "WorkType",
        type: "Enum",
        note: "Source document type: SalesOrder, PurchaseOrder, TransferIssue, etc.",
      },
      {
        name: "ShipmentId",
        type: "String",
        fkTarget: "WHSShipmentTable.ShipmentId",
        note: "Links work to the outbound shipment it fulfils.",
      },
      {
        name: "LoadId",
        type: "String",
        fkTarget: "WHSLoadTable.LoadId",
        note: "Links work to the outbound load/truck for transportation planning.",
      },
      {
        name: "SalesId",
        type: "String",
        fkTarget: "SalesTable.SalesId",
        note: "Source sales order for this picking work.",
      },
      {
        name: "WaveId",
        type: "String",
        note: "Wave that created this work; used for batch processing and reporting.",
      },
    ],
  },
  WHSWorkLine: {
    name: "WHSWorkLine",
    description: "Individual pick or put step within a warehouse work order, specifying item, quantity, and source/destination location.",
    module: "Warehouse Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetline/whsworkline",
    fields: [
      {
        name: "WorkId",
        type: "String",
        fkTarget: "WHSWorkTable.WorkId",
        note: "Parent work header \u2014 part of composite logical key.",
      },
      {
        name: "LineNum",
        type: "Decimal",
        note: "Sequence within the work order (typically alternates Pick/Put pairs).",
      },
      {
        name: "WorkType",
        type: "Enum",
        note: "Pick or Put \u2014 each work order contains at least one Pick and one Put line.",
      },
      {
        name: "ItemId",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "Item to be picked or put.",
      },
      {
        name: "InventDimId",
        type: "String",
        fkTarget: "InventDim.InventDimId",
        note: "Dimension combination (includes location, batch, serial) for this movement.",
      },
      {
        name: "WQty",
        type: "Decimal",
        note: "Expected quantity to be picked/put as directed by the system.",
      },
      {
        name: "QtyWork",
        type: "Decimal",
        note: "Actual quantity confirmed by the worker on the mobile device.",
      },
    ],
  },
  WHSShipmentTable: {
    name: "WHSShipmentTable",
    description: "Outbound shipment record grouping one or more sales order lines into a single physical shipment for carrier booking and ASN generation.",
    module: "Warehouse Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetheader/whsshipmenttable",
    fields: [
      {
        name: "ShipmentId",
        type: "String",
        note: "Primary key \u2014 shipment number.",
      },
      {
        name: "LoadId",
        type: "String",
        fkTarget: "WHSLoadTable.LoadId",
        note: "The freight load this shipment is assigned to for transportation management.",
      },
      {
        name: "SalesId",
        type: "String",
        fkTarget: "SalesTable.SalesId",
        note: "Primary sales order reference for single-order shipments.",
      },
      {
        name: "ShipmentStatus",
        type: "Enum",
        note: "Open / Released / Shipped / Cancelled \u2014 gates warehouse and carrier actions.",
      },
      {
        name: "CarrierCode",
        type: "String",
        note: "Carrier account booked for this shipment.",
      },
      {
        name: "BOLId",
        type: "String",
        note: "Bill of lading number assigned at shipment confirmation.",
      },
      {
        name: "ShipDate",
        type: "Date",
        note: "Actual or planned ship date used for carrier scheduling.",
      },
    ],
  },
  WHSLoadTable: {
    name: "WHSLoadTable",
    description: "Outbound freight load representing a truck/container load that groups multiple shipments for carrier tendering and transportation management.",
    module: "Warehouse Management / Transportation Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetheader/whsloadtable",
    fields: [
      {
        name: "LoadId",
        type: "String",
        note: "Primary key \u2014 load number.",
      },
      {
        name: "LoadStatus",
        type: "Enum",
        note: "Open / Released / Shipped / Invoiced \u2014 mirrors the outbound fulfillment lifecycle.",
      },
      {
        name: "ShipDate",
        type: "Date",
        note: "Planned departure date for the load.",
      },
      {
        name: "CarrierId",
        type: "String",
        note: "Carrier master reference used for rate shopping and tender.",
      },
      {
        name: "ModeCode",
        type: "String",
        note: "Transport mode (truck, air, ocean) for rate/route determination.",
      },
      {
        name: "InventSiteId",
        type: "String",
        fkTarget: "InventSite.SiteId",
        note: "Ship-from site for load planning.",
      },
      {
        name: "CustomerRef",
        type: "String",
        note: "Customer-provided reference number printed on BOL.",
      },
    ],
  },
  InventTrans: {
    name: "InventTrans",
    description: "Inventory subledger transaction recording every physical and financial movement of inventory (receipts, issues, picks, transfers, count adjustments).",
    module: "Inventory Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/transaction/inventtrans",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key.",
      },
      {
        name: "ItemId",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "Item involved in the movement.",
      },
      {
        name: "InventDimId",
        type: "String",
        fkTarget: "InventDim.InventDimId",
        note: "Dimension combination at the time of the transaction.",
      },
      {
        name: "TransType",
        type: "Enum",
        note: "Business origin: Sales, Purchase, Counted, Transfer, Production, etc.",
      },
      {
        name: "StatusIssue",
        type: "Enum",
        note: "Issue-side status: None / ReservOrdered / ReservPhysical / Picked / Deducted / Sold.",
      },
      {
        name: "StatusReceipt",
        type: "Enum",
        note: "Receipt-side status: None / Ordered / Arrived / Received / Purchased.",
      },
      {
        name: "Qty",
        type: "Decimal",
        note: "Positive for receipts; negative for issues.",
      },
      {
        name: "CostAmountPhysical",
        type: "Decimal",
        note: "Physical cost posted when the packing slip is generated (pre-invoice).",
      },
    ],
  },
  CustInvoiceJour: {
    name: "CustInvoiceJour",
    description: "Posted customer invoice journal header for sales-order-based invoices; each row represents a single posted invoice document.",
    module: "Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountsreceivable/transaction/custinvoicejour",
    fields: [
      {
        name: "InvoiceId",
        type: "String",
        note: "Invoice number (part of compound PK with InvoiceDate and SalesId).",
      },
      {
        name: "SalesId",
        type: "String",
        fkTarget: "SalesTable.SalesId",
        note: "Source sales order; links the invoice back to the fulfillment chain.",
      },
      {
        name: "InvoiceAccount",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Customer account to which the invoice is billed.",
      },
      {
        name: "OrderAccount",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Ordering customer (ship-to) \u2014 may differ from InvoiceAccount in third-party billing.",
      },
      {
        name: "InvoiceDate",
        type: "Date",
        note: "Posting date used for due date and aging calculations.",
      },
      {
        name: "SalesAmount",
        type: "Decimal",
        note: "Net invoice amount excluding tax.",
      },
      {
        name: "SumTax",
        type: "Decimal",
        note: "Total tax amount \u2014 detail in TaxTrans.",
      },
      {
        name: "Voucher",
        type: "String",
        note: "GL voucher number; joins to LedgerJournalTrans and GeneralJournalAccountEntry.",
      },
    ],
  },
  CustInvoiceTable: {
    name: "CustInvoiceTable",
    description: "Free text invoice header for AR invoices not sourced from a sales order (e.g. recurring charges, service fees).",
    module: "Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountsreceivable/worksheetheader/custinvoicetable",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key.",
      },
      {
        name: "InvoiceId",
        type: "String",
        note: "User-assigned or sequence-generated invoice number.",
      },
      {
        name: "CustAccount",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Customer billed on this free text invoice.",
      },
      {
        name: "InvoiceDate",
        type: "Date",
        note: "Posting and AR aging date.",
      },
      {
        name: "PaymTermId",
        type: "String",
        fkTarget: "PaymTerm",
        note: "Payment terms override for this invoice.",
      },
      {
        name: "DueDate",
        type: "Date",
        note: "Calculated payment due date based on PaymTermId.",
      },
      {
        name: "CurrencyCode",
        type: "String",
        fkTarget: "Currency",
        note: "Invoice transaction currency.",
      },
      {
        name: "InvoiceStatus",
        type: "Enum",
        note: "Created / InProcess / Posted / Cancelled.",
      },
    ],
  },
  CustInvoiceTrans: {
    name: "CustInvoiceTrans",
    description: "Customer invoice line detail table used for both sales-order invoices and free text invoices.",
    module: "Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountsreceivable/transaction/custinvoicetrans",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key.",
      },
      {
        name: "InvoiceId",
        type: "String",
        fkTarget: "CustInvoiceJour.InvoiceId",
        note: "Parent invoice reference \u2014 joins to CustInvoiceJour (SO invoice) or CustInvoiceTable (FTI).",
      },
      {
        name: "SalesId",
        type: "String",
        fkTarget: "SalesTable.SalesId",
        note: "Source sales order; null for free text invoices.",
      },
      {
        name: "ItemId",
        type: "String",
        fkTarget: "InventTable.ItemId",
        note: "Invoiced item; may be null for free text invoice lines using ledger accounts.",
      },
      {
        name: "Qty",
        type: "Decimal",
        note: "Invoiced quantity.",
      },
      {
        name: "SalesPrice",
        type: "Decimal",
        note: "Unit price as invoiced.",
      },
      {
        name: "LineAmount",
        type: "Decimal",
        note: "Qty \u00d7 SalesPrice minus discounts.",
      },
      {
        name: "TaxGroup",
        type: "String",
        fkTarget: "TaxGroupHeading",
        note: "Sales tax group on the line; combined with item tax group for tax calculation.",
      },
    ],
  },
  CustTrans: {
    name: "CustTrans",
    description: "Customer AR subledger transaction \u2014 one row per financial posting event (invoice, payment, credit note, interest) against a customer account.",
    module: "Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountsreceivable/transaction/custtrans",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key; referenced as FK by CustSettlement.",
      },
      {
        name: "AccountNum",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Customer account this transaction is posted against.",
      },
      {
        name: "Invoice",
        type: "String",
        note: "Invoice number for lookup/matching \u2014 populated on invoice postings and payment references.",
      },
      {
        name: "AmountCur",
        type: "Decimal",
        note: "Amount in the transaction currency (positive = customer owes, negative = credit).",
      },
      {
        name: "TransDate",
        type: "Date",
        note: "Transaction posting date used for aging and due-date calculation.",
      },
      {
        name: "Voucher",
        type: "String",
        note: "GL voucher number tying this AR entry to the general ledger.",
      },
      {
        name: "TransType",
        type: "Enum",
        note: "Invoice / Payment / CreditNote / Interest / WriteOff / etc.",
      },
      {
        name: "Closed",
        type: "Date",
        note: "Date the transaction was fully settled; null when an open balance remains.",
      },
    ],
  },
  TaxTrans: {
    name: "TaxTrans",
    description: "Tax subledger transaction recording per-tax-code amounts for every voucher that has a taxable event (invoices, payments with tax, etc.).",
    module: "Tax",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/tax/transaction/taxtrans",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key.",
      },
      {
        name: "Voucher",
        type: "String",
        note: "GL voucher number \u2014 joins this row to CustInvoiceJour.Voucher or LedgerJournalTrans.Voucher.",
      },
      {
        name: "TaxCode",
        type: "String",
        fkTarget: "TaxTable.TaxCode",
        note: "Tax code master defining rate, account, and reporting attributes.",
      },
      {
        name: "TaxAmount",
        type: "Decimal",
        note: "Calculated tax amount in the tax currency.",
      },
      {
        name: "TaxBaseAmount",
        type: "Decimal",
        note: "Taxable base amount the tax was calculated on.",
      },
      {
        name: "TransDate",
        type: "Date",
        note: "Transaction date matching the source document posting date.",
      },
      {
        name: "SourceTableId",
        type: "Int",
        note: "SysTableId of the originating table (e.g. CustInvoiceTrans) for traceability.",
      },
      {
        name: "SourceRecId",
        type: "Int64",
        note: "RecId of the originating line record for direct back-reference.",
      },
    ],
  },
  CustSettlement: {
    name: "CustSettlement",
    description: "Links an AR invoice transaction to the payment (or other offset) transaction that settles it, recording the settled amount and date.",
    module: "Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/dynamics365/finance/cash-bank-management/settlement-overview",
    fields: [
      {
        name: "RecId",
        type: "Int64",
        note: "System primary key.",
      },
      {
        name: "TransRecId",
        type: "Int64",
        fkTarget: "CustTrans.RecId",
        note: "Invoice-side CustTrans record being settled.",
      },
      {
        name: "OffsetTransRecId",
        type: "Int64",
        fkTarget: "CustTrans.RecId",
        note: "Payment-side (or credit note) CustTrans record providing the offset.",
      },
      {
        name: "SettleAmountCur",
        type: "Decimal",
        note: "Amount settled in the transaction currency (partial settlements create multiple rows).",
      },
      {
        name: "TransDate",
        type: "Date",
        note: "Date the settlement was applied.",
      },
      {
        name: "MarkedAsClosed",
        type: "NoYes",
        note: "Indicates the invoice CustTrans is fully closed after this settlement.",
      },
    ],
  },
  LedgerJournalTable: {
    name: "LedgerJournalTable",
    description: "Journal batch header controlling type, name, approval status, and posting flag for a group of LedgerJournalTrans lines.",
    module: "General Ledger / Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountingfoundation/worksheetheader/ledgerjournaltable",
    fields: [
      {
        name: "JournalNum",
        type: "String",
        note: "Primary key \u2014 journal batch number from number sequence.",
      },
      {
        name: "JournalType",
        type: "Enum",
        note: "Daily / Customer / Vendor / Bank / etc. \u2014 controls which account types are allowed on lines.",
      },
      {
        name: "JournalName",
        type: "String",
        fkTarget: "LedgerJournalName",
        note: "Journal name template providing default offset account and approval settings.",
      },
      {
        name: "Posted",
        type: "NoYes",
        note: "1 once the batch has been posted to the GL; prevents further edits.",
      },
      {
        name: "NumLines",
        type: "Int",
        note: "Count of LedgerJournalTrans lines in this batch.",
      },
      {
        name: "Description",
        type: "String",
        note: "User-provided description for search/audit purposes.",
      },
    ],
  },
  LedgerJournalTrans: {
    name: "LedgerJournalTrans",
    description: "Individual debit or credit journal line; for customer payment journals each line targets a customer account and vouches to the GL.",
    module: "General Ledger / Accounts Receivable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountingfoundation/worksheetline/ledgerjournaltrans",
    fields: [
      {
        name: "JournalNum",
        type: "String",
        fkTarget: "LedgerJournalTable.JournalNum",
        note: "Parent journal batch \u2014 composite logical PK with LineNum.",
      },
      {
        name: "LineNum",
        type: "Decimal",
        note: "Sequence number within the journal batch.",
      },
      {
        name: "AccountType",
        type: "Enum",
        note: "Ledger / Customer / Vendor / Bank / FixedAsset \u2014 determines FK target of AccountNum.",
      },
      {
        name: "AccountNum",
        type: "String",
        fkTarget: "CustTable.AccountNum",
        note: "Account reference; FK to CustTable.AccountNum when AccountType=Customer.",
      },
      {
        name: "AmountCurDebit",
        type: "Decimal",
        note: "Debit amount in transaction currency.",
      },
      {
        name: "AmountCurCredit",
        type: "Decimal",
        note: "Credit amount in transaction currency.",
      },
      {
        name: "Voucher",
        type: "String",
        note: "Voucher number shared with the corresponding CustTrans row after posting.",
      },
      {
        name: "TransDate",
        type: "Date",
        note: "Transaction date posted to the general ledger.",
      },
    ],
  },
  BankAccountTable: {
    name: "BankAccountTable",
    description: "Company bank account master defining account numbers, bank group, currency, and routing details for payment disbursement.",
    module: "Cash and Bank Management",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/bank/main/bankaccounttable",
    fields: [
      {
        name: "AccountId",
        type: "String",
        note: "Primary key \u2014 internal bank account identifier used in journal offset accounts.",
      },
      {
        name: "AccountNum",
        type: "String",
        note: "Actual bank account number at the financial institution.",
      },
      {
        name: "BankGroupId",
        type: "String",
        fkTarget: "BankGroup.BankGroupId",
        note: "Bank group providing routing number, bank name, and GL posting profile.",
      },
      {
        name: "CurrencyCode",
        type: "String",
        fkTarget: "Currency",
        note: "Denominated currency of this bank account.",
      },
      {
        name: "BankAccountType",
        type: "Enum",
        note: "Checking / Savings / etc.",
      },
      {
        name: "BankIBAN",
        type: "String",
        note: "IBAN number for international wire transfers and SEPA payments.",
      },
      {
        name: "SWIFT",
        type: "String",
        note: "SWIFT/BIC code identifying the bank for international payments.",
      },
    ],
  },
  // ── P2P tables ──────────────────────────────
  PurchReqTable: {
    name: "PurchReqTable",
    description: "Purchase requisition header. Tracks the requisition document submitted by an employee requesting goods or services, through workflow approval.",
    module: "Procurement and Sourcing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/procurementandsourcing/worksheetheader/purchreqtable",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "PurchReqId", type: "String", note: "Human-readable requisition number (e.g. PR-000123); business key" },
      { name: "PurchReqName", type: "String", note: "Description / title of the requisition" },
      { name: "RequisitionStatus", type: "Int32", note: "Enum: Draft=0, InReview=1, Approved=2, Closed=3, Cancelled=4" },
      { name: "RequisitionPurpose", type: "Int32", note: "Enum: Consumption=0 (generates PO), Replenishment=1 (feeds master plan)" },
      { name: "RequiredDate", type: "Date", note: "Requested delivery date across the requisition" },
      { name: "Originator", type: "Int64", fkTarget: "HcmWorker.RecId", note: "Worker who created the requisition" },
      { name: "TransDate", type: "Date", note: "Document date (date entered)" },
      { name: "SubmittedDateTime", type: "Date", note: "Timestamp when submitted to workflow; read-only" },
    ],
  },

  PurchReqLine: {
    name: "PurchReqLine",
    description: "Purchase requisition line. Each line represents a single item or service requested, with quantity, price, preferred vendor, and financial dimensions.",
    module: "Procurement and Sourcing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/procurementandsourcing/worksheetline/purchreqline",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "PurchReqId", type: "String", fkTarget: "PurchReqTable.PurchReqId", note: "Links line to its requisition header" },
      { name: "LineNumber", type: "Int32", note: "Sequential line number within the requisition" },
      { name: "ItemId", type: "String", fkTarget: "InventTable.ItemId", note: "Product/item being requested; null if procurement category used" },
      { name: "VendAccount", type: "String", fkTarget: "VendTable.AccountNum", note: "Preferred vendor suggested by requester; not binding" },
      { name: "Qty", type: "Decimal", note: "Requested quantity in the purchase unit of measure" },
      { name: "Price", type: "Decimal", note: "Estimated unit price (purchase currency)" },
      { name: "LineAmount", type: "Decimal", note: "Qty × Price; net line amount before tax" },
      { name: "PurchReqConsolidationStatus", type: "Int32", note: "Enum indicating if line is in a consolidation opportunity for demand aggregation" },
    ],
  },

  VendTable: {
    name: "VendTable",
    description: "Vendor master. Central record for each supplier including payment terms, currency, tax group, and hold status. Keyed by account number within the legal entity.",
    module: "Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/vendor/main/vendtable",
    fields: [
      { name: "AccountNum", type: "String", note: "Vendor account number; natural/business primary key" },
      { name: "VendGroup", type: "String", fkTarget: "VendGroup.VendGroup", note: "Vendor group; drives posting profiles and policies" },
      { name: "CurrencyCode", type: "String", fkTarget: "Currency.CurrencyCode", note: "Default transaction currency for this vendor" },
      { name: "PaymTermId", type: "String", fkTarget: "PaymTerm.PaymTermId", note: "Default payment terms (e.g. Net30)" },
      { name: "DlvTermId", type: "String", fkTarget: "DlvTerm.DlvTermId", note: "Default delivery terms (Incoterms)" },
      { name: "TaxGroup", type: "String", fkTarget: "TaxGroup.TaxGroup", note: "Sales-tax group applied to vendor transactions" },
      { name: "VendHoldStatus", type: "Int32", note: "Enum: None=0, All=1, Invoice=2, Payment=3; blocks processing when set" },
      { name: "OneTimeVendor", type: "Int32", note: "Flag for auto-created one-time vendor accounts" },
    ],
  },

  PurchTable: {
    name: "PurchTable",
    description: "Purchase order header. Represents the external order agreement with a vendor, including order/invoice account, currency, payment terms, and overall order status.",
    module: "Procurement and Sourcing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/procurementandsourcing/worksheetheader/purchtable",
    fields: [
      { name: "PurchId", type: "String", note: "Purchase order number; natural primary key (e.g. PO-000456)" },
      { name: "OrderAccount", type: "String", fkTarget: "VendTable.AccountNum", note: "Vendor account placing the order from; drives default fields" },
      { name: "InvoiceAccount", type: "String", fkTarget: "VendTable.AccountNum", note: "Vendor account for invoicing (may differ from OrderAccount)" },
      { name: "PurchStatus", type: "Int32", note: "Enum: None=0, OpenOrder=1, Received=2, Invoiced=3, Cancelled=4" },
      { name: "DocumentStatus", type: "Int32", note: "Enum tracks document progress: None, PurchaseOrder, ProductReceipt, Invoice" },
      { name: "CurrencyCode", type: "String", fkTarget: "Currency.CurrencyCode", note: "Transaction currency for the order" },
      { name: "PaymTermId", type: "String", fkTarget: "PaymTerm.PaymTermId", note: "Payment terms inherited from vendor; can be overridden" },
      { name: "DeliveryDate", type: "Date", note: "Requested delivery date on the header" },
    ],
  },

  PurchLine: {
    name: "PurchLine",
    description: "Purchase order line. Each line specifies a product/category, quantity, price, storage dimensions, and financial dimensions for one ordered item on the PO.",
    module: "Procurement and Sourcing",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/procurementandsourcing/worksheetline/purchline",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "PurchId", type: "String", fkTarget: "PurchTable.PurchId", note: "Links line to purchase order header" },
      { name: "LineNum", type: "Decimal", note: "Line sequence number; decimal to allow insertion between lines" },
      { name: "ItemId", type: "String", fkTarget: "InventTable.ItemId", note: "Product ordered; null if procurement category line" },
      { name: "InventDimId", type: "String", fkTarget: "InventDim.InventDimId", note: "Inventory dimension combination (site, warehouse, batch, serial, etc.)" },
      { name: "PurchQty", type: "Decimal", note: "Ordered quantity in purchase unit of measure" },
      { name: "PurchPrice", type: "Decimal", note: "Agreed unit price in order currency" },
      { name: "LineAmount", type: "Decimal", note: "Net line amount (PurchQty × PurchPrice after discounts)" },
      { name: "RemainPurchPhysical", type: "Decimal", note: "Quantity not yet received; decrements on each product receipt" },
    ],
  },

  VendPackingSlipJour: {
    name: "VendPackingSlipJour",
    description: "Vendor product receipt journal header. Created when a PO product receipt is posted; represents one physical delivery event from the vendor (one packing slip).",
    module: "Procurement and Sourcing / Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/procurementandsourcing/transaction/vendpackingslipjour",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "PurchId", type: "String", fkTarget: "PurchTable.PurchId", note: "Purchase order against which this receipt was posted" },
      { name: "PackingSlipId", type: "String", note: "Vendor's packing slip / delivery note number; required for matching" },
      { name: "VendAccount", type: "String", fkTarget: "VendTable.AccountNum", note: "Vendor account on the originating PO" },
      { name: "DeliveryDate", type: "Date", note: "Actual physical delivery date recorded at receipt" },
      { name: "TransDate", type: "Date", note: "Accounting posting date for inventory and accrual entries" },
      { name: "Voucher", type: "String", note: "Voucher number in the general ledger for this receipt posting" },
      { name: "InvoiceAccount", type: "String", fkTarget: "VendTable.AccountNum", note: "Invoice vendor account (may differ from ordering vendor)" },
    ],
  },

  VendPackingSlipTrans: {
    name: "VendPackingSlipTrans",
    description: "Vendor product receipt lines. Each record represents one PO line quantity received within a specific product receipt (packing slip) posting.",
    module: "Procurement and Sourcing / Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/procurementandsourcing/transaction/vendpackingsliptrans",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "VendPackingSlipJour", type: "Int64", fkTarget: "VendPackingSlipJour.RecId", note: "FK to the receipt journal header; groups lines under one delivery" },
      { name: "PurchId", type: "String", fkTarget: "PurchTable.PurchId", note: "Purchase order number, cross-links back to the PO header" },
      { name: "LineNum", type: "Decimal", fkTarget: "PurchLine.LineNum", note: "Matches PurchLine.LineNum to identify the PO line received" },
      { name: "ItemId", type: "String", fkTarget: "InventTable.ItemId", note: "Product received on this line" },
      { name: "Qty", type: "Decimal", note: "Physical quantity received in purchase unit of measure" },
      { name: "InventTransId", type: "String", fkTarget: "InventTrans.InventTransId", note: "Links to the inventory transaction that updated on-hand stock" },
      { name: "InventDimId", type: "String", fkTarget: "InventDim.InventDimId", note: "Dimension combination for the received stock" },
    ],
  },

  VendInvoiceJour: {
    name: "VendInvoiceJour",
    description: "Posted vendor invoice journal header. Created when a vendor invoice is confirmed and posted; records the invoice amount, accounting date, and voucher that hits the GL and subledger.",
    module: "Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountspayable/transaction/vendinvoicejour",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "InvoiceId", type: "String", note: "Vendor's invoice number; used for duplicate-invoice detection" },
      { name: "PurchId", type: "String", fkTarget: "PurchTable.PurchId", note: "PO against which the invoice is matched; null for non-PO invoices" },
      { name: "VendAccount", type: "String", fkTarget: "VendTable.AccountNum", note: "Vendor account being invoiced" },
      { name: "InvoiceDate", type: "Date", note: "Date on the vendor's paper invoice; drives due-date calculation" },
      { name: "InvoiceAmountMST", type: "Decimal", note: "Invoice total in accounting (MST) currency" },
      { name: "CurrencyCode", type: "String", fkTarget: "Currency.CurrencyCode", note: "Invoice transaction currency" },
      { name: "Voucher", type: "String", note: "GL voucher number generated at posting; links to GeneralJournalEntry" },
      { name: "VendTrans_RecId", type: "Int64", fkTarget: "VendTrans.RecId", note: "Direct FK to the VendTrans debit record created by this invoice posting" },
    ],
  },

  VendInvoiceTrans: {
    name: "VendInvoiceTrans",
    description: "Posted vendor invoice lines. One record per invoice line; holds the quantity, price, and tax group posted, cross-referenced to the originating PO line.",
    module: "Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountspayable/transaction/vendinvoicetrans",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "InvoiceId", type: "String", fkTarget: "VendInvoiceJour.InvoiceId", note: "Invoice number; combined with VendAccount identifies the journal header" },
      { name: "VendAccount", type: "String", fkTarget: "VendInvoiceJour.VendAccount", note: "Vendor account; part of composite FK to VendInvoiceJour" },
      { name: "PurchId", type: "String", fkTarget: "PurchLine.PurchId", note: "Purchase order number; combined with LineNum pinpoints the PO line" },
      { name: "LineNum", type: "Decimal", fkTarget: "PurchLine.LineNum", note: "PO line number; combined with PurchId links back to PurchLine" },
      { name: "ItemId", type: "String", fkTarget: "InventTable.ItemId", note: "Product invoiced on this line" },
      { name: "Qty", type: "Decimal", note: "Invoiced quantity" },
      { name: "LineAmountMST", type: "Decimal", note: "Net line amount in accounting currency" },
      { name: "TaxGroup", type: "String", fkTarget: "TaxGroup.TaxGroup", note: "Sales-tax group applied on this invoice line" },
    ],
  },

  VendTrans: {
    name: "VendTrans",
    description: "Vendor accounts-payable subledger transaction. Every posted AP event (invoice, payment, credit note, adjustment) creates a record here; the open balance is the sum of unsettled records.",
    module: "Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/accountspayable/transaction/vendtrans",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key; referenced by VendSettlement and VendInvoiceJour" },
      { name: "AccountNum", type: "String", fkTarget: "VendTable.AccountNum", note: "Vendor account; the AP subledger account" },
      { name: "Voucher", type: "String", note: "GL voucher number; links this AP transaction to GeneralJournalEntry" },
      { name: "TransDate", type: "Date", note: "Accounting date of the transaction" },
      { name: "AmountMST", type: "Decimal", note: "Amount in accounting currency; negative = vendor credit (payment)" },
      { name: "AmountCur", type: "Decimal", note: "Amount in transaction currency" },
      { name: "CurrencyCode", type: "String", fkTarget: "Currency.CurrencyCode", note: "Transaction currency of this entry" },
      { name: "Invoice", type: "String", note: "Vendor invoice number stored for reference and matching" },
      { name: "TransType", type: "Int32", note: "Enum: VendorBalance=0, CreditNote=1, Payment=2, etc.; determines debit/credit nature" },
    ],
  },

  VendSettlement: {
    name: "VendSettlement",
    description: "Vendor settlement record. Links one AP debit transaction (invoice) to one AP credit transaction (payment or credit note) with the settled amount; created by the settlement engine.",
    module: "Accounts Payable",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/bank/transaction/vendsettlement",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "TransRecId", type: "Int64", fkTarget: "VendTrans.RecId", note: "FK to the invoice (debit) VendTrans record being settled" },
      { name: "OffsetRecId", type: "Int64", fkTarget: "VendTrans.RecId", note: "FK to the payment (credit) VendTrans record used to settle" },
      { name: "SettleAmountMST", type: "Decimal", note: "Amount settled in accounting currency for this link" },
      { name: "SettleAmountCur", type: "Decimal", note: "Amount settled in transaction currency" },
      { name: "CurrencyCode", type: "String", fkTarget: "Currency.CurrencyCode", note: "Transaction currency of the settlement" },
      { name: "TransDate", type: "Date", note: "Date on which settlement was applied" },
      { name: "LastSettleDate", type: "Date", note: "Date the link was last modified (e.g. partial settlement updates)" },
    ],
  },

  LedgerTrans: {
    name: "LedgerTrans",
    description: "General ledger posted transaction. NOTE: In D365FO (AX 2012+) the legacy LedgerTrans table was replaced by GeneralJournalEntry (header) + GeneralJournalAccountEntry (lines). This entry describes GeneralJournalEntry — the posted GL transaction header containing the voucher, accounting date, posting layer, and link to subledger source documents.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/finance/ledger/transactionheader/generaljournalentry",
    fields: [
      { name: "RecId", type: "Int64", note: "Surrogate primary key" },
      { name: "JournalNumber", type: "String", note: "Subledger journal number (internal posting reference)" },
      { name: "AccountingDate", type: "Date", note: "Date on which the entry is recognised in the GL" },
      { name: "Voucher", type: "String", note: "Voucher number; connects to VendTrans.Voucher, CustTrans.Voucher, etc." },
      { name: "PostingLayer", type: "Int32", note: "Enum: Current=0, Operations=1, Tax=2; separates reporting layers" },
      { name: "IsSystemGenerated", type: "Int32", note: "1 if auto-generated by subledger posting engine; 0 if entered manually" },
      { name: "SystemGeneratedEntryType", type: "Int32", note: "Indicates the subledger module that originated this entry (AP, AR, Inventory, etc.)" },
      { name: "TransactionLog_RecId", type: "Int64", fkTarget: "TransactionLog.RecId", note: "FK to the immutable transaction log for audit trail" },
    ],
  },

  // ── RTR tables ──────────────────────────────
  MainAccount: {
    name: "MainAccount",
    description: "Individual general ledger account within a chart of accounts. Defines account type, posting behavior, FX revaluation settings, and closing options.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/financialdimensions/main/mainaccount",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "MainAccountId", type: "string", note: "Natural key — account number (unique within a chart of accounts)" },
      { name: "Name", type: "string", note: "Display name of the account" },
      { name: "Type", type: "int32 (enum)", note: "Main account type: BalanceSheet, ProfitAndLoss, Total, Reporting, None" },
      { name: "LedgerChartOfAccounts", type: "int64 (FK → LedgerChartOfAccounts.RecId)", note: "The chart of accounts this account belongs to" },
      { name: "Blocked", type: "int32 (enum)", note: "Whether the account is blocked for manual posting" },
      { name: "ExchangeAdjustmentRateType", type: "int64 (FK → ExchangeRateType.RecId, nullable)", note: "Exchange rate type used for foreign-currency revaluation" },
      { name: "FinancialReportingExchangeRateType", type: "int64 (FK → ExchangeRateType.RecId, nullable)", note: "Exchange rate type used for financial-reporting currency translation" },
    ],
  },

  LedgerChartOfAccounts: {
    name: "LedgerChartOfAccounts",
    description: "Chart of accounts header. A named, shared collection of main accounts that can be assigned to one or more legal-entity ledgers.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/main/ledgerchartofaccounts",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "Name", type: "string", note: "Chart-of-accounts identifier / display name (displayName: 'Chart of accounts')" },
      { name: "Description", type: "string (nullable)", note: "Human-readable description" },
      { name: "MainAccountFormatMask", type: "string (nullable)", note: "Account-number display format mask (e.g., '######')" },
    ],
  },

  Ledger: {
    name: "Ledger",
    description: "Legal-entity ledger configuration. Binds a legal entity to its chart of accounts, fiscal calendar, accounting/reporting currencies, and default exchange rate type. One Ledger record per legal entity.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/main/ledger",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "ChartOfAccounts", type: "int64 (FK → LedgerChartOfAccounts.RecId)", note: "Chart of accounts used by this legal entity (displayName: 'Chart of accounts')" },
      { name: "FiscalCalendar", type: "int64 (FK → FiscalCalendar.RecId)", note: "Fiscal calendar governing the ledger periods" },
      { name: "DefaultExchangeRateType", type: "int64 (FK → ExchangeRateType.RecId, nullable)", note: "Default exchange rate type for transaction currency conversion (displayName: 'Default exchange rate type')" },
      { name: "AccountingCurrency", type: "string", note: "ISO 4217 code for the accounting (home/functional) currency" },
      { name: "ReportingCurrency", type: "string (nullable)", note: "ISO 4217 code for the optional second reporting currency" },
      { name: "Description", type: "string (nullable)", note: "Ledger description" },
    ],
  },

  FiscalCalendar: {
    name: "FiscalCalendar",
    description: "Fiscal calendar definition. Container for one or more fiscal years, each subdivided into periods. Shared across legal entities and also used for fixed-asset books and budget cycles.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/reference/fiscalcalendar",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "CalendarId", type: "string", note: "Natural key — unique calendar identifier (e.g., 'Fiscal_2024')" },
      { name: "Description", type: "string", note: "Human-readable description of the calendar" },
    ],
  },

  FiscalCalendarPeriod: {
    name: "FiscalCalendarPeriod",
    description: "Individual accounting period within a fiscal year. Defines start/end dates, period type (operating vs. closing), and month/quarter metadata.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/reference/fiscalcalendarperiod",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "Name", type: "string", note: "Period name (e.g., 'Jan 2024')" },
      { name: "ShortName", type: "string (nullable)", note: "Abbreviated period label" },
      { name: "StartDate", type: "date", note: "First day of the period" },
      { name: "EndDate", type: "date", note: "Last day of the period" },
      { name: "Type", type: "int32 (enum, nullable)", note: "Period type: 0=Operating, 1=Opening, 2=Closing (closing periods used for year-end entries)" },
      { name: "FiscalCalendar", type: "int64 (FK → FiscalCalendar.RecId, nullable)", note: "Parent fiscal calendar" },
      { name: "FiscalCalendarYear", type: "int64 (FK → FiscalCalendarYear.RecId)", note: "Parent fiscal year record" },
      { name: "Month", type: "int32 (nullable)", note: "Calendar month number (1–12)" },
      { name: "Quarter", type: "int32 (nullable)", note: "Calendar quarter number (1–4)" },
    ],
  },

  LedgerAllocationRule: {
    name: "LedgerAllocationRule",
    description: "Allocation rule for automatically distributing ledger balances or fixed amounts to destination accounts. Supports four methods: Basis (proportional to a ledger balance), Fixed Percentage, Fixed Weight, and Equally.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/main/ledgerallocationrule",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "RuleId", type: "string", note: "Natural key — unique allocation rule identifier" },
      { name: "Description", type: "string (nullable)", note: "Human-readable rule description" },
      { name: "AllocationMethod", type: "int32 (enum)", note: "0=Basis, 1=Fixed percentage, 2=Fixed weight, 3=Equally" },
      { name: "DataSource", type: "int32 (enum)", note: "Source of amounts to allocate: 0=Ledger balance, 1=Fixed value" },
      { name: "JournalName", type: "string (FK → LedgerJournalName)", note: "Journal name used when posting the generated allocation entries" },
      { name: "Active", type: "int32 (enum)", note: "Whether the rule is active (0=Inactive, 1=Active)" },
    ],
  },

  SubledgerVoucherGeneralJournalEntry: {
    name: "SubledgerVoucherGeneralJournalEntry",
    description: "Bridge table linking a subledger-module voucher (e.g., AP invoice, AR payment, bank transaction) to its corresponding GeneralJournalEntry in the GL. Provides traceability from subledger to posted ledger.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/transaction/subledgervouchergeneraljournalentry",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "GeneralJournalEntry", type: "int64 (FK → GeneralJournalEntry.RecId)", note: "The GL general journal entry header this voucher maps to" },
      { name: "Voucher", type: "string", note: "Subledger voucher number (from AP/AR/Bank/etc.)" },
      { name: "VoucherDataAreaId", type: "string", note: "Legal entity (DataAreaId) of the originating subledger voucher" },
      { name: "AccountingDate", type: "date (nullable)", note: "Accounting date of the subledger voucher" },
    ],
  },

  ExchangeRate: {
    name: "ExchangeRate",
    description: "Currency exchange rate record. Stores a rate value for a currency pair (from/to) effective from a specific date. The rate is indirectly associated with an ExchangeRateType via the ExchangeRateCurrencyPair parent.",
    module: "System / Currency",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/common/currency/reference/exchangerate",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "ExchangeRate", type: "decimal", note: "The exchange rate value (e.g., units of 'to' currency per unit of 'from' currency)" },
      { name: "ExchangeRateCurrencyPair", type: "int64 (FK → ExchangeRateCurrencyPair.RecId, nullable)", note: "Currency pair this rate applies to; ExchangeRateCurrencyPair in turn FK→ExchangeRateType" },
      { name: "ValidFrom", type: "date (nullable)", note: "Effective start date of the rate (displayName: 'Start date')" },
      { name: "ValidTo", type: "date (nullable, isReadOnly)", note: "Calculated end date (set to the ValidFrom of the next rate minus 1 day)" },
    ],
  },

  ExchangeRateType: {
    name: "ExchangeRateType",
    description: "Exchange rate type definition (e.g., Default, Average, Spot, Budget). Each type groups a set of ExchangeRateCurrencyPair/ExchangeRate records for a specific financial purpose (transaction entry, revaluation, reporting translation).",
    module: "System / Currency",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/common/currency/group/exchangeratetype",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "Name", type: "string", note: "System identifier for the rate type (e.g., 'Default', 'Average')" },
      { name: "Description", type: "string (nullable)", note: "Display label for the rate type (CDM displayName: 'Name')" },
      { name: "CalendarId", type: "string (nullable)", note: "Optional work calendar used for weighted-average rate calculation" },
    ],
  },

  LedgerConsolidate: {
    name: "LedgerConsolidate",
    description: "Consolidation run record (CDM table: LedgerConsolidateHist). Each online or import consolidation execution creates a history record identifying the source subsidiary and target consolidated legal entity.",
    module: "General Ledger / Consolidations",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/transactionheader/ledgerconsolidatehist",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "CompanyIdOrigin", type: "string (nullable)", note: "DataAreaId of the subsidiary legal entity being consolidated (displayName: 'Company accounts')" },
      { name: "Description", type: "string (nullable)", note: "Description of the consolidation run" },
      { name: "DataAreaId", type: "string (isReadOnly)", note: "Legal entity of the target (parent/consolidated) entity" },
    ],
  },

  LedgerClosingSheet: {
    name: "LedgerClosingSheet",
    description: "Period closing worksheet header. Groups the closing accounts and entries used during period-end close for a specific fiscal period. Lines (LedgerClosingTable) reference individual main accounts.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/finance/ledger/worksheetheader/ledgerclosingsheet",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "Sheet", type: "string", note: "Natural key — closing sheet identifier" },
      { name: "Name", type: "string (nullable)", note: "Human-readable closing sheet name" },
      { name: "FiscalCalendarPeriod", type: "int64 (FK → FiscalCalendarPeriod.RecId, nullable)", note: "The fiscal period being closed" },
      { name: "FromDate", type: "date (nullable)", note: "Start of the closing period (displayName: 'From')" },
      { name: "ToDate", type: "date (nullable)", note: "End of the closing period (displayName: 'To')" },
      { name: "PostDate", type: "date (nullable)", note: "Date used to post closing entries (displayName: 'Post')" },
      { name: "Voucher", type: "string (nullable, isReadOnly)", note: "Voucher number of the posted closing transaction" },
      { name: "SumResult", type: "decimal (nullable, isReadOnly)", note: "Computed P&L net result for the sheet (displayName: 'Result')" },
    ],
  },

  LedgerPeriodClose: {
    name: "LedgerPeriodClose",
    description: "Period/year-end closing task record. Part of the Financial period close workspace. Tracks each closing task's template, associated fiscal period, assigned company, status, due date, and completion across the closing schedule.",
    module: "General Ledger",
    docsUrl: "https://learn.microsoft.com/dynamics365/finance/general-ledger/financial-period-close-workspace",
    fields: [
      { name: "RecId", type: "int64", note: "Primary key (surrogate)" },
      { name: "TaskName", type: "string", note: "Name of the closing task (e.g., 'Post accruals', 'Run currency revaluation')" },
      { name: "CloseGroup", type: "string (FK → LedgerFiscalCloseGroup)", note: "Closing schedule / group the task belongs to" },
      { name: "FiscalCalendarPeriod", type: "int64 (FK → FiscalCalendarPeriod.RecId)", note: "The fiscal period this closing task is scoped to" },
      { name: "DueDate", type: "date", note: "Calculated task due date based on template relative days and period end date" },
      { name: "Status", type: "int32 (enum)", note: "Task status: 0=Open, 1=Completed, 2=Blocked (dependency not met)" },
      { name: "DataAreaId", type: "string", note: "Legal entity the task applies to" },
    ],
  },

  // ── INV tables ──────────────────────────────
  EcoResProduct: {
    name: "EcoResProduct",
    description: "Global shared product definition (not yet released to a legal entity). Holds the product number, type (Item/Service), and top-level attributes that are shared across all companies. Released per-company records link back to this table via InventTable.Product.",
    module: "Product Information Management – shared (cross-company)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/productinformationmanagement/main/ecoresproduct",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK; system-generated" },
      { name: "DisplayProductNumber", type: "string", note: "Human-readable product number shown in UI" },
      { name: "ProductType", type: "int32 enum", note: "1 = Item, 2 = Service" },
      { name: "SearchName", type: "string", note: "Alternate search/alias name; nullable" },
      { name: "ServiceType", type: "int32 enum", note: "Delivered / Work center; nullable" },
      { name: "InstanceRelationType", type: "int64", note: "Polymorphic type discriminator (EcoResDistinctProduct vs EcoResProductMaster); nullable" },
      { name: "PdsCWProduct", type: "int32", note: "Catch-weight product flag; nullable" },
      { name: "EngChgProductOwnerId", type: "string", note: "Engineering change owner ID; nullable" },
    ],
  },

  InventTableModule: {
    name: "InventTableModule",
    description: "Stores module-specific settings for a released product (InventTable) per module type: Purchase (1), Sales (2), and Inventory (3). Each released product has up to three rows—one per module. Controls default unit, pricing, and discount rules.",
    module: "Product Information Management / Inventory Management – per legal entity",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/productinformationmanagement/main/inventtablemodule",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ItemId", type: "string", note: "FK → InventTable.ItemId; released product in this legal entity" },
      { name: "ModuleType", type: "int32 enum", note: "1 = Purchase, 2 = Sales, 3 = Inventory" },
      { name: "UnitId", type: "string", note: "Default unit of measure for the module; FK → UnitOfMeasure" },
      { name: "PriceUnit", type: "decimal", note: "Quantity basis for the module price (e.g. price per 100 units)" },
      { name: "Price", type: "decimal", note: "Module list/cost price per PriceUnit" },
      { name: "LineDisc", type: "decimal", note: "Default line discount %" },
      { name: "DataAreaId", type: "string", note: "Legal-entity partition; FK → CompanyInfo" },
    ],
  },

  InventModelGroup: {
    name: "InventModelGroup",
    description: "Defines the inventory costing model and physical/financial posting policy for items that belong to the group. Controls whether FIFO, LIFO, Weighted Average, Standard Cost, or Moving Average is used, and whether physical transactions update the ledger.",
    module: "Inventory Management – group (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/group/inventmodelgroup",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ModelGroupId", type: "string", note: "User-defined group code (e.g. 'FIFO', 'STD')" },
      { name: "Name", type: "string", note: "Descriptive name" },
      { name: "InventModel", type: "int32 enum", note: "Costing method: FIFO=1, LIFO=2, WeightedAvg=3, MovingAvg=4, StdCost=5, LIFO date=6, WeightedAvg date=7" },
      { name: "PostPhysical", type: "int32 bool", note: "Post physical receipts/issues to ledger immediately" },
      { name: "PostFinancial", type: "int32 bool", note: "Post financial transactions to ledger" },
      { name: "NegativeInventory", type: "int32 bool", note: "Allow negative physical inventory" },
      { name: "FixedReceiptPrice", type: "int32 bool", note: "Use fixed receipt price (standard cost mode; enable with InventModel=StdCost)" },
    ],
  },

  InventSum: {
    name: "InventSum",
    description: "Aggregated on-hand inventory quantities for each unique combination of ItemId and InventDimId. Updated in real time by inventory transactions. Non-WMS on-hand source of truth; WMS-enabled warehouses supplement this with WHSInventReserve.",
    module: "Inventory Management – transaction (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/transaction/inventsum",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ItemId", type: "string", note: "FK → InventTable.ItemId" },
      { name: "InventDimId", type: "string", note: "FK → InventDim; dimension combination (site/warehouse/location/batch etc.)" },
      { name: "PhysicalInvent", type: "decimal", note: "Total physically on hand (received minus issued)" },
      { name: "PostedQty", type: "decimal", note: "Financially posted on-hand quantity" },
      { name: "ReservPhysical", type: "decimal", note: "Physically reserved quantity" },
      { name: "ReservOrdered", type: "decimal", note: "Ordered-reserved quantity (future receipt reservation)" },
      { name: "AvailPhysical", type: "decimal", note: "Available physical = PhysicalInvent − ReservPhysical; read-only calculated" },
      { name: "OnOrder", type: "decimal", note: "Quantity on open inbound orders" },
    ],
  },

  WHSInventReserve: {
    name: "WHSInventReserve",
    description: "WMS-level on-hand and reservation record. For WMS-enabled warehouses, one row exists per hierarchy level per dimension combination, enabling the WMS reservation algorithm to evaluate availability at each level (site → warehouse → status → location → license plate).",
    module: "Warehouse Management – transaction (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/transaction/whsinventreserve",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ItemId", type: "string", note: "FK → InventTable" },
      { name: "InventDimId", type: "string", note: "FK → InventDim; dimension combination at this hierarchy level" },
      { name: "ReservPhysical", type: "decimal", note: "Physically reserved quantity at this level" },
      { name: "ReservOrdered", type: "decimal", note: "Ordered-reserved quantity at this level" },
      { name: "AvailPhysical", type: "decimal", note: "Available physical at this level" },
      { name: "AvailOrdered", type: "decimal", note: "Available ordered at this level" },
      { name: "CWReservPhysical", type: "decimal", note: "Catch-weight physically reserved; nullable" },
      { name: "CWReservOrdered", type: "decimal", note: "Catch-weight ordered reserved; nullable" },
    ],
  },

  WHSReservationHierarchy: {
    name: "WHSReservationHierarchy",
    description: "Defines a named reservation hierarchy that specifies which inventory dimensions are controlled at which level, and which are delegated to WMS work. Shared (cross-company) table. Assigned to items via WHSReservationHierarchyItem. WHSReservationHierarchyElement rows define each dimension level.",
    module: "Warehouse Management – group (shared / cross-company)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/group/whsreservationhierarchy",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "Name", type: "string", note: "Unique hierarchy name (e.g. 'Default', 'Batch-above-loc')" },
      { name: "Description", type: "string", note: "Human-readable description; nullable" },
    ],
  },

  InventTransferTable: {
    name: "InventTransferTable",
    description: "Transfer order header representing a planned or in-transit movement of goods between two warehouses or sites within the same legal entity. Controls dates, from/to locations, and overall status lifecycle (Created → Shipped → Received).",
    module: "Inventory Management – worksheet header (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetheader/inventtransfertable",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "TransferId", type: "string", note: "Transfer order number; natural key" },
      { name: "InventLocationIdFrom", type: "string", note: "From warehouse; FK → InventLocation" },
      { name: "InventLocationIdTo", type: "string", note: "To warehouse; FK → InventLocation" },
      { name: "InventSiteIdFrom", type: "string", note: "From site; FK → InventSite" },
      { name: "InventSiteIdTo", type: "string", note: "To site; FK → InventSite" },
      { name: "ShipDate", type: "date", note: "Planned shipment date" },
      { name: "ReceiveDate", type: "date", note: "Planned receipt date" },
      { name: "TransferStatus", type: "int32 enum", note: "Created=0, Shipped=1, Received=2, None=3" },
    ],
  },

  InventTransferLine: {
    name: "InventTransferLine",
    description: "Transfer order line for a specific item and dimension combination within a transfer order. Tracks ship and receive quantities separately. InventDimId captures the 'from' dimensions; InventDimIdTo captures 'to' dimensions (relevant when tracking dimensions differ between sites).",
    module: "Inventory Management – worksheet line (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetline/inventtransferline",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "TransferId", type: "string", note: "FK → InventTransferTable.TransferId" },
      { name: "LineNum", type: "decimal", note: "Line sequence number" },
      { name: "ItemId", type: "string", note: "FK → InventTable.ItemId" },
      { name: "InventDimId", type: "string", note: "FK → InventDim; source (from) dimension combination" },
      { name: "InventDimIdTo", type: "string", note: "FK → InventDim; destination (to) dimension combination; nullable" },
      { name: "Qty", type: "decimal", note: "Planned transfer quantity" },
      { name: "QtyShipped", type: "decimal", note: "Quantity physically shipped" },
      { name: "QtyReceived", type: "decimal", note: "Quantity received at destination" },
    ],
  },

  InventJournalTable: {
    name: "InventJournalTable",
    description: "Inventory journal header for non-WMS inventory adjustments: Movement, Counting, Profit/Loss, BOM, Transfer, and Tag counting journal types. One row per journal batch. Lines stored in InventJournalTrans. Posted journals create InventTrans records.",
    module: "Inventory Management – worksheet header (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetheader/inventjournaltable",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "JournalId", type: "string", note: "Journal number; natural key" },
      { name: "JournalType", type: "int32 enum", note: "1=Movement, 2=Counting, 3=P&L, 4=Adjustment, 5=Transfer, 6=BOM" },
      { name: "JournalNameId", type: "string", note: "FK → InventJournalName; determines GL setup" },
      { name: "Posted", type: "int32", note: "1 = Journal has been posted" },
      { name: "Description", type: "string", note: "Free-text description; nullable" },
      { name: "DataAreaId", type: "string", note: "Legal-entity partition" },
    ],
  },

  InventJournalTrans: {
    name: "InventJournalTrans",
    description: "Inventory journal transaction lines. One row per item/dimension/date combination within a journal. For counting journals the CountedQty vs. on-hand difference is posted as an adjustment. Creates InventTrans on posting.",
    module: "Inventory Management – worksheet line (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/worksheetline/inventjournaltrans",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "JournalId", type: "string", note: "FK → InventJournalTable.JournalId" },
      { name: "LineNum", type: "decimal", note: "Line sequence number" },
      { name: "TransDate", type: "date", note: "Transaction date" },
      { name: "ItemId", type: "string", note: "FK → InventTable.ItemId" },
      { name: "InventDimId", type: "string", note: "FK → InventDim" },
      { name: "Qty", type: "decimal", note: "Adjustment quantity (positive = in, negative = out)" },
      { name: "CountedQty", type: "decimal", note: "Physical count quantity (Counting journals only)" },
      { name: "CostAmount", type: "decimal", note: "Cost value of the adjustment" },
      { name: "Voucher", type: "string", note: "GL voucher number (populated on post)" },
    ],
  },

  WHSCountingJournalTable: {
    name: "WHSCountingJournalTable",
    description: "WMS cycle-counting journal header. Created automatically by cycle count plans/thresholds or manually via 'Cycle count work by location/item'. Tracks the work pool, warehouse, and journal lifecycle. Resolved differences are posted as InventJournalTable (Counting type) records. NOTE: This table is an internal D365FO WMS table not currently published in the CDM schema; the functional documentation below is the authoritative public reference.",
    module: "Warehouse Management – worksheet header (per legal entity)",
    docsUrl: "https://learn.microsoft.com/dynamics365/supply-chain/warehousing/cycle-counting",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "JournalId", type: "string", note: "WMS counting journal number" },
      { name: "WorkPoolId", type: "string", note: "FK → WHSWorkPool; optional work pool for segregation" },
      { name: "Warehouse", type: "string", note: "FK → WHSWarehouse.Warehouse (WMS warehouse code)" },
      { name: "JournalStatus", type: "int32 enum", note: "Open, Pending review, Closed" },
      { name: "CreatedDateTime", type: "utcDateTime", note: "Counting job creation timestamp" },
    ],
  },

  WHSCountingJournalLine: {
    name: "WHSCountingJournalLine",
    description: "WMS cycle-counting journal line. One row per item/location counted. Stores the worker-entered CountingQuantity and the system's ExpectedQuantity; if they differ beyond tolerance, a review step is required before the line can be posted. Links to the WHSWorkTable work record that triggered the count.",
    module: "Warehouse Management – worksheet line (per legal entity)",
    docsUrl: "https://learn.microsoft.com/dynamics365/supply-chain/warehousing/cycle-counting",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "JournalId", type: "string", note: "FK → WHSCountingJournalTable.JournalId" },
      { name: "LineNum", type: "decimal", note: "Line sequence number" },
      { name: "ItemId", type: "string", note: "FK → InventTable.ItemId" },
      { name: "InventDimId", type: "string", note: "FK → InventDim; includes location and license plate" },
      { name: "CountingQuantity", type: "decimal", note: "Quantity entered by the worker during the physical count" },
      { name: "ExpectedQuantity", type: "decimal", note: "System on-hand quantity at time of count" },
      { name: "WorkId", type: "string", note: "FK → WHSWorkTable.WorkId; the work order that generated this count line" },
    ],
  },

  InventSettlement: {
    name: "InventSettlement",
    description: "Inventory cost settlement record created by the inventory close process. Each row links a financially posted receipt transaction (TransRecId) to a financially posted issue transaction (SettleRecId), recording the quantity settled and the cost adjustment amount. Cancelled settlements reference the original via the Cancelled FK.",
    module: "Cost Management / Inventory Management – transaction line (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/transactionline/inventsettlement",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "Voucher", type: "string", note: "GL voucher from the inventory close adjustment posting" },
      { name: "TransRecId", type: "int64", note: "FK → InventTrans.RecId (receipt side)" },
      { name: "SettleRecId", type: "int64", note: "FK → InventTrans.RecId (issue side being settled)" },
      { name: "Qty", type: "decimal", note: "Quantity settled in this record" },
      { name: "CostAmount", type: "decimal", note: "Cost adjustment amount posted to GL" },
      { name: "IsCancelled", type: "int32", note: "1 = this settlement was reversed/cancelled" },
      { name: "Cancelled", type: "int64", note: "FK → InventSettlement.RecId of the cancellation record; nullable" },
    ],
  },

  InventCostListTable: {
    name: "InventCostListTable",
    description: "BOM cost calculation list line (CDM entity: InventCostList). Stores the itemised cost component rows produced when rolling up a standard cost via the BOM cost calculation engine. Grouped into bundles; each row captures the item, BOM level, and cost contribution. Used during standard cost activation and inventory close recalculation. In CDM this entity is named InventCostList (Calculation list in TransactionLine).",
    module: "Cost Management – transaction line (per legal entity)",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/supplychain/inventory/transactionline/inventcostlist",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ItemId", type: "string", note: "FK → InventTable.ItemId; the item whose cost is captured" },
      { name: "BOMLevel", type: "int32", note: "BOM nesting depth level (0 = top-level item)" },
      { name: "Bundle", type: "int64", note: "FK → InventCostBundleList; groups rows from the same calculation run; nullable" },
      { name: "NumOfIteration", type: "int32", note: "Number of calculation iterations (for circular BOM detection); nullable, read-only" },
      { name: "Voucher", type: "string", note: "Calculation voucher; read-only" },
      { name: "DataAreaId", type: "string", note: "Legal-entity partition; read-only" },
    ],
  },

  // ── HR tables ──────────────────────────────
  HcmPosition: {
    name: "HcmPosition",
    description: "Individual position instance within an organization — a specific funded slot tied to a Job. Defines the role, department assignment, reporting structure, activation/retirement dates, and compensation region. A position can have at most one active worker assignment at any time.",
    module: "Human Resources",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/entities/humanresources/hrm/hcmpositionv2entity",
    fields: [
      { name: "PositionId", type: "String(20)", note: "Natural key, user-defined position ID (e.g. '000220')" },
      { name: "JobId", type: "String(20)", note: "FK → HcmJob; the job definition this position is an instance of" },
      { name: "PositionTypeId", type: "String(20)", note: "FK → HcmPositionType (Full-time, Part-time, etc.); nullable" },
      { name: "TitleId", type: "String(10)", note: "FK → HcmTitle; position title shown on worker record; nullable" },
      { name: "Activation", type: "UtcDateTime", note: "Date the position becomes active in the system" },
      { name: "Retirement", type: "UtcDateTime", note: "Date the position is retired / deactivated; nullable" },
      { name: "DepartmentNumber", type: "String(10)", note: "FK → OMOperatingUnit (Department); nullable" },
      { name: "CompensationRegionId", type: "String(10)", note: "FK → HcmCompensationRegion; drives comp grid selection; nullable" },
    ],
  },

  HcmPositionHierarchy: {
    name: "HcmPositionHierarchy",
    description: "Defines parent-child reporting relationships between positions for a given hierarchy type (Line, Matrix, Project, etc.). Supports multiple concurrent hierarchies. Date-effective via ValidFrom/ValidTo.",
    module: "Human Resources",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/entities/humanresources/hrm/hcmpositionhierarchyentity",
    fields: [
      { name: "PositionId", type: "String(20)", note: "FK → HcmPosition; the child (reporting) position" },
      { name: "ParentPositionId", type: "String(20)", note: "FK → HcmPosition; the parent ('reports to') position" },
      { name: "PositionHierarchyType", type: "String(20)", note: "FK → HcmPositionHierarchyType; identifies the hierarchy (e.g. 'Line')" },
      { name: "HierarchyType", type: "String(20)", note: "Denormalized hierarchy type name" },
      { name: "ValidFrom", type: "UtcDateTime", note: "Effective start date of this reporting relationship" },
      { name: "ValidTo", type: "UtcDateTime", note: "Effective end date; nullable for open-ended relationships" },
    ],
  },

  HcmWorker: {
    name: "HcmWorker",
    description: "Shared worker record for both employees (WorkerType=Employee) and contractors (WorkerType=Contractor). Identified by PersonnelNumber. Links to DirPerson for all personal/contact data stored in the Global Address Book.",
    module: "Human Resources",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/entities/humanresources/hrm/hcmworkerentity",
    fields: [
      { name: "PersonnelNumber", type: "String(20)", note: "Natural key for the worker across the system" },
      { name: "WorkerType", type: "Enum", note: "Employee or Contractor" },
      { name: "Person", type: "Int64", note: "FK → DirPerson.RecId; links to the GAB party record for personal data" },
      { name: "AllowRehire", type: "Enum", note: "Yes / No / Under conditions; set on separation" },
      { name: "ObjectId", type: "String(36)", note: "GUID-style unique identifier used in API / Dataverse integration" },
    ],
  },

  DirPerson: {
    name: "DirPerson",
    description: "Person record in the Global Address Book (GAB). Shared across all D365FO modules. Stores display name, language, name alias, initials and subtype discriminator. All HR worker personal data (name, contact info, address) ultimately traces back here.",
    module: "Global Address Book (Common)",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/common/gab/main/dirperson",
    fields: [
      { name: "RecId", type: "Int64", note: "PK; surrogate key referenced by HcmWorker.Person" },
      { name: "Name", type: "String(100)", note: "Full display name of the person" },
      { name: "NameAlias", type: "String(100)", note: "Nickname or alias; nullable" },
      { name: "Initials", type: "String(10)", note: "Initials of the person; nullable" },
      { name: "LanguageId", type: "String(7)", note: "Preferred language code; nullable" },
      { name: "NameSequenceDisplayAs", type: "Enum", note: "Display format for name (First Last vs Last, First)" },
      { name: "InstanceRelationType", type: "Int64", note: "Subtype discriminator linking to employee, contact, vendor, etc." },
    ],
  },

  HcmEmployment: {
    name: "HcmEmployment",
    description: "Employment period for a worker in a specific legal entity. Tracks start and end dates, employment type, work calendar, and regulatory establishment. An open EmploymentEndDate means currently employed. Multiple records can exist per worker across different companies.",
    module: "Human Resources",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/entities/humanresources/hrm/hcmemploymententity",
    fields: [
      { name: "Worker", type: "Int64", note: "FK → HcmWorker.RecId; the employed worker" },
      { name: "PersonnelNumber", type: "String(20)", note: "Denormalized natural key of the worker" },
      { name: "LegalEntityId", type: "String(4)", note: "FK → CompanyInfo; the employing legal entity / company" },
      { name: "EmploymentStartDate", type: "UtcDateTime", note: "Official start date of employment" },
      { name: "EmploymentEndDate", type: "UtcDateTime", note: "End date; NULL or open = currently employed" },
      { name: "WorkerType", type: "Enum", note: "Employee or Contractor for this employment period" },
      { name: "CalendarId", type: "String(10)", note: "FK → WorkCalendar; work schedule calendar; nullable" },
    ],
  },

  HcmOnboardingTask: {
    name: "HcmOnboardingTask",
    description: "Individual task record within an onboarding, offboarding, or transition checklist. Can be assigned to a specific worker, position, group of positions, the new hire's manager, or the affected employee. Due date is calculated as an offset (days) from the hire/termination/transition date.",
    module: "Human Resources – Task Management",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-task-mgmt",
    fields: [
      { name: "TaskId", type: "String(36)", note: "PK; GUID-style unique task identifier" },
      { name: "Name", type: "String(100)", note: "Display name of the task" },
      { name: "ChecklistId", type: "String(20)", note: "FK → HcmChecklist; the checklist template this task belongs to" },
      { name: "AssignmentType", type: "Enum", note: "Worker / Position / Group / Manager / Employee" },
      { name: "AssignedTo", type: "String(20)", note: "The specific worker/position/group ID; type depends on AssignmentType" },
      { name: "DueDateOffset", type: "Integer", note: "Days before (negative) or after (positive) start/termination date" },
      { name: "Optional", type: "Enum", note: "Yes = informational only; No = required" },
      { name: "TaskLinkType", type: "Enum", note: "URL / MenuItem / WorkerDetails — defines the completion link; nullable" },
    ],
  },

  HcmChecklist: {
    name: "HcmChecklist",
    description: "Onboarding, offboarding, or transition checklist template. Groups a set of tasks together. Assigned to a worker at hire, termination, or transfer time. Supports a default owner (for fallback task assignment) and a work calendar for due-date calculations.",
    module: "Human Resources – Task Management",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-task-mgmt",
    fields: [
      { name: "ChecklistId", type: "String(20)", note: "PK; natural key for the checklist template" },
      { name: "Name", type: "String(100)", note: "Display name of the checklist" },
      { name: "ChecklistType", type: "Enum", note: "Onboarding / Offboarding / Transition" },
      { name: "Owner", type: "String(20)", note: "FK → HcmWorker.PersonnelNumber; default assignee when no other owner can be resolved" },
      { name: "CalendarId", type: "String(10)", note: "FK → WorkCalendar; used to calculate working-day due dates for tasks" },
      { name: "Description", type: "String(1000)", note: "Optional description of the checklist purpose; nullable" },
    ],
  },

  SecurityUserRole: {
    name: "SecurityUserRole",
    description: "Maps a D365FO system user to a security role. Controls which modules, menu items, and data the user can access via role-based security. Assignment can be manual or rule-driven (automatic). Protected by AOSAuthorization=CreateUpdateDelete to prevent privilege escalation.",
    module: "System Administration – Security",
    docsUrl: "https://learn.microsoft.com/dynamics365/fin-ops-core/dev-itpro/dev-ref/system-tables#securityuserrole",
    fields: [
      { name: "User", type: "String(UserId)", note: "FK → UserInfo; the system user being granted the role" },
      { name: "SecurityRole", type: "Int64", note: "FK → SecurityRole.RecId; the role being assigned" },
      { name: "AssignmentMode", type: "Enum", note: "Manual or Automatic (rule-driven)" },
      { name: "AssignmentStatus", type: "Enum", note: "Enabled or Disabled" },
      { name: "ValidFrom", type: "UtcDateTime", note: "Effective start of the assignment" },
      { name: "ValidTo", type: "UtcDateTime", note: "Effective end of the assignment; nullable" },
    ],
  },

  HcmCompPlan: {
    name: "HcmCompPlan",
    description: "Base compensation plan definition — the parent record that specifies plan ID, plan type (Fixed/Variable), currency, effective date range, and pay frequency. Fixed and variable compensation plans both reference this record. Eligibility rules are attached to control which workers can be enrolled.",
    module: "Human Resources – Compensation",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-compensation-overview",
    fields: [
      { name: "Plan", type: "String(20)", note: "PK; natural key / plan ID (e.g. 'ANNUAL-FIXED')" },
      { name: "Description", type: "String(60)", note: "Human-readable plan description" },
      { name: "Type", type: "Enum", note: "Fixed / Variable / None — determines the subtype" },
      { name: "EffectiveDate", type: "Date", note: "Date the plan becomes active" },
      { name: "ExpirationDate", type: "Date", note: "Date the plan expires; nullable for open-ended plans" },
      { name: "Currency", type: "String(3)", note: "ISO currency code for all pay amounts in this plan" },
      { name: "PayFrequency", type: "String(10)", note: "FK → HcmPayRateConversion; pay frequency (Annual, Monthly, Hourly, etc.)" },
    ],
  },

  HcmCompFixedPlan: {
    name: "HcmCompFixedPlan",
    description: "Fixed compensation plan details — extends the base HcmCompPlan with a salary grid structure, hire rule, out-of-range tolerance, and control point. Workers are enrolled via the fixed compensation enrollment process tied to their position's compensation level.",
    module: "Human Resources – Compensation",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hcm-comp-fixed-plan",
    fields: [
      { name: "Plan", type: "String(20)", note: "PK / FK → HcmCompPlan; the parent plan this fixed plan belongs to" },
      { name: "CompensationStructure", type: "String(20)", note: "FK → HcmCompGrid; the salary grade/band/step matrix" },
      { name: "HireRule", type: "Enum", note: "Percent (prorate new hires) or None" },
      { name: "OutOfRangeTolerance", type: "Enum", note: "None / Soft (warn) / Hard (error) for out-of-range pay" },
      { name: "RecommendationAllowed", type: "Enum", note: "Yes = process events allow guideline overrides" },
      { name: "ControlPoint", type: "String(20)", note: "FK → HcmCompRefPointSetupLine; ideal pay reference point (e.g. midpoint)" },
      { name: "RefPointSetupId", type: "String(20)", note: "FK → HcmCompRefPointSetup; reference point configuration for this plan" },
    ],
  },

  HcmBenefitPlan: {
    name: "HcmBenefitPlan",
    description: "Benefit plan definition — covers health, dental, vision, life, retirement, and other benefit types. Specifies the benefit type, vendor, coverage options, eligibility rules, premium currency, and effective dates. Workers are enrolled in plans via HcmBenefit.",
    module: "Human Resources – Benefits Management",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-benefits-plans-setup",
    fields: [
      { name: "PlanId", type: "String(20)", note: "PK; natural key for the benefit plan (e.g. 'HEALTH-PPO')" },
      { name: "Description", type: "String(60)", note: "Plan display name" },
      { name: "PlanTypeId", type: "String(20)", note: "FK → HcmBenefitType; type (Medical, Dental, Vision, 401k, etc.)" },
      { name: "StartDate", type: "Date", note: "Plan effective start date" },
      { name: "EndDate", type: "Date", note: "Plan effective end date; nullable for ongoing plans" },
      { name: "VendorAccountNum", type: "String(20)", note: "FK → VendTable; the benefit insurance/plan provider vendor" },
      { name: "Currency", type: "String(3)", note: "ISO currency code for premium calculations" },
    ],
  },

  HcmBenefit: {
    name: "HcmBenefit",
    description: "Worker's enrollment in a specific benefit plan for a given period. Records the selected coverage option, employee/employer cost amounts, enrollment status (Selected/Confirmed/Waived), and effective dates. Created during open enrollment or life events.",
    module: "Human Resources – Benefits Management",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-benefits-plans-worker",
    fields: [
      { name: "Worker", type: "Int64", note: "FK → HcmWorker.RecId; the enrolled worker" },
      { name: "PlanId", type: "String(20)", note: "FK → HcmBenefitPlan; the benefit plan the worker is enrolled in" },
      { name: "CoverageOptionId", type: "String(20)", note: "FK → HcmBenefitOption; coverage tier (Employee Only, Employee+Spouse, etc.)" },
      { name: "StartDate", type: "Date", note: "Enrollment effective start date" },
      { name: "EndDate", type: "Date", note: "Enrollment end date; nullable for open-ended enrollments" },
      { name: "Status", type: "Enum", note: "Selected / Confirmed / Waived / Cancelled" },
      { name: "LegalEntityId", type: "String(4)", note: "FK → CompanyInfo; the employing legal entity" },
    ],
  },

  HcmLeaveType: {
    name: "HcmLeaveType",
    description: "Leave type definition (e.g. Vacation/PTO, Sick Leave, FMLA, Parental Leave). Configures the category (Scheduled/Unscheduled), unit (Hours/Days), accrual earning code, approval workflow, reason code requirements, and calendar color.",
    module: "Human Resources – Leave and Absence",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-admin-integration-payroll-api-leave-type",
    fields: [
      { name: "LeaveTypeId", type: "String(20)", note: "PK; natural key (e.g. 'PTO', 'SICK', 'FMLA')" },
      { name: "Description", type: "String(60)", note: "Human-readable description" },
      { name: "Category", type: "Enum", note: "None / Scheduled / Unscheduled — affects absence management reporting" },
      { name: "ReasonCodeRequired", type: "Enum", note: "Yes = worker must supply a reason code when submitting requests" },
      { name: "LeaveAmountUnit", type: "Enum", note: "Hours or Days — unit used when entering leave amounts" },
      { name: "EarningCodeId", type: "String(10)", note: "FK → PayrollEarningCode; payroll earning code linked to this leave type; nullable" },
      { name: "WorkflowId", type: "String(20)", note: "FK → workflow definition; approval workflow for leave requests; nullable" },
    ],
  },

  HcmLeaveRequest: {
    name: "HcmLeaveRequest",
    description: "Worker leave request record. Captures a single request for time off — leave type, date, quantity, status, and any attached reason code or comment. Follows a configurable approval workflow. Status progresses: Draft → Submitted → Approved/Denied.",
    module: "Human Resources – Leave and Absence",
    docsUrl: "https://learn.microsoft.com/dynamics365/human-resources/hr-admin-integration-payroll-api-leave-request",
    fields: [
      { name: "RequestId", type: "String(36)", note: "PK; system-generated unique request identifier" },
      { name: "PersonnelNumber", type: "String(20)", note: "FK (natural key) → HcmWorker; the requesting employee" },
      { name: "LeaveTypeId", type: "String(20)", note: "FK → HcmLeaveType; the type of leave being requested" },
      { name: "LeaveDate", type: "UtcDateTime", note: "The date(s) covered by this leave request" },
      { name: "Amount", type: "Decimal", note: "Quantity of leave in units defined by HcmLeaveType.LeaveAmountUnit" },
      { name: "Status", type: "Enum", note: "Draft / Submitted / Approved / Denied / Failed / Cancelled" },
      { name: "ReasonCodeId", type: "String(20)", note: "FK → HcmReasonCode; reason for leave; required when LeaveType.ReasonCodeRequired=Yes" },
      { name: "Comment", type: "String(2000)", note: "Free-text comment from worker; nullable" },
    ],
  },

  HcmSeparation: {
    name: "HcmSeparation",
    description: "Worker termination / separation record. Formally ends employment by recording the termination date, reason code, last date worked, and re-hire eligibility. Initiates the offboarding process: ends position assignments, benefit elections, compensation, and leave accruals.",
    module: "Human Resources",
    docsUrl: "https://learn.microsoft.com/dynamics365/guidance/business-processes/hire-to-retire-onboard-terminate-employment",
    fields: [
      { name: "Worker", type: "Int64", note: "FK → HcmWorker.RecId; the worker being terminated" },
      { name: "Employment", type: "Int64", note: "FK → HcmEmployment.RecId; the specific employment period being ended" },
      { name: "SeparationDate", type: "Date", note: "Official termination / separation effective date" },
      { name: "LastDateWorked", type: "Date", note: "Last actual day the worker performed work; may differ from SeparationDate; nullable" },
      { name: "ReasonCode", type: "String(10)", note: "FK → HcmReasonCode; termination reason (Resignation, Layoff, Retirement, etc.)" },
      { name: "DataAreaId", type: "String(4)", note: "Legal entity where the employment is being terminated" },
    ],
  },

  // ── Service tables ──────────────────────────────
  SMAAgreementTable: {
    name: "SMAAgreementTable",
    description: "Service agreement header — defines the master terms, validity period, grouping rules, and project linkage for a recurring service agreement. Customer is accessed indirectly via ProjId → ProjTable.CustAccount (no direct CustAccount FK in CDM).",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/worksheetheader/smaagreementtable",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "AgreementId", type: "string", note: "Natural key / human-readable agreement identifier" },
      { name: "AgreementGroupId", type: "string", note: "FK → SMAAgreementGroup (for sorting/filtering)" },
      { name: "ProjId", type: "string", note: "FK → ProjTable – mandatory; drives customer, cost posting, and billing" },
      { name: "StartDate", type: "date", note: "Agreement validity start" },
      { name: "EndDate", type: "date", note: "Agreement validity end; nullable" },
      { name: "Suspended", type: "int32", note: "NoYes enum – if 1, no service orders can be generated from this agreement" },
      { name: "GroupBy", type: "int32", note: "Enum – controls how agreement lines are grouped into service orders (per line, task, or object)" },
      { name: "WorkerServiceResponsible", type: "string", note: "FK → HcmWorker – default responsible technician" },
      { name: "ServiceLevelAgreementId", type: "string", note: "FK → SMAServiceLevelAgreementTable; nullable" },
    ],
  },

  SMAAgreementLine: {
    name: "SMAAgreementLine",
    description: "Service agreement line — defines a specific service work item within an agreement: what is done (transaction type), how often (interval), by whom (worker), on which object, and to which project category.",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/worksheetline/smaagreementline",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "AgreementId", type: "string", note: "FK → SMAAgreementTable.AgreementId – parent header (readonly)" },
      { name: "AgreementLineNum", type: "decimal", note: "Line number within the agreement (readonly)" },
      { name: "TransactionType", type: "int32", note: "Enum – line type: Hour=0, Item=1, Expense=2, Fee=3" },
      { name: "ProjCategoryId", type: "string", note: "FK → ProjCategory – service or cost category for posting" },
      { name: "ProjId", type: "string", note: "FK → ProjTable – inherited from header (readonly)" },
      { name: "IntervalId", type: "string", note: "FK → SMAAgreementInterval – how often service orders are auto-generated; nullable" },
      { name: "ServiceObjectRelationId", type: "string", note: "FK → SMAServiceObjectRelation – which object instance is covered; nullable" },
      { name: "ServiceTaskId", type: "string", note: "FK → SMAServiceTask – work task classification; nullable" },
      { name: "Worker", type: "string", note: "FK → HcmWorker – assigned technician for this line; nullable" },
      { name: "Suspended", type: "int32", note: "NoYes – stops auto-generation of orders for this specific line" },
    ],
  },

  SMAServiceOrderTable: {
    name: "SMAServiceOrderTable",
    description: "Service order header — represents a planned or ad-hoc service visit to a customer site. Can be generated automatically from a service agreement or created manually. Tracks stage, priority, and technician assignment.",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/worksheetheader/smaserviceordertable",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "ServiceOrderId", type: "string", note: "Natural key – auto-generated order number (readonly)" },
      { name: "AgreementId", type: "string", note: "FK → SMAAgreementTable.AgreementId – nullable; null if created without an agreement" },
      { name: "CustAccount", type: "string", note: "FK → CustTable – customer being serviced" },
      { name: "ProjId", type: "string", note: "FK → ProjTable – associated project for cost/revenue posting; nullable" },
      { name: "ServiceDateTime", type: "datetime", note: "Preferred service date and time; nullable" },
      { name: "StageId", type: "string", note: "FK → SMAStageTable – workflow stage of the order (readonly)" },
      { name: "Priority", type: "int32", note: "Enum – order priority level; nullable" },
      { name: "WorkerResponsible", type: "string", note: "FK → HcmWorker – technician responsible for the order; nullable" },
      { name: "SignOff", type: "int32", note: "NoYes – whether the order has been signed off by the technician" },
    ],
  },

  SMAServiceOrderLine: {
    name: "SMAServiceOrderLine",
    description: "Service order line — individual task or activity on a service order. Each line represents hours worked, an item (spare part) consumed, an expense, or a fee. Posted to the project for billing.",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/worksheetline/smaserviceorderline",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "ServiceOrderId", type: "string", note: "FK → SMAServiceOrderTable.ServiceOrderId – parent header" },
      { name: "ServiceOrderLineNum", type: "decimal", note: "Line sequence number within the order (readonly)" },
      { name: "ProjCategoryId", type: "string", note: "FK → ProjCategory – service activity category; drives posting rules" },
      { name: "ItemId", type: "string", note: "FK → InventTable – spare part or material; nullable (only for Item-type lines)" },
      { name: "InventDimId", type: "string", note: "FK → InventDim – inventory dimensions (site, warehouse, serial) for the item; nullable" },
      { name: "ServiceObjectRelationId", type: "string", note: "FK → SMAServiceObjectRelation – the specific object instance being worked on; nullable" },
      { name: "ActivityId", type: "string", note: "FK → dispatch activity record – links to scheduling/dispatch; readonly, nullable" },
      { name: "DateExecution", type: "date", note: "Actual date the service was performed; nullable" },
      { name: "Qty", type: "decimal", note: "Quantity (hours, units, etc.)" },
      { name: "AgreementId", type: "string", note: "FK → SMAAgreementTable – originating agreement line; nullable, readonly" },
    ],
  },

  SMAServiceObjectTable: {
    name: "SMAServiceObjectTable",
    description: "Service object — the physical equipment, asset, or item that is being serviced (e.g., elevator, boiler, machine). Identified by a service object ID and optionally linked to a specific inventory item instance via InventDim (serial/batch).",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/main/smaserviceobjecttable",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "ServiceObjectId", type: "string", note: "Natural key – human-readable object identifier" },
      { name: "Description", type: "string", note: "Text description of the service object; nullable" },
      { name: "ItemId", type: "string", note: "FK → InventTable – product type/model of the asset; nullable" },
      { name: "InventDimId", type: "string", note: "FK → InventDim – identifies a specific serialized/batched unit; nullable" },
      { name: "ServiceObjectGroup", type: "string", note: "FK → SMAServiceObjectGroup – object classification group" },
      { name: "TemplateBOMId", type: "string", note: "FK → SMATemplateBOMTable – template bill of materials for the object; nullable" },
    ],
  },

  SMAServiceObjectRelation: {
    name: "SMAServiceObjectRelation",
    description: "Service object relation — associative record linking a specific service object instance (SMAServiceObjectTable) to a service agreement line, service order, or service order line. RelTableId + RelKeyId determine which document the object is attached to.",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/main/smaserviceobjectrelation",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "ServiceObjectRelationId", type: "string", note: "Natural key for this relation record" },
      { name: "ServiceObjectId", type: "string", note: "FK → SMAServiceObjectTable.ServiceObjectId – the object being related" },
      { name: "RelTableId", type: "int32", note: "AOS table ID of the related document (discriminator for polymorphic FK)" },
      { name: "RelKeyId", type: "string", note: "Natural key of the related document (agreement ID or service order ID)" },
      { name: "InventDimId", type: "string", note: "FK → InventDim – serial/batch dimension for the object instance; nullable" },
      { name: "TemplateBOMId", type: "string", note: "FK → SMATemplateBOMTable – may override the object's default template; nullable" },
      { name: "SalesId", type: "string", note: "FK → SalesTable – if object originated from a sales order; readonly, nullable" },
    ],
  },

  ResResource: {
    name: "ResResource",
    description: "Resource identifier (ResResourceIdentifier in CDM) — each record maps a schedulable resource (person or machine) to its backing WrkCtrTable entry. The RecId of this table is the 'resource ID' used across project scheduling, resource booking, and service dispatch activities.",
    module: "Project Management and Accounting / Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/miscellaneous/resresourceidentifier",
    fields: [
      { name: "RecId", type: "int64", note: "PK – the resource ID referenced by ResBooking, ResAssignment, and service dispatch" },
      { name: "RefRecId", type: "int64", note: "FK → WrkCtrTable.RecId (or HcmWorker.RecId) – the backing record; determined by RefTableId" },
      { name: "RefTableId", type: "int32", note: "AOS table ID discriminator – identifies whether backing record is WrkCtrTable (machine) or HcmWorker (person)" },
    ],
  },

  WrkCtrTable: {
    name: "WrkCtrTable",
    description: "Work center / resource — shared table used by both Production Control and Service Management. Defines a schedulable capacity unit: an individual person, machine, or resource group. Technicians appear here with IsIndividualResource=1.",
    module: "Supply Chain / Production Control / Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/salesandmarketing/main/wrkctrtable",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "Name", type: "string", note: "Display name of the resource or work center; nullable" },
      { name: "IsIndividualResource", type: "int32", note: "NoYes – 1 = individual person resource (technician), 0 = machine or group" },
      { name: "Capacity", type: "decimal", note: "Available capacity amount per period; nullable" },
      { name: "EffectivityPct", type: "decimal", note: "Efficiency percentage (e.g., 90 = 90% productive); nullable" },
      { name: "ProcessCategoryId", type: "string", note: "FK → RouteCostCategory – cost category for processing time; nullable" },
      { name: "SetUpCategoryId", type: "string", note: "FK → RouteCostCategory – cost category for setup time; nullable" },
      { name: "Exclusive", type: "int32", note: "Exclusive scheduling flag – prevents double-booking; nullable" },
    ],
  },

  SMAContractTable: {
    name: "SMAContractTable",
    description: "Service contract — header table capturing billing terms and coverage scope for a customer service contract, linked to subscriptions and service agreements. NOTE: Not published as a standalone table in the CDM schema; in D365FO SCM, service billing contracts are managed through SMASubscriptionTable (recurring) and SMAAgreementTable (project-based).",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/dynamics365/supply-chain/service-management/service-subscriptions",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "ContractId", type: "string", note: "Natural key – contract identifier" },
      { name: "CustAccount", type: "string", note: "FK → CustTable – the billing customer" },
      { name: "Name", type: "string", note: "Contract description / name" },
      { name: "ProjId", type: "string", note: "FK → ProjTable – project used for cost and revenue tracking" },
      { name: "StartDate", type: "date", note: "Contract coverage start date" },
      { name: "EndDate", type: "date", note: "Contract coverage end date; nullable" },
      { name: "Status", type: "int32", note: "Enum – Active / Suspended / Cancelled" },
    ],
  },

  SMASubscriptionTable: {
    name: "SMASubscriptionTable",
    description: "Service subscription — defines a recurring billing subscription for a customer. Stores the subscription ID, billing group, project linkage, fee category, base price, and currency. Subscription fee transactions (SMASubscriptionTrans) are created from this record for each invoicing period.",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/servicemanagement/main/smasubscriptiontable",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "SubscriptionId", type: "string", note: "Natural key – human-readable subscription identifier" },
      { name: "Name", type: "string", note: "Subscription description; nullable" },
      { name: "Active", type: "int32", note: "NoYes – active flag; nullable" },
      { name: "BasePrice", type: "decimal", note: "Base price per period; nullable" },
      { name: "CurrencyCode", type: "string", note: "FK → Currency – billing currency" },
      { name: "GroupId", type: "string", note: "FK → SMASubscriptionGroup – defines invoicing period and accrual settings" },
      { name: "ProjId", type: "string", note: "FK → ProjTable – subscription revenue posted to this project" },
      { name: "ProjCategoryId", type: "string", note: "FK → ProjCategory – fee category for subscription revenue posting" },
      { name: "StartDate", type: "date", note: "Subscription start date (readonly, computed); nullable" },
      { name: "LatestEnddate", type: "date", note: "Latest computed end date of all fee transactions (readonly); nullable" },
    ],
  },

  SMASubscriptionTrans: {
    name: "SMASubscriptionTrans",
    description: "Subscription transaction — records each fee transaction (Regular, Credit, Reduction days, Accrual) generated for a service subscription. These are the source lines proposed for invoicing; after posting, they are linked to a CustInvoiceJour record. NOTE: Physical D365FO table not published in CDM schema (CDM Transaction folder contains only SMAAccruePeriodLine and related tables).",
    module: "Service Management",
    docsUrl: "https://learn.microsoft.com/dynamics365/supply-chain/service-management/create-subscription-fee-transactions",
    fields: [
      { name: "RecId", type: "int64", note: "PK – surrogate key" },
      { name: "SubscriptionId", type: "string", note: "FK → SMASubscriptionTable – parent subscription" },
      { name: "TransactionType", type: "int32", note: "Enum – Regular=1, CreditNote=2, ReductionDays=3, Accrual=4" },
      { name: "PeriodFrom", type: "date", note: "Start of the fee coverage period" },
      { name: "PeriodTo", type: "date", note: "End of the fee coverage period" },
      { name: "Amount", type: "decimal", note: "Transaction fee amount in subscription currency" },
      { name: "CurrencyCode", type: "string", note: "FK → Currency – transaction currency" },
      { name: "InvoiceId", type: "string", note: "FK → CustInvoiceJour – populated after the fee transaction is invoiced; nullable" },
      { name: "Status", type: "int32", note: "Enum – Open / Invoiced / Cancelled" },
    ],
  },

  // ── PTP tables ──────────────────────────────
  ReqTrans: {
    name: "ReqTrans",
    description: "Net requirements / planned orders generated by master planning. Each row represents one planned production, purchase, or transfer order created or updated during a plan run. CDM display name: 'Net requirements'.",
    module: "SupplyChain / MasterPlanning / Transaction",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/masterplanning/transaction/reqtrans",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "ItemId", type: "string", note: "" },
      { name: "PlanVersion", type: "int64", note: "" },
      { name: "ReqDate", type: "date", note: "" },
      { name: "QtySched", type: "decimal", note: "" },
      { name: "ActionType", type: "int32", note: "" },
      { name: "ActionDate", type: "date", note: "" },
      { name: "FuturesDays", type: "decimal", note: "" },
      { name: "ItemBomId", type: "string", note: "" },
      { name: "ItemRouteId", type: "string", note: "" },
      { name: "CovInventDimId", type: "string", note: "" },
      { name: "OpenStatus", type: "int32", note: "" },
      { name: "ActionDays", type: "decimal", note: "" },
      { name: "Level", type: "int32", note: "" },
    ],
  },

  ReqPlanSched: {
    name: "ReqPlanSched",
    description: "Master plan schedule definition — each record configures one named master plan (scheduling method, time fences, margins, etc.). A plan run reads this record and generates ReqTrans rows. CDM display name: 'Master plan setup'.",
    module: "SupplyChain / MasterPlanning / Group",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/masterplanning/group/reqplansched",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "ReqPlanIdSched", type: "string", note: "" },
      { name: "Name", type: "string", note: "" },
      { name: "CovSchedMethod", type: "int32", note: "" },
      { name: "TimeFenceAction", type: "int32", note: "" },
      { name: "FuturesSched", type: "int32", note: "" },
      { name: "IncludeRequisitions", type: "int32", note: "" },
      { name: "IncludePlannedIntercompanyDemand", type: "int32", note: "" },
      { name: "IssueMargin", type: "decimal", note: "" },
      { name: "ReceiptMargin", type: "decimal", note: "" },
      { name: "OrderingMargin", type: "decimal", note: "" },
      { name: "BottleneckScheduling", type: "int32", note: "" },
    ],
  },

  InventForecastTable: {
    name: "InventForecastTable",
    description: "Demand forecast entry lines — stores per-item, per-period sales/demand forecast quantities used as input to master planning. In D365FO the underlying AOT table is ForecastSales; CDM exposes it as 'Demand forecast' (ForecastSales). A parallel table ForecastInvent holds the derived inventory forecast balance view.",
    module: "SupplyChain / MasterPlanning / WorksheetLine",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/masterplanning/worksheetline/forecastsales",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "ItemId", type: "string", note: "" },
      { name: "DateBudget", type: "date", note: "" },
      { name: "ModelId", type: "string", note: "" },
      { name: "Qty", type: "decimal", note: "" },
      { name: "CustAccountId", type: "string", note: "" },
      { name: "CustGroupId", type: "string", note: "" },
      { name: "InventDimId", type: "string", note: "" },
      { name: "ItemBOMId", type: "string", note: "" },
      { name: "ItemRouteId", type: "string", note: "" },
      { name: "AllocateMethod", type: "int32", note: "" },
      { name: "Active", type: "int32", note: "" },
    ],
  },

  BOMTable: {
    name: "BOMTable",
    description: "Bill of materials header — defines a named BOM that lists component materials. A BOM must be approved and linked to items via BOMVersion before it can be used in production. CDM display name: 'Bills of materials'.",
    module: "SupplyChain / ProductInformationManagement / Main",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productinformationmanagement/main/bomtable",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "BOMId", type: "string", note: "" },
      { name: "Name", type: "string", note: "" },
      { name: "Approved", type: "int32", note: "" },
      { name: "Approver", type: "int64", note: "" },
      { name: "CheckBOM", type: "int32", note: "" },
      { name: "ItemGroupId", type: "string", note: "" },
      { name: "SiteId", type: "string", note: "" },
      { name: "PmfBOMFormula", type: "int32", note: "" },
    ],
  },

  BOMVersion: {
    name: "BOMVersion",
    description: "BOM version — links a finished/semi-finished item (InventTable) to a BOM header (BOMTable) with a date-effective, site-specific, quantity-range activation record. Only the active approved version is used during production order creation and cost calculation. CDM display name: 'BOM versions'.",
    module: "SupplyChain / ProductInformationManagement / Main",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productinformationmanagement/main/bomversion",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "BOMId", type: "string", note: "" },
      { name: "ItemId", type: "string", note: "" },
      { name: "Active", type: "int32", note: "" },
      { name: "Approved", type: "int32", note: "" },
      { name: "FromDate", type: "date", note: "" },
      { name: "ToDate", type: "date", note: "" },
      { name: "SiteId", type: "string", note: "" },
      { name: "InventDimId", type: "string", note: "" },
    ],
  },

  RouteTable: {
    name: "RouteTable",
    description: "Production route header — defines a named route that groups a sequence of operations. Route versions (RouteVersion) link items to routes; RouteOpr records define each operation's properties within a route. CDM display name: 'Routes'.",
    module: "SupplyChain / ProductionControl / Main",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/main/routetable",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "RouteId", type: "string", note: "" },
      { name: "Name", type: "string", note: "" },
      { name: "Approved", type: "int32", note: "" },
      { name: "Approver", type: "int64", note: "" },
      { name: "CheckRoute", type: "int32", note: "" },
      { name: "ItemGroupId", type: "string", note: "" },
    ],
  },

  RouteOpr: {
    name: "RouteOpr",
    description: "Operation relation — stores the operational properties (times, cost categories, work center assignments) for an operation (RouteOprTable) as it appears within a specific route (RouteTable) or for a specific item. Supports three relation scopes: All routes, Specific route, Specific item+route. CDM display name: 'Operation relation'.",
    module: "SupplyChain / ProductionControl / Main",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/main/routeopr",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "OprId", type: "string", note: "" },
      { name: "RouteCode", type: "int32", note: "" },
      { name: "RouteRelation", type: "string", note: "" },
      { name: "ItemCode", type: "int32", note: "" },
      { name: "ItemRelation", type: "string", note: "" },
      { name: "SetupTime", type: "decimal", note: "" },
      { name: "ProcessTime", type: "decimal", note: "" },
      { name: "ProcessPerQty", type: "decimal", note: "" },
      { name: "SetUpCategoryId", type: "string", note: "" },
      { name: "ProcessCategoryId", type: "string", note: "" },
      { name: "RouteGroupId", type: "string", note: "" },
      { name: "QueueTimeBefore", type: "decimal", note: "" },
      { name: "QueueTimeAfter", type: "decimal", note: "" },
    ],
  },

  ProdTable: {
    name: "ProdTable",
    description: "Production order header — the master record for a discrete production order. Tracks status, quantities, BOM/route assignments, scheduling dates, and links to the item being produced. CDM display name: 'Production orders'.",
    module: "SupplyChain / ProductionControl / WorksheetHeader",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/worksheetheader/prodtable",
    fields: [
      { name: "ProdId", type: "string", note: "" },
      { name: "ItemId", type: "string", note: "" },
      { name: "BOMId", type: "string", note: "" },
      { name: "BOMDate", type: "date", note: "" },
      { name: "DlvDate", type: "date", note: "" },
      { name: "InventDimId", type: "string", note: "" },
      { name: "Name", type: "string", note: "" },
      { name: "ProdStatus", type: "int32", note: "" },
      { name: "ProdGroupId", type: "string", note: "" },
      { name: "ProdType", type: "int32", note: "" },
      { name: "QtySched", type: "decimal", note: "" },
      { name: "FinishedDate", type: "date", note: "" },
    ],
  },

  ProdBOM: {
    name: "ProdBOM",
    description: "Production BOM line — component material requirements for a specific production order. Derived from the BOM version at order creation; each line represents one component (item) to be consumed. CDM display name: 'Production BOM'.",
    module: "SupplyChain / ProductionControl / WorksheetLine",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/worksheetline/prodbom",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "ProdId", type: "string", note: "" },
      { name: "ItemId", type: "string", note: "" },
      { name: "BOMId", type: "string", note: "" },
      { name: "BOMConsump", type: "int32", note: "" },
      { name: "QtyBOM", type: "decimal", note: "" },
      { name: "QtyCalc", type: "decimal", note: "" },
      { name: "QtyReal", type: "decimal", note: "" },
      { name: "InventDimId", type: "string", note: "" },
      { name: "LineNum", type: "decimal", note: "" },
    ],
  },

  ProdRoute: {
    name: "ProdRoute",
    description: "Production route line — the operations to be performed for a specific production order. Derived from the route version at order creation. Tracks scheduled and actual times per operation. CDM display name: 'Production route'.",
    module: "SupplyChain / ProductionControl / WorksheetLine",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/worksheetline/prodroute",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "ProdId", type: "string", note: "" },
      { name: "OprNum", type: "int32", note: "" },
      { name: "WrkCtrId", type: "string", note: "" },
      { name: "SetUpCategoryId", type: "string", note: "" },
      { name: "CalcSetUp", type: "decimal", note: "" },
      { name: "CalcProc", type: "decimal", note: "" },
      { name: "CalcQty", type: "decimal", note: "" },
      { name: "ErrorPct", type: "decimal", note: "" },
      { name: "ExecutedProcess", type: "decimal", note: "" },
    ],
  },

  ProdJournalTable: {
    name: "ProdJournalTable",
    description: "Production journal header — represents one unposted or posted journal for a production order. Journal types include picking list (BOM consumption), route card (operation time), and report-as-finished (RAF). CDM display name: 'Production journal table'.",
    module: "SupplyChain / ProductionControl / WorksheetHeader",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/worksheetheader/prodjournaltable",
    fields: [
      { name: "JournalId", type: "string", note: "" },
      { name: "JournalNameId", type: "string", note: "" },
      { name: "Description", type: "string", note: "" },
      { name: "ProdId", type: "string", note: "" },
      { name: "Posted", type: "int32", note: "" },
      { name: "DrawNegative", type: "int32", note: "" },
      { name: "JournalNameIdPickList", type: "string", note: "" },
      { name: "JournalNameIdReportFinish", type: "string", note: "" },
      { name: "AutoReportFinished", type: "int32", note: "" },
      { name: "EndJob", type: "int32", note: "" },
    ],
  },

  ProdJournalTrans: {
    name: "ProdJournalTrans",
    description: "Production journal lines — individual transaction lines within a production journal. In D365FO the physical tables are split by journal subtype: ProdJournalBOM (picking list), ProdJournalRoute (route card), and ProdJournalProd (report-as-finished). The CDM represents ProdJournalProd as 'Production journal transactions'. The docsUrl points to the ProdJournalProd CDM page (RAF lines).",
    module: "SupplyChain / ProductionControl / WorksheetLine",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/worksheetline/prodjournalprod",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "JournalId", type: "string", note: "" },
      { name: "ProdId", type: "string", note: "" },
      { name: "ItemId", type: "string", note: "" },
      { name: "QtyGood", type: "decimal", note: "" },
      { name: "QtyError", type: "decimal", note: "" },
      { name: "TransDate", type: "date", note: "" },
      { name: "LineNum", type: "decimal", note: "" },
    ],
  },

  ProdRouteJob: {
    name: "ProdRouteJob",
    description: "Scheduled production job — each operation on a production order is broken into one or more jobs (setup, process, queue, transport) during job scheduling. Stores scheduled start/end date-times and execution status. CDM display name: 'Route jobs'.",
    module: "SupplyChain / ProductionControl / WorksheetLine",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/worksheetline/prodroutejob",
    fields: [
      { name: "JobId", type: "string", note: "" },
      { name: "ProdId", type: "string", note: "" },
      { name: "OprNum", type: "int32", note: "" },
      { name: "WrkCtrId", type: "string", note: "" },
      { name: "JobType", type: "int32", note: "" },
      { name: "JobStatus", type: "int32", note: "" },
      { name: "FromDate", type: "date", note: "" },
      { name: "FromTime", type: "int32", note: "" },
      { name: "CalcTimeHours", type: "decimal", note: "" },
      { name: "ExecutedPct", type: "decimal", note: "" },
      { name: "JobFinished", type: "int32", note: "" },
    ],
  },

  ProdCalcTrans: {
    name: "ProdCalcTrans",
    description: "Production cost calculation transaction — stores the itemized cost estimate or actual cost lines for a production order, broken down by cost component (material, operation, overhead). Generated during Estimate and Costing steps. CDM display name: 'Calculation'.",
    module: "SupplyChain / ProductionControl / Transaction",
    docsUrl: "https://learn.microsoft.com/common-data-model/schema/core/operationscommon/tables/supplychain/productioncontrol/transaction/prodcalctrans",
    fields: [
      { name: "RecId", type: "int64", note: "" },
      { name: "CollectRefProdId", type: "string", note: "" },
      { name: "CalcType", type: "int32", note: "" },
      { name: "CostAmount", type: "decimal", note: "" },
      { name: "CostGroupId", type: "string", note: "" },
      { name: "ConsumpConstant", type: "decimal", note: "" },
      { name: "ConsumpVariable", type: "decimal", note: "" },
      { name: "OprId", type: "string", note: "" },
      { name: "OprNum", type: "int32", note: "" },
      { name: "Qty", type: "decimal", note: "" },
      { name: "InventDimId", type: "string", note: "" },
    ],
  },

  // ── PROJ tables ──────────────────────────────
  ProjTable: {
    name: "ProjTable",
    description: "Master project record — the header for all project transactions, forecasts, and billing. Every posted transaction references ProjId. In D365FO, 'project' is the operational unit that drives cost, revenue, and WIP.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/main/projtable",
    fields: [
      { name: "ProjId", type: "string", note: "Natural key — unique project identifier within company" },
      { name: "Name", type: "string", note: "Descriptive project name" },
      { name: "ProjGroupId", type: "string", note: "FK → ProjGroup; drives all GL posting behaviour" },
      { name: "ProjInvoiceProjId", type: "string", note: "FK → ProjInvoiceTable (billing contract); projects billed under the same invoice project share one contract" },
      { name: "WorkerResponsible", type: "int64", note: "FK → HcmWorker; project manager responsible for delivery" },
      { name: "Status", type: "int32", note: "Enum: 1=InProcess, 2=Finished, 3=Postponed — controls whether new transactions can be posted" },
      { name: "StartDate", type: "date", note: "Planned project start date" },
      { name: "EndDate", type: "date", note: "Planned project end / completion date" },
    ],
  },

  ProjGroup: {
    name: "ProjGroup",
    description: "Project group — a configuration master that determines how transactions are posted to the general ledger (P&L vs WIP balance sheet), revenue accrual method, and matching principle for fixed-price projects.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/group/projgroup",
    fields: [
      { name: "ProjGroupId", type: "string", note: "Natural key — project group identifier" },
      { name: "Name", type: "string", note: "Display name for the group" },
      { name: "LedgerPosting", type: "int32", note: "Enum: controls whether cost posts to P&L (No WIP) or balance sheet (WIP)" },
      { name: "MatchingPrincip", type: "int32", note: "Fixed-price revenue recognition method: Completed contract, Percentage completion, etc." },
      { name: "EmplTransCost", type: "int32", note: "Hour transaction posting behaviour (Cost account)" },
      { name: "CostTransTurnover", type: "int32", note: "Flag: accrue revenue on expense transactions" },
      { name: "RevenueTransTurnover", type: "int32", note: "Flag: accrue revenue on fee/revenue transactions" },
      { name: "AccruedCostCategoryId", type: "string", note: "FK → ProjCategory; default category for accrued-loss adjustments" },
    ],
  },

  ProjFundingSource: {
    name: "ProjFundingSource",
    description: "Funding source linked to a project billing contract — identifies who (customer, grant, organisation) funds the project and at what percentage/priority. One contract can have multiple funding sources, each with allocation rules and limits.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/main/projfundingsource",
    fields: [
      { name: "FundingSourceId", type: "string", note: "Natural key — funding source identifier within the contract" },
      { name: "ContractId", type: "string", note: "FK → ProjInvoiceTable.ProjInvoiceId (the billing contract)" },
      { name: "CustAccount", type: "string", note: "FK → CustTable; customer account if FundingType = Customer" },
      { name: "FundingType", type: "int32", note: "Enum: Customer, Grant, Organisation" },
      { name: "Party", type: "int64", note: "FK → DirPartyTable; generic party link for non-customer funders" },
      { name: "PaymentTermsId", type: "string", note: "Payment terms applied to this funding source's invoices" },
      { name: "PostingProfile", type: "string", note: "Customer posting profile override for this funding source" },
    ],
  },

  ProjContract: {
    name: "ProjContract",
    description: "Project billing contract (called 'Invoice project' in the D365FO UI; CDM entity name ProjInvoiceTable) — the sales-side contract that governs how one or more projects are invoiced. Defines payment terms, invoice format, currency, and is the parent of ProjFundingSource records. ProjTable.ProjInvoiceProjId is the FK into this table.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/main/projinvoicetable",
    fields: [
      { name: "ProjInvoiceId", type: "string", note: "Natural key — billing contract ID (referenced as ContractId by ProjFundingSource)" },
      { name: "Name", type: "string", note: "Invoicing name / contract description" },
      { name: "CurrencyId", type: "string", note: "Invoicing currency for this contract" },
      { name: "Payment", type: "string", note: "FK → PaymTerms; payment terms applied to all invoices under this contract" },
      { name: "NumberSequenceGroupId", type: "string", note: "Number sequence group controlling invoice numbering" },
      { name: "PSAProgressInvoicing", type: "int32", note: "Flag: enables progress invoicing (partial billing) for fixed-price" },
      { name: "PSARetainPercent", type: "decimal", note: "Customer retention / holdback percentage deducted from invoices" },
    ],
  },

  ProjWBSActivity: {
    name: "ProjWBSActivity",
    description: "Work breakdown structure activity — represents a task node in the project plan hierarchy. Stores scheduling, effort estimates, and resource assignments. Parent–child relationships form the WBS tree; estimate lines (ProjWBSActivityEstimatesEntity) attach hour/expense forecasts to each activity.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/entities/professionalservices/projectmanagementandaccounting/projwbsactivityestimatesentity",
    fields: [
      { name: "ActivityNumber", type: "string", note: "Natural key — unique activity/task identifier within the project" },
      { name: "ProjId", type: "string", note: "FK → ProjTable; the owning project" },
      { name: "Name", type: "string", note: "Activity name / task title" },
      { name: "ParentActivityNumber", type: "string", note: "FK → ProjWBSActivity.ActivityNumber (null = root node); defines tree hierarchy" },
      { name: "ScheduledStartDate", type: "date", note: "Planned start date of the activity" },
      { name: "ScheduledEndDate", type: "date", note: "Planned end date / completion date" },
      { name: "EstimatedEffort", type: "decimal", note: "Planned effort in hours for this task node" },
    ],
  },

  ProjEmplTrans: {
    name: "ProjEmplTrans",
    description: "Posted employee (hour) transaction on a project — the subledger record created when an hour journal is posted. Each row represents one resource's time charged to a project for a given date, category, and line property. Drives cost and optionally accrued revenue.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projempltrans",
    fields: [
      { name: "TransId", type: "string", note: "Natural key — unique transaction ID assigned at posting" },
      { name: "ProjId", type: "string", note: "FK → ProjTable; the project charged" },
      { name: "Worker", type: "int64", note: "FK → HcmWorker; the employee or contractor who logged the hours" },
      { name: "CategoryId", type: "string", note: "FK → ProjCategory; work category (e.g. Development, Consulting)" },
      { name: "TransDate", type: "date", note: "Date the hours were worked / posted" },
      { name: "TotalCostAmountCur", type: "decimal", note: "Total cost amount in transaction currency (hours × cost price)" },
      { name: "TotalSalesAmountCur", type: "decimal", note: "Total sales/revenue amount in transaction currency" },
      { name: "VoucherJournal", type: "string", note: "GL voucher number; links to LedgerTrans for the accounting entries" },
    ],
  },

  ProjItemTrans: {
    name: "ProjItemTrans",
    description: "Posted item (material) transaction on a project — subledger record created when an item journal, packing slip, or purchase invoice is posted against a project. Captures quantity, cost, and optionally sales amount for material consumption.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projitemtrans",
    fields: [
      { name: "ProjTransId", type: "string", note: "Natural key — unique transaction ID" },
      { name: "ProjId", type: "string", note: "FK → ProjTable; project the material was consumed against" },
      { name: "ItemId", type: "string", note: "FK → InventTable; the inventory item consumed" },
      { name: "CategoryId", type: "string", note: "FK → ProjCategory; project category for the item line" },
      { name: "TransDate", type: "date", note: "Date of the material transaction" },
      { name: "Qty", type: "decimal", note: "Quantity consumed" },
      { name: "TotalCostAmountCur", type: "decimal", note: "Total cost in transaction currency" },
      { name: "TotalSalesAmountCur", type: "decimal", note: "Total sales amount in transaction currency (for T&M billing)" },
    ],
  },

  ProjCostTrans: {
    name: "ProjCostTrans",
    description: "Posted expense/cost transaction on a project — subledger record created when an expense journal or fee journal is posted. Represents non-labour direct costs such as travel, accommodation, or subcontractor charges.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projcosttrans",
    fields: [
      { name: "TransId", type: "string", note: "Natural key — unique transaction ID" },
      { name: "ProjId", type: "string", note: "FK → ProjTable; the project charged" },
      { name: "CategoryId", type: "string", note: "FK → ProjCategory; expense category (e.g. Travel, Entertainment)" },
      { name: "Worker", type: "int64", note: "FK → HcmWorker; employee who incurred the expense (nullable)" },
      { name: "TransDate", type: "date", note: "Date the expense was posted" },
      { name: "TotalCostAmountCur", type: "decimal", note: "Total cost in transaction currency" },
      { name: "TotalSalesAmountCur", type: "decimal", note: "Billable amount in transaction currency" },
      { name: "VoucherJournal", type: "string", note: "GL voucher number linking to LedgerTrans" },
    ],
  },

  ProjCategory: {
    name: "ProjCategory",
    description: "Project category — shared lookup that classifies project transactions by type (Hour, Expense, Item, Fee). The combination of category + project group + line property determines which GL accounts are used for cost, WIP, and revenue postings.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/group/projcategory",
    fields: [
      { name: "CategoryId", type: "string", note: "Natural key — category identifier (e.g. 'TRAVEL', 'DEV-HOURS')" },
      { name: "Name", type: "string", note: "Display name of the category" },
      { name: "CategoryGroupId", type: "string", note: "FK → ProjCategoryGroup; groups categories for reporting and posting rules" },
      { name: "CategoryType", type: "int32", note: "Enum (read-only): Hours=1, Expense=2, Item=3, Fee=4 — derived from ProjCategoryGroup" },
      { name: "Active", type: "int32", note: "Flag: 1=Active (available for transaction entry), 0=Inactive" },
      { name: "ProjCategoryEmplOption", type: "int32", note: "Controls worker-category relationship: None, Worker must have category assignment, etc." },
      { name: "TaxItemGroupId", type: "string", note: "Default item sales-tax group applied to transactions in this category" },
    ],
  },

  ProjInvoiceTable: {
    name: "ProjInvoiceTable",
    description: "Posted project invoice journal header (CDM: ProjInvoiceJour) — the final customer-facing invoice document created after posting an invoice proposal. One ProjInvoiceJour record per invoice number; child lines are in per-type tables (ProjInvoiceEmpl, ProjInvoiceItem, ProjInvoiceCost, ProjInvoiceRevenue).",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projinvoicejour",
    fields: [
      { name: "ProjInvoiceId", type: "string", note: "Natural key — posted invoice number" },
      { name: "ProjInvoiceProjId", type: "string", note: "FK → ProjInvoiceTable (billing contract) under which this invoice was created" },
      { name: "InvoiceAmount", type: "decimal", note: "Total invoiced amount in transaction currency" },
      { name: "CurrencyId", type: "string", note: "Invoice currency" },
      { name: "OrderAccount", type: "string", note: "Customer account (FK → CustTable) billed on this invoice" },
      { name: "CostValue", type: "decimal", note: "Total cost component for profitability reporting" },
      { name: "CashDiscCode", type: "string", note: "Cash discount code if applicable" },
    ],
  },

  ProjInvoiceTrans: {
    name: "ProjInvoiceTrans",
    description: "Project invoice line — in D365FO, invoice lines are stored in per-type tables (ProjInvoiceEmpl for hours, ProjInvoiceItem for materials, ProjInvoiceCost for expenses, ProjInvoiceRevenue for fees, ProjInvoiceOnAcc for on-account). Each line traces back to the originating subledger transaction (e.g. ProjEmplTrans for hour lines).",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projinvoiceitem",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ProjInvoiceId", type: "string", note: "FK → ProjInvoiceJour (the parent posted invoice journal)" },
      { name: "ProjId", type: "string", note: "FK → ProjTable; project the line relates to" },
      { name: "CategoryId", type: "string", note: "FK → ProjCategory; category of the invoiced work" },
      { name: "TransDate", type: "date", note: "Date of the underlying transaction being invoiced" },
      { name: "SalesAmount", type: "decimal", note: "Invoice line amount (sales price × quantity)" },
      { name: "OrigTransId", type: "string", note: "FK → ProjEmplTrans.TransId (or equivalent); traces invoice line to source transaction" },
    ],
  },

  ProjOnAccTrans: {
    name: "ProjOnAccTrans",
    description: "On-account (billing milestone) transaction — a pre-billing record entered against a project contract to capture fixed-amount milestones before actual transactions accrue. Milestone lines are included in invoice proposals and result in on-account invoice lines. Tracks completion status and supports fixed-price progress billing.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projonacctrans",
    fields: [
      { name: "RecId", type: "int64", note: "Surrogate PK" },
      { name: "ProjID", type: "string", note: "FK → ProjTable; the project the milestone belongs to" },
      { name: "ActivityNumber", type: "string", note: "FK → ProjWBSActivity (optional); WBS task the milestone aligns to" },
      { name: "Description", type: "string", note: "Milestone description shown on the invoice" },
      { name: "TotalSalesAmountCur", type: "decimal", note: "Billable amount for this milestone in transaction currency" },
      { name: "TransDate", type: "date", note: "Milestone billing date" },
      { name: "IsMilestoneComplete", type: "int32", note: "Flag: 1=milestone marked complete and ready to invoice" },
      { name: "CurrencyId", type: "string", note: "Currency of the on-account amount" },
    ],
  },

  ProjRevenueTrans: {
    name: "ProjRevenueTrans",
    description: "Accrued revenue transaction — posted by the revenue recognition (estimate) process for fixed-price projects. Each row represents a revenue accrual entry that debits WIP-Revenue and credits Accrued Revenue. Reversed when the project is eventually invoiced or completed. CDM display name is 'Fee in Transaction'.",
    module: "Project Management and Accounting",
    docsUrl: "https://learn.microsoft.com/en-us/common-data-model/schema/core/operationscommon/tables/professionalservices/projectmanagementandaccounting/transaction/projrevenuetrans",
    fields: [
      { name: "TransId", type: "string", note: "Natural key — unique accrual transaction ID" },
      { name: "ProjId", type: "string", note: "FK → ProjTable; the fixed-price project being recognised" },
      { name: "CategoryId", type: "string", note: "FK → ProjCategory; revenue category driving the posting accounts" },
      { name: "TransDate", type: "date", note: "Date the revenue accrual was recognised" },
      { name: "TotalSalesAmountCur", type: "decimal", note: "Revenue amount accrued in transaction currency" },
      { name: "VoucherJournal", type: "string", note: "GL voucher; links to LedgerTrans for the WIP-Revenue accounting entry" },
      { name: "IsCorrection", type: "int32", note: "Flag: 1=this row is a reversal/correction of a prior accrual" },
      { name: "LinePropertyId", type: "string", note: "FK → ProjLineProperty; controls whether line is chargeable and accrues revenue" },
    ],
  },

}