import type { VectorDocument, VectorProviderName } from 'unagent/vector'
import { useVector } from '#imports'
import { createError, defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { provider?: VectorProviderName, docs?: VectorDocument[] }
  const docs = body?.docs
  if (!Array.isArray(docs)) {
    throw createError({ statusCode: 400, message: 'Missing docs array.' })
  }

  const vector = await useVector(body?.provider)
  const result = await vector.index(docs)

  return { ok: true, result }
})
