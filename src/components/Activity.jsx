import { ALGORITHMS } from '../../shared/engine.js'
import { Badge, actionLabel, timeAgo } from './ui.jsx'

// Compact list of recent allocation events.
export default function Activity({ history, limit = 6 }) {
  if (!history.length) return <p className="text-sm text-muted">No activity yet.</p>
  return (
    <ul className="divide-y divide-line">
      {history.slice(0, limit).map((h) => (
        <li key={h.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${h.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-ink">{actionLabel(h.action)}</span>
              {h.vmName && <span className="text-muted">· {h.vmName}</span>}
              {h.algorithm && <Badge>{ALGORITHMS[h.algorithm]?.label}</Badge>}
              <span className="ml-auto font-mono text-[11px] text-muted">{timeAgo(h.timestamp)}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{h.message}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
