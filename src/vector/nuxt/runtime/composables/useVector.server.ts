import type { VectorProviderName } from '../../../_providers'
import type { VectorClient } from '../../../types'
import { useRequestEvent, useRuntimeConfig } from '#imports'
import { getVector } from '../../../nitro'

export function useVector(providerName?: VectorProviderName): Promise<VectorClient> {
  const event = useRequestEvent()
  if (!event)
    throw new Error('useVector must be called during a server request.')
  const runtimeConfig = useRuntimeConfig()
  const contextKey = (runtimeConfig as any).vector?.contextKey || 'vector'
  return getVector(event, providerName, contextKey)
}
