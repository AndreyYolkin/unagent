import type { VectorProviderName, VectorSearchOptions } from 'unagent/vector'
import { useVector } from '#imports'
import { createError, defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { provider?: VectorProviderName, query?: string, options?: VectorSearchOptions }
  if (!body?.query) {
    throw createError({ statusCode: 400, message: 'Missing query.' })
  }

  const vector = await useVector(body?.provider)
  const results = await vector.search(body.query, body.options)

  return { ok: true, results }
})
