import type { VectorProviderName } from '../_providers'
import type { EmbeddingConfig, VectorProviderOptions } from '../types'
import { addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export type VectorRuntimeEmbeddingConfig
  = | 'hash'
    | { name: 'hash', dimensions?: number }

export type VectorRuntimeProviderOptions = VectorProviderOptions & { embeddings?: EmbeddingConfig | VectorRuntimeEmbeddingConfig }

export type VectorRuntimeProviderMap = Partial<Record<VectorProviderName, VectorRuntimeProviderOptions>>

export interface VectorNuxtModuleOptions {
  providers?: VectorRuntimeProviderMap
  defaultProvider?: VectorProviderName
  contextKey?: string
  cache?: boolean
}

export default defineNuxtModule<VectorNuxtModuleOptions>({
  meta: {
    name: 'unagent-vector',
    configKey: 'vector',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults: {
    providers: {},
    contextKey: 'vector',
    cache: true,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.vector ||= {}
    const runtimeConfig = nuxt.options.runtimeConfig.vector as {
      providers?: VectorRuntimeProviderMap
      defaultProvider?: VectorProviderName
      contextKey?: string
      cache?: boolean
    }

    runtimeConfig.providers = {
      ...(options.providers || {}),
      ...(runtimeConfig.providers || {}),
    }

    runtimeConfig.defaultProvider ||= options.defaultProvider
    runtimeConfig.contextKey ||= options.contextKey
    if (typeof runtimeConfig.cache !== 'boolean')
      runtimeConfig.cache = options.cache

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.plugins ||= []
      nitroConfig.plugins.push(resolve('./runtime/nitro'))
    })

    addImportsDir(resolve('./runtime/composables'))
    addPlugin(resolve('./runtime/plugins/vector.server'))
  },
})
