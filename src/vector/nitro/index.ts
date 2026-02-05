import type { VectorProviderName, VectorProviderOptionsMap } from '../_providers'
import type { VectorClient, VectorProviderOptions } from '../types'
import { VectorError } from '../errors'
import { createVector } from '../index'

export interface H3EventLike {
  context?: Record<string, any>
}

export interface NitroAppLike {
  hooks?: { hook: (name: string, fn: (event: H3EventLike) => void | Promise<void>) => void }
  [key: string]: any
}

export type VectorProviderEntry = VectorProviderOptions | (() => VectorProviderOptions | Promise<VectorProviderOptions>)

export type VectorProviderEntryMap = Partial<Record<VectorProviderName, VectorProviderEntry>>

export interface VectorManagerOptions {
  providers: VectorProviderEntryMap
  defaultProvider?: VectorProviderName
  contextKey?: string
  cache?: boolean
}

export interface VectorManager {
  get: (providerName?: VectorProviderName) => Promise<VectorClient>
  close: () => Promise<void>
  providers: VectorProviderName[]
}

export interface VectorRequestContext {
  get: (providerName?: VectorProviderName) => Promise<VectorClient>
  manager: VectorManager
}

function resolveProviderName(
  providers: VectorProviderEntryMap,
  providerName?: VectorProviderName,
  defaultProvider?: VectorProviderName,
): VectorProviderName {
  if (providerName)
    return providerName
  if (defaultProvider)
    return defaultProvider
  const available = Object.keys(providers) as VectorProviderName[]
  if (available.length === 1)
    return available[0]!
  throw new VectorError('Vector provider is required. Pass { provider } or configure defaultProvider.')
}

async function resolveProviderOptions(
  providers: VectorProviderEntryMap,
  providerName: VectorProviderName,
): Promise<VectorProviderOptions> {
  const entry = providers[providerName]
  if (!entry)
    throw new VectorError(`Vector provider not configured: ${providerName}`)
  const resolved = typeof entry === 'function' ? await entry() : entry
  if (resolved && typeof resolved === 'object' && !('name' in resolved))
    return { ...(resolved as Record<string, unknown>), name: providerName } as VectorProviderOptions
  return resolved
}

function createContext(manager: VectorManager): VectorRequestContext {
  return {
    get: manager.get,
    manager,
  }
}

export function createVectorManager(options: VectorManagerOptions): VectorManager {
  const { providers, defaultProvider, cache = true } = options
  if (!providers || Object.keys(providers).length === 0)
    throw new VectorError('Vector providers are required. Pass { providers }.')

  const cacheMap = new Map<VectorProviderName, Promise<VectorClient>>()

  const get = async (providerName?: VectorProviderName): Promise<VectorClient> => {
    const resolvedName = resolveProviderName(providers, providerName, defaultProvider)
    if (cache) {
      const cached = cacheMap.get(resolvedName)
      if (cached)
        return cached
    }
    const provider = await resolveProviderOptions(providers, resolvedName)
    const promise = createVector({ provider })
    if (cache)
      cacheMap.set(resolvedName, promise)
    return promise
  }

  const close = async (): Promise<void> => {
    if (!cache)
      return
    const entries = Array.from(cacheMap.entries())
    cacheMap.clear()
    await Promise.all(entries.map(async ([, clientPromise]) => {
      try {
        const client = await clientPromise
        if (client.supports.close)
          await client.close?.()
      }
      catch {
        // ignore close failures
      }
    }))
  }

  return {
    get,
    close,
    providers: Object.keys(providers) as VectorProviderName[],
  }
}

export function vectorNitroPlugin(options: VectorManagerOptions): (nitroApp: NitroAppLike) => VectorManager {
  const manager = createVectorManager(options)
  const contextKey = options.contextKey || 'vector'
  const context = createContext(manager)

  return (nitroApp: NitroAppLike): VectorManager => {
    nitroApp.vector = context

    const attach = (event: H3EventLike): void => {
      if (!event.context)
        event.context = {}
      Object.defineProperty(event.context, contextKey, {
        configurable: true,
        get: () => context,
      })
    }

    if (nitroApp.hooks?.hook) {
      nitroApp.hooks.hook('request', attach)
      nitroApp.hooks.hook('close', async (): Promise<void> => {
        await manager.close()
      })
    }

    return manager
  }
}

export async function getVector(event: H3EventLike, providerName?: VectorProviderName, contextKey = 'vector'): Promise<VectorClient> {
  const context = event?.context?.[contextKey]
  if (!context)
    throw new VectorError(`Vector context not available. Ensure vectorNitroPlugin is installed with contextKey '${contextKey}'.`)

  if (typeof context === 'function')
    return context(providerName)

  if (typeof context.get === 'function')
    return context.get(providerName)

  if (context.manager?.get)
    return context.manager.get(providerName)

  if (context.provider)
    return context as VectorClient

  throw new VectorError('Vector context is invalid or missing get().')
}

export type { VectorProviderName, VectorProviderOptionsMap }
