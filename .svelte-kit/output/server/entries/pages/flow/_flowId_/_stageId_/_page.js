import { f as flows, p as personas } from "../../../../../chunks/flows.js";
import { error } from "@sveltejs/kit";
function load({ params }) {
  const flow = flows.find((f) => f.id === params.flowId);
  if (!flow) throw error(404, `Flow "${params.flowId}" not found`);
  const stage = flow.stages.find((s) => s.id === params.stageId);
  if (!stage) throw error(404, `Stage "${params.stageId}" not found`);
  return { flow, stage, allPersonas: personas };
}
export {
  load
};
