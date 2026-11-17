// Public landing page shown at the site root. Uses the shared engine for the live algorithm preview.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, BarChart3, Cpu, HardDrive, LayoutDashboard, Menu, X } from 'lucide-react'
import { ALGORITHMS, ALLOCATION_UNIT, getFreeHoles, getLayout, resetDemo } from '../../shared/engine.js'

const DEMO = resetDemo().state
const HOLES = getFreeHoles(DEMO)
const LAYOUT = getLayout(DEMO)
const VM_TONES = ['#ffc94a', '#ff7eb9', '#ff8a4c']
const NAV = [
  { id: 'features', label: 'Features' },
  { id: 'algorithms', label: 'Algorithms' },
  { id: 'concepts', label: 'OS Concepts' },
  { id: 'about', label: 'About' },
]

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// Adds the `is-visible` class once an element scrolls into view.
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const items = root.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-visible'), io.unobserve(e.target))),
      { threshold: 0.15 },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

export default function Landing({ go }) {
  const [menu, setMenu] = useState(false)
  const ref = useReveal()
  const open = (id = 'dashboard') => go(id)

  return (
    <div ref={ref} className="landing min-h-screen bg-[#e7e6ee] p-2 text-[#16131f] sm:p-4">
      <div className="overflow-hidden rounded-[28px] bg-white">
        {/* Top bar */}
        <header className="relative z-20 flex items-center gap-4 px-5 py-5 sm:px-10">
          <a href="#/" className="font-display text-2xl font-bold tracking-tight">vmemory<span className="text-[#5b34ea]">.</span></a>
          <nav className="mx-auto hidden items-center gap-1 rounded-2xl bg-[#f5f4f8] p-1.5 md:flex">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="rounded-xl px-4 py-2 text-sm text-[#16131f]/80 transition hover:bg-white hover:text-[#16131f] hover:shadow-sm">
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button onClick={() => open('analytics')} className="hidden px-3 py-2 text-sm text-[#16131f]/80 hover:text-[#16131f] sm:block">View analytics</button>
            <button onClick={() => open()} className="rounded-xl bg-[#16131f] px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-px hover:bg-[#2a2536]">Open Simulator</button>
            <button className="md:hidden" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          </div>
        </header>
        {menu && (
          <div className="mx-5 mb-2 grid gap-1 rounded-2xl bg-[#f5f4f8] p-2 md:hidden">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setMenu(false); scrollTo(n.id) }} className="rounded-xl px-4 py-2.5 text-left text-sm hover:bg-white">{n.label}</button>
            ))}
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden px-5 pt-10 text-center sm:pt-16">
          <p className="rise mx-auto inline-flex items-center gap-2 rounded-full border border-[#e9e7f0] px-3 py-1 text-xs text-[#16131f]/70" style={{ '--d': '0ms' }}>
            <span className="size-1.5 rounded-full bg-[#5b34ea]" /> An OS simulator<span className="hidden sm:inline">&nbsp;for virtual machines</span>
          </p>
          <h1 className="rise font-display mx-auto mt-6 max-w-4xl text-[2.6rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-6xl lg:text-[5.2rem]" style={{ '--d': '80ms' }}>
            Watch every megabyte <br className="hidden sm:block" />find its place
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-base text-[#16131f]/65 sm:text-lg" style={{ '--d': '160ms' }}>
            Share 1024 MB of host RAM between virtual machines. Allocate, release and compare First, Best and Worst Fit on a live memory map.
          </p>
          <div className="rise mt-8 flex flex-wrap justify-center gap-3" style={{ '--d': '240ms' }}>
            <button onClick={() => open('allocate')} className="group inline-flex items-center gap-2 rounded-xl bg-[#5b34ea] px-6 py-3.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(91,52,234,0.7)] transition hover:-translate-y-0.5 hover:bg-[#4d29d6]">
              Start allocating <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </button>
            <button onClick={() => scrollTo('algorithms')} className="rounded-xl border border-[#e4e2ec] bg-white px-6 py-3.5 text-sm font-medium transition hover:-translate-y-0.5 hover:border-[#16131f]/30">
              See how it works
            </button>
          </div>

          <HeroStack />
        </section>

        {/* Numbers strip */}
        <section id="features" className="scroll-mt-6 border-y border-[#efedf4] px-5 py-10 sm:px-10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 lg:grid-cols-4">
            {[
              ['1024', 'MB of simulated host RAM'],
              ['3', 'placement algorithms, side by side'],
              [`${ALLOCATION_UNIT}`, 'MB allocation unit, so internal fragmentation is visible'],
              ['640', 'MB in use when the demo loads, across 3 VMs'],
            ].map(([n, t], i) => (
              <div key={t} className="reveal border-l border-[#efedf4] pl-5" style={{ '--d': `${i * 70}ms` }}>
                <div className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{n}</div>
                <div className="mt-2 max-w-[14rem] text-sm text-[#16131f]/60">{t}</div>
              </div>
            ))}
          </div>
        </section>

        <Sections open={open} />
        <AlgorithmPlayground open={open} />
        <Concepts />

        {/* Closing CTA */}
        <section id="about" className="scroll-mt-6 px-3 pb-3 sm:px-5 sm:pb-5">
          <div className="reveal relative overflow-hidden rounded-[24px] bg-[#16131f] px-6 py-16 text-white sm:px-14 sm:py-20">
            <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-[48px] bg-[#ffc94a] opacity-90 rotate-12" />
            <div className="pointer-events-none absolute -right-4 top-24 size-64 rounded-[40px] bg-[#ff7eb9] -rotate-6" />
            <div className="pointer-events-none absolute right-24 top-40 size-56 rounded-[36px] bg-[#5b34ea] rotate-[-14deg]" />
            <div className="relative max-w-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">B.Tech Operating Systems project</p>
              <h2 className="font-display mt-4 text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl">Load the demo and break it on purpose.</h2>
              <p className="mt-5 text-white/65">
                Ask VM 2 for 250 MB. It is rejected even though 384 MB is free, because no single hole is large enough. That is external fragmentation, and you can see it happen.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => open()} className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-medium text-[#16131f] transition hover:-translate-y-0.5">
                  Open the dashboard <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
                <button onClick={() => open('vms')} className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-medium transition hover:border-white/50">Manage VMs</button>
              </div>
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 px-3 pt-6 pb-2 text-xs text-[#16131f]/50 sm:px-6">
            <span className="font-display text-sm font-bold text-[#16131f]">vmemory<span className="text-[#5b34ea]">.</span></span>
            <span>Dynamic Memory Allocation and Resource Management for Virtual Machines</span>
            <span>Educational simulator. It does not control a real hypervisor.</span>
          </footer>
        </section>
      </div>
    </div>
  )
}

// The tilted card stack under the hero, with a memory-themed illustration on the front card.
function HeroStack() {
  return (
    <div className="rise relative mx-auto mt-16 h-[360px] max-w-5xl sm:mt-20 sm:h-[470px]" style={{ '--d': '340ms' }}>
      <div className="absolute inset-x-[2%] top-6 h-[480px] rounded-[40px] bg-[#ffc94a] rotate-[1.5deg]" />
      <div className="absolute inset-x-0 top-12 h-[480px] rounded-[40px] bg-[#ff7eb9] -rotate-[3deg]" />
      <div className="absolute inset-x-[1%] top-4 h-[500px] overflow-hidden rounded-[40px] bg-[#4a1fc4] -rotate-[4deg] sm:top-0">
        <div className="absolute inset-0 rotate-[4deg] scale-110">
          {/* Orbiting "host" sphere */}
          <div className="absolute left-[6%] top-[14%] hidden sm:block">
            <div className="relative size-[290px]">
              <div className="absolute inset-0 rounded-full border border-white/30" />
              <div className="absolute inset-[38px] rounded-full border border-white/25" />
              <div className="orbit absolute inset-0"><span className="absolute -top-1.5 left-1/2 size-3 rounded-full bg-[#ffc94a]" /></div>
              <div className="sphere absolute inset-[78px] rounded-full" />
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] text-white/80 backdrop-blur">host · 1024 MB</span>
            </div>
          </div>
          {/* Isometric block stack */}
          <svg viewBox="0 0 260 260" className="float absolute right-[6%] top-[6%] w-[200px] sm:w-[280px]" aria-hidden="true">
            <IsoBox x={130} y={190} w={70} d={70} h={34} />
            <IsoBox x={130} y={150} w={70} d={70} h={34} tone="yellow" />
            <IsoBox x={130} y={110} w={70} d={70} h={34} />
          </svg>
          {/* Memory map panel */}
          <div className="absolute inset-x-[6%] top-[52%] rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-md sm:left-[38%] sm:right-[6%] sm:top-[58%]">
            <div className="flex items-center justify-between font-mono text-[11px] text-white/70">
              <span>physical memory</span><span>Best Fit · 64 MB → @512</span>
            </div>
            <div className="mt-3 flex h-10 overflow-hidden rounded-lg">
              {LAYOUT.map((seg, i) => (
                <div key={seg.id} style={{ width: `${(seg.size / DEMO.totalMemory) * 100}%`, background: seg.type === 'free' ? undefined : VM_TONES[Math.floor(i / 2) % 3] }}
                  className={`relative border-r border-[#4a1fc4] last:border-0 ${seg.type === 'free' ? 'hero-free' : ''}`}>
                  {seg.type === 'free' && seg.start === 512 && <span className="drop absolute inset-0 rounded-sm bg-white" />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-white/50"><span>0</span><span>512</span><span>1024 MB</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IsoBox({ x, y, w, d, h, tone = 'pink' }) {
  const c = tone === 'pink' ? ['#ffc2e0', '#ff7eb9', '#ff6a2b'] : ['#ffe39a', '#ffc94a', '#f39a1e']
  const dx = w * 0.87, dy = w * 0.5, ex = d * 0.87, ey = d * 0.5
  // F is the front corner of the top face; the box extends back-right (w) and back-left (d).
  const F = [x, y - h], R = [x + dx, y - h - dy], B = [x + dx - ex, y - h - dy - ey], L = [x - ex, y - h - ey]
  const down = (p) => [p[0], p[1] + h]
  const pts = (...ps) => ps.map((p) => p.join(',')).join(' ')
  return (
    <g>
      <polygon points={pts(L, F, down(F), down(L))} fill={c[1]} />
      <polygon points={pts(F, R, down(R), down(F))} fill={c[2]} />
      <polygon points={pts(F, R, B, L)} fill={c[0]} />
    </g>
  )
}

// The four app sections, laid out as an asymmetric bento grid.
function Sections({ open }) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, title: 'Dashboard', text: 'Host RAM statistics, a segmented memory map, the distribution chart and recent allocations at a glance.', cls: 'lg:col-span-7 bg-[#f5f2ff]', accent: '#5b34ea' },
    { id: 'vms', icon: Cpu, title: 'Virtual Machines', text: 'Add VMs with initial and maximum memory and a priority. Start, stop or delete them.', cls: 'lg:col-span-5 bg-[#fff6dc]', accent: '#c78a00' },
    { id: 'allocate', icon: HardDrive, title: 'Memory Allocation', text: 'Pick a VM, a size and an algorithm. A live hole table shows which hole each strategy would choose before you commit.', cls: 'lg:col-span-5 bg-[#ffeef6]', accent: '#d9327c' },
    { id: 'analytics', icon: BarChart3, title: 'Analytics & OS Concepts', text: 'Success and failure counts, internal and external fragmentation, the full history and short concept notes.', cls: 'lg:col-span-7 bg-[#f3f3f6]', accent: '#16131f' },
  ]
  return (
    <section className="px-5 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="reveal grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 className="font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:col-span-7">Four views of one <br className="hidden sm:block" />physical memory.</h2>
          <p className="text-[#16131f]/60 lg:col-span-5">Every view reads the same state. Allocate in one place and the map, the charts and the history update everywhere.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          {items.map(({ id, icon: Icon, title, text, cls, accent }, i) => (
            <button key={id} onClick={() => open(id)} style={{ '--d': `${i * 80}ms` }}
              className={`reveal group relative flex min-h-[220px] flex-col rounded-[24px] p-7 text-left transition hover:-translate-y-1 ${cls}`}>
              <span className="grid size-11 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: accent }}><Icon className="size-5" /></span>
              <h3 className="font-display mt-auto pt-10 text-2xl font-medium tracking-tight">{title}</h3>
              <p className="mt-2 max-w-md text-sm text-[#16131f]/60">{text}</p>
              <ArrowUpRight className="absolute right-6 top-6 size-5 text-[#16131f]/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#16131f]" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// Interactive preview: runs the real First/Best/Worst Fit code against the demo layout.
function AlgorithmPlayground({ open }) {
  const [algo, setAlgo] = useState('best-fit')
  const [request, setRequest] = useState(64)
  const size = Math.ceil(request / ALLOCATION_UNIT) * ALLOCATION_UNIT
  const result = useMemo(() => ALGORITHMS[algo].run(HOLES, size), [algo, size])
  const free = HOLES.reduce((t, h) => t + h.size, 0)
  let vmIndex = 0

  return (
    <section id="algorithms" className="scroll-mt-6 bg-[#f7f6fa] px-5 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
        <div className="reveal lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#5b34ea]">Try it here</p>
          <h2 className="font-display mt-3 text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl">Same request, three answers.</h2>
          <p className="mt-4 text-[#16131f]/60">The demo leaves holes of 128, 64 and 192 MB. Choose a strategy and a request size to see where the block lands.</p>
          <div className="mt-8 grid gap-2">
            {Object.entries(ALGORITHMS).map(([key, a]) => (
              <button key={key} onClick={() => setAlgo(key)}
                className={`rounded-2xl border px-5 py-4 text-left transition ${algo === key ? 'border-[#16131f] bg-white shadow-[0_8px_24px_-12px_rgba(22,19,31,0.35)]' : 'border-transparent hover:bg-white/70'}`}>
                <div className="flex items-center justify-between font-display text-lg font-medium">{a.label}{algo === key && <span className="size-2 rounded-full bg-[#5b34ea]" />}</div>
                {algo === key && <p className="mt-1 text-sm text-[#16131f]/60">{a.description}</p>}
              </button>
            ))}
          </div>
        </div>

        <div className="reveal lg:col-span-8" style={{ '--d': '120ms' }}>
          <div className="rounded-[28px] bg-white p-6 shadow-[0_30px_80px_-40px_rgba(22,19,31,0.35)] sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm text-[#16131f]/60">Request</span>
              {[64, 100, 160, 250].map((n) => (
                <button key={n} onClick={() => setRequest(n)}
                  className={`rounded-full px-4 py-1.5 font-mono text-sm transition ${request === n ? 'bg-[#16131f] text-white' : 'bg-[#f3f2f7] hover:bg-[#e9e7f0]'}`}>{n} MB</button>
              ))}
            </div>

            <div className="mt-8 flex h-24 overflow-hidden rounded-2xl border border-[#ecebf2]">
              {LAYOUT.map((seg) => {
                const w = `${(seg.size / DEMO.totalMemory) * 100}%`
                if (seg.type !== 'free') {
                  const tone = VM_TONES[vmIndex++ % 3]
                  return (
                    <div key={seg.id} style={{ width: w, background: tone }} className="flex flex-col justify-end border-r-2 border-white p-2.5 text-[#16131f]">
                      <span className="text-xs font-semibold">VM {vmIndex}</span>
                      <span className="font-mono text-[11px] opacity-70">{seg.size} MB</span>
                    </div>
                  )
                }
                const chosen = result.hole?.start === seg.start
                return (
                  <div key={seg.id} style={{ width: w }} className="free-stripes relative flex border-r-2 border-white last:border-0">
                    {chosen && (
                      <div key={`${algo}-${size}`} className="drop-in flex flex-col justify-end bg-[#5b34ea] p-2.5 text-white" style={{ width: `${(size / seg.size) * 100}%` }}>
                        <span className="text-xs font-semibold">new</span>
                        <span className="font-mono text-[11px] opacity-80">{size}</span>
                      </div>
                    )}
                    <span className="absolute right-2 top-2 font-mono text-[10px] text-[#16131f]/45">{seg.size}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-[#16131f]/40"><span>0 MB</span><span>256</span><span>512</span><span>768</span><span>1024</span></div>

            <div className={`mt-8 rounded-2xl p-5 text-sm ${result.hole ? 'bg-[#f5f2ff] text-[#2d1a7a]' : 'bg-[#fff0f5] text-[#8a1846]'}`}>
              {result.hole ? (
                <>
                  {result.reason}
                  {size > request && <span className="block mt-2 opacity-75">{request} MB rounds up to {size} MB, so {size - request} MB is lost to internal fragmentation.</span>}
                </>
              ) : (
                <>Rejected. {free} MB is free in total, but the largest hole is only {Math.max(...HOLES.map((h) => h.size))} MB. That is external fragmentation.</>
              )}
            </div>
            <button onClick={() => open('allocate')} className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#5b34ea]">
              Run it on the full simulator <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Concepts() {
  const items = [
    ['Contiguous allocation', 'Each block is one unbroken range of physical addresses, so where it lands matters.'],
    ['Coalescing', 'Releasing a block merges it with neighbouring holes into one larger free range.'],
    ['Internal fragmentation', `Requests round up to ${ALLOCATION_UNIT} MB units. The unused tail inside a block is wasted.`],
    ['External fragmentation', 'Enough memory is free in total, but it is split into holes too small for the request.'],
  ]
  return (
    <section id="concepts" className="scroll-mt-6 px-5 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
        <h2 className="reveal font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:col-span-5 lg:sticky lg:top-10 lg:self-start">The OS ideas you can see, not just read about.</h2>
        <ol className="lg:col-span-7">
          {items.map(([t, d], i) => (
            <li key={t} className="reveal grid grid-cols-[3rem_1fr] gap-4 border-t border-[#efedf4] py-7 last:border-b" style={{ '--d': `${i * 60}ms` }}>
              <span className="font-mono text-sm text-[#5b34ea]">0{i + 1}</span>
              <div>
                <h3 className="font-display text-2xl font-medium tracking-tight">{t}</h3>
                <p className="mt-2 text-[#16131f]/60">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
