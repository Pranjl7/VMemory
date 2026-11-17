import { useState } from 'react'
import { CheckCircle2, Cpu, Unlock, XCircle } from 'lucide-react'
import { ALGORITHMS, ALLOCATION_UNIT, getFreeHoles } from '../../shared/engine.js'
import MemoryMap from '../components/MemoryMap.jsx'
import { Badge, Button, Card, Field, inputClass, mb, pct, vmColor } from '../components/ui.jsx'

export default function Simulator({ sim }) {
  const { state, stats, act, busy } = sim
  const running = state.vms.filter((v) => v.status === 'running')
  const [vmId, setVmId] = useState(running[0]?.id || '')
  const [size, setSize] = useState(128)
  const [algorithm, setAlgorithm] = useState('first-fit')
  const [selectedBlockId, setSelectedBlockId] = useState(null)

  const vm = state.vms.find((v) => v.id === vmId) || running[0]
  const selectedBlock = state.blocks.find((b) => b.id === selectedBlockId)
  const lastOp = state.history.find((h) => h.action === 'allocate' || h.action === 'release')
  const highlightId = lastOp?.action === 'allocate' && lastOp.status === 'success'
    ? state.blocks.find((b) => b.vmId === lastOp.vmId && b.start === lastOp.blockStart)?.id
    : null

  // Live preview: which hole each algorithm would choose for the current request.
  const holes = getFreeHoles(state)
  const rounded = Math.ceil(Math.max(1, Number(size) || 0) / ALLOCATION_UNIT) * ALLOCATION_UNIT
  const picks = Object.fromEntries(Object.entries(ALGORITHMS).map(([k, a]) => [k, a.run(holes, rounded).hole?.start]))

  const allocate = (e) => {
    e.preventDefault()
    if (vm) act('allocate', { vmId: vm.id, size: Number(size), algorithm })
  }
  const releaseBlock = async () => {
    if (await act('release', { blockId: selectedBlockId })) setSelectedBlockId(null)
  }

  return (
    <div className="space-y-6">
      <Card title="Physical Memory Blocks" subtitle="Click a VM block to select it for release. Free holes are the gaps between allocated blocks.">
        <MemoryMap state={state} height="h-28" highlightId={highlightId} selectedBlockId={selectedBlockId}
          onSelectBlock={(b) => setSelectedBlockId(b.id === selectedBlockId ? null : b.id)} />
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
          {[['Allocated', mb(stats.allocated)], ['Free', mb(stats.available)], ['Utilization', pct(stats.utilization)], ['Largest free hole', mb(stats.largestHole)]].map(([k, v]) => (
            <div key={k}><div className="text-xs text-muted">{k}</div><div className="font-mono font-semibold text-ink">{v}</div></div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Allocation Request" className="lg:col-span-2">
          <form onSubmit={allocate} className="space-y-4">
            <Field label="Virtual machine">
              <select className={inputClass} value={vm?.id || ''} onChange={(e) => setVmId(e.target.value)} disabled={!running.length}>
                {!running.length && <option>No running VMs</option>}
                {running.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.allocatedMemory}/{v.maximumMemory} MB</option>)}
              </select>
            </Field>
            <Field label="Memory request (MB)" hint={`Rounded up to ${ALLOCATION_UNIT} MB units → ${rounded} MB${rounded > size ? ` (${rounded - size} MB internal fragmentation)` : ''}`}>
              <input className={inputClass} type="number" min={1} max={state.totalMemory} required value={size} onChange={(e) => setSize(e.target.value)} />
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Algorithm</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                {Object.entries(ALGORITHMS).map(([k, a]) => (
                  <button type="button" key={k} onClick={() => setAlgorithm(k)}
                    className={`rounded-md px-2 py-1.5 text-sm font-medium transition ${algorithm === k ? 'bg-white text-accent shadow-sm' : 'text-muted hover:text-ink'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{ALGORITHMS[algorithm].description}</p>
            </div>
            <Button type="submit" className="w-full" disabled={busy || !vm}><Cpu className="size-4" /> Allocate {rounded} MB</Button>
          </form>

          <div className="mt-5 border-t border-line pt-4">
            <div className="text-sm font-medium text-ink">Release memory</div>
            {selectedBlock ? (
              <p className="mt-1 text-xs text-muted">Selected: {state.vms.find((v) => v.id === selectedBlock.vmId)?.name}, {selectedBlock.size} MB at {selectedBlock.start} MB.</p>
            ) : (
              <p className="mt-1 text-xs text-muted">Select a block in the memory map, or release everything held by the chosen VM.</p>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="flex-1" disabled={busy || !selectedBlock} onClick={releaseBlock}><Unlock className="size-4" /> Release block</Button>
              <Button variant="secondary" className="flex-1" disabled={busy || !vm?.allocatedMemory} onClick={() => act('release', { vmId: vm.id })}>Release all of VM</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card title="Last Operation Result">
            {lastOp ? (
              <div className="flex gap-3">
                {lastOp.status === 'failed'
                  ? <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                  : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {lastOp.action === 'release' ? 'Memory released' : lastOp.status === 'failed' ? 'Allocation failed' : 'Allocation successful'}
                    </span>
                    <Badge tone={lastOp.status}>{lastOp.status}</Badge>
                    {lastOp.algorithm && <Badge>{ALGORITHMS[lastOp.algorithm]?.label}</Badge>}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{lastOp.message}</p>
                  {lastOp.action === 'allocate' && (
                    <p className="mt-2 font-mono text-xs text-muted">
                      {lastOp.vmName} · requested {lastOp.requestedMemory} MB · allocated {lastOp.allocatedMemory} MB
                      {lastOp.blockStart != null && ` · address ${lastOp.blockStart}–${lastOp.blockStart + lastOp.allocatedMemory} MB`}
                    </p>
                  )}
                </div>
              </div>
            ) : <p className="text-sm text-muted">Run an allocation to see which block is chosen and why.</p>}
          </Card>

          <Card title="Free Hole Table" subtitle={`Which hole each algorithm would choose for a ${rounded} MB request right now.`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr><th className="pb-2 font-medium">Hole</th><th className="pb-2 font-medium">Address range</th><th className="pb-2 font-medium">Size</th><th className="pb-2 font-medium">Chosen by</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {holes.map((h, i) => {
                    const by = Object.entries(picks).filter(([, s]) => s === h.start).map(([k]) => ALGORITHMS[k].label)
                    return (
                      <tr key={h.start} className={h.size < rounded ? 'text-muted' : 'text-ink'}>
                        <td className="py-2 font-medium">#{i + 1}</td>
                        <td className="py-2 font-mono text-xs">{h.start}–{h.start + h.size} MB</td>
                        <td className="py-2 font-mono text-xs">{h.size} MB {h.size < rounded && <span className="text-rose-500">· too small</span>}</td>
                        <td className="py-2"><div className="flex flex-wrap gap-1">{by.map((l) => <Badge key={l}>{l}</Badge>)}</div></td>
                      </tr>
                    )
                  })}
                  {!holes.length && <tr><td colSpan={4} className="py-3 text-muted">Memory is full — no free holes.</td></tr>}
                </tbody>
              </table>
            </div>
            {holes.length > 0 && Object.values(picks).every((p) => p === undefined) && (
              <p className="mt-3 text-xs text-rose-600">No single hole can hold {rounded} MB, so every algorithm will reject this request.</p>
            )}
            {vm && <p className="mt-3 text-xs text-muted">Tip: with the demo layout, request 64 MB for <span style={{ color: vmColor(vm) }} className="font-medium">{vm.name}</span> and try each algorithm — all three pick a different hole.</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
