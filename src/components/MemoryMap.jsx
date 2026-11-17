// The physical RAM visualization: a proportional, segmented bar of host memory.
import { getLayout } from '../../shared/engine.js'
import { vmColor } from './ui.jsx'

export default function MemoryMap({ state, highlightId, selectedBlockId, onSelectBlock, height = 'h-20', showLegend = true }) {
  const total = state.totalMemory
  const vmById = Object.fromEntries(state.vms.map((v) => [v.id, v]))
  const layout = getLayout(state)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(total * f))

  return (
    <div>
      <div className={`flex w-full overflow-hidden rounded-xl border border-line bg-slate-50 ${height}`}>
        {layout.map((seg) => {
          const width = `${(seg.size / total) * 100}%`
          if (seg.type === 'free') {
            return (
              <div key={seg.id} style={{ width }} title={`Free hole · ${seg.size} MB @ ${seg.start} MB`}
                className="free-stripes flex min-w-0 flex-col items-center justify-center border-r border-white/80 px-1 text-center last:border-r-0">
                <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">Free</span>
                <span className="truncate font-mono text-[11px] text-slate-500">{seg.size} MB</span>
              </div>
            )
          }
          const vm = vmById[seg.vmId]
          const active = seg.id === highlightId
          const selected = seg.id === selectedBlockId
          return (
            <button key={seg.id} type="button" style={{ width, background: vmColor(vm) }}
              onClick={onSelectBlock ? () => onSelectBlock(seg) : undefined}
              title={`${vm?.name} · ${seg.size} MB @ ${seg.start}–${seg.start + seg.size} MB${seg.size > seg.requested ? ` (requested ${seg.requested} MB)` : ''}`}
              className={`relative flex min-w-0 flex-col items-center justify-center border-r border-white/70 px-1 text-center text-white last:border-r-0 ${onSelectBlock ? 'cursor-pointer hover:brightness-110' : 'cursor-default'} ${active ? 'animate-pulse' : ''} ${selected ? 'ring-4 ring-inset ring-ink/70' : ''}`}>
              <span className="w-full truncate text-[11px] font-semibold">{vm?.name.split('·')[0].trim()}</span>
              <span className="w-full truncate font-mono text-[11px] opacity-90">{seg.size} MB</span>
              {seg.size > seg.requested && (
                <span className="absolute right-0 top-0 h-full bg-white/30" style={{ width: `${((seg.size - seg.requested) / seg.size) * 100}%` }} title="Internal fragmentation" />
              )}
            </button>
          )
        })}
      </div>
      <div className="relative mt-1.5 h-4 font-mono text-[10px] text-muted">
        {ticks.map((t, i) => (
          <span key={t} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(t / total) * 100}%` }}>
            {t}{i === ticks.length - 1 ? ' MB' : ''}
          </span>
        ))}
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
          {state.vms.map((vm) => (
            <span key={vm.id} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: vmColor(vm) }} />
              {vm.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5"><span className="free-stripes size-2.5 rounded-sm border border-line" />Free hole</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-indigo-300" />Lighter tail = internal fragmentation</span>
        </div>
      )}
    </div>
  )
}
