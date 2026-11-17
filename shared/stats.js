// Derived statistics shared by every page. Pure functions over the engine state.
import { getFreeHoles } from './engine.js'

export function computeStats(state, counts) {
  const total = state.totalMemory
  const allocated = state.blocks.reduce((t, b) => t + b.size, 0)
  const available = total - allocated
  const holes = getFreeHoles(state)
  const largestHole = Math.max(0, ...holes.map((h) => h.size))
  const internal = state.blocks.reduce((t, b) => t + (b.size - b.requested), 0)
  return {
    total,
    allocated,
    available,
    utilization: total ? (allocated / total) * 100 : 0,
    holes,
    largestHole,
    internalFragmentation: internal,
    // Share of free memory that is unusable for a request of size "available" (0% = one contiguous hole).
    externalFragmentation: available ? ((available - largestHole) / available) * 100 : 0,
    running: state.vms.filter((v) => v.status === 'running').length,
    success: counts?.success ?? 0,
    failed: counts?.failed ?? 0,
  }
}

export function countAllocations(history) {
  const allocs = history.filter((h) => h.action === 'allocate')
  return {
    success: allocs.filter((h) => h.status === 'success').length,
    failed: allocs.filter((h) => h.status === 'failed').length,
  }
}
