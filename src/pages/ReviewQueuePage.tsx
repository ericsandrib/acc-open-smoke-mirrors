import { useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Tag as TagIcon,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { V2_LIFECYCLE_STATES, type V2QueuedAccount, type V2ReviewActionType } from '@/types/workflow-v2'
import { V2_SAMPLE_HISTORIES, V2_TRANSITIONS } from '@/lib/account-lifecycle'

/**
 * Review queue + lifecycle viewer.
 *
 * Two panels:
 *   1. The Review queue — single queue with multiple action types in
 *      parallel (§5.4). Demonstrates parallel review with consolidated NIGO.
 *   2. Lifecycle state machine — Appendix C states + transitions, with
 *      sample event histories that replay through the machine.
 */

const ACTION_COLORS: Record<V2ReviewActionType, string> = {
  'suitability-review': 'bg-orange-100 text-orange-900 border-orange-300',
  'best-interest-review': 'bg-violet-100 text-violet-900 border-violet-300',
  'compliance-review': 'bg-rose-100 text-rose-900 border-rose-300',
  'documentation-review': 'bg-stone-100 text-stone-800 border-stone-300',
  'sim-document-review': 'bg-amber-100 text-amber-900 border-amber-300',
}

// Fixture queue showing different shapes of parallel review.
const QUEUE: V2QueuedAccount[] = [
  {
    id: 'qa-reyes',
    client: 'Olivia Reyes',
    accountType: 'Joint Brokerage',
    enteredQueueAt: '2026-05-09T10:00:00Z',
    state: 'in_review',
    tags: ['suitability-review'],
    slaHours: 24,
    actions: [
      {
        type: 'suitability-review',
        assignedTo: 'Supervision queue',
        status: 'pending',
      },
    ],
  },
  {
    id: 'qa-foster',
    client: 'Henry Foster',
    accountType: 'Individual + Margin',
    enteredQueueAt: '2026-05-09T11:14:00Z',
    state: 'in_review',
    tags: ['suitability-review', 'compliance-review'],
    slaHours: 24,
    actions: [
      {
        type: 'suitability-review',
        assignedTo: 'Supervision queue',
        status: 'approved',
        reviewer: 'Aaron Pak',
        decidedAt: '2026-05-09T14:20:00Z',
      },
      {
        type: 'compliance-review',
        assignedTo: 'Compliance queue',
        status: 'nigo',
        reviewer: 'Marisol Yates',
        decidedAt: '2026-05-09T15:42:00Z',
        nigoDeficiencies: [
          { category: 'compliance_attribute', description: 'OBA verification record not on file for the account entity.' },
          { category: 'documentation', description: 'Missing signed ADV 2B disclosure for the secondary advisor.' },
        ],
      },
    ],
  },
  {
    id: 'qa-patel',
    client: 'Nina Patel',
    accountType: 'Traditional IRA',
    enteredQueueAt: '2026-05-10T08:42:00Z',
    state: 'in_review',
    tags: ['best-interest-review'],
    slaHours: 48,
    actions: [
      {
        type: 'best-interest-review',
        assignedTo: 'Best-Interest reviewer (OQ-10)',
        status: 'pending',
      },
    ],
  },
  {
    id: 'qa-bautista',
    client: 'Kyle Bautista',
    accountType: 'SIM (Separately-managed)',
    enteredQueueAt: '2026-05-10T09:01:00Z',
    state: 'in_review',
    tags: ['sim-document-review', 'documentation-review'],
    slaHours: 48,
    actions: [
      {
        type: 'sim-document-review',
        assignedTo: 'Operations queue',
        status: 'approved',
        reviewer: 'Jordan Lee',
        decidedAt: '2026-05-10T11:32:00Z',
      },
      {
        type: 'documentation-review',
        assignedTo: 'Operations queue',
        status: 'pending',
      },
    ],
  },
]

export function ReviewQueuePage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  )
}

function Body() {
  return (
    <div className="max-w-[1500px] mx-auto">
      <header className="mb-5">
        <Link
          to="/workflow"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to V2 workflow
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">
          Review queue + account lifecycle
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          One queue with multiple action types (suitability, best-interest,
          compliance, documentation, SIM). Reviewers act in parallel; any
          NIGO consolidates into a single round-trip to the advisor.
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Review queue ({QUEUE.length} accounts)
        </h2>
        <div className="space-y-3">
          {QUEUE.map((qa) => (
            <QueueRow key={qa.id} qa={qa} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Lifecycle state machine — Appendix C
        </h2>
        <LifecycleViewer />
      </section>
    </div>
  )
}

function QueueRow({ qa }: { qa: V2QueuedAccount }) {
  const allApproved = qa.actions.every((a) => a.status === 'approved')
  const anyNigo = qa.actions.some((a) => a.status === 'nigo')
  const consolidatedDeficiencies = qa.actions
    .filter((a) => a.status === 'nigo')
    .flatMap((a) => a.nigoDeficiencies ?? [])

  const hoursInQueue = Math.round(
    (Date.now() - new Date(qa.enteredQueueAt).getTime()) / (1000 * 60 * 60),
  )

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4',
        anyNigo ? 'border-rose-300 bg-rose-50/30' : allApproved ? 'border-emerald-300 bg-emerald-50/30' : 'border-border',
      )}
    >
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-muted-foreground">{qa.id}</span>
            <span className="inline-flex h-4 items-center rounded bg-muted px-1.5 text-[9px] font-bold uppercase tracking-wide text-foreground/80">
              {qa.state.replace('_', ' ')}
            </span>
            <span className="inline-flex h-4 items-center gap-1 rounded bg-stone-100 px-1.5 text-[9px] font-medium text-stone-700">
              <Clock className="h-2.5 w-2.5" />
              {hoursInQueue}h in queue / SLA {qa.slaHours}h
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {qa.client}
          </h3>
          <p className="text-xs text-muted-foreground">{qa.accountType}</p>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[300px] justify-end">
          {qa.tags.map((t) => (
            <span
              key={t}
              className={cn(
                'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-semibold',
                ACTION_COLORS[t],
              )}
            >
              <TagIcon className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
        </div>
      </header>

      {/* Parallel review actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
        {qa.actions.map((a) => (
          <div
            key={a.type}
            className={cn(
              'rounded-lg border px-3 py-2',
              a.status === 'approved' && 'border-emerald-200 bg-emerald-50',
              a.status === 'nigo' && 'border-rose-300 bg-rose-50',
              a.status === 'pending' && 'border-amber-200 bg-amber-50/60',
            )}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <ActionStatusIcon status={a.status} />
                <span className="text-xs font-semibold text-foreground">
                  {a.type}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {a.assignedTo}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={cn('font-bold uppercase tracking-wide',
                a.status === 'approved' && 'text-emerald-700',
                a.status === 'nigo' && 'text-rose-700',
                a.status === 'pending' && 'text-amber-700',
              )}>
                {a.status}
              </span>
              {a.reviewer && (
                <span className="text-muted-foreground">
                  {a.reviewer}
                  {a.decidedAt && ` · ${new Date(a.decidedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Consolidated NIGO — only when any reviewer rejected */}
      {anyNigo && (
        <div className="rounded-lg border-2 border-rose-400 bg-rose-50 p-3 mt-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertOctagon className="h-4 w-4 text-rose-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-rose-800">
              Consolidated NIGO to advisor
            </span>
            <span className="text-[10px] text-rose-700">
              ({consolidatedDeficiencies.length} deficienc{consolidatedDeficiencies.length === 1 ? 'y' : 'ies'} from {qa.actions.filter((a) => a.status === 'nigo').length} reviewer{qa.actions.filter((a) => a.status === 'nigo').length === 1 ? '' : 's'})
            </span>
          </div>
          <ul className="space-y-1">
            {consolidatedDeficiencies.map((d, i) => (
              <li key={i} className="text-xs text-rose-900 flex items-start gap-1.5">
                <span className="inline-flex h-4 items-center rounded bg-rose-200 px-1 text-[9px] font-bold uppercase tracking-wide text-rose-900 shrink-0 mt-0.5">
                  {d.category.replace('_', ' ')}
                </span>
                <span>{d.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ActionStatusIcon({ status }: { status: 'pending' | 'approved' | 'nigo' }) {
  if (status === 'approved')
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
  if (status === 'nigo')
    return <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
  return <Clock className="h-3.5 w-3.5 text-amber-600" />
}

// ─── Lifecycle viewer ──────────────────────────────────────────────────

function LifecycleViewer() {
  const [historyIdx, setHistoryIdx] = useState(0)
  const history = V2_SAMPLE_HISTORIES[historyIdx]

  // Track which states are visited in the selected history.
  const visited = useMemo(() => {
    const s = new Set<string>(['draft'])
    for (const ev of history.events) {
      s.add(ev.from)
      s.add(ev.to)
    }
    return s
  }, [history])

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      {/* Sample-history picker */}
      <div className="flex gap-2 flex-wrap mb-4">
        {V2_SAMPLE_HISTORIES.map((h, i) => (
          <button
            key={h.label}
            onClick={() => setHistoryIdx(i)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs transition-colors',
              historyIdx === i
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-white text-foreground hover:bg-muted/40',
            )}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* State map */}
        <div>
          <div className="grid grid-cols-3 gap-2">
            {V2_LIFECYCLE_STATES.map((s) => {
              const isCurrent = s.id === history.currentState
              const isVisited = visited.has(s.id)
              return (
                <div
                  key={s.id}
                  className={cn(
                    'rounded-lg border px-3 py-2 transition-all',
                    isCurrent && 'border-foreground bg-foreground text-background shadow-md',
                    !isCurrent && isVisited && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                    !isVisited && 'border-border bg-white text-muted-foreground opacity-60',
                  )}
                >
                  <div className="text-[9px] font-mono opacity-70 mb-0.5">{s.id}</div>
                  <div className="text-xs font-semibold leading-tight">{s.name}</div>
                  <p className="text-[10px] mt-1 leading-tight opacity-80 line-clamp-2">
                    {s.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Event log */}
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Transition history ({history.events.length})
          </div>
          <ol className="space-y-2">
            {history.events.map((ev, i) => (
              <li key={i} className="text-[11px]">
                <div className="font-mono text-muted-foreground mb-0.5">
                  {new Date(ev.at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                <div className="flex items-center gap-1 text-foreground/80">
                  <span className="font-mono">{ev.from}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-mono font-semibold text-foreground">
                    {ev.to}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground italic mt-0.5">
                  {ev.actor} — {ev.trigger}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Transition table */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-foreground">
          Allowed transitions ({V2_TRANSITIONS.length}) — full table
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono">
          {V2_TRANSITIONS.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 text-foreground/80">
              <span>{t.from}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold text-foreground">{t.to}</span>
              <span className="text-muted-foreground text-[9px]">
                · {t.actorRole}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
