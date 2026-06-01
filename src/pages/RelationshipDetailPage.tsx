import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, LayoutGrid, Users, LineChart, ClipboardList, Wrench, TrendingUp,
  Receipt, MessageSquare, FileText, Building2, Calendar, Sparkles,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getRelationshipDetail, type RelationshipDetail, type DetailAccount } from '@/data/zions/relationshipDetail'

function usd(n?: number | null): string {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const s = abs >= 1_000_000 ? `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M` : abs >= 1_000 ? `$${Math.round(abs / 1_000)}K` : `$${abs}`
  return n < 0 ? `(${s})` : s
}

type TabId = 'overview' | 'household' | 'investments' | 'planning' | 'servicing' | 'growth' | 'billing' | 'communications' | 'documents'
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'household', label: 'Household', icon: Users },
  { id: 'investments', label: 'Investments', icon: LineChart },
  { id: 'planning', label: 'Planning', icon: ClipboardList },
  { id: 'servicing', label: 'Servicing', icon: Wrench },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
]

function Section({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count != null && <span className="text-xs text-muted-foreground">{count}</span>}
      </div>
      {children}
    </div>
  )
}

function AccountsTable({ accounts }: { accounts: DetailAccount[] }) {
  if (accounts.length === 0) return <div className="px-4 py-6 text-sm text-muted-foreground">No accounts on file.</div>
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/60">
        <th className="px-4 py-2 font-medium">System</th><th className="px-4 py-2 font-medium">Account</th>
        <th className="px-4 py-2 font-medium">Domain</th><th className="px-4 py-2 font-medium text-right">Value</th>
      </tr></thead>
      <tbody>
        {accounts.map((a, i) => (
          <tr key={i} className="border-b border-border/40 last:border-0">
            <td className="px-4 py-2">
              <span className="inline-flex items-center rounded border border-[#0b4f9c33] bg-[#0b4f9c1a] px-1.5 py-0.5 text-[11px] font-medium text-[#0b4f9c]">
                {a.system}{a.affiliate ? ` · ${a.affiliate}` : ''}
              </span>
            </td>
            <td className="px-4 py-2 text-foreground/90">{a.label}<span className="text-muted-foreground"> · {a.externalId}</span></td>
            <td className="px-4 py-2 text-muted-foreground">{a.domain}</td>
            <td className={cn('px-4 py-2 text-right tabular-nums', a.value != null && a.value < 0 ? 'text-destructive' : 'text-foreground')}>{a.value != null ? usd(a.value) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Rows({ items, empty }: { items: { primary: string; secondary?: string; badge?: string; right?: string }[]; empty: string }) {
  if (items.length === 0) return <div className="px-4 py-6 text-sm text-muted-foreground">{empty}</div>
  return (
    <div className="divide-y divide-border/40">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <div className="text-sm text-foreground truncate">{it.primary}</div>
            {it.secondary && <div className="text-xs text-muted-foreground truncate">{it.secondary}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {it.badge && <Badge variant="secondary" className="text-[10px]">{it.badge}</Badge>}
            {it.right && <span className="text-xs text-muted-foreground tabular-nums">{it.right}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function TabBody({ tab, d, navigate }: { tab: TabId; d: RelationshipDetail; navigate: (p: string) => void }) {
  switch (tab) {
    case 'overview':
      return (
        <div className="flex flex-col gap-4">
          <Section title="Accounts across custodians" count={d.accounts.length}><AccountsTable accounts={d.accounts} /></Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Open actions" count={d.openActions.length}>
              <Rows empty="No open actions." items={d.openActions.map((a) => ({ primary: a.name, secondary: a.category, right: a.date }))} />
            </Section>
            <Section title="Open tasks" count={d.openTasks.length}>
              <Rows empty="No open tasks." items={d.openTasks.map((t) => ({ primary: t.name, secondary: t.owner, badge: t.status }))} />
            </Section>
          </div>
          {d.opportunities.length > 0 && (
            <Section title="Growth opportunities" count={d.opportunities.length}>
              <Rows empty="" items={d.opportunities.map((o) => ({ primary: o.signal, secondary: o.kind, right: usd(o.estimatedValue) }))} />
            </Section>
          )}
          {d.meetings.length > 0 && (
            <Section title="Meetings" count={d.meetings.length}>
              <div className="divide-y divide-border/40">
                {d.meetings.map((m) => (
                  <button key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground flex-1">{m.subject}</span>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>
      )
    case 'household':
      return (
        <div className="flex flex-col gap-4">
          <Section title="Household members" count={d.members.length}>
            <Rows empty="No members." items={d.members.map((mem) => ({ primary: mem.name, secondary: mem.descriptor, badge: mem.isPrimary ? 'Primary' : mem.role }))} />
          </Section>
          {d.relatedOrgs.length > 0 && (
            <Section title="Related organizations" count={d.relatedOrgs.length}>
              <Rows empty="" items={d.relatedOrgs.map((o) => ({ primary: o.name, secondary: o.role }))} />
            </Section>
          )}
        </div>
      )
    case 'investments':
      return <Section title="Investment accounts" count={d.accounts.length}><AccountsTable accounts={d.accounts.filter((a) => a.domain === 'Wealth' || a.domain === 'Corporate Trust')} /></Section>
    case 'servicing':
      return (
        <div className="flex flex-col gap-4">
          <Section title="Open actions" count={d.openActions.length}><Rows empty="No open actions." items={d.openActions.map((a) => ({ primary: a.name, secondary: a.category, badge: a.status, right: a.date }))} /></Section>
          <Section title="Open tasks" count={d.openTasks.length}><Rows empty="No open tasks." items={d.openTasks.map((t) => ({ primary: t.name, secondary: t.owner, badge: t.status }))} /></Section>
        </div>
      )
    case 'growth':
      return <Section title="Growth opportunities" count={d.opportunities.length}><Rows empty="No opportunities surfaced." items={d.opportunities.map((o) => ({ primary: o.signal, secondary: o.kind, right: usd(o.estimatedValue) }))} /></Section>
    default: {
      const labels: Record<string, string> = { planning: 'Financial planning (eMoney)', billing: 'Billing & fees', communications: 'Communications', documents: 'Documents & e-sign' }
      return <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">{labels[tab] ?? tab} — representative tab (data not in the POC seed).</div>
    }
  }
}

export function RelationshipDetailPage() {
  const { relationshipId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('overview')
  const d = relationshipId ? getRelationshipDetail(relationshipId) : null

  if (!d) {
    return <AppShell><div className="max-w-3xl mx-auto py-12 text-center text-sm text-muted-foreground">Relationship not found.</div></AppShell>
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/relationships')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Relationships
        </button>

        <div className="relative pl-4 mb-5">
          <div className="absolute left-0 top-1 bottom-1 w-1 rounded bg-[#0b4f9c]" />
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground">{d.name}</h1>
            <Badge variant="secondary" className="bg-[#0b4f9c1a] text-[#0b4f9c] border-[#0b4f9c33]">{d.offering}</Badge>
            <Badge variant="secondary">{d.type}</Badge>
            {d.alert && <Badge className="bg-amber-100 text-amber-700 border-0 gap-1"><Sparkles className="h-3 w-3" />{d.alert}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Client since {d.clientSince} · {usd(d.aum)} AUM</p>
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn('flex items-center gap-1.5 px-3 py-2 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors',
                    tab === t.id ? 'border-[#0b4f9c] text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
            <TabBody tab={tab} d={d} navigate={navigate} />
          </div>

          {/* Sidebar */}
          <aside className="w-72 shrink-0 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Details</h3>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Total AUM</dt><dd className="font-medium text-foreground tabular-nums">{usd(d.aum)}</dd></div>
                {d.lastMeeting && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Last meeting</dt><dd className="text-foreground">{d.lastMeeting}</dd></div>}
                {d.nextMeeting && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Next meeting</dt><dd className="text-foreground">{d.nextMeeting}</dd></div>}
              </dl>
              {d.context && <p className="mt-3 pt-3 border-t border-border/60 text-[13px] text-muted-foreground leading-snug">{d.context}</p>}
              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Household members</div>
                {d.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[13px] py-0.5">
                    <span className="text-foreground">{m.name}</span>
                    <span className="text-muted-foreground">{m.isPrimary ? 'Primary' : m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Team</h3>
              <dl className="flex flex-col gap-2 text-sm mb-3">
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Division</dt><dd className="text-foreground">{d.team.division}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Market</dt><dd className="text-foreground">{d.team.market}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Office</dt><dd className="text-foreground">{d.team.office}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Household ID</dt><dd className="text-foreground font-mono text-xs">{d.team.householdId}</dd></div>
              </dl>
              <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
                {d.team.members.map((tm, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-foreground">{tm.name.split(' ').map((p) => p[0]).join('')}</span>
                    <div className="min-w-0"><div className="text-[13px] text-foreground truncate">{tm.name}</div><div className="text-[11px] text-muted-foreground truncate">{tm.role}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
