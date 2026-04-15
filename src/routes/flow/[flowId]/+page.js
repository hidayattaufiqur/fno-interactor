import { flows } from '$lib/data/flows.js'
import { redirect, error } from '@sveltejs/kit'

export function load({ params }) {
  const flow = flows.find((f) => f.id === params.flowId)
  if (!flow) throw error(404, `Flow "${params.flowId}" not found`)
  throw redirect(302, `/flow/${params.flowId}/${flow.stages[0].id}`)
}
