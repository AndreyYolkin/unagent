<script setup lang="ts">
import { ref } from 'vue'

const provider = ref<'sqlite-vec' | 'upstash'>('sqlite-vec')
const query = ref('hello world')
const docs = ref(`[
  { "id": "doc-1", "content": "Hello world from Nuxt playground.", "metadata": { "tag": "demo" } },
  { "id": "doc-2", "content": "Vector search lets you find similar text quickly.", "metadata": { "tag": "demo" } },
  { "id": "doc-3", "content": "sqlite-vec works locally with hash embeddings.", "metadata": { "tag": "local" } }
]`)
const options = ref(`{
  "limit": 5,
  "returnContent": true,
  "returnMetadata": true
}`)
const ids = ref('doc-1,doc-2')
const logs = ref<{ id: string, time: string, endpoint: string, status: 'loading' | 'success' | 'error', elapsed?: number, data?: any, error?: string }[]>([])

const pushLog = (entry: typeof logs.value[number]) => {
  logs.value = [entry, ...logs.value]
}

const updateLog = (id: string, patch: Partial<typeof logs.value[number]>) => {
  logs.value = logs.value.map(item => (item.id === id ? { ...item, ...patch } : item))
}

const clearLogs = () => {
  logs.value = []
}

const call = async (endpoint: string, init?: RequestInit) => {
  const id = Math.random().toString(36).slice(2)
  const time = new Date().toLocaleTimeString()
  pushLog({ id, time, endpoint, status: 'loading' })

  try {
    const start = Date.now()
    const res = await fetch(endpoint, init)
    const data = await res.json()
    const elapsed = Date.now() - start
    updateLog(id, { status: 'success', elapsed, data })
    return data
  }
  catch (error: any) {
    updateLog(id, { status: 'error', error: error?.message || String(error) })
    return null
  }
}

const parseJson = (value: string, label: string) => {
  try {
    return value ? JSON.parse(value) : undefined
  }
  catch (error: any) {
    pushLog({
      id: Math.random().toString(36).slice(2),
      time: new Date().toLocaleTimeString(),
      endpoint: label,
      status: 'error',
      error: `Invalid JSON: ${error?.message || String(error)}`,
    })
    return null
  }
}

const vectorIndex = async () => {
  const parsedDocs = parseJson(docs.value, 'docs')
  if (parsedDocs === null)
    return
  await call('/api/vector/index', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: provider.value, docs: parsedDocs }),
  })
}

const vectorSearch = async () => {
  const parsedOptions = parseJson(options.value, 'options')
  if (parsedOptions === null)
    return
  await call('/api/vector/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: provider.value, query: query.value, options: parsedOptions }),
  })
}

const vectorRemove = async () => {
  const parsedIds = ids.value.split(',').map(val => val.trim()).filter(Boolean)
  await call('/api/vector/remove', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: provider.value, ids: parsedIds }),
  })
}

const vectorClear = async () => {
  await call('/api/vector/clear', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: provider.value }),
  })
}
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>Unagent Vector Playground (Nuxt)</h1>
      <p>Switch between Upstash and sqlite-vec using the Nuxt vector module.</p>
    </header>

    <section class="card">
      <h2>Provider</h2>
      <div class="row">
        <label class="field">
          <span>Provider</span>
          <select v-model="provider">
            <option value="sqlite-vec">sqlite-vec (local)</option>
            <option value="upstash">Upstash (cloud)</option>
          </select>
        </label>
        <button class="secondary" @click="clearLogs">clear logs</button>
      </div>
    </section>

    <section class="card">
      <h2>Vector</h2>
      <label class="field">
        <span>Query</span>
        <input v-model="query" type="text" />
      </label>

      <label class="field">
        <span>Docs (JSON)</span>
        <textarea v-model="docs" rows="6" />
      </label>

      <label class="field">
        <span>Search Options (JSON)</span>
        <textarea v-model="options" rows="4" />
      </label>

      <label class="field">
        <span>IDs (comma-separated)</span>
        <input v-model="ids" type="text" />
      </label>

      <div class="row">
        <button @click="vectorIndex">index</button>
        <button @click="vectorSearch">search</button>
        <button @click="vectorRemove">remove</button>
        <button @click="vectorClear">clear</button>
      </div>
    </section>

    <section class="card logs">
      <h2>Logs</h2>
      <div class="log-list">
        <div v-for="entry in logs" :key="entry.id" class="log-entry">
          <div class="log-header">
            <span class="time">[{{ entry.time }}]</span>
            <span class="endpoint">{{ entry.endpoint }}</span>
            <span v-if="entry.status === 'loading'">loading...</span>
            <span v-else :class="entry.status">{{ entry.status === 'error' ? 'ERROR' : `${entry.elapsed}ms` }}</span>
          </div>
          <pre v-if="entry.status === 'success'">{{ JSON.stringify(entry.data, null, 2) }}</pre>
          <pre v-else-if="entry.status === 'error'">{{ entry.error }}</pre>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');

:root {
  color-scheme: light;
}

.page {
  font-family: "Space Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.header h1 {
  margin: 0 0 0.5rem;
}

.card {
  border: 1px solid #e1e4e8;
  border-radius: 12px;
  padding: 1.5rem;
  background: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

input,
select,
textarea {
  border: 1px solid #cbd5f5;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9rem;
  background: #f8fafc;
}

button {
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.1rem;
  font-weight: 600;
  cursor: pointer;
  background: #1d4ed8;
  color: white;
}

button.secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.logs {
  padding-bottom: 0.5rem;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 50vh;
  overflow: auto;
}

.log-entry {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.75rem;
}

.log-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}

.log-header .time {
  color: #64748b;
}

.log-header .endpoint {
  font-weight: 600;
  color: #1d4ed8;
}

.log-header .error {
  color: #b91c1c;
}

.log-header .success {
  color: #15803d;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.85rem;
  background: #f1f5f9;
  padding: 0.75rem;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .page {
    padding: 1.25rem;
  }

  .row {
    flex-direction: column;
    align-items: stretch;
  }

  button {
    width: 100%;
  }
}
</style>
