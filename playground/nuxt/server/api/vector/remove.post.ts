import type { VectorProviderName } from 'unagent/vector'
import { useVector } from '#imports'
import { createError, defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { provider?: VectorProviderName, ids?: string[] }
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Missing ids array.' })
  }

  const vector = await useVector(body?.provider)
  if (!vector.supports.remove)
    return { ok: false, error: 'remove not supported by provider' }

  const result = await vector.remove?.(ids)
  return { ok: true, result }
})
