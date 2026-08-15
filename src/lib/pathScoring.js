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
 *       infrastructure). Rule 1 waiver: a join is NOT plumbing when exactly
 *       one side is a system key (RecId/DataAreaId/Partition) and the other
 *       field NAME equals (or clearly names) the target table — a named
 *       RecId reference such as InventTrans.InventTransOrigin →
 *       InventTransOrigin.RecId. Anonymous joins (both sides system keys)
 *       and Tmp tables stay −3.
 *   -1  generic reference: the stepped-into table is a generic lookup
 *       (currency, payment terms, units, address/country, tax setup, number
 *       sequences, language, data area). Curated from degree signal + D365FO
 *       knowledge; see GENERIC_TABLES below.
 *   -2  hub: stepped-into table has > 300 distinct FK neighbours.
 *   -1  hub: stepped-into table has > 100 distinct FK neighbours. Rule 2
 *       waiver (Q4): the hub penalty is skipped when the edge carries a
 *       business key (a business-meaningful join through a hub, e.g.
 *       SalesLine.CustAccount → CustTable.AccountNum, is not punished for
 *       the hub's size).
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
 * Rule 1 (Q3, user-approved 2026-08-15): a join is NOT plumbing when exactly
 * one side is a system key (RecId/DataAreaId/Partition) and the other field
 * NAME equals (or clearly names) the target table — a "named RecId reference"
 * (e.g. InventTrans.InventTransOrigin → InventTransOrigin.RecId). Anonymous
 * joins (both sides system keys) and Tmp tables stay −3.
 */

/** System keys that can anchor a named reference (Rule 1 scope). */
const SYSTEM_KEYS = new Set(['recid', 'dataareaid', 'partition'])

/** Suffixes a reference field may carry after the target table name. */
const NAMED_REF_SUFFIXES = ['recid', 'refrecid', 'id', 'dataareaid']

/**
 * Localization / derived-table extensions a table name may carry after the
 * field name (compound allowed, e.g. TaxWithholdComponentGroup →
 * TaxWithholdComponentGroupTable_IN).
 */
const NAMED_TABLE_EXTENSIONS = ['_in', '_br', '_cn', '_ru', '_lt', '_psn', 'table']

/** @param {string} field */
export function isSystemKeyField(field) {
  return SYSTEM_KEYS.has(field.toLowerCase())
}

/**
 * Does `field` name `table`? True on exact match, when the field is the
 * table's key reference (table + RecId/RefRecId/Id/DataAreaId), or when the
 * table is a localized/derived variant of the field name (field + _IN/_BR/
 * _CN/_RU/_LT/_PSN/Table, compound extensions allowed).
 * @param {string} field
 * @param {string} table
 * @returns {boolean}
 */
export function fieldNamesTable(field, table) {
  const f = field.toLowerCase()
  let t = table.toLowerCase()
  if (f === t) return true
  for (const s of NAMED_REF_SUFFIXES) {
    if (f === t + s) return true
  }
  let changed = true
  while (changed) {
    changed = false
    for (const s of NAMED_TABLE_EXTENSIONS) {
      if (t.length > s.length && t.endsWith(s)) {
        t = t.slice(0, -s.length)
        changed = true
        break
      }
    }
  }
  return f === t
}

/**
 * Rule 1 (Q3): named RecId/DataAreaId/Partition reference. True when exactly
 * one join field is a system key and the other field's name equals (or
 * clearly names) the system-key side's table.
 * @param {{ from: string; fromField: string; to: string; toField: string }} edge
 * @returns {boolean}
 */
export function isNamedSystemKeyReference(edge) {
  const fromSys = isSystemKeyField(edge.fromField)
  const toSys = isSystemKeyField(edge.toField)
  if (fromSys === toSys) return false // both or neither — anonymous
  if (fromSys) return fieldNamesTable(edge.toField, edge.from)
  return fieldNamesTable(edge.fromField, edge.to)
}

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
  // Rule 1 (Q3): a join is NOT plumbing when exactly one side is a system key
  // (RecId/DataAreaId/Partition) and the other field names the target table
  // (named RecId reference, e.g. InventTrans.InventTransOrigin →
  // InventTransOrigin.RecId). Anonymous joins (both sides system keys) and
  // Tmp/plumbing tables stay −3.
  const tablePlumbing = isPlumbingTable(edge.from) || isPlumbingTable(edge.to)
  const fieldPlumbing = isPlumbingField(edge.fromField) || isPlumbingField(edge.toField)
  const namedRef = isNamedSystemKeyReference(edge)
  const plumbing = tablePlumbing || (fieldPlumbing && !namedRef)
  if (plumbing) score += WEIGHTS.plumbing

  // Generic reference: the stepped-into table is a cross-module lookup.
  const generic = isGenericTable(edge.to)
  if (generic) score += WEIGHTS.generic

  // Business key on the NON-hub side: the endpoint with the lower degree
  // (both endpoints are candidates on a tie). Never awarded when either
  // endpoint is a generic reference table — a lookup's own key (CashDiscCode,
  // PaymTermId, CurrencyCode) is not a business-flow key, so plumbing/generic
  // links through lookups can never outscore a real business key. Rule 1
  // extension: a named reference field (one that NAMES the entity it joins
  // to, e.g. InventTrans.InventTransOrigin → InventTransOrigin.RecId) is a
  // business key of that reference — it identifies a business entity by name,
  // exactly like an Id/Num/Code field, so it earns the same +2.
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
  if (!plumbing && namedRef) businessKey = true
  if (businessKey) score += WEIGHTS.businessKey

  // Hub penalty on the stepped-into table only (the source's hub-ness is a
  // constant across all paths of one query, and intermediates are not
  // double-counted the way a both-ends rule would). Rule 2 (Q4): waived when
  // the edge carries a business key — a business-meaningful join through a
  // hub (e.g. SalesLine.CustAccount → CustTable.AccountNum) should not be
  // punished for the hub's size.
  if (!businessKey) score += hubPenalty(degTo)

  // Documented tables are curated and business-meaningful.
  if (documented.has(edge.to)) score += WEIGHTS.documented

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
