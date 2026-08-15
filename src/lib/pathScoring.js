/**
 * Semantic edge scoring for the Table Path Finder ("most unique" ranking).
 *
 * Self-contained on purpose: this module has NO imports and depends only on
 * its arguments, so the identical weights and curated lists can be ported
 * verbatim to the FnO MCP server (fno-dev-copilot-spike, `trace_relation_path`)
 * or any other consumer. If you change a weight or a list here, port the same
 * change there.
 *
 * Model (user-approved 2026-08-14): a path's score is the sum of per-edge
 * weights, higher = more meaningful. Source of truth for fields: the `via`
 * triples in static/data/fk-map.json ([child, parentField, childField]) and
 * the forward/reverse maps in src/lib/stores/fkMap.js.
 *
 * Each directed edge is { from, fromField, to, toField } in traversal
 * direction: `from` is the table the path is leaving, `to` is the table being
 * stepped into, and the join is `from.fromField = to.toField`.
 *
 * Per-edge weights:
 *   -3  plumbing: either join field is a system field (RecId, DataAreaId,
 *       Partition, TableId, RefTableId, DefaultDimension, LedgerDimension,
 *       Worker, LegalEntity, Party, or any *RecId ref) OR either endpoint is
 *       a pure plumbing table (Tmp* buffers, Dimension* ledger-dimension
 *       infrastructure).
 *   -1  generic reference: the stepped-into table is a generic lookup
 *       (currency, payment terms, units, address/country, tax setup, number
 *       sequences, language, data area). Curated from degree signal + D365FO
 *       knowledge; see GENERIC_TABLES below.
 *   -2  hub: stepped-into table has > 300 distinct FK neighbours.
 *   -1  hub: stepped-into table has > 100 distinct FK neighbours.
 *   +1  documented: stepped-into table has a curated tableDef entry
 *       (inverts the old tableQuality documented bonus).
 *   +2  business key: the join field on the NON-hub side (the endpoint with
 *       the lower degree; both sides on a tie) is a real business key:
 *       field name ends in Id / Num / Code (excluding RecId / DataAreaId /
 *       Partition / TableId system fields and the generic `Code` lookup
 *       field), or matches BUSINESS_KEY_FIELDS.
 */

/** System / plumbing join fields (compared case-insensitively). */
export const PLUMBING_FIELDS = new Set([
  'recid',
  'dataareaid',
  'partition',
  'tableid',
  'reftableid',
  'defaultdimension',
  'ledgerdimension',
  'worker',
  'legalentity',
  'party',
])

/**
 * Pure plumbing tables: Tmp* temp/print/analysis buffers (D365FO names them
 * Tmp*, *Tmp, or *Tmp* — every 'Tmp' occurrence in the dataset is a transient
 * buffer, so a substring match is safe), Dimension* ledger-dimension
 * infrastructure (DimensionAttributeValue, DimensionAttributeValueCombination,
 * DimensionAttributeValueSet, ...), and derived/aggregation data tables
 * (statistics buffers, OLAP/BI tables, snapshots — non-master tables that
 * exist to serve reporting, not business flows).
 */
export const PLUMBING_TABLE_PREFIXES = ['Dimension']

const DERIVED_TABLE_PATTERN = /Statistics|Totaling|Snapshot|BIAnalysis|Printout|Buffer|WorkTable|Parm|ForProcessing/

/** @param {string} table */
export function isPlumbingTable(table) {
  if (table.startsWith('Tmp') || table.includes('Tmp')) return true
  if (DERIVED_TABLE_PATTERN.test(table)) return true
  return PLUMBING_TABLE_PREFIXES.some((prefix) => table.startsWith(prefix))
}

/**
 * Generic reference tables (curated from the degree signal + D365FO
 * knowledge). These are cross-module lookup masters: joining through them
 * says nothing about the business relationship being traced.
 */
export const GENERIC_TABLES = new Set([
  'Currency',
  'PaymTerm',
  'PaymDay',
  'PaymCalendar',
  'PaymCalendarCriteriaRule',
  'CustPaymModeTable',
  'CashDisc',
  'MarkupGroup',
  'MarkupTable',
  'UnitOfMeasure',
  'UnitOfMeasureTranslation',
  'LogisticsAddressCountryRegion',
  'LogisticsAddressState',
  'LogisticsAddressCounty',
  'LogisticsAddressZipCode',
  'LogisticsPostalAddress',
  'LogisticsLocation',
  'LanguageTable',
  'TaxTable',
  'TaxGroupHeading',
  'TaxItemGroupHeading',
  'NumberSequenceTable',
  'NumberSequenceReference',
  'NumberSequenceScope',
  'DataArea',
])

/**
 * Business-key fields that do not match the Id/Num/Code suffix heuristic but
 * are real account/transaction keys in D365FO.
 */
export const BUSINESS_KEY_FIELDS = new Set([
  'CustAccount',
  'VendAccount',
  'InvoiceAccount',
  'Voucher',
])

/** Degree thresholds for the hub penalty (strictly greater). */
export const HUB_HEAVY_DEGREE = 300
export const HUB_LIGHT_DEGREE = 100

export const WEIGHTS = {
  plumbing: -3,
  generic: -1,
  hubHeavy: -2,
  hubLight: -1,
  documented: 1,
  businessKey: 2,
}

/** @param {string} field */
export function isPlumbingField(field) {
  if (PLUMBING_FIELDS.has(field.toLowerCase())) return true
  // Any RecId-style surrogate reference (RefRecId, SourceRecId, LegalEntityRecId, ...)
  return /recid$/i.test(field) || /dataareaid$/i.test(field)
}

/** @param {string} table */
export function isGenericTable(table) {
  return GENERIC_TABLES.has(table)
}

/**
 * @param {string} field
 * @returns {boolean} true if the field looks like a real business key
 */
export function isBusinessKeyField(field) {
  if (isPlumbingField(field)) return false
  if (field.toLowerCase() === 'code') return false // generic code lookup
  if (BUSINESS_KEY_FIELDS.has(field)) return true
  return /(Id|Num|Code)$/.test(field)
}

/**
 * Hub penalty for a single table's degree.
 * @param {number} degree
 * @returns {number} negative penalty (0 when not a hub)
 */
export function hubPenalty(degree) {
  if (degree > HUB_HEAVY_DEGREE) return WEIGHTS.hubHeavy
  if (degree > HUB_LIGHT_DEGREE) return WEIGHTS.hubLight
  return 0
}

/**
 * Score one directed edge. Higher = more meaningful.
 *
 * @param {{ from: string; fromField: string; to: string; toField: string }} edge
 * @param {(table: string) => number} getDegree  FK-neighbour count per table
 * @param {Set<string>} documented  table names with a curated tableDef entry
 * @returns {{ score: number; plumbing: boolean; generic: boolean }}
 */
export function scoreEdge(edge, getDegree, documented) {
  let score = 0

  // Plumbing: system join fields or pure plumbing tables on either side.
  const plumbing =
    isPlumbingField(edge.fromField) ||
    isPlumbingField(edge.toField) ||
    isPlumbingTable(edge.from) ||
    isPlumbingTable(edge.to)
  if (plumbing) score += WEIGHTS.plumbing

  // Generic reference: the stepped-into table is a cross-module lookup.
  const generic = isGenericTable(edge.to)
  if (generic) score += WEIGHTS.generic

  // Hub penalty on the stepped-into table only (the source's hub-ness is a
  // constant across all paths of one query, and intermediates are not
  // double-counted the way a both-ends rule would).
  score += hubPenalty(getDegree(edge.to))

  // Documented tables are curated and business-meaningful.
  if (documented.has(edge.to)) score += WEIGHTS.documented

  // Business key on the NON-hub side: the endpoint with the lower degree
  // (both endpoints are candidates on a tie). Never awarded when either
  // endpoint is a generic reference table — a lookup's own key (CashDiscCode,
  // PaymTermId, CurrencyCode) is not a business-flow key, so plumbing/generic
  // links through lookups can never outscore a real business key.
  const degFrom = getDegree(edge.from)
  const degTo = getDegree(edge.to)
  let businessKey = false
  if (!isGenericTable(edge.from) && !isGenericTable(edge.to)) {
    const fields =
      degFrom === degTo
        ? [edge.fromField, edge.toField]
        : degFrom < degTo
          ? [edge.fromField]
          : [edge.toField]
    businessKey = fields.some((f) => isBusinessKeyField(f))
  }
  if (businessKey) score += WEIGHTS.businessKey

  return { score, plumbing, generic }
}

/**
 * Score a full path (list of edges) and produce its breakdown.
 *
 * @param {{ from: string; fromField: string; to: string; toField: string }[]} edges
 * @param {(table: string) => number} getDegree
 * @param {Set<string>} documented
 * @returns {{ score: number; breakdown: { plumbing: number; generic: number } }}
 */
export function scorePath(edges, getDegree, documented) {
  let score = 0
  const breakdown = { plumbing: 0, generic: 0 }
  for (const edge of edges) {
    const { score: s, plumbing, generic } = scoreEdge(edge, getDegree, documented)
    score += s
    if (plumbing) breakdown.plumbing += 1
    if (generic) breakdown.generic += 1
  }
  return { score, breakdown }
}
