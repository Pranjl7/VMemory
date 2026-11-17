import { Activity as ActivityIcon, ArrowRight, Gauge, HardDrive, MemoryStick, PackageOpen } from 'lucide-react'
import MemoryMap from '../components/MemoryMap.jsx'
import Activity from '../components/Activity.jsx'
import DistributionChart from '../components/DistributionChart.jsx'
import { Badge, Button, Card, Stat, mb, pct, vmColor } from '../components/ui.jsx'

export default function Dashboard({ sim }) {
  const { state, stats, go } = sim
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={HardDrive} label="Total Host RAM" value={mb(stats.total)} sub="Physical memory on the host" />
        <Stat icon={MemoryStick} label="Allocated Memory" value={mb(stats.allocated)} sub={`${state.blocks.length} blocks across ${stats.running} running VMs`} />
        <Stat icon={PackageOpen} label="Available Memory" value={mb(stats.available)} sub={`${stats.holes.length} free holes · largest ${mb(stats.largestHole)}`} accent="bg-emerald-50 text-emerald-600" />
        <Stat icon={Gauge} label="Memory Utilization" value={pct(stats.utilization)} sub="Allocated ÷ total host RAM" accent="bg-amber-50 text-amber-600" />
      </div>

      <Card title="Physical Memory Map" subtitle="How the host's RAM is divided between virtual machines, from address 0 to the top of memory."
        action={<Button variant="secondary" onClick={() => go('allocate')}>Open simulator <ArrowRight className="size-4" /></Button>}>
        <MemoryMap state={state} height="h-24" />
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Memory Distribution" subtitle="Share of host RAM held by each VM" className="lg:col-span-2">
          <DistributionChart state={state} stats={stats} />
        </Card>
        <Card title="Active Virtual Machines" className="lg:col-span-3"
          action={<Button variant="ghost" onClick={() => go('vms')}>Manage</Button>}>
          <ul className="divide-y divide-line">
            {state.vms.map((vm) => (
              <li key={vm.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="size-3 rounded-full" style={{ background: vmColor(vm) }} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{vm.name}</span>
                <Badge tone={vm.status}>{vm.status}</Badge>
                <span className="w-32 text-right font-mono text-xs text-muted">{vm.allocatedMemory} / {vm.maximumMemory} MB</span>
              </li>
            ))}
            {!state.vms.length && <li className="text-sm text-muted">No virtual machines. Load the demo data or add a VM.</li>}
          </ul>
        </Card>
      </div>

      <Card title="Recent Allocation Activity" action={<ActivityIcon className="size-4 text-muted" />}>
        <Activity history={state.history} limit={5} />
      </Card>
    </div>
  )
}
