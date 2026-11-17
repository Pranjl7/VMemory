// Small shared UI primitives and helpers.
export const VM_COLORS = ['#4f46e5', '#0ea5a4', '#f59e0b', '#e11d48', '#0284c7', '#7c3aed', '#16a34a', '#ea580c']
export const vmColor = (vm) => VM_COLORS[(vm?.color ?? 0) % VM_COLORS.length]
export const mb = (n) => `${Math.round(n).toLocaleString()} MB`
export const pct = (n) => `${n.toFixed(1)}%`

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,61,0.04),0_4px_16px_rgba(15,27,61,0.04)] ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

const BUTTON = {
  primary: 'bg-accent text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-slate-50',
  ghost: 'text-muted hover:text-ink hover:bg-slate-100',
  danger: 'text-rose-600 hover:bg-rose-50',
}
export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON[variant]} ${className}`}
      {...props}
    />
  )
}

const BADGE = {
  running: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  stopped: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  failed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  high: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  low: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  neutral: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
}
export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${BADGE[tone] || BADGE.neutral}`}>
      {children}
    </span>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}
export const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100'

export function Stat({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,61,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${accent || 'bg-indigo-50 text-accent'}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function Progress({ value, color = '#4f46e5' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

const ACTION_LABEL = { allocate: 'Allocate', release: 'Release', create: 'Create VM', delete: 'Delete VM', start: 'Start', stop: 'Stop', demo: 'Demo', reset: 'Reset' }
export const actionLabel = (a) => ACTION_LABEL[a] || a
export const timeAgo = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
