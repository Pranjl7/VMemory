import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Cpu, Database, HardDrive, LayoutDashboard, Loader2, Menu, RotateCcw, Sparkles, TriangleAlert, X } from 'lucide-react'
import { connect } from './api.js'
import { computeStats } from '../shared/stats.js'
import { Button } from './components/ui.jsx'
import Dashboard from './pages/Dashboard.jsx'
import VirtualMachines from './pages/VirtualMachines.jsx'
import Simulator from './pages/Simulator.jsx'
import Analytics from './pages/Analytics.jsx'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'vms', label: 'Virtual Machines', icon: Cpu, component: VirtualMachines },
  { id: 'allocate', label: 'Memory Allocation', icon: HardDrive, component: Simulator },
  { id: 'analytics', label: 'Analytics & OS Concepts', icon: BarChart3, component: Analytics },
]
const pageFromHash = () => PAGES.find((p) => `#/${p.id}` === window.location.hash)?.id || 'dashboard'

export default function App() {
  const [page, setPage] = useState(pageFromHash)
  const [backend, setBackend] = useState(null)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    connect().then(({ backend, data }) => {
      setBackend(backend)
      setData(data)
    })
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // Runs a backend operation, stores the returned snapshot and reports the outcome.
  const act = useCallback(
    async (method, ...args) => {
      setBusy(true)
      try {
        const result = await backend[method](...args)
        setData(result)
        const last = result.events?.at(-1)
        if (last) setToast({ tone: last.status === 'failed' ? 'error' : 'success', text: last.message })
        return result
      } catch (err) {
        setToast({ tone: 'error', text: err.message })
        return null
      } finally {
        setBusy(false)
      }
    },
    [backend],
  )

  const go = (id) => {
    window.location.hash = `/${id}`
    setNavOpen(false)
  }

  if (!data) {
    return (
      <div className="grid h-screen place-items-center text-muted">
        <span className="inline-flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Connecting to the memory manager…</span>
      </div>
    )
  }

  const stats = computeStats(data.state, data.counts)
  const current = PAGES.find((p) => p.id === page)
  const Page = current.component
  const sim = { state: data.state, stats, act, busy, go, lastEvent: data.events?.at(-1) }

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-white transition-transform lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-white"><HardDrive className="size-5" /></span>
          <div className="leading-tight">
            <div className="font-semibold text-ink">VMemory</div>
            <div className="text-xs text-muted">VM Memory Simulator</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setNavOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {PAGES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${page === id ? 'bg-indigo-50 text-accent' : 'text-muted hover:bg-slate-50 hover:text-ink'}`}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="m-3 rounded-xl border border-line bg-canvas p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Host machine</div>
          <div className="mt-1 text-sm font-semibold text-ink">{data.state.totalMemory} MB physical RAM</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            {backend.mode === 'database'
              ? <><Database className="size-3.5 text-emerald-600" /> Persisted in database</>
              : <><TriangleAlert className="size-3.5 text-amber-600" /> Local demo mode</>}
          </div>
        </div>
      </aside>
      {navOpen && <div className="fixed inset-0 z-20 bg-ink/20 lg:hidden" onClick={() => setNavOpen(false)} />}

      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
          <button className="lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-ink">{current.label}</h1>
            <p className="hidden truncate text-xs text-muted sm:block">Dynamic Memory Allocation and Resource Management for Virtual Machines</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => act('loadDemo')}><Sparkles className="size-4" /><span className="hidden sm:inline">Load Demo Data</span></Button>
            <Button variant="secondary" disabled={busy} onClick={() => confirm('Reset to the initial demo configuration and clear all history?') && act('resetDemo')}>
              <RotateCcw className="size-4" /><span className="hidden sm:inline">Reset Demo</span>
            </Button>
          </div>
        </div>
      </header>

      {backend.mode === 'local' && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            The API/database is unreachable, so the simulator is running in <b className="mx-1">local demo mode</b>. Changes are kept in this browser only and are NOT saved to the database.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <Page sim={sim} />
      </main>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-40 max-w-md rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-white text-ink'}`}>
          {toast.text}
        </div>
      )}
    </div>
  )
}
