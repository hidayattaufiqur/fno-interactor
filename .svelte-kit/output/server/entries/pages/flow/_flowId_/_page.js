import { f as flows } from "../../../../chunks/flows.js";
import { error, redirect } from "@sveltejs/kit";
function load({ params }) {
  const flow = flows.find((f) => f.id === params.flowId);
  if (!flow) throw error(404, `Flow "${params.flowId}" not found`);
  throw redirect(302, `/flow/${params.flowId}/${flow.stages[0].id}`);
}
export {
  load
};
