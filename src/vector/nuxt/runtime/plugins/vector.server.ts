import type { VectorProviderName } from '../../../_providers'
import { defineNuxtPlugin, useVector } from '#imports'

const vectorNuxtPlugin: ReturnType<typeof defineNuxtPlugin> = defineNuxtPlugin(() => {
  return {
    provide: {
      vector: (providerName?: VectorProviderName) => useVector(providerName),
    },
  }
})

export default vectorNuxtPlugin
