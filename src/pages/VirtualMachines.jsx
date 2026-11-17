import { useState } from 'react'
import { Play, Plus, Square, Trash2 } from 'lucide-react'
import { PRIORITIES } from '../../shared/engine.js'
import { Badge, Button, Card, Field, Progress, inputClass, mb, vmColor } from '../components/ui.jsx'

const EMPTY = { name: '', initialMemory: 128, maximumMemory: 256, priority: 'medium' }

export default function VirtualMachines({ sim }) {
  const { state, stats, act, busy } = sim
  const [form, setForm] = useState(EMPTY)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const res = await act('createVm', { ...form, initialMemory: Number(form.initialMemory), maximumMemory: Number(form.maximumMemory) })
    if (res) setForm(EMPTY)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Add Virtual Machine" subtitle={`Initial memory is allocated with First Fit. ${mb(stats.available)} free on the host.`} className="h-fit">
        <form onSubmit={submit} className="space-y-4">
          <Field label="VM name">
            <input className={inputClass} required maxLength={40} value={form.name} onChange={set('name')} placeholder="e.g. VM 4 · Mail Server" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Initial (MB)">
              <input className={inputClass} type="number" min={1} max={state.totalMemory} required value={form.initialMemory} onChange={set('initialMemory')} />
            </Field>
            <Field label="Maximum (MB)">
              <input className={inputClass} type="number" min={1} max={state.totalMemory} required value={form.maximumMemory} onChange={set('maximumMemory')} />
            </Field>
          </div>
          <Field label="Priority">
            <select className={inputClass} value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
          </Field>
          <Button type="submit" className="w-full" disabled={busy}><Plus className="size-4" /> Add VM</Button>
        </form>
      </Card>

      <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-2">
        {state.vms.map((vm) => {
          const usage = vm.maximumMemory ? (vm.allocatedMemory / vm.maximumMemory) * 100 : 0
          const running = vm.status === 'running'
          return (
            <div key={vm.id} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,61,0.04)]">
              <div className="flex items-start gap-3">
                <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: vmColor(vm) }} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-ink">{vm.name}</h3>
                  <div className="mt-1.5 flex gap-1.5"><Badge tone={vm.status}>{vm.status}</Badge><Badge tone={vm.priority}>{vm.priority} priority</Badge></div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted">Allocated</dt><dd className="font-mono font-medium text-ink">{mb(vm.allocatedMemory)}</dd></div>
                <div><dt className="text-xs text-muted">Maximum</dt><dd className="font-mono font-medium text-ink">{mb(vm.maximumMemory)}</dd></div>
              </dl>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted"><span>Memory utilization</span><span>{usage.toFixed(0)}%</span></div>
                <Progress value={usage} color={vmColor(vm)} />
              </div>
              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => act('updateVm', vm.id, { status: running ? 'stopped' : 'running' })}>
                  {running ? <><Square className="size-3.5" /> Stop</> : <><Play className="size-3.5" /> Start</>}
                </Button>
                <Button variant="danger" disabled={busy} aria-label={`Delete ${vm.name}`}
                  onClick={() => confirm(`Delete ${vm.name}? Its memory returns to the host.`) && act('deleteVm', vm.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          )
        })}
        {!state.vms.length && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted sm:col-span-2">
            No virtual machines yet. Add one, or press “Load Demo Data”.
          </div>
        )}
      </div>
    </div>
  )
}
