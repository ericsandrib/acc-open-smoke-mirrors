import { Handle, Position, type NodeProps } from '@xyflow/react'
import { User, Users, Landmark, Briefcase, FileText } from 'lucide-react'
import {
  SOURCE_SYSTEM_LABEL,
  AFFILIATE_LABEL,
  type LegalEntity,
  type CrossSiloOpportunity,
  type EntityKind,
  type SourceSystem,
} from '@/types/identityGraph'

const kindIcon: Record<EntityKind, React.ComponentType<{ className?: string }>> = {
  person: User,
  household: Users,
  business: Briefcase,
  trust: FileText,
  municipality: Landmark,
  issuer: Landmark,
}

// Per-source-system chip colors (alpha-hex arbitrary values are Tailwind v4-safe).
const systemChip: Record<SourceSystem, string> = {
  fitek: 'bg-[#0b4f9c1a] text-[#0b4f9c] border-[#0b4f9c33]',
  lpl: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  transtar: 'bg-violet-50 text-violet-700 border-violet-200',
  emoney: 'bg-amber-50 text-amber-700 border-amber-200',
  salesforce: 'bg-sky-50 text-sky-700 border-sky-200',
  'bank-core': 'bg-slate-100 text-slate-700 border-slate-200',
}

function fmt(v?: number): string | null {
  if (v == null) return null
  const abs = Math.abs(v)
  const s =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
      : abs >= 1_000
        ? `$${Math.round(abs / 1_000)}K`
        : `$${abs}`
  return v < 0 ? `(${s})` : s
}

export function EntityGraphNode({ data }: NodeProps) {
  const entity = data.entity as LegalEntity
  const prospect = !!entity.wealthProspect
  const Icon = kindIcon[entity.kind]

  return (
    <div
      className={`rounded-xl bg-card shadow-sm w-[290px] ${
        prospect ? 'border-2 border-[#0b4f9c]' : 'border border-border'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#0b4f9c]" />

      <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0b4f9c1a] text-[#0b4f9c]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{entity.name}</div>
          {entity.descriptor && (
            <div className="text-[11px] text-muted-foreground truncate">{entity.descriptor}</div>
          )}
        </div>
      </div>

      <div className="px-3 py-2 flex flex-col gap-1">
        {entity.identities.map((id, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span
              className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-medium ${systemChip[id.system]}`}
            >
              {SOURCE_SYSTEM_LABEL[id.system]}
              {id.affiliate ? ` · ${AFFILIATE_LABEL[id.affiliate]}` : ''}
            </span>
            <span className="text-muted-foreground truncate flex-1">{id.context}</span>
            {id.value != null && (
              <span className={`tabular-nums shrink-0 ${id.value < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {fmt(id.value)}
              </span>
            )}
          </div>
        ))}
      </div>

      {(entity.totalValue != null || prospect) && (
        <div className="px-3 py-1.5 border-t border-border/60 flex items-center justify-between gap-2">
          {entity.totalValue != null ? (
            <span className="text-[11px] text-muted-foreground">
              Relationship{' '}
              <span className="font-semibold text-foreground tabular-nums">{fmt(entity.totalValue)}</span>
            </span>
          ) : (
            <span />
          )}
          {prospect && (
            <span className="inline-flex items-center rounded-full bg-[#0b4f9c] px-2 py-0.5 text-[10px] font-semibold text-white">
              Wealth prospect
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#0b4f9c]" />
    </div>
  )
}
