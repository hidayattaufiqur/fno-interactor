import { f as flows, t as tableDefs } from "../../../chunks/flows.js";
function load() {
  const tableIndex = {};
  for (const flow of flows) {
    for (const stage of flow.stages) {
      for (const tbl of stage.tables) {
        if (!tableIndex[tbl]) tableIndex[tbl] = [];
        tableIndex[tbl].push({
          flowId: flow.id,
          flowTitle: flow.title,
          stageId: stage.id,
          stageTitle: stage.title
        });
      }
    }
  }
  return { tableIndex, tableDefs };
}
export {
  load
};
