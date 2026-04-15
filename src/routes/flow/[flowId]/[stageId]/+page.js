import { flows, roles } from '$lib/data/flows.js'
import { error } from '@sveltejs/kit'

export function load({ params }) {
  const flow = flows.find((flow) => flow.id === params.flowId)
  if (!flow) throw error(404, `Flow "${params.flowId}" not found`)
  const stage = flow.stages.find((stage) => stage.id === params.stageId)
  if (!stage) throw error(404, `Stage "${params.stageId}" not found`)
  return { flow, stage, allRoles: roles }
}
