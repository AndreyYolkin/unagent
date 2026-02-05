import type { VectorProviderName } from '../../../_providers'
import { defineNuxtPlugin, useVector } from '#imports'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      vector: (providerName?: VectorProviderName) => useVector(providerName),
    },
  }
})
