import { flows, tableDefs } from '$lib/data/flows.js'

export function load() {
  // Build an index: tableName → [{flow, stage}]
  /** @type {Record<string, {flowId: string, flowTitle: string, stageId: string, stageTitle: string}[]>} */
  const tableIndex = {}

  for (const flow of flows) {
    for (const stage of flow.stages) {
      for (const tbl of stage.tables) {
        if (!tableIndex[tbl]) tableIndex[tbl] = []
        tableIndex[tbl].push({
          flowId: flow.id,
          flowTitle: flow.title,
          stageId: stage.id,
          stageTitle: stage.title,
        })
      }
    }
  }

  return { tableIndex, tableDefs }
}
