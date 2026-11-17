// Data layer. Two clearly separated backends with the same interface:
//  - "database": the Express API, which persists everything in Netlify Database (Postgres).
//  - "local":    a browser-only fallback used ONLY when the API is unreachable. Data lives in
//                localStorage and is labelled in the UI as NOT persisted to the database.
import * as engine from '../shared/engine.js'
import { countAllocations } from '../shared/stats.js'

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status })
  return data
}

const remote = {
  mode: 'database',
  status: () => request('GET', '/api/memory/status'),
  createVm: (input) => request('POST', '/api/vms', input),
  updateVm: (id, input) => request('PUT', `/api/vms/${id}`, input),
  deleteVm: (id) => request('DELETE', `/api/vms/${id}`),
  allocate: (input) => request('POST', '/api/memory/allocate', input),
  release: (input) => request('POST', '/api/memory/release', input),
  loadDemo: () => request('POST', '/api/demo/load'),
  resetDemo: () => request('POST', '/api/demo/reset'),
}

const KEY = 'vmemory-local-demo'
function localState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.vms) return saved
  } catch {}
  return engine.resetDemo().state
}
function apply(op) {
  try {
    const out = op(localState())
    localStorage.setItem(KEY, JSON.stringify(out.state))
    return Promise.resolve({ state: out.state, counts: countAllocations(out.state.history), events: out.events, persisted: false })
  } catch (err) {
    return Promise.reject(err)
  }
}

const local = {
  mode: 'local',
  status: () => apply((s) => ({ state: s, events: [] })),
  createVm: (input) => apply((s) => engine.createVm(s, input)),
  updateVm: (id, input) => apply((s) => engine.updateVm(s, id, input)),
  deleteVm: (id) => apply((s) => engine.deleteVm(s, id)),
  allocate: (input) => apply((s) => engine.allocate(s, input)),
  release: (input) => apply((s) => engine.release(s, input)),
  loadDemo: () => apply((s) => engine.loadDemo(s)),
  resetDemo: () => apply(() => engine.resetDemo()),
}

// Try the database API first; fall back to the local demo only if the API cannot be reached.
export async function connect() {
  try {
    return { backend: remote, data: await remote.status() }
  } catch (err) {
    console.warn('API unavailable, using local demo mode:', err.message)
    return { backend: local, data: await local.status() }
  }
}
