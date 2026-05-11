import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Calendar,
  ArrowDown,
  ArrowUpRight,
  Info,
  Briefcase,
  ClipboardList,
  Scale,
  Landmark,
  Umbrella,
  Building2,
  Pencil,
  Bell,
  Users,
  Workflow,
  CircleDot,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type Relationship,
} from '@/data/relationshipsSeed'
import { useRelationship } from '@/db/queries/relationships'
import { useFinancialAccounts } from '@/db/queries/detail'
import { cn } from '@/lib/utils'
import { ConfigHotspot } from '@/components/config-overlay'
import { NaField } from '@/components/orion/NaField'
import { InvestmentsOverview } from './tabs/InvestmentsOverview'
import { PlanningTab } from './tabs/PlanningTab'
import { ServicingTab } from './tabs/ServicingTab'
import { BillingTab } from './tabs/BillingTab'
import { CommunicationsTab } from './tabs/CommunicationsTab'
import { DocumentsTab } from './tabs/DocumentsTab'
import { HouseholdTab } from './tabs/HouseholdTab'

// --- helpers ---------------------------------------------------------------

function formatMoney(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatMoneyTight(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

// --- header ----------------------------------------------------------------

function DetailHeader({ r }: { r: Relationship }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-tight">
            {r.household}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {r.type}
            {r.clientSince ? ` • Client since ${r.clientSince}` : ''}
          </p>
        </div>
      </div>
      <div />
    </div>
  )
}

// --- detail tabs ------------------------------------------------------------

const DETAIL_TABS = [
  'Overview',
  'Household',
  'Investments',
  'Planning',
  'Servicing',
  'Billing',
  'Communications',
  'Documents',
] as const
type DetailTab = (typeof DETAIL_TABS)[number]

const TAB_KNOB_ID: Partial<Record<DetailTab, string>> = {
  Overview: 'relationships/detail/tabs/overview',
  Household: 'relationships/detail/tabs/household',
  Investments: 'relationships/detail/tabs/investments',
  Servicing: 'relationships/detail/tabs/servicing',
  Communications: 'relationships/detail/tabs/communications',
  Documents: 'relationships/detail/tabs/documents',
}

function DetailTabs({
  active,
  onChange,
}: {
  active: DetailTab
  onChange: (t: DetailTab) => void
}) {
  return (
    <div className="border-b border-border flex items-center gap-6 text-sm overflow-x-auto">
      {DETAIL_TABS.map((t) => {
        const knobId = TAB_KNOB_ID[t]
        return (
          <div key={t} className="relative inline-flex items-center">
            <button
              onClick={() => onChange(t)}
              className={cn(
                'py-2.5 -mb-px border-b-2 transition-colors whitespace-nowrap',
                active === t
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
            {knobId && (
              <ConfigHotspot
                knobId={knobId}
                anchor="inline"
                size="sm"
                className="ml-1"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- financial accounts panel ----------------------------------------------

type SubTab = 'Accounts' | 'RMDs' | 'SLOAs'

function PanelHeader({ count, subTab }: { count: number; subTab: SubTab }) {
  return (
    <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Financial Accounts
        </h2>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {subTab === 'Accounts' && (
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <ArrowDown className="h-3.5 w-3.5" />
              Sort{' '}
              <span className="text-muted-foreground font-normal ml-1">
                Total Balance
              </span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              Open Accounts
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </>
        )}
        {subTab === 'RMDs' && (
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <ArrowDown className="h-3.5 w-3.5" />
              Sort{' '}
              <span className="text-muted-foreground font-normal ml-1">
                Year
              </span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create New RMD
            </Button>
          </>
        )}
        {subTab === 'SLOAs' && (
          <>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <ArrowDown className="h-3.5 w-3.5 rotate-180" />
              Sort{' '}
              <span className="text-muted-foreground font-normal ml-1">
                Account Name
              </span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              Active SLOAs
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function SubTabs({
  active,
  onChange,
}: {
  active: SubTab
  onChange: (t: SubTab) => void
}) {
  return (
    <div className="px-5 border-b border-border flex items-center gap-5 text-sm">
      {(['Accounts', 'RMDs', 'SLOAs'] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'py-2 -mb-px border-b-2 transition-colors',
            active === t
              ? 'border-foreground text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function PanelFooter({
  pageSizeDefault = 5,
  total,
}: {
  pageSizeDefault?: number
  total: number
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
          {pageSizeDefault}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <span>1-{total} of {total}</span>
        <button
          className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
          disabled
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="h-6 w-6 rounded bg-foreground text-background text-xs font-medium">
          1
        </button>
        <button
          className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
          disabled
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function FidelityIcon({ size = 32 }: { size?: number }) {
  // Fidelity squircle mark: dark-green rounded square with a white circle,
  // a centered pyramid, and sunburst rays radiating from behind the pyramid.
  const stroke = Math.max(1, size * 0.025)
  const cx = 50
  const cy = 50
  const rOuter = 30
  // 16 rays around the top half-circle (-180deg to 0deg, i.e. above horizon)
  const rays = Array.from({ length: 17 }, (_, i) => {
    const angle = (-180 + (i * 180) / 16) * (Math.PI / 180)
    const inner = 6
    const outer = rOuter - 2
    return {
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy + Math.sin(angle) * outer,
    }
  })
  return (
    <div
      className="shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark green rounded-square background */}
        <rect x="2" y="2" width="96" height="96" rx="22" ry="22" fill="#1B5E3F" />
        {/* White circle outline */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          fill="none"
          stroke="#ffffff"
          strokeWidth={stroke * 1.2}
        />
        {/* Sunburst rays in upper half */}
        <g stroke="#ffffff" strokeWidth={stroke * 1.4} strokeLinecap="round">
          {rays.map((ray, i) => (
            <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
          ))}
        </g>
        {/* Pyramid */}
        <polygon points="50,28 68,72 32,72" fill="#ffffff" />
        {/* Pyramid front-face shading line */}
        <line
          x1="50"
          y1="28"
          x2="50"
          y2="72"
          stroke="#1B5E3F"
          strokeWidth={stroke * 0.8}
        />
      </svg>
    </div>
  )
}

// Backwards-compat alias kept for anywhere we call it positionally.
function AccountIconCircle(_: { letter: string }) {
  return <FidelityIcon size={32} />
}

// --- Accounts sub-tab content ---------------------------------------------

interface AccountRow {
  id: string
  accountName: string
  custodianId: string
  investmentProgram: string
  accountNumber: string
  totalBalance: number
  cashBalance: number
  sloas: number
  rmds: number
  // Slide-over detail fields
  accountType: string
  opened: string
  status: 'Open' | 'Closed' | 'Pending'
  custodian: string
  pms: string
  qualified: 'Yes' | 'No'
  closed?: string
  /** Orion-derived attributes for the Stratos field map; null for missing. */
  orion: Record<string, unknown> | null
}

function useDbAccounts(r: Relationship): AccountRow[] {
  const { data } = useFinancialAccounts(r.id)
  if (!data) return []
  return data.map<AccountRow>((a) => ({
    id: a.id,
    accountName: `${r.household} ; ${a.name}`,
    custodianId: `${a.custodian}-${a.accountNumber}`,
    investmentProgram: 'Core Portfolio (ETF)',
    accountNumber: a.accountNumber,
    totalBalance: a.balance,
    cashBalance: a.cashBalance,
    sloas: 0,
    rmds: 0,
    accountType: a.name,
    opened: r.clientSince ?? '—',
    status:
      a.status === 'active' || a.status === 'Open'
        ? 'Open'
        : a.status === 'closed' || a.status === 'Closed'
        ? 'Closed'
        : 'Pending',
    custodian: `${a.custodian}-${a.accountNumber}`,
    pms: 'Orion',
    qualified: a.taxStatus === 'tax-deferred' || a.taxStatus === 'tax-free' ? 'Yes' : 'No',
    orion: a.orion,
  }))
}

function AccountsContent({
  r,
  onSelect,
}: {
  r: Relationship
  onSelect: (a: AccountRow) => void
}) {
  const accounts = useDbAccounts(r)
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-y border-border">
              <th className="px-5 py-2.5 font-medium">Account</th>
              <th className="px-5 py-2.5 font-medium">Investment Program</th>
              <th className="px-5 py-2.5 font-medium">Account Number</th>
              <th className="px-5 py-2.5 font-medium text-right">Total Balance</th>
              <th className="px-5 py-2.5 font-medium">SLOAs</th>
              <th className="px-5 py-2.5 font-medium">RMDs</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr
                key={a.id}
                onClick={() => onSelect(a)}
                className="border-b border-border hover:bg-muted/40 cursor-pointer"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <FidelityIcon size={32} />
                    <div className="leading-tight">
                      <div className="text-sm text-foreground">
                        {a.accountName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.custodianId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground/90">
                  {a.investmentProgram}
                </td>
                <td className="px-5 py-3 text-foreground/90 tabular-nums">
                  {a.accountNumber}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  <div className="leading-tight">
                    <div className="text-foreground">
                      {formatMoney(a.totalBalance)}
                    </div>
                    <div className="text-xs text-muted-foreground underline underline-offset-2">
                      Cash {formatMoney(a.cashBalance)}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground/90">
                  {a.sloas}
                </td>
                <td className="px-5 py-3 text-foreground/90">
                  {a.rmds}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-b border-border">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Open New Account
        </button>
      </div>
    </>
  )
}

// --- RMDs sub-tab content -------------------------------------------------

function RmdsContent({ r }: { r: Relationship }) {
  const rmds = [
    {
      id: 'rmd-1',
      year: 2025,
      accountName: `${r.household.split(' ')[0]} Corona...`,
      custodian: 'Fidelity-G15391056',
      accountNumber: '655158348',
      outsideAccountNumber: '-',
      rmdAmount: 0,
      ytdDistributions: 0,
      remainingBalance: 0,
      status: 'Completed',
    },
  ]
  return (
    <>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            The RMD information shown below is not updated in real time. Please
            reference the Custodian's website for the real time value.{' '}
            <a className="underline underline-offset-2 text-foreground" href="#">
              Click here
            </a>{' '}
            to learn more about how and when the information displayed here is
            updated.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-y border-border">
              <th className="px-5 py-2.5 font-medium">Year</th>
              <th className="px-5 py-2.5 font-medium">Account Name</th>
              <th className="px-5 py-2.5 font-medium">Account Number</th>
              <th className="px-5 py-2.5 font-medium">Outside Account Number</th>
              <th className="px-5 py-2.5 font-medium">RMD Amount</th>
              <th className="px-5 py-2.5 font-medium">YTD Distributions</th>
              <th className="px-5 py-2.5 font-medium">Remaining Balance</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rmds.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-5 py-3 text-foreground">{row.year}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <AccountIconCircle letter={row.accountName[0]!} />
                    <div className="leading-tight">
                      <div className="text-sm text-foreground">
                        {row.accountName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.custodian}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground/90 tabular-nums">
                  {row.accountNumber}
                </td>
                <td className="px-5 py-3 text-foreground/90">
                  {row.outsideAccountNumber}
                </td>
                <td className="px-5 py-3 text-foreground/90 tabular-nums">
                  {formatMoney(row.rmdAmount)}
                </td>
                <td className="px-5 py-3 text-foreground/90 tabular-nums">
                  {formatMoney(row.ytdDistributions)}
                </td>
                <td className="px-5 py-3 text-foreground/90 tabular-nums">
                  {formatMoney(row.remainingBalance)}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// --- SLOAs sub-tab content ------------------------------------------------

function SloasContent({ r }: { r: Relationship }) {
  const sloas = [
    {
      id: 'sloa-1',
      nickname: 'ACH - BANK OF AMERICA, N.A. 457040000000',
      accountName: `${r.household} ; Inherited IRA`,
      custodian: 'Fidelity-G15391056',
      accountNumber: '655158348',
      createdDate: 'Apr 27, 2025',
      status: 'Active',
    },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-y border-border">
            <th className="px-5 py-2.5 font-medium">Nickname</th>
            <th className="px-5 py-2.5 font-medium">Account Name</th>
            <th className="px-5 py-2.5 font-medium">Account Number</th>
            <th className="px-5 py-2.5 font-medium">Created Date</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sloas.map((row) => (
            <tr key={row.id} className="border-b border-border">
              <td className="px-5 py-3 text-foreground/90">{row.nickname}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <AccountIconCircle letter={row.accountName[0]!} />
                  <div className="leading-tight">
                    <div className="text-sm text-foreground">
                      {row.accountName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.custodian}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-foreground/90 tabular-nums">
                {row.accountNumber}
              </td>
              <td className="px-5 py-3 text-foreground/90">
                {row.createdDate}
              </td>
              <td className="px-5 py-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinancialAccountsPanel({ r }: { r: Relationship }) {
  const [subTab, setSubTab] = useState<SubTab>('Accounts')
  const [selected, setSelected] = useState<AccountRow | null>(null)
  const counts: Record<SubTab, number> = { Accounts: 1, RMDs: 1, SLOAs: 2 }

  return (
    <>
      <div className="rounded-xl border border-border bg-white">
        <PanelHeader count={counts[subTab]} subTab={subTab} />
        <SubTabs active={subTab} onChange={setSubTab} />
        {subTab === 'Accounts' && (
          <AccountsContent r={r} onSelect={setSelected} />
        )}
        {subTab === 'RMDs' && <RmdsContent r={r} />}
        {subTab === 'SLOAs' && <SloasContent r={r} />}
        <PanelFooter total={counts[subTab]} />
      </div>
      <AccountDetailSlideOver
        r={r}
        account={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}

// --- account detail slide-over -------------------------------------------

const ACCOUNT_NAV_SECTIONS = [
  { label: 'Account', expandable: false },
  { label: 'Cash', expandable: false },
  { label: 'Investment', expandable: true },
  { label: 'Servicing', expandable: false },
  { label: 'Compliance', expandable: false },
  { label: 'Billing', expandable: true },
  { label: 'SLOAs', expandable: false },
  { label: 'RMDs', expandable: true },
  { label: 'Retirement Planning Group', expandable: false },
  { label: 'Trust', expandable: false },
  { label: 'Additional Details', expandable: false },
] as const

type AccountNavSection = (typeof ACCOUNT_NAV_SECTIONS)[number]['label']

function AccountDetailSlideOver({
  r,
  account,
  onClose,
}: {
  r: Relationship
  account: AccountRow | null
  onClose: () => void
}) {
  const [section, setSection] = useState<AccountNavSection>('Account')

  useEffect(() => {
    if (!account) return
    setSection('Account')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [account, onClose])

  if (!account) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      {/* Panel */}
      <div className="relative h-full w-full max-w-[1100px] bg-white shadow-2xl flex">
        {/* Left nav */}
        <aside className="w-[280px] shrink-0 border-r border-border flex flex-col">
          <div className="px-5 pt-6 pb-5 border-b border-border">
            <FidelityIcon size={44} />
            <h2 className="text-lg font-semibold tracking-tight text-foreground mt-3 leading-tight">
              {account.accountName}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {account.accountNumber}
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {ACCOUNT_NAV_SECTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => setSection(s.label)}
                className={cn(
                  'w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors',
                  section === s.label
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-foreground/80 hover:bg-muted/60',
                )}
              >
                {s.label}
                {s.expandable && (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center justify-between px-8 py-5 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">{section}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-8 py-6 bg-muted/20">
            {section === 'Account' && (
              <AccountSection r={r} account={account} />
            )}
            {section !== 'Account' && (
              <div className="rounded-xl border border-border bg-white p-8 text-sm text-muted-foreground">
                <p>{section} details will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountSection({
  r,
  account,
}: {
  r: Relationship
  account: AccountRow
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-white p-6">
        <h4 className="text-base font-semibold text-foreground mb-5">
          Overview
        </h4>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-xl font-semibold text-foreground tabular-nums mt-1">
              {formatMoney(account.totalBalance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Opened</div>
            <div className="text-xl font-semibold text-foreground mt-1">
              {account.opened}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-xl font-semibold text-foreground mt-1">
              {account.status}
            </div>
          </div>
        </div>
        <dl className="divide-y divide-border text-sm">
          {[
            ['Account Number', account.accountNumber],
            ['Account Type', account.accountType],
            ['Custodian', account.custodian],
            ['Portfolio Management System', account.pms],
            ['Qualified?', account.qualified],
            ['Closed', account.closed ?? ''],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-2 py-2.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            Edit
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-6">
        <h4 className="text-base font-semibold text-foreground mb-4">
          Ownership
        </h4>
        <dl className="divide-y divide-border text-sm">
          <div className="grid grid-cols-2 py-2.5">
            <dt className="text-muted-foreground">Relationship</dt>
            <dd className="text-foreground">{r.household}</dd>
          </div>
          <div className="grid grid-cols-2 py-2.5">
            <dt className="text-muted-foreground">Primary Owner</dt>
            <dd className="text-foreground">{r.household}</dd>
          </div>
          <div className="grid grid-cols-2 py-2.5">
            <dt className="text-muted-foreground">Tax ID</dt>
            <dd className="text-foreground">•••-••-1234</dd>
          </div>
        </dl>
      </section>

      <AccountOrionDetails account={account} />
    </div>
  )
}

// Two-column row helper for the Orion details section.
function OrionRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 py-2.5 border-b border-border last:border-b-0 items-center">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value ?? <NaField compact />}</dd>
    </div>
  )
}

// The Orion-mapped account detail block — drives the live walkthrough.
// Y-fields render values from the seed; N-fields render the red N/A pill.
function AccountOrionDetails({ account }: { account: AccountRow }) {
  const o = (account.orion ?? {}) as Record<string, unknown>
  const has = (k: string) => o[k] !== undefined && o[k] !== null && o[k] !== ''
  const val = (k: string) => (has(k) ? String(o[k]) : null)

  return (
    <>
      <section className="rounded-xl border border-border bg-white p-6">
        <h4 className="text-base font-semibold text-foreground mb-4">
          Account details
        </h4>
        <dl>
          {/* Y in Orion */}
          <OrionRow label="Discretionary" value={val('discretionary')} />
          <OrionRow label="Custodial Rep Code" value={val('custodialRepCode')} />
          <OrionRow label="Fund Family" value={val('fundFamily')} />
          <OrionRow label="Management Style" value={val('managementStyle')} />
          <OrionRow label="ADV Reportable" value={val('advReportable')} />
          <OrionRow label="Sub-advisor" value={val('subAdvisor')} />
          <OrionRow label="Managed" value={val('managed')} />
          <OrionRow label="Download Source" value={val('downloadSource')} />
          <OrionRow label="Share Class" value={val('shareClass')} />
          <OrionRow label="Business Line" value={val('businessLine')} />
          <OrionRow label="Price Hierarchy" value={val('priceHierarchy')} />
          {/* N in Orion — red pills */}
          <OrionRow label="Wrap Managed" value={<NaField compact />} />
          <OrionRow label="Nickname" value={<NaField compact />} />
          <OrionRow label="Wrap Sponsored" value={<NaField compact />} />
          <OrionRow label="13f Reportable" value={<NaField compact />} />
          <OrionRow label="AUA Reportable" value={<NaField compact />} />
          <OrionRow label="Provider" value={<NaField compact />} />
          <OrionRow label="Linked Account" value={<NaField compact />} />
          <OrionRow label="Sweep Account" value={<NaField compact />} />
          <OrionRow label="Position Only Recon" value={<NaField compact />} />
          <OrionRow label="Unfunded" value={<NaField compact />} />
          <OrionRow label="Bundled Fees" value={<NaField compact />} />
          <OrionRow label="Risk Score" value={<NaField compact label="N/A — Riskalyze/Nitrogen?" />} />
          <OrionRow label="Exclude Firm Assets For Composites" value={<NaField compact />} />
          <OrionRow label="Outside ID" value={<NaField compact />} />
          <OrionRow label="Qualified Plan" value={<NaField compact />} />
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-white p-6">
        <h4 className="text-base font-semibold text-foreground mb-4">
          Billing
        </h4>
        <dl>
          {/* Y in Orion */}
          <OrionRow label="Pay Method" value={val('payMethod')} />
          <OrionRow label="Fee Schedule" value={val('feeSchedule')} />
          <OrionRow label="Payout Schedule" value={val('payoutSchedule')} />
          <OrionRow label="Billing Status" value={val('billingStatus')} />
          <OrionRow label="Style" value={val('billingStyle')} />
          <OrionRow label="Frequency" value={val('frequency')} />
          <OrionRow label="Cycle Month" value={val('cycleMonth')} />
          <OrionRow label="Valuation Method" value={val('valuationMethod')} />
          <OrionRow label="Start Date" value={val('billingStartDate')} />
          {/* N in Orion */}
          <OrionRow label="Custodial Account Number" value={<NaField compact />} />
          <OrionRow label="Include In Aggregate" value={<NaField compact />} />
          <OrionRow label="Linked Billing Account" value={<NaField compact />} />
          <OrionRow label="Bank Name (ACH)" value={<NaField compact />} />
          <OrionRow label="ABA Number" value={<NaField compact />} />
          <OrionRow label="Bank Account Number" value={<NaField compact />} />
          <OrionRow label="Name On Account" value={<NaField compact />} />
          <OrionRow label="Performance Billed" value={<NaField compact />} />
          <OrionRow label="Performance Fee Schedule" value={<NaField compact />} />
        </dl>
      </section>
    </>
  )
}

// --- actions panel ---------------------------------------------------------

interface ActionRow {
  id: string
  title: string
  subtitle: string
  status: 'Ready to Begin' | 'In Progress'
  date: string
}

const ACTION_ROWS: ActionRow[] = [
  {
    id: 'a1',
    title: 'Manage Relationship Cyber Security Concern',
    subtitle: 'Manage Relationship Concern',
    status: 'Ready to Begin',
    date: 'Feb 24',
  },
  {
    id: 'a2',
    title: 'Manage Relationship Cyber Security Concern',
    subtitle: 'Manage Relationship Concern',
    status: 'Ready to Begin',
    date: 'Feb 24',
  },
  {
    id: 'a3',
    title: 'Manage Relationship Cyber Security Concern',
    subtitle: 'Manage Relationship Concern',
    status: 'In Progress',
    date: 'Feb 24',
  },
  {
    id: 'a4',
    title: 'Manage Relationship Cyber Security Concern',
    subtitle: 'Manage Relationship Concern',
    status: 'In Progress',
    date: 'Feb 25',
  },
]

function StatusPill({ status }: { status: ActionRow['status'] }) {
  const Icon = status === 'Ready to Begin' ? CircleDot : RefreshCw
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <Icon className="h-3 w-3" />
      {status}
    </span>
  )
}

function ActionsPanel() {
  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Actions</h2>
          <span className="text-sm text-muted-foreground">
            {ACTION_ROWS.length}
          </span>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-md">
          All Open
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </div>
      <ul className="border-t border-border">
        {ACTION_ROWS.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <Workflow className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">
                {row.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {row.subtitle}
              </div>
            </div>
            <StatusPill status={row.status} />
            <span className="text-xs text-muted-foreground tabular-nums w-12 text-right shrink-0">
              {row.date}
            </span>
          </li>
        ))}
      </ul>
      <div className="px-5 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          See All Actions
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

interface TaskRow {
  id: string
  title: string
  context: string
  date: string
}

const TASK_ROWS: TaskRow[] = [
  {
    id: 't1',
    title: 'Review Cyber Security Concern',
    context: 'Manage Relationship Concern',
    date: 'Feb 24',
  },
  {
    id: 't2',
    title: 'Review Cyber Security Concern',
    context: 'Manage Relationship Concern',
    date: 'Feb 24',
  },
  {
    id: 't3',
    title: 'Review Cyber Security Concern',
    context: 'Manage Relationship Concern',
    date: 'Feb 24',
  },
  {
    id: 't4',
    title: 'Review Cyber Security Concern',
    context: 'Manage Relationship Concern',
    date: 'Feb 25',
  },
]

function TasksPanel() {
  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Tasks</h2>
          <span className="text-sm text-muted-foreground">
            {TASK_ROWS.length}
          </span>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-md">
          Ready to Begin
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </div>
      <ul className="border-t border-border">
        {TASK_ROWS.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer"
          >
            <CircleDot className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1 flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground truncate">
                {row.title}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {row.context}
              </span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-12 text-right shrink-0">
              {row.date}
            </span>
          </li>
        ))}
      </ul>
      <div className="px-5 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          See All Tasks
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// --- right sidebar ---------------------------------------------------------

function SidebarSection({
  title,
  action,
  children,
  collapsible = true,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  collapsible?: boolean
}) {
  return (
    <section className="border-b border-border last:border-b-0 px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {action}
          {collapsible && (
            <button className="rounded p-0.5 text-muted-foreground hover:bg-muted">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

const OFFERING_ITEMS: { label: string; Icon: typeof Briefcase }[] = [
  { label: 'Investments', Icon: Briefcase },
  { label: 'Planning', Icon: ClipboardList },
  { label: 'Taxes', Icon: Scale },
  { label: 'Estate', Icon: Landmark },
  { label: 'Insurance', Icon: Umbrella },
  { label: 'Trusts', Icon: Building2 },
]

function DetailSidebar({ r }: { r: Relationship }) {
  const total = r.totalAum ?? r.aum ?? 0
  return (
    <aside className="rounded-xl border border-border bg-white">
      <div className="px-5 py-4 border-b border-border">
        <div className="text-xs text-muted-foreground">Total AUM</div>
        <div className="text-2xl font-semibold tracking-tight text-pink-700 mt-1 tabular-nums">
          {formatMoneyTight(total)}
        </div>
      </div>

      <SidebarSection title="Offerings">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {OFFERING_ITEMS.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </div>
              {label}
            </div>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Context">
        <button className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border h-9 text-sm text-foreground hover:bg-muted">
          <Pencil className="h-3.5 w-3.5" />
          Add context
        </button>
      </SidebarSection>

      <SidebarSection title="Activities">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Last Meeting</dt>
            <dd className="text-foreground inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {r.lastMeeting || 'Not Scheduled'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Next Meeting</dt>
            <dd className="text-muted-foreground">
              {r.nextMeeting || 'Not Scheduled'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Alerts</dt>
            <dd className="text-foreground underline underline-offset-2 inline-flex items-center gap-1">
              <Bell className="h-3.5 w-3.5" />
              No Active Alerts
            </dd>
          </div>
        </dl>
      </SidebarSection>

      <SidebarSection title="Household">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-semibold">
            {r.household
              .split(' ')
              .filter((p) => /^[A-Za-z]/.test(p))
              .slice(0, 2)
              .map((p) => p[0]!.toUpperCase())
              .join('')}
          </div>
          <div className="text-sm text-foreground">{r.household}</div>
        </div>
      </SidebarSection>
    </aside>
  )
}

// --- main ------------------------------------------------------------------

export function RelationshipDetailContent() {
  const { id } = useParams<{ id: string }>()
  const { data: r } = useRelationship(id ?? '')
  const [tab, setTab] = useState<DetailTab>('Overview')

  if (!r) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-foreground">Relationship not found.</p>
        <Link
          to="/relationships"
          className="text-sm underline underline-offset-2 mt-3 inline-block"
        >
          Back to Relationships
        </Link>
      </div>
    )
  }

  return (
    <div className="relative max-w-[1400px] mx-auto -mt-2">
      {/* Page-level hotspot for the Relationship detail page */}
      <ConfigHotspot
        knobId="relationships/detail"
        anchor="top-right"
        size="md"
        className="!top-0 !right-0"
      />

      <Link
        to="/relationships"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Relationships
      </Link>

      <DetailHeader r={r} />
      <DetailTabs active={tab} onChange={setTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {tab === 'Overview' && (
            <>
              <FinancialAccountsPanel r={r} />
              <ActionsPanel />
              <TasksPanel />
            </>
          )}
          {tab === 'Household' && <HouseholdTab r={r} />}
          {tab === 'Investments' && (
            <>
              <FinancialAccountsPanel r={r} />
              <InvestmentsOverview r={r} />
            </>
          )}
          {tab === 'Planning' && <PlanningTab r={r} />}
          {tab === 'Servicing' && <ServicingTab r={r} />}
          {tab === 'Billing' && <BillingTab r={r} />}
          {tab === 'Communications' && <CommunicationsTab r={r} />}
          {tab === 'Documents' && <DocumentsTab />}
        </div>
        <div className="lg:col-span-1 relative">
          <ConfigHotspot
            knobId="relationships/detail/sidebar"
            anchor="top-right"
            size="md"
            area="region"
            className="!top-0 !right-0"
          />
          <DetailSidebar r={r} />
        </div>
      </div>
    </div>
  )
}
