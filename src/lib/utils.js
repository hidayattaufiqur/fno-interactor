/**
 * Maps the verbose CDM module strings from tableDefs to one of our 8 canonical module names.
 * These canonical names match the CSS [data-module="..."] selectors for badge colours.
 * Returns null for unmappable modules (e.g. "System Administration – Security").
 *
 * @param {string | undefined | null} raw
 * @returns {string | null}
 */
export function canonicalModule(raw) {
  if (!raw) return null
  const r = raw.toLowerCase()
  if (r.includes('sale')) return 'Sales'
  if (r.includes('procurement') || r.includes('accounts payable') || r.includes('sourcing'))
    return 'Procurement'
  // 'production' but not 'project' (to avoid 'Project Mgt and Accounting' matching)
  if (r.includes('production') && !r.includes('project')) return 'Production'
  if (
    r.includes('inventory') ||
    r.includes('warehouse') ||
    r.includes('product information') ||
    r.includes('productinformation') ||
    r.includes('master planning') ||
    r.includes('masterplanning') ||
    r.includes('supply chain') ||
    r.includes('supplychain') ||
    r.startsWith('cost management')
  )
    return 'Inventory'
  if (
    r === 'finance' ||
    r.includes('general ledger') ||
    r.includes('accounts receivable') ||
    r.includes('cash and bank') ||
    r === 'tax' ||
    r.includes('currency') ||
    r.includes('consolidation') ||
    r.includes('global address book')
  )
    return 'Finance'
  if (r.startsWith('project')) return 'Project'
  if (r.startsWith('hr') || r.includes('human resources')) return 'HR'
  if (r.includes('service')) return 'Service'
  return null
}
