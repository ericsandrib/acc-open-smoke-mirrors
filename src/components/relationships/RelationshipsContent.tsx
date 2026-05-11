import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Info,
  BarChart3,
  UsersRound,
  ArrowUpDown,
  Filter,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  type Relationship,
  type RelationshipType,
} from '@/data/relationshipsSeed'
import {
  useRelationships,
  useRelationshipMetrics,
} from '@/db/queries/relationships'
import { cn } from '@/lib/utils'
import { ConfigHotspot } from '@/components/config-overlay'

// --- summary cards ---------------------------------------------------------

interface KpiCardProps {
  status: 'Prospective' | 'New' | 'Existing'
  left: { label: string; value: React.ReactNode }
  right: { label: string; value: React.ReactNode }
  active?: boolean
}

function KpiCard({ status, left, right, active }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl px-5 py-4 min-w-[230px] flex flex-col gap-3 transition-colors',
        active
          ? 'bg-white border border-border shadow-sm'
          : 'bg-muted/50 border border-transparent',
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <BarChart3 className="h-4 w-4 text-rose-500" />
        <span>{status}</span>
        <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
      </div>
      <div className="flex items-start gap-10 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">{left.label}</div>
          <div className="text-foreground font-semibold mt-1">{left.value}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">{right.label}</div>
          <div className="text-foreground font-semibold mt-1">{right.value}</div>
        </div>
      </div>
    </div>
  )
}

// --- view tabs -------------------------------------------------------------

type ViewTab =
  | 'all'
  | 'prospective'
  | 'onboarding'
  | 'existing'
  | 'transferred'
  | 'tax-documents'
  | 'more'

const TAB_TYPE_FILTER: Record<ViewTab, RelationshipType | null> = {
  all: null,
  prospective: 'Prospect',
  onboarding: 'Onboarding',
  existing: 'Existing',
  transferred: null,
  'tax-documents': null,
  more: null,
}

function ViewTabs({
  active,
  onChange,
  counts,
}: {
  active: ViewTab
  onChange: (v: ViewTab) => void
  counts: { all: number; prospective: number; onboarding: number; existing: number; transferred: number }
}) {
  const t = counts
  const tabs: {
    id: ViewTab
    label: string
    count?: number
    badge?: string
    truncate?: boolean
  }[] = [
    { id: 'all', label: 'All', count: t.all },
    { id: 'prospective', label: 'Prospective', count: t.prospective },
    { id: 'onboarding', label: 'Onboarding', count: t.onboarding },
    { id: 'existing', label: 'Existing', count: t.existing },
    { id: 'transferred', label: 'Transferred', count: t.transferred },
    { id: 'tax-documents', label: 'Tax Documents', truncate: true },
    { id: 'more', label: 'More' },
  ]
  return (
    <div className="border-b border-border flex items-center gap-6 text-sm overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 py-2.5 -mb-px border-b-2 transition-colors whitespace-nowrap',
            active === tab.id
              ? 'border-foreground text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span
              className={cn(
                'inline-flex items-center justify-center h-5 min-w-[22px] rounded-full text-xs font-medium px-1.5',
                active === tab.id
                  ? 'bg-muted text-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {tab.count}
            </span>
          )}
          {tab.truncate && (
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          )}
          {tab.badge && (
            <Badge className="ml-1 h-5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-[10px] font-semibold rounded">
              {tab.badge}
            </Badge>
          )}
        </button>
      ))}
    </div>
  )
}

// --- action bar ------------------------------------------------------------

function ActionBar() {
  return (
    <div className="flex items-center justify-between py-3 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-9 gap-2 text-sm font-medium"
        >
          <UsersRound className="h-4 w-4" />
          My Relationships
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-md h-9 gap-2 text-sm"
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-md h-9 gap-2 text-sm"
        >
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-md"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-md h-9 gap-2 text-sm"
        >
          <LayoutGrid className="h-4 w-4" />
          Display
        </Button>
      </div>
    </div>
  )
}

// --- table -----------------------------------------------------------------

function AdvisorBadge({
  name,
  initials,
}: {
  name: string
  initials: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-[10px] font-semibold">
        {initials}
      </div>
      <span className="text-sm text-foreground">{name}</span>
    </div>
  )
}

function formatMoney(n: number | null) {
  if (n === null || n === undefined) return ''
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function RelationshipsTable({ rows }: { rows: Relationship[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/40 text-left text-xs text-muted-foreground border-y border-border">
            <th className="px-4 py-2.5 font-medium min-w-[260px]">Relationship</th>
            <th className="px-4 py-2.5 font-medium min-w-[200px]">Advisor</th>
            <th className="px-4 py-2.5 font-medium min-w-[140px]">Type</th>
            <th className="px-4 py-2.5 font-medium min-w-[140px] text-right">AUM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-border hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-muted-foreground" />
                  <Link
                    to={`/relationships/${r.id}`}
                    className="underline underline-offset-2 text-foreground hover:text-primary"
                  >
                    {r.household}
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3">
                <AdvisorBadge
                  name={r.advisor}
                  initials={r.advisorInitials}
                />
              </td>
              <td className="px-4 py-3 text-foreground/90">{r.type}</td>
              <td className="px-4 py-3 text-foreground/90 tabular-nums text-right">
                {formatMoney(r.aum)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- pagination ------------------------------------------------------------

function Pagination() {
  const [page, setPage] = useState(1)
  const pages = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center justify-center gap-1 pt-6 pb-0">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30"
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={cn(
            'h-8 w-8 rounded-md text-sm font-medium',
            page === p
              ? 'bg-foreground text-background'
              : 'text-foreground hover:bg-muted',
          )}
        >
          {p}
        </button>
      ))}
      <span className="px-1.5 text-muted-foreground text-sm">…</span>
      <button
        onClick={() => setPage((p) => p + 1)}
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// --- main ------------------------------------------------------------------

export function RelationshipsContent() {
  const [view, setView] = useState<ViewTab>('all')
  const { data: all } = useRelationships()
  const { data: metrics } = useRelationshipMetrics()

  const m =
    metrics ?? {
      totalClients: 0,
      prospective: { total: 0, targetedAum: '0' },
      new: { total: 0, aum: '0' },
      existing: { total: 0, aum: '0' },
      tabs: { all: 0, prospective: 0, onboarding: 0, existing: 0, transferred: 0 },
    }

  const rows = useMemo(() => {
    const source = all ?? []
    const filter = TAB_TYPE_FILTER[view]
    if (!filter) return source
    return source.filter((r) => r.type === filter)
  }, [all, view])

  return (
    <div className="relative max-w-[1400px] mx-auto -mt-2">
      {/* Section-level hotspot — the "Relationships list" parent */}
      <ConfigHotspot
        knobId="relationships/list"
        anchor="top-right"
        size="md"
        className="!top-0 !right-0"
      />

      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-5">
        Relationships
      </h1>

      {/* KPI summary cards — Header metrics knob */}
      <div className="relative flex items-stretch gap-3 mb-6 flex-wrap pr-10">
        <ConfigHotspot
          knobId="relationships/list/header-metrics"
          anchor="top-right"
          size="md"
          area="region"
          className="!top-0 !right-0"
        />
        <KpiCard
          status="Prospective"
          left={{ label: 'Total', value: m.prospective.total }}
          right={{
            label: 'Targeted AUM',
            value: `$${m.prospective.targetedAum}`,
          }}
        />
        <KpiCard
          status="New"
          left={{ label: 'Total', value: m.new.total }}
          right={{ label: 'AUM', value: `$${m.new.aum}` }}
        />
        <KpiCard
          status="Existing"
          left={{ label: 'Total', value: m.existing.total }}
          right={{ label: 'AUM', value: `$${m.existing.aum}` }}
        />
      </div>

      {/* View tabs — Default views knob */}
      <div className="relative pr-10">
        <ConfigHotspot
          knobId="relationships/list/default-views"
          anchor="middle-right"
          size="sm"
          className="!right-0"
        />
        <ViewTabs active={view} onChange={setView} counts={m.tabs} />
      </div>

      <ActionBar />

      {/* Table — Columns knob */}
      <div className="relative">
        <ConfigHotspot
          knobId="relationships/list/columns"
          anchor="top-right"
          size="md"
          area="region"
          className="!top-2 !right-2"
        />
        <RelationshipsTable rows={rows} />
      </div>

      <Pagination />
    </div>
  )
}
