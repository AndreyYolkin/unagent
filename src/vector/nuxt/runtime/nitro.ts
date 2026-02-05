import type { VectorProviderName } from '../../_providers'
import type { EmbeddingConfig, VectorProviderOptions } from '../../types'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { vectorNitroPlugin } from '../../nitro'

const DEFAULT_HASH_DIMENSIONS = 32

function hashToVector(text: string, dimensions: number): number[] {
  const vec = new Float32Array(dimensions)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    const idx = i % dimensions
    vec[idx] += (code % 31) / 31
  }
  let norm = 0
  for (let i = 0; i < vec.length; i++)
    norm += vec[i] * vec[i]
  norm = Math.sqrt(norm) || 1
  for (let i = 0; i < vec.length; i++)
    vec[i] = vec[i] / norm
  return Array.from(vec)
}

function createHashEmbedding(dimensions = DEFAULT_HASH_DIMENSIONS): EmbeddingConfig {
  return {
    async resolve() {
      return {
        dimensions,
        embedder: async (texts: string[]) => texts.map(text => hashToVector(text, dimensions)),
      }
    },
  }
}

function resolveEmbeddings(value: unknown): EmbeddingConfig | undefined {
  if (!value)
    return undefined
  if (value === 'hash')
    return createHashEmbedding()
  if (typeof value === 'object' && (value as { name?: string }).name === 'hash')
    return createHashEmbedding((value as { dimensions?: number }).dimensions)
  return value as EmbeddingConfig
}

function normalizeProviderOptions(raw: VectorProviderOptions): VectorProviderOptions {
  if (!raw || typeof raw !== 'object')
    return raw
  const copy: any = { ...raw }
  if ('embeddings' in copy)
    copy.embeddings = resolveEmbeddings(copy.embeddings)
  return copy
}

export default defineNitroPlugin((nitroApp) => {
  const runtimeConfig = useRuntimeConfig()
  const vectorConfig = (runtimeConfig as any).vector || {}
  const providersConfig = vectorConfig.providers || {}

  const providers: Partial<Record<VectorProviderName, VectorProviderOptions>> = {}
  for (const [key, value] of Object.entries(providersConfig)) {
    if (!value)
      continue
    const name = (value as { name?: string }).name || key
    providers[name as VectorProviderName] = normalizeProviderOptions(value as VectorProviderOptions)
  }

  vectorNitroPlugin({
    providers,
    defaultProvider: vectorConfig.defaultProvider as VectorProviderName | undefined,
    contextKey: vectorConfig.contextKey || 'vector',
    cache: typeof vectorConfig.cache === 'boolean' ? vectorConfig.cache : true,
  })(nitroApp)
})
