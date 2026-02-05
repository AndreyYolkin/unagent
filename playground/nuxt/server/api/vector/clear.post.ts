import type { VectorProviderName } from 'unagent/vector'
import { useVector } from '#imports'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { provider?: VectorProviderName }
  const vector = await useVector(body?.provider)
  if (!vector.supports.clear)
    return { ok: false, error: 'clear not supported by provider' }

  await vector.clear?.()
  return { ok: true }
})
