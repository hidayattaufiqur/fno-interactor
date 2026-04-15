import { flows, tableDefs } from '$lib/data/flows.js'
import { error } from '@sveltejs/kit'

export function load({ params }) {
  const name = params.name

  // Verify the table actually exists in any stage (even without a full def)
  const usedIn = flows.flatMap((flow) =>
    flow.stages
      .filter((s) => s.tables.includes(name))
      .map((s) => ({ flowId: flow.id, flowTitle: flow.title, stageId: s.id, stageTitle: s.title }))
  )

  if (usedIn.length === 0 && !tableDefs[name]) {
    throw error(404, `Table "${name}" not found in any flow or table definitions.`)
  }

  // Also collect relation edges that mention this table
  const relationsUsing = flows.flatMap((flow) =>
    flow.stages.flatMap((stage) =>
      (stage.relations ?? [])
        .filter((r) => r.from === name || r.to === name)
        .map((r) => ({ ...r, flowId: flow.id, flowTitle: flow.title, stageId: stage.id, stageTitle: stage.title }))
    )
  )

  return { name, def: tableDefs[name] ?? null, usedIn, relationsUsing }
}
