/**
 * Common/xRecord inherited methods for every D365FO table.
 *
 * Source: https://learn.microsoft.com/dynamics365/fin-ops-core/dev-itpro/dev-ref/system-tables#common
 *
 * All D365FO tables inherit from the Common base table, which in turn inherits
 * from xRecord. This file documents the methods that are always available on
 * any table buffer.
 */

/** @type {Record<string, { label: string; description: string }>} */
export const METHOD_CATEGORIES = {
  crud: {
    label: 'CRUD',
    description: 'Core create, update, and delete operations on the record buffer',
  },
  validation: {
    label: 'Validation',
    description: 'Field and record validation before persisting to the database',
  },
  init: {
    label: 'Initialization',
    description: 'Set default field values and reset the record buffer',
  },
  events: {
    label: 'Events',
    description: 'Lifecycle hooks called by the framework at specific points',
  },
  dataAccess: {
    label: 'Data Access',
    description: 'Read and copy data to/from the record buffer',
  },
  utility: {
    label: 'Utility',
    description: 'Metadata, locking, security, and other helper methods',
  },
  static: {
    label: 'Static',
    description:
      'Class-level methods — not on Common itself, but a D365FO convention found on nearly every table',
  },
}

/**
 * @typedef {{
 *   name: string
 *   signature: string
 *   description: string
 *   category: keyof typeof METHOD_CATEGORIES
 *   overridable: boolean
 *   common: boolean
 * }} TableMethod
 */

/** @type {TableMethod[]} */
export const COMMON_METHODS = [
  // ── CRUD ──────────────────────────────────────────────────────────────────
  {
    name: 'insert',
    signature: 'void insert()',
    description:
      'Inserts the current record buffer into the table. Override in extensions to add pre/post-insert logic — e.g., setting audit fields or creating linked records.',
    category: 'crud',
    overridable: true,
    common: true,
  },
  {
    name: 'update',
    signature: 'void update()',
    description:
      'Updates the current record in the database. Override to run custom logic on every save, such as recalculating totals or syncing related records.',
    category: 'crud',
    overridable: true,
    common: true,
  },
  {
    name: 'delete',
    signature: 'void delete()',
    description:
      'Deletes the current record from the table. Override to add cascading delete logic or to block deletion when business rules are violated.',
    category: 'crud',
    overridable: true,
    common: true,
  },
  {
    name: 'doInsert',
    signature: 'void doInsert()',
    description:
      'Inserts the record while bypassing any override of insert(). Use when you intentionally want to skip custom insert logic (e.g., data migration).',
    category: 'crud',
    overridable: false,
    common: false,
  },
  {
    name: 'doUpdate',
    signature: 'void doUpdate()',
    description: 'Updates the record while bypassing any override of update().',
    category: 'crud',
    overridable: false,
    common: false,
  },
  {
    name: 'doDelete',
    signature: 'void doDelete()',
    description: 'Deletes the record while bypassing any override of delete().',
    category: 'crud',
    overridable: false,
    common: false,
  },

  // ── Validation ────────────────────────────────────────────────────────────
  {
    name: 'validateWrite',
    signature: 'boolean validateWrite()',
    description:
      'Called before every insert or update. Return false to prevent saving. This is the primary hook for table-level business rule validation — super().validateWrite() should always be called first.',
    category: 'validation',
    overridable: true,
    common: true,
  },
  {
    name: 'validateDelete',
    signature: 'boolean validateDelete()',
    description:
      'Called before delete. Return false to prevent deletion. Override to enforce referential integrity or business constraints.',
    category: 'validation',
    overridable: true,
    common: true,
  },
  {
    name: 'validateField',
    signature: 'boolean validateField(FieldId _fieldId)',
    description:
      'Validates a single field value when the user leaves it. Override to add field-level validation beyond EDT/enum constraints. Use fieldId2Name(_fieldId) to check which field changed.',
    category: 'validation',
    overridable: true,
    common: true,
  },
  {
    name: 'aosValidateInsert',
    signature: 'boolean aosValidateInsert()',
    description:
      'Server-side validation before insert. Runs on AOS even when client-side validation is bypassed.',
    category: 'validation',
    overridable: true,
    common: false,
  },
  {
    name: 'aosValidateUpdate',
    signature: 'boolean aosValidateUpdate()',
    description: 'Server-side validation before update.',
    category: 'validation',
    overridable: true,
    common: false,
  },
  {
    name: 'aosValidateDelete',
    signature: 'boolean aosValidateDelete()',
    description: 'Server-side validation before delete.',
    category: 'validation',
    overridable: true,
    common: false,
  },
  {
    name: 'aosValidateRead',
    signature: 'boolean aosValidateRead()',
    description: 'Server-side validation that a record is allowed to be read.',
    category: 'validation',
    overridable: true,
    common: false,
  },
  {
    name: 'doValidateDelete',
    signature: 'boolean doValidateDelete()',
    description:
      'Performs delete validation while bypassing any override of validateDelete(). Called internally by the framework.',
    category: 'validation',
    overridable: false,
    common: false,
  },
  {
    name: 'checkRecord',
    signature: 'boolean checkRecord([boolean _checkMandatory])',
    description:
      'Gets or sets whether mandatory field checking is active for this buffer.',
    category: 'validation',
    overridable: false,
    common: false,
  },
  {
    name: 'checkRestrictedDeleteActions',
    signature: 'boolean checkRestrictedDeleteActions()',
    description:
      'Checks whether the record can be deleted given restricted delete action rules defined on table relations.',
    category: 'validation',
    overridable: false,
    common: false,
  },

  // ── Initialization ────────────────────────────────────────────────────────
  {
    name: 'initValue',
    signature: 'void initValue()',
    description:
      'Initializes all fields to their default values when a new record is created. Override to set dynamic defaults — e.g., defaulting a date to today or copying values from a parent record.',
    category: 'init',
    overridable: true,
    common: true,
  },
  {
    name: 'defaultField',
    signature: 'void defaultField(FieldId _fieldId)',
    description:
      'Populates the default value for a single field. Called by the form when the user enters a field for the first time. Override to set context-sensitive defaults based on other field values.',
    category: 'init',
    overridable: true,
    common: true,
  },
  {
    name: 'defaultRow',
    signature: 'void defaultRow()',
    description:
      'Populates default values in a non-interactive (programmatic) context. Called when a record is created through code rather than through a form.',
    category: 'init',
    overridable: true,
    common: false,
  },
  {
    name: 'clear',
    signature: 'void clear()',
    description: 'Removes all rows from the table buffer, resetting it to an empty state.',
    category: 'init',
    overridable: false,
    common: false,
  },
  {
    name: 'doClear',
    signature: 'void doClear()',
    description: 'Removes all rows from the buffer bypassing any override of clear().',
    category: 'init',
    overridable: false,
    common: false,
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: 'modifiedField',
    signature: 'void modifiedField(FieldId _fieldId)',
    description:
      'Called by the form when the user changes a field value. Override to react to changes — e.g., auto-populate related fields, recalculate totals, or clear dependent fields. Always call super() first.',
    category: 'events',
    overridable: true,
    common: true,
  },
  {
    name: 'modifiedFieldValue',
    signature: 'void modifiedFieldValue(FieldId _fieldId, anytype _previousValue)',
    description:
      'Called after modifiedField with the previous value. Useful when you need both the old and new value to decide what to do.',
    category: 'events',
    overridable: true,
    common: false,
  },
  {
    name: 'postLoad',
    signature: 'void postLoad()',
    description:
      'Executed after a record is fetched from the database. Override to populate computed or display fields that are not stored in the DB.',
    category: 'events',
    overridable: true,
    common: true,
  },
  {
    name: 'canSubmitToWorkflow',
    signature: 'boolean canSubmitToWorkflow([str _workflowType])',
    description:
      'Indicates whether the current record is eligible for workflow submission. Override to add precondition checks.',
    category: 'events',
    overridable: true,
    common: false,
  },

  // ── Data Access ───────────────────────────────────────────────────────────
  {
    name: 'orig',
    signature: 'Common orig()',
    description:
      'Returns the original values of the record as they were last read from the database — before any unsaved in-memory changes. Useful in modifiedField to compare old vs. new values.',
    category: 'dataAccess',
    overridable: false,
    common: true,
  },
  {
    name: 'reread',
    signature: 'void reread()',
    description:
      'Rereads the record from the database, discarding any unsaved buffer changes. Call after another process may have changed the record.',
    category: 'dataAccess',
    overridable: false,
    common: true,
  },
  {
    name: 'data',
    signature: 'Common data([Common _common])',
    description:
      'Gets or sets an entire row in the table buffer. Used to copy data between two table buffer variables of the same type.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'getFieldValue',
    signature: 'anytype getFieldValue(str _fieldName)',
    description:
      'Gets the value of a field by its AOT field name. Useful for generic code that handles fields dynamically.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'setFieldValue',
    signature: 'void setFieldValue(str _fieldName, anytype _value)',
    description:
      'Sets a field value by its AOT field name. Useful for generic code that populates fields dynamically.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'buf2con',
    signature: 'container buf2con()',
    description:
      'Packs the full table buffer into an X++ container. Used to pass record data across tiers or store it temporarily.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'con2buf',
    signature: 'void con2buf(container _con)',
    description:
      'Unpacks a container (previously created by buf2con) back into the table buffer.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'isNewRecord',
    signature: 'boolean isNewRecord()',
    description:
      'Returns true if this record exists only in memory and has not yet been persisted (RecId is 0). Useful in validateWrite to distinguish insert from update.',
    category: 'dataAccess',
    overridable: false,
    common: true,
  },
  {
    name: 'selectForUpdate',
    signature: 'boolean selectForUpdate([boolean _forupdate])',
    description:
      'Marks the buffer to lock records for update when selected. Must be set before the select statement inside a ttsbegin/ttscommit block if you intend to call update().',
    category: 'dataAccess',
    overridable: false,
    common: true,
  },
  {
    name: 'RowCount',
    signature: 'int64 RowCount()',
    description: 'Returns the total number of rows in the table.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'selectRefRecord',
    signature: 'Common selectRefRecord(FieldId _referenceFieldId)',
    description:
      'Selects and returns the record referenced by the given FK field.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },
  {
    name: 'relatedTable',
    signature: 'Common relatedTable(str _tableName, [boolean _set])',
    description: 'Gets or sets the related buffer linked via a table relation.',
    category: 'dataAccess',
    overridable: false,
    common: false,
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  {
    name: 'caption',
    signature: 'str caption()',
    description:
      'Returns the table caption label. Override to provide a dynamic caption based on the current record values.',
    category: 'utility',
    overridable: true,
    common: false,
  },
  {
    name: 'company',
    signature: 'SelectableDataArea company([SelectableDataArea _companyId])',
    description:
      'Gets or sets the legal entity (company) associated with this buffer. Important for cross-company data access.',
    category: 'utility',
    overridable: false,
    common: true,
  },
  {
    name: 'concurrencyModel',
    signature: 'ConcurrencyModel concurrencyModel([ConcurrencyModel _model])',
    description:
      'Gets or sets the concurrency model for updates: Optimistic (default), Pessimistic, or Auto.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'disableCache',
    signature: 'boolean disableCache([boolean _disable])',
    description:
      'Disables the record cache for this buffer, forcing every select to hit the database.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'dispose',
    signature: 'void dispose()',
    description:
      'Releases any resources held by this xRecord object. Rarely called explicitly — the runtime handles cleanup.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'equal',
    signature: 'boolean equal(Common _common)',
    description:
      'Returns true if the given table buffer represents the same record (same table and same RecId).',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'getPhysicalTableName',
    signature: 'str getPhysicalTableName()',
    description:
      'Returns the physical database table name. For TempDB tables this is the instance name rather than the AOT name.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'getTableType',
    signature: 'Types getTableType()',
    description:
      'Returns the table type: Regular (permanent), InMemory (tmp), or TempDB.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'helpField',
    signature: 'str helpField(FieldId _fieldId)',
    description:
      'Returns the help text for a field. Override to provide context-sensitive help strings.',
    category: 'utility',
    overridable: true,
    common: false,
  },
  {
    name: 'hasRelatedTable',
    signature: 'boolean hasRelatedTable(str _tableName)',
    description:
      'Returns true if a FK constraint buffer for the given table is currently linked to this buffer.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'isTempDb',
    signature: 'boolean isTempDb()',
    description: 'Returns true if this is a SQL TempDB table.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'isTmp',
    signature: 'boolean isTmp()',
    description: 'Returns true if this is an in-memory (tmp) table.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'joinChild',
    signature: 'Common joinChild()',
    description: 'Returns the join child buffer of the current record.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'joinParent',
    signature: 'Common joinParent()',
    description: 'Returns the join parent buffer of the current record.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'merge',
    signature: 'void merge(Common _table)',
    description: 'Merges the current buffer with the fields from the given buffer.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'overwriteSystemfields',
    signature: 'boolean overwriteSystemfields([boolean _allow])',
    description:
      'Allows or disallows writing to system-managed fields (CreatedBy, RecId, etc.). Primarily used during data migration.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'queryTimeout',
    signature: 'int queryTimeout([int _timeout])',
    description:
      'Gets or sets the query timeout in seconds for selects on this buffer.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'readPast',
    signature: 'boolean readPast([boolean _readPast])',
    description:
      'When enabled, selects skip rows that are locked by other transactions rather than waiting.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'recordLevelSecurity',
    signature: 'boolean recordLevelSecurity([boolean _enable])',
    description: 'Gets or sets whether record-level security (RLS) is enforced for this buffer.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'renamePrimaryKey',
    signature: 'void renamePrimaryKey()',
    description:
      'Cascades a primary key rename to all FK columns in related tables. Called automatically by the framework when a natural key changes.',
    category: 'utility',
    overridable: true,
    common: false,
  },
  {
    name: 'selectLocked',
    signature: 'boolean selectLocked([boolean _selectLocked])',
    description: 'Gets or sets whether to include locked records in selects.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'selectWithRepeatableRead',
    signature: 'boolean selectWithRepeatableRead([boolean _enable])',
    description:
      'Enables repeatable read isolation for selects on this buffer, preventing phantom reads within the same transaction.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'setCrossPartition',
    signature: 'void setCrossPartition(boolean _crossPartition)',
    description: 'Enables or disables cross-partition queries for this buffer.',
    category: 'utility',
    overridable: false,
    common: false,
  },
  {
    name: 'setSQLTracing',
    signature: 'void setSQLTracing([boolean _enable])',
    description: 'Enables SQL tracing for debugging queries generated from this buffer.',
    category: 'utility',
    overridable: false,
    common: false,
  },

  // ── Static (convention, not in Common) ────────────────────────────────────
  {
    name: 'find',
    signature: 'static TableName find(KeyType _key, [boolean _forUpdate = false])',
    description:
      'Finds and returns a record by its primary key. Almost every D365FO table has a static find() method — the exact signature depends on the table (e.g., SalesTable::find(salesId), CustTable::find(accountNum)). Pass true as the second argument to select for update.',
    category: 'static',
    overridable: false,
    common: true,
  },
  {
    name: 'exist',
    signature: 'static boolean exist(KeyType _key)',
    description:
      "Checks whether a record with the given key exists without loading the full buffer. More efficient than find() when you only need a yes/no answer. Returns true if found, false otherwise.",
    category: 'static',
    overridable: false,
    common: true,
  },
  {
    name: 'findRecId',
    signature: 'static TableName findRecId(RecId _recId, [boolean _forUpdate = false])',
    description:
      'Finds a record by its RecId. Available on most tables. Useful when you have a RecId reference from a related record and need to load the full buffer.',
    category: 'static',
    overridable: false,
    common: true,
  },
]

/** Methods grouped by category — useful for rendering category sections. */
export const METHODS_BY_CATEGORY = Object.fromEntries(
  Object.keys(METHOD_CATEGORIES).map((cat) => [
    cat,
    COMMON_METHODS.filter((m) => m.category === cat),
  ])
)

/** Only the most commonly used/overridden methods — shown by default. */
export const COMMON_METHODS_HIGHLIGHT = COMMON_METHODS.filter((m) => m.common)
