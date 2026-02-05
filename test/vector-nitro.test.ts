import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as vectorModule from '../src/vector/index'
import { createVectorManager, getVector, vectorNitroPlugin } from '../src/vector/nitro'

function baseClient(provider: string) {
  return {
    provider,
    supports: { remove: false, clear: false, close: true, filter: false },
    index: vi.fn(async () => ({ count: 0 })),
    search: vi.fn(async () => []),
    close: vi.fn(async () => {}),
  }
}

describe('vector nitro helpers', () => {
  const createVectorSpy = vi.spyOn(vectorModule, 'createVector')

  beforeEach(() => {
    createVectorSpy.mockImplementation(async (opts: any) => baseClient(opts.provider?.name || 'unknown'))
  })

  afterEach(() => {
    createVectorSpy.mockReset()
  })

  it('caches vector clients per provider by default', async () => {
    const manager = createVectorManager({
      providers: {
        upstash: { name: 'upstash', url: 'https://example', token: 'token' },
      },
      defaultProvider: 'upstash',
    })

    const first = await manager.get()
    const second = await manager.get('upstash')

    expect(first).toBe(second)
    expect(createVectorSpy).toHaveBeenCalledTimes(1)
  })

  it('throws for unknown providers', async () => {
    const manager = createVectorManager({
      providers: {
        upstash: { name: 'upstash', url: 'https://example', token: 'token' },
      },
      defaultProvider: 'upstash',
    })

    await expect(manager.get('sqlite-vec')).rejects.toThrow(/not configured/i)
  })

  it('closes cached clients when requested', async () => {
    const manager = createVectorManager({
      providers: {
        upstash: { name: 'upstash', url: 'https://example', token: 'token' },
      },
      defaultProvider: 'upstash',
    })

    const client = await manager.get('upstash')
    await manager.close()

    expect(client.close).toHaveBeenCalledTimes(1)
  })

  it('injects vector context into request events', async () => {
    const hooks: Record<string, any> = {
      hook: (name: string, fn: any) => {
        hooks[name] = fn
      },
    }
    const nitroApp = { hooks } as any

    vectorNitroPlugin({
      providers: {
        upstash: { name: 'upstash', url: 'https://example', token: 'token' },
      },
      defaultProvider: 'upstash',
    })(nitroApp)

    const event = { context: {} }
    await hooks.request(event)

    const client = await getVector(event as any)
    expect(client.provider).toBe('upstash')
  })
})
