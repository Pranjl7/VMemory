// Persistence layer: loads the simulator state from Netlify Database (Postgres) and saves it back.
import { getDatabase } from '@netlify/database'
import { resetDemo } from '../../shared/engine.js'

const db = getDatabase()

export async function loadState() {
  const [host] = await db.sql`SELECT total_memory FROM host_configuration WHERE id = 1`
  if (!host) return null
  const vms = await db.sql`SELECT * FROM virtual_machines ORDER BY sort_order, name`
  const blocks = await db.sql`SELECT * FROM memory_blocks ORDER BY start_address`
  const history = await db.sql`SELECT * FROM allocation_history ORDER BY seq DESC LIMIT 60`
  const counts = await db.sql`
    SELECT allocation_status, COUNT(*)::int AS n FROM allocation_history
    WHERE action = 'allocate' GROUP BY allocation_status`
  return {
    state: {
      totalMemory: host.total_memory,
      vms: vms.map((v) => ({
        id: v.id,
        name: v.name,
        initialMemory: v.initial_memory,
        allocatedMemory: v.allocated_memory,
        maximumMemory: v.maximum_memory,
        priority: v.priority,
        status: v.status,
        color: v.color,
      })),
      blocks: blocks.map((b) => ({ id: b.id, vmId: b.vm_id, start: b.start_address, size: b.size, requested: b.requested })),
      history: history.map((h) => ({
        id: h.id,
        vmId: h.vm_id,
        vmName: h.vm_name,
        action: h.action,
        requestedMemory: h.requested_memory,
        algorithm: h.algorithm,
        allocatedMemory: h.allocated_memory,
        status: h.allocation_status,
        blockStart: h.block_start,
        message: h.message,
        timestamp: new Date(h.timestamp).toISOString(),
      })),
    },
    counts: {
      success: counts.find((c) => c.allocation_status === 'success')?.n ?? 0,
      failed: counts.find((c) => c.allocation_status === 'failed')?.n ?? 0,
    },
  }
}

// Writes the new state and its history events in a single transaction.
export async function saveState(state, events, { clearHistory = false } = {}) {
  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')
    if (clearHistory) await client.query('DELETE FROM allocation_history')
    await client.query('DELETE FROM memory_blocks')
    await client.query('DELETE FROM virtual_machines WHERE NOT (id = ANY($1::text[]))', [state.vms.map((v) => v.id)])
    for (const [i, v] of state.vms.entries()) {
      await client.query(
        `INSERT INTO virtual_machines (id, name, initial_memory, allocated_memory, maximum_memory, priority, status, color, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET name=$2, initial_memory=$3, allocated_memory=$4, maximum_memory=$5,
           priority=$6, status=$7, color=$8, sort_order=$9`,
        [v.id, v.name, v.initialMemory, v.allocatedMemory, v.maximumMemory, v.priority, v.status, v.color, i],
      )
    }
    for (const b of state.blocks) {
      await client.query(
        'INSERT INTO memory_blocks (id, vm_id, start_address, size, requested) VALUES ($1,$2,$3,$4,$5)',
        [b.id, b.vmId, b.start, b.size, b.requested],
      )
    }
    for (const e of events) {
      await client.query(
        `INSERT INTO allocation_history (id, vm_id, vm_name, action, requested_memory, algorithm, allocated_memory,
           allocation_status, block_start, message, timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [e.id, e.vmId, e.vmName, e.action, e.requestedMemory, e.algorithm, e.allocatedMemory, e.status, e.blockStart, e.message, e.timestamp],
      )
    }
    const allocated = state.blocks.reduce((t, b) => t + b.size, 0)
    await client.query(
      `INSERT INTO host_configuration (id, total_memory, allocated_memory, available_memory) VALUES (1,$1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET total_memory=$1, allocated_memory=$2, available_memory=$3`,
      [state.totalMemory, allocated, state.totalMemory - allocated],
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// Returns the persisted snapshot, seeding the demo configuration on first use.
export async function getSnapshot() {
  const snap = await loadState()
  if (snap) return snap
  const seed = resetDemo()
  await saveState(seed.state, seed.events, { clearHistory: true })
  return loadState()
}
