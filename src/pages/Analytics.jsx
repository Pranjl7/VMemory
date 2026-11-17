import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ALGORITHMS } from '../../shared/engine.js'
import DistributionChart from '../components/DistributionChart.jsx'
import { Badge, Card, Progress, actionLabel, mb, pct, timeAgo } from '../components/ui.jsx'

const CONCEPTS = [
  ['Virtualization', 'A hypervisor lets one physical host run several isolated virtual machines, each believing it has its own hardware and RAM.'],
  ['Dynamic memory allocation', 'Memory is handed to VMs at run time, on request, and returned to the host when it is released, instead of being fixed in advance.'],
  ['First Fit', 'Places a request in the first free hole, scanning from address 0, that is large enough. Fast with little searching.'],
  ['Best Fit', 'Places a request in the smallest hole that fits, minimising leftover space but often producing tiny unusable fragments.'],
  ['Worst Fit', 'Places a request in the largest hole so the remainder stays big enough to be useful for later requests.'],
  ['Internal fragmentation', 'Wasted space inside an allocated block: here requests are rounded up to 32 MB units, so a 100 MB request occupies 128 MB.'],
  ['External fragmentation', 'Free memory is split into separate holes, so a request can fail even when total free memory is large enough.'],
  ['Resource allocation', 'The host enforces limits: total allocations can never exceed physical RAM, and each VM is capped at its maximum memory.'],
]

export default function Analytics({ sim }) {
  const { state, stats } = sim
  const perVm = state.vms.map((v) => ({ name: v.name.split('·')[0].trim(), Allocated: v.allocatedMemory, Maximum: v.maximumMemory }))
  const attempts = stats.success + stats.failed

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Memory Distribution" subtitle="Current share of host RAM">
          <DistributionChart state={state} stats={stats} />
        </Card>
        <Card title="Allocation Outcomes" subtitle={`${attempts} allocation requests recorded`}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-4"><div className="text-xs text-emerald-700">Successful</div><div className="text-2xl font-semibold text-emerald-700">{stats.success}</div></div>
            <div className="rounded-xl bg-rose-50 p-4"><div className="text-xs text-rose-700">Failed</div><div className="text-2xl font-semibold text-rose-700">{stats.failed}</div></div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted"><span>Success rate</span><span>{attempts ? pct((stats.success / attempts) * 100) : '—'}</span></div>
            <Progress value={attempts ? (stats.success / attempts) * 100 : 0} color="#16a34a" />
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted"><span>Memory utilization</span><span>{pct(stats.utilization)}</span></div>
            <Progress value={stats.utilization} />
          </div>
        </Card>
        <Card title="Fragmentation" subtitle="Calculated from the current memory layout">
          <dl className="space-y-3 text-sm">
            <Row k="Free holes" v={stats.holes.length} />
            <Row k="Total free memory" v={mb(stats.available)} />
            <Row k="Largest contiguous hole" v={mb(stats.largestHole)} />
            <Row k="External fragmentation" v={pct(stats.externalFragmentation)} hint="(free − largest hole) ÷ free" />
            <Row k="Internal fragmentation" v={mb(stats.internalFragmentation)} hint="rounded size − requested size" />
          </dl>
        </Card>
      </div>

      <Card title="Allocated vs Maximum Memory per VM" subtitle="How close each VM is to its resource limit (MB)">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={perVm} barGap={4} margin={{ left: -16 }}>
              <CartesianGrid vertical={false} stroke="#e4e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5b6785' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5b6785' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f6f7fb' }} formatter={(v) => mb(v)} />
              <Bar dataKey="Allocated" fill="#4f46e5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Maximum" fill="#c7d2fe" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Allocation History" subtitle="Most recent operations, newest first">
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs text-muted">
              <tr>{['Time', 'Action', 'VM', 'Algorithm', 'Requested', 'Allocated', 'Status'].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {state.history.map((h) => (
                <tr key={h.id} title={h.message}>
                  <td className="py-2 pr-3 font-mono text-xs text-muted">{timeAgo(h.timestamp)}</td>
                  <td className="py-2 pr-3 font-medium text-ink">{actionLabel(h.action)}</td>
                  <td className="py-2 pr-3 text-ink">{h.vmName || '—'}</td>
                  <td className="py-2 pr-3 text-muted">{ALGORITHMS[h.algorithm]?.label || '—'}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{h.requestedMemory != null ? `${h.requestedMemory} MB` : '—'}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{h.allocatedMemory != null ? `${h.allocatedMemory} MB` : '—'}</td>
                  <td className="py-2"><Badge tone={h.status}>{h.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Operating System Concepts" subtitle="The ideas this simulator demonstrates">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {CONCEPTS.map(([t, d]) => (
            <div key={t} className="border-l-2 border-indigo-200 pl-4">
              <h3 className="text-sm font-semibold text-ink">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Row({ k, v, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0">
      <dt className="text-muted">{k}{hint && <span className="block text-[11px] text-slate-400">{hint}</span>}</dt>
      <dd className="font-mono font-semibold text-ink">{v}</dd>
    </div>
  )
}
