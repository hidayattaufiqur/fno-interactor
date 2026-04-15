import { writable } from 'svelte/store'

/**
 * Persistent state for the Table Path Finder page.
 * Lives at module level so it survives navigation (back/forward).
 */
export const findState = writable(
  /** @type {{
   *   sourceInput: string
   *   targetInput: string
   *   sourceTable: string
   *   targetTable: string
   *   maxHops: number
   *   pathResults: { steps: { table: string; via: string }[] }[]
   *   searchState: 'idle' | 'running' | 'done'
   *   searchError: string
   * }} */
  ({
    sourceInput: '',
    targetInput: '',
    sourceTable: '',
    targetTable: '',
    maxHops: 3,
    pathResults: [],
    searchState: 'idle',
    searchError: '',
  })
)
