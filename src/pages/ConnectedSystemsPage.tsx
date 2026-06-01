import { Layers, ArrowDownUp, Database } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CONNECTED_SYSTEMS, DOMAIN_ORDER, type ConnectedSystem } from '@/data/zions/connectedSystems'
import { cn } from '@/lib/utils'

function SystemCard({ s }: { s: ConnectedSystem }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 flex flex-col gap-2', s.highlight ? 'border-2 border-[#0b4f9c]' : 'border-border')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b4f9c1a] text-[#0b4f9c]"><Database className="h-4 w-4" /></span>
          <span className="text-sm font-semibold text-foreground">{s.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', s.reads ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground')}>Read</span>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', s.writes ? 'bg-[#0b4f9c1a] text-[#0b4f9c]' : 'bg-muted text-muted-foreground')}>{s.writes ? 'Write-back' : 'Read-only'}</span>
        </div>
      </div>
      <div className="text-[13px] text-foreground/80">{s.what}</div>
      <div className="text-[11px] text-muted-foreground">{s.pattern}</div>
      {s.note && <div className="text-[11px] text-[#0b4f9c] bg-[#0b4f9c0a] rounded-md px-2 py-1.5 leading-snug">{s.note}</div>}
    </div>
  )
}

export function ConnectedSystemsPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Connected systems</h1>
        <p className="text-sm text-muted-foreground max-w-3xl mb-5">
          Avantos sits <strong>above</strong> Zions's source systems — it reads approved data, runs governed
          workflows, and writes approved outputs back. It does not replace any of them.
        </p>

        {/* sits-above band */}
        <div className="rounded-xl border border-[#0b4f9c33] bg-[#0b4f9c0a] p-4 mb-6 flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b4f9c] text-white"><Layers className="h-5 w-5" /></span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Avantos — orchestration &amp; intelligence layer</div>
            <div className="text-[13px] text-muted-foreground">Identity graph · journeys &amp; actions · meeting intelligence · governed write-back · audit trail</div>
          </div>
          <ArrowDownUp className="h-5 w-5 text-[#0b4f9c]" />
        </div>

        {DOMAIN_ORDER.map((domain) => {
          const systems = CONNECTED_SYSTEMS.filter((s) => s.domain === domain)
          if (systems.length === 0) return null
          return (
            <div key={domain} className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{domain}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systems.map((s) => <SystemCard key={s.name} s={s} />)}
              </div>
            </div>
          )
        })}

        <p className="text-xs text-muted-foreground max-w-3xl mt-2">
          Integration patterns are illustrative for the POC — direct APIs, enterprise data-plane, event/batch,
          SFTP, and controlled write-back. The key implementation question for Zions is which system is
          authoritative for each record, and which to read directly vs. through an enterprise data layer.
        </p>
      </div>
    </AppShell>
  )
}
