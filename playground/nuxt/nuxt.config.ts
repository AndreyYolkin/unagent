import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['unagent/vector/nuxt'],
  vector: {
    defaultProvider: 'sqlite-vec',
    providers: {
      'sqlite-vec': {
        name: 'sqlite-vec',
        path: 'vectors.db',
        embeddings: { name: 'hash', dimensions: 32 },
      },
    },
  },
  runtimeConfig: {
    vector: {
      providers: {
        upstash: {
          name: 'upstash',
          url: process.env.UPSTASH_VECTOR_URL,
          token: process.env.UPSTASH_VECTOR_TOKEN,
          namespace: 'unagent-playground',
        },
      },
    },
  },
})
