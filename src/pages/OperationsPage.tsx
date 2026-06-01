import { useMemo } from 'react'
import { AlertTriangle, Clock, Workflow, Activity } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useServicing } from '@/stores/servicingStore'
import type { JourneyAction } from '@/types/servicing'
import { cn } from '@/lib/utils'

type Sla = 'breach' | 'at_risk' | 'on_track' | 'done'

function slaOf(a: JourneyAction): Sla {
  if (a.tasks.some((t) => t.status === 'blocked')) return 'breach'
  if (a.tasks.some((t) => t.status === 'awaiting_review')) return 'at_risk'
  return a.status === 'complete' ? 'done' : 'on_track'
}

const SLA_BADGE: Record<Sla, string> = {
  breach: 'bg-red-100 text-red-700',
  at_risk: 'bg-amber-100 text-amber-700',
  on_track: 'bg-emerald-100 text-emerald-700',
  done: 'bg-slate-100 text-slate-600',
}
const SLA_LABEL: Record<Sla, string> = { breach: 'Past SLA', at_risk: 'At risk', on_track: 'On track', done: 'Complete' }

function MetricCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs"><Icon className="h-4 w-4" /> {label}</div>
      <div className={cn('text-2xl font-semibold tabular-nums mt-1', tone)}>{value}</div>
    </div>
  )
}

export function OperationsPage() {
  const { allActions, allTasks } = useServicing()

  const m = useMemo(() => {
    const open = allActions.filter((a) => a.status !== 'complete')
    const distributions = allActions
      .filter((a) => a.category === 'Move Money' && a.title === 'Distribution')
      .map((a) => ({ a, sla: slaOf(a) }))
    const breaches = distributions.filter((d) => d.sla === 'breach').length
    const awaiting = allActions.filter((a) => a.status === 'awaiting_review').length

    const byCategory = new Map<string, number>()
    open.forEach((a) => byCategory.set(a.category ?? 'Other', (byCategory.get(a.category ?? 'Other') ?? 0) + 1))

    const taskCounts = new Map<string, number>()
    allTasks.forEach((t) => {
      if (t.status === 'in_progress' || t.status === 'blocked' || t.status === 'awaiting_review') {
        taskCounts.set(t.title, (taskCounts.get(t.title) ?? 0) + 1)
      }
    })
    const bottlenecks = [...taskCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    return { open: open.length, distributions, breaches, awaiting, byCategory: [...byCategory.entries()], bottlenecks }
  }, [allActions, allTasks])

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Operations</h1>
        <p className="text-sm text-muted-foreground mb-5">SLA monitoring, bottleneck visibility, and workflow throughput across the book.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={Workflow} label="Open actions" value={m.open} />
          <MetricCard icon={AlertTriangle} label="Distributions past SLA" value={m.breaches} tone={m.breaches ? 'text-red-600' : undefined} />
          <MetricCard icon={Clock} label="Awaiting review" value={m.awaiting} tone={m.awaiting ? 'text-amber-600' : undefined} />
          <MetricCard icon={Activity} label="Distributions in flight" value={m.distributions.filter((d) => d.sla !== 'done').length} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distributions SLA */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Distributions — SLA status</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {m.distributions.map(({ a, sla }) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{a.nickname || a.description}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', SLA_BADGE[sla])}>{SLA_LABEL[sla]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottlenecks */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Bottlenecks — open work by step</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {m.bottlenecks.map(([title, count]) => (
                <div key={title} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-foreground/90 truncate">{title}</span>
                  <span className="shrink-0 inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-muted px-2 text-xs font-medium tabular-nums text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>

            <h2 className="text-sm font-semibold text-foreground mt-5 mb-2">Open actions by category</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {m.byCategory.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-foreground/90">{cat}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
