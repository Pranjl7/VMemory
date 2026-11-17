// REST API for the VM memory simulator (Express on a Netlify Server).
import express from 'express'
import * as engine from '../../shared/engine.js'
import { getSnapshot, saveState } from './store.mjs'

export const config = { path: '/api/*' }

const app = express()
app.use(express.json())

// Operations run one at a time so two requests never allocate the same hole.
let queue = Promise.resolve()
const serial = (fn) => {
  const p = queue.then(fn)
  queue = p.catch(() => {})
  return p
}

function fail(res, err) {
  if (err instanceof engine.EngineError) return res.status(400).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Database operation failed.' })
}

// Load state from the database, apply an engine operation, persist it, and return the fresh snapshot.
const mutate = (op) => async (req, res) => {
  try {
    const result = await serial(async () => {
      const { state } = await getSnapshot()
      const out = op(state, req)
      await saveState(out.state, out.events, { clearHistory: out.clearHistory })
      return { ...(await getSnapshot()), events: out.events, persisted: true }
    })
    res.json(result)
  } catch (err) {
    fail(res, err)
  }
}

const read = (pick) => async (req, res) => {
  try {
    res.json(pick(await getSnapshot()))
  } catch (err) {
    fail(res, err)
  }
}

app.get('/api/memory/status', read((s) => ({ ...s, persisted: true })))
app.get('/api/vms', read((s) => s.state.vms))
app.get('/api/history', read((s) => s.state.history))

app.post('/api/vms', mutate((state, req) => engine.createVm(state, req.body)))
app.put('/api/vms/:id', mutate((state, req) => engine.updateVm(state, req.params.id, req.body)))
app.delete('/api/vms/:id', mutate((state, req) => engine.deleteVm(state, req.params.id)))
app.post('/api/memory/allocate', mutate((state, req) => engine.allocate(state, req.body)))
app.post('/api/memory/release', mutate((state, req) => engine.release(state, req.body)))
app.post('/api/demo/load', mutate((state) => engine.loadDemo(state)))
app.post('/api/demo/reset', mutate(() => engine.resetDemo()))

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

export default app
