// Memory allocation engine shared by the Express server and the browser-only demo fallback.
// Every operation takes a state object, returns { state, events } and never mutates its input.
//
// state = {
//   totalMemory: number (MB),
//   vms:     [{ id, name, initialMemory, maximumMemory, priority, status, color, allocatedMemory }],
//   blocks:  [{ id, vmId, start, size, requested }]   // allocated, contiguous regions of host RAM
//   history: [event, ...]                             // newest first
// }
// Free holes are never stored: they are the gaps between allocated blocks, so adjacent free
// space is coalesced automatically when a block is released.

import { firstFit } from './algorithms/firstFit.js'
import { bestFit } from './algorithms/bestFit.js'
import { worstFit } from './algorithms/worstFit.js'

export const HOST_MEMORY = 1024
export const ALLOCATION_UNIT = 32 // MB — requests are rounded up to this page/frame size
export const PRIORITIES = ['high', 'medium', 'low']

export const ALGORITHMS = {
  'first-fit': {
    label: 'First Fit',
    run: firstFit,
    description:
      'Scans memory from the lowest address and places the request in the first free hole that is large enough. Fast, but tends to leave small holes near the start of memory.',
  },
  'best-fit': {
    label: 'Best Fit',
    run: bestFit,
    description:
      'Searches every free hole and picks the smallest one that fits, minimising leftover space. Saves large holes, but can create many tiny unusable fragments.',
  },
  'worst-fit': {
    label: 'Worst Fit',
    run: worstFit,
    description:
      'Searches every free hole and picks the largest one, so the leftover piece is still big enough to be useful. Breaks up large holes quickly.',
  },
}

export class EngineError extends Error {}

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const clone = (s) => structuredClone(s)
const sum = (arr, f) => arr.reduce((t, x) => t + f(x), 0)

export function getFreeHoles(state) {
  const sorted = [...state.blocks].sort((a, b) => a.start - b.start)
  const holes = []
  let cursor = 0
  for (const b of sorted) {
    if (b.start > cursor) holes.push({ start: cursor, size: b.start - cursor })
    cursor = Math.max(cursor, b.start + b.size)
  }
  if (cursor < state.totalMemory) holes.push({ start: cursor, size: state.totalMemory - cursor })
  return holes
}

// Ordered list of every segment of physical memory (allocated blocks and free holes).
export function getLayout(state) {
  const used = state.blocks.map((b) => ({ type: 'vm', ...b }))
  const free = getFreeHoles(state).map((h) => ({ type: 'free', id: `free-${h.start}`, ...h }))
  return [...used, ...free].sort((a, b) => a.start - b.start)
}

export const vmAllocated = (state, vmId) => sum(state.blocks.filter((b) => b.vmId === vmId), (b) => b.size)

function sync(s) {
  for (const vm of s.vms) vm.allocatedMemory = vmAllocated(s, vm.id)
  if (s.history.length > 200) s.history.length = 200
  return s
}

// Runs an operation on a copy of the state and collects the history events it records.
function run(state, fn) {
  const s = clone(state)
  const events = []
  const record = (e) => {
    const ev = {
      id: uid(),
      timestamp: new Date().toISOString(),
      vmId: null,
      vmName: null,
      requestedMemory: null,
      algorithm: null,
      allocatedMemory: null,
      blockStart: null,
      status: 'success',
      ...e,
    }
    s.history.unshift(ev)
    events.push(ev)
    return ev
  }
  fn(s, record)
  return { state: sync(s), events }
}

function findVm(s, id) {
  const vm = s.vms.find((v) => v.id === id)
  if (!vm) throw new EngineError('Virtual machine not found.')
  return vm
}

function toMb(value, label) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new EngineError(`${label} must be a positive whole number of MB.`)
  return n
}

// Core dynamic allocation step. Records a success or failure event either way.
function allocateInto(s, record, vm, requested, algorithmKey) {
  const algo = ALGORITHMS[algorithmKey]
  if (!algo) throw new EngineError('Unknown allocation algorithm.')
  const base = { action: 'allocate', vmId: vm.id, vmName: vm.name, requestedMemory: requested, algorithm: algorithmKey }
  const fail = (message) => record({ ...base, status: 'failed', allocatedMemory: 0, message })

  if (vm.status !== 'running') return fail(`${vm.name} is stopped. Start the VM before requesting memory.`)

  const size = Math.ceil(requested / ALLOCATION_UNIT) * ALLOCATION_UNIT
  const current = vmAllocated(s, vm.id)
  if (current + size > vm.maximumMemory) {
    return fail(
      `Rejected: ${vm.name} would use ${current + size} MB, above its ${vm.maximumMemory} MB maximum (resource limit).`,
    )
  }

  const holes = getFreeHoles(s)
  const free = sum(holes, (h) => h.size)
  if (size > free) {
    return fail(`Insufficient memory: ${size} MB requested but only ${free} MB of host RAM is free.`)
  }

  const { hole, reason } = algo.run(holes, size)
  if (!hole) {
    const largest = Math.max(0, ...holes.map((h) => h.size))
    return fail(
      `External fragmentation: ${free} MB is free in total, but split into ${holes.length} holes. The largest is only ${largest} MB, so no contiguous ${size} MB block exists.`,
    )
  }

  const block = { id: uid(), vmId: vm.id, start: hole.start, size, requested }
  s.blocks.push(block)
  const waste = size - requested
  return record({
    ...base,
    allocatedMemory: size,
    blockStart: hole.start,
    blockId: block.id,
    message:
      reason +
      (waste > 0
        ? ` Request rounded up from ${requested} MB to ${size} MB (${waste} MB internal fragmentation).`
        : ''),
  })
}

function releaseBlocks(s, record, vm, blocks, action = 'release') {
  const freed = sum(blocks, (b) => b.size)
  const ids = new Set(blocks.map((b) => b.id))
  s.blocks = s.blocks.filter((b) => !ids.has(b.id))
  if (blocks.length && action === 'release') {
    const where = blocks.length === 1 ? ` at ${blocks[0].start} MB` : ` across ${blocks.length} blocks`
    record({
      action: 'release',
      vmId: vm.id,
      vmName: vm.name,
      allocatedMemory: freed,
      blockStart: blocks.length === 1 ? blocks[0].start : null,
      message: `Released ${freed} MB${where} from ${vm.name}. Adjacent free holes merge automatically.`,
    })
  }
  return freed
}

// ---------------------------------------------------------------- public operations

export function allocate(state, { vmId, size, algorithm }) {
  return run(state, (s, record) => {
    const vm = findVm(s, vmId)
    const requested = toMb(size, 'Memory request')
    if (requested > s.totalMemory) throw new EngineError(`Request cannot exceed host RAM (${s.totalMemory} MB).`)
    allocateInto(s, record, vm, requested, algorithm)
  })
}

export function release(state, { blockId, vmId }) {
  return run(state, (s, record) => {
    if (blockId) {
      const block = s.blocks.find((b) => b.id === blockId)
      if (!block) throw new EngineError('Memory block not found.')
      return releaseBlocks(s, record, findVm(s, block.vmId), [block])
    }
    const vm = findVm(s, vmId)
    const blocks = s.blocks.filter((b) => b.vmId === vm.id)
    if (!blocks.length) throw new EngineError(`${vm.name} has no allocated memory to release.`)
    releaseBlocks(s, record, vm, blocks)
  })
}

export function createVm(state, input) {
  return run(state, (s, record) => {
    const name = String(input.name || '').trim().slice(0, 40)
    if (!name) throw new EngineError('VM name is required.')
    if (s.vms.some((v) => v.name.toLowerCase() === name.toLowerCase())) throw new EngineError('A VM with this name already exists.')
    const initialMemory = toMb(input.initialMemory, 'Initial memory')
    const maximumMemory = toMb(input.maximumMemory, 'Maximum memory')
    if (maximumMemory < initialMemory) throw new EngineError('Maximum memory must be at least the initial memory.')
    if (maximumMemory > s.totalMemory) throw new EngineError(`Maximum memory cannot exceed host RAM (${s.totalMemory} MB).`)
    const priority = PRIORITIES.includes(input.priority) ? input.priority : 'medium'
    const color = s.vms.length ? Math.max(...s.vms.map((v) => v.color)) + 1 : 0
    const vm = { id: uid(), name, initialMemory, maximumMemory, priority, status: 'running', color, allocatedMemory: 0 }
    s.vms.push(vm)
    record({ action: 'create', vmId: vm.id, vmName: name, message: `Created ${name} (${priority} priority, max ${maximumMemory} MB).` })
    const ev = allocateInto(s, record, vm, initialMemory, 'first-fit')
    if (ev.status === 'failed') vm.status = 'stopped'
  })
}

export function updateVm(state, id, input) {
  return run(state, (s, record) => {
    const vm = findVm(s, id)
    if (input.name !== undefined) {
      const name = String(input.name).trim().slice(0, 40)
      if (!name) throw new EngineError('VM name is required.')
      vm.name = name
    }
    if (input.priority !== undefined && PRIORITIES.includes(input.priority)) vm.priority = input.priority
    if (input.maximumMemory !== undefined) {
      const max = toMb(input.maximumMemory, 'Maximum memory')
      if (max < vmAllocated(s, vm.id)) throw new EngineError('Maximum memory cannot be below the memory already allocated.')
      vm.maximumMemory = Math.min(max, s.totalMemory)
    }
    if (input.status === 'stopped' && vm.status === 'running') {
      vm.status = 'stopped'
      const freed = releaseBlocks(s, record, vm, s.blocks.filter((b) => b.vmId === vm.id), 'stop')
      record({ action: 'stop', vmId: vm.id, vmName: vm.name, allocatedMemory: freed, message: `Stopped ${vm.name}; ${freed} MB returned to the host.` })
    } else if (input.status === 'running' && vm.status === 'stopped') {
      vm.status = 'running'
      record({ action: 'start', vmId: vm.id, vmName: vm.name, message: `Started ${vm.name}; requesting ${vm.initialMemory} MB.` })
      const ev = allocateInto(s, record, vm, vm.initialMemory, 'first-fit')
      if (ev.status === 'failed') vm.status = 'stopped'
    }
  })
}

export function deleteVm(state, id) {
  return run(state, (s, record) => {
    const vm = findVm(s, id)
    const freed = releaseBlocks(s, record, vm, s.blocks.filter((b) => b.vmId === vm.id), 'delete')
    s.vms = s.vms.filter((v) => v.id !== id)
    record({ action: 'delete', vmId: vm.id, vmName: vm.name, allocatedMemory: freed, message: `Deleted ${vm.name}; ${freed} MB returned to the host.` })
  })
}

// Demo layout: 1024 MB host, VM 1 = 256 MB, VM 2 = 128 MB, VM 3 = 256 MB, 384 MB free.
// The free memory is deliberately split into three holes (128, 64 and 192 MB) so that
// First Fit, Best Fit and Worst Fit visibly choose different holes for the same request.
function demoMachines() {
  const vms = [
    { name: 'VM 1 · Web Server', initialMemory: 256, maximumMemory: 512, priority: 'high', start: 0 },
    { name: 'VM 2 · Database', initialMemory: 128, maximumMemory: 384, priority: 'medium', start: 384 },
    { name: 'VM 3 · Analytics', initialMemory: 256, maximumMemory: 512, priority: 'low', start: 576 },
  ].map((v, i) => ({ ...v, id: uid(), color: i, status: 'running' }))
  return {
    vms: vms.map(({ start, ...vm }) => ({ ...vm, allocatedMemory: vm.initialMemory })),
    blocks: vms.map((v) => ({ id: uid(), vmId: v.id, start: v.start, size: v.initialMemory, requested: v.initialMemory })),
  }
}

export function loadDemo(state) {
  const base = state ?? { totalMemory: HOST_MEMORY, vms: [], blocks: [], history: [] }
  return run(base, (s, record) => {
    Object.assign(s, { totalMemory: HOST_MEMORY }, demoMachines())
    record({ action: 'demo', message: 'Loaded demo data: 3 VMs using 640 MB of 1024 MB host RAM.' })
  })
}

export function resetDemo() {
  const result = loadDemo({ totalMemory: HOST_MEMORY, vms: [], blocks: [], history: [] })
  result.events[0].action = 'reset'
  result.events[0].message = 'Demo reset: initial configuration restored and history cleared.'
  return { ...result, clearHistory: true }
}
