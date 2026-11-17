import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { mb, vmColor } from './ui.jsx'

// Donut of host RAM by VM plus free memory.
export default function DistributionChart({ state, stats }) {
  const rows = [
    ...state.vms.filter((v) => v.allocatedMemory > 0).map((v) => ({ name: v.name, value: v.allocatedMemory, color: vmColor(v) })),
    { name: 'Free', value: stats.available, color: '#e3e8f1' },
  ]
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={1.5} stroke="none" isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
            </Pie>
            <Tooltip formatter={(v) => mb(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xl font-semibold text-ink">{stats.utilization.toFixed(0)}%</div>
            <div className="text-[11px] text-muted">utilized</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: r.color }} />
            <span className="truncate text-ink">{r.name}</span>
            <span className="ml-auto font-mono text-xs text-muted">{mb(r.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
