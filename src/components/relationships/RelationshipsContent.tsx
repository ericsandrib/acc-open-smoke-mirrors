import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  Info,
  BarChart3,
  UsersRound,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Download,
  LayoutGrid,
} from 'lucide-react'
import { AccessoryBar } from '@/components/accessory-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RELATIONSHIPS_SEED,
  RELATIONSHIP_METRICS,
  type Relationship,
} from '@/data/relationshipsSeed'
import { cn } from '@/lib/utils'

// --- top metric cards ------------------------------------------------------

function MetricCard({
  label,
  value,
  hint,
  tall,
}: {
  label: string
  value: React.ReactNode
  hint?: boolean
  tall?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card px-5 py-3 flex flex-col justify-center min-w-[200px]',
        tall && 'row-span-2',
      )}
    >
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>{label}</span>
        {hint && <Info className="h-3.5 w-3.5 opacity-60" />}
      </div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  )
}

function ProspectCard({
  status,
  left,
  right,
}: {
  status: 'Prospective' | 'New' | 'Existing'
  left: { label: string; value: React.ReactNode }
  right: { label: string; value: React.ReactNode }
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3 min-w-[220px] flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm text-foreground font-medium">
        <BarChart3 className="h-4 w-4 text-rose-500" />
        <span>{status}</span>
        <Info className="h-3.5 w-3.5 opacity-50" />
      </div>
      <div className="flex items-center gap-8 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">{left.label}</div>
          <div className="text-foreground font-medium mt-0.5">{left.value}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">{right.label}</div>
          <div className="text-foreground font-medium mt-0.5">{right.value}</div>
        </div>
      </div>
    </div>
  )
}

// --- view tabs -------------------------------------------------------------

type ViewTab = 'all' | 'default' | 'prospects' | 'more'

function ViewTabs({ active, onChange }: { active: ViewTab; onChange: (v: ViewTab) => void }) {
  const tabs: { id: ViewTab; label: string; count?: number; badge?: string }[] = [
    { id: 'all', label: 'All', count: RELATIONSHIPS_SEED.length },
    { id: 'default', label: 'Default', count: 196 },
    { id: 'prospects', label: 'Prospects', count: RELATIONSHIPS_SEED.filter((r) => r.type === 'Prospective').length },
    { id: 'more', label: 'More', badge: 'New' },
  ]
  return (
    <div className="border-b border-border flex items-center gap-6 text-sm">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 py-2 -mb-px border-b-2 transition-colors',
            active === t.id
              ? 'border-foreground text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="inline-flex items-center justify-center h-5 min-w-[22px] rounded-full bg-muted text-xs font-medium px-1.5 text-muted-foreground">
              {t.count}
            </span>
          )}
          {t.badge && (
            <Badge className="ml-1 h-5 bg-emerald-100 text-emerald-800 border-0 text-[10px] font-semibold">
              {t.badge}
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
        <Button variant="outline" size="sm" className="rounded-md h-9 gap-2 text-sm">
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </Button>
        <Button variant="outline" size="sm" className="rounded-md h-9 gap-2 text-sm">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
          <LayoutGrid className="h-4 w-4" />
          Display
        </Button>
      </div>
    </div>
  )
}

// --- table -----------------------------------------------------------------

function formatMoney(n: number | null) {
  if (n === null || n === undefined) return ''
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

const COLUMNS: {
  key: keyof Relationship
  label: string
  width?: string
  render?: (r: Relationship) => React.ReactNode
}[] = [
  {
    key: 'relationship',
    label: 'Relationship',
    width: 'min-w-[180px]',
    render: (r) => (
      <div className="flex items-center gap-2">
        <UsersRound className="h-4 w-4 text-muted-foreground" />
        <Link
          to={`/relationships/${r.id}`}
          className="underline underline-offset-2 text-foreground hover:text-primary"
        >
          {r.relationship}
        </Link>
      </div>
    ),
  },
  { key: 'advisor', label: 'Advisor', width: 'min-w-[140px]' },
  { key: 'type', label: 'Type', width: 'min-w-[110px]' },
  { key: 'product', label: 'Product', width: 'min-w-[120px]' },
  {
    key: 'aum',
    label: 'AUM',
    width: 'min-w-[120px]',
    render: (r) => <span>{formatMoney(r.aum)}</span>,
  },
  { key: 'lastMeeting', label: 'Last Meeting', width: 'min-w-[130px]' },
  { key: 'nextMeeting', label: 'Next Meeting', width: 'min-w-[130px]' },
  { key: 'updatedAt', label: 'Updated At', width: 'min-w-[110px]' },
  {
    key: 'premium',
    label: 'Premium',
    width: 'min-w-[110px]',
    render: (r) => <span>{formatMoney(r.premium)}</span>,
  },
  { key: 'firm', label: 'Firm', width: 'min-w-[110px]' },
  { key: 'zipCode', label: 'Zip Code', width: 'min-w-[100px]' },
  { key: 'status', label: 'Status', width: 'min-w-[200px]' },
]

function RelationshipsTable({ rows }: { rows: Relationship[] }) {
  return (
    <div className="mt-3 border-t border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
            {COLUMNS.map((c) => (
              <th key={String(c.key)} className={cn('px-4 py-2.5 font-medium', c.width)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border hover:bg-muted/30">
              {COLUMNS.map((c) => (
                <td key={String(c.key)} className={cn('px-4 py-3 text-foreground/90', c.width)}>
                  {c.render ? c.render(r) : ((r[c.key] as string) ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- main ------------------------------------------------------------------

export function RelationshipsContent() {
  const [view, setView] = useState<ViewTab>('all')
  const m = RELATIONSHIP_METRICS

  const rows = useMemo(() => {
    if (view === 'prospects') return RELATIONSHIPS_SEED.filter((r) => r.type === 'Prospective')
    return RELATIONSHIPS_SEED
  }, [view])

  return (
    <div className="max-w-7xl mx-auto">
      <AccessoryBar
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        currentPage="Relationships"
        showBackButton={false}
        showBorder={false}
        className="-mt-6 mb-2"
      />

      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-4">
        Relationships
      </h1>

      {/* Top metric row — mercer-top header layout */}
      <div className="flex items-stretch gap-3 mb-4 flex-wrap">
        <MetricCard
          tall
          label="Total Clients"
          value={m.totalClients}
          hint
        />
        <MetricCard label="Total AUM (Wealth)" value={`$${m.totalAumWealth}`} hint />
        <MetricCard label="Annualized Premium Life" value={`$${m.annualizedPremiumLife}`} hint />
        <MetricCard
          label="Annualized Premium Disability"
          value={`$${m.annualizedPremiumDisability}`}
          hint
        />
      </div>

      {/* Prospect / New / Existing summary cards */}
      <div className="flex items-stretch gap-3 mb-5 flex-wrap">
        <ProspectCard
          status="Prospective"
          left={{ label: 'Total', value: m.prospective.total }}
          right={{ label: 'Targeted AUM', value: `$${m.prospective.targetedAum}` }}
        />
        <ProspectCard
          status="New"
          left={{ label: 'Total', value: m.new.total }}
          right={{ label: 'AUM', value: `$${m.new.aum}` }}
        />
        <ProspectCard
          status="Existing"
          left={{ label: 'Total', value: m.existing.total }}
          right={{ label: 'AUM', value: `$${m.existing.aum}` }}
        />
      </div>

      <ViewTabs active={view} onChange={setView} />
      <ActionBar />
      <RelationshipsTable rows={rows} />

      {/* Footer micro-copy explaining the mapping intent */}
      <p className="mt-6 text-xs text-muted-foreground max-w-3xl">
        Columns map to the Stratos Data Dictionary → Orion / Salesforce fields.
        Relationship (S243 · SF-CT), Advisor (S195 · SF-FA · IAR Name),
        Type (S244 · Contact Type), AUM (S141/S142 · Household totals),
        Firm (S093 · Broker-Dealer Firm Name), Zip Code (S042).
      </p>
    </div>
  )
}
