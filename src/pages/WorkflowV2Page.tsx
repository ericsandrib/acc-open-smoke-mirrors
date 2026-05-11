import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  FileQuestion,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  V2_LANES,
  V2_OPEN_QUESTIONS,
  type V2LaneId,
  type V2Node,
  type V2NodeFamily,
} from '@/types/workflow-v2'

/**
 * V2 RIA-segment Open Accounts workflow visualization.
 *
 * Source: Avantos_RIA_Account_Opening_Spec.docx §6.
 *
 * Five horizontal lanes with a left label column. Visual conventions per
 * §6.3: amber = new for Stratos, white = reused from Guardian. Annotation
 * stickies (§6.4) anchor to specific nodes. Open questions panel on the
 * right surfaces the 11 unresolved decisions.
 */

// ─── Node inventory (§6.2 + V2 model) ───────────────────────────────────

const V2_NODES: V2Node[] = [
  // L1 — Setup & validate
  { id: 'S-01', lane: 'L1', family: 'start_end', label: 'Start: New account', newForStratos: false, column: 0 },
  { id: 'G-10', lane: 'L1', family: 'process', label: 'Prefill from Orion (Client Info)', newForStratos: false, column: 1, note: 'Reads name, DOB, SSN, address, suitability, risk from Orion.' },
  { id: 'S-02', lane: 'L1', family: 'process', label: 'Advisor completes Open Accounts form', newForStratos: true, column: 2, note: 'Inline guardrails fire at field entry / submit.' },
  { id: 'S-03', lane: 'L1', family: 'gate', label: 'Inline guardrails (G-1…G-7)', newForStratos: true, column: 3, note: '7 guardrails block submit before any reviewer is involved.' },
  { id: 'S-04', lane: 'L1', family: 'api_system', label: 'Advisor licensing check (LAWS)', newForStratos: false, column: 4, note: 'OQ-2: confirm LAWS vs alternate.' },
  { id: 'S-05', lane: 'L1', family: 'hold_block', label: 'Licensing hold', newForStratos: false, column: 5, note: 'Off-path: blocks until licensing resolved.' },
  { id: 'S-06', lane: 'L1', family: 'gate', label: 'Cross-field validation', newForStratos: true, column: 5, note: 'Inconsistent suitability + risk → hold.' },

  // L2 — KYC per owner (parallel sub-workflow)
  { id: 'K-01', lane: 'L2', family: 'process', label: 'For each owner →', newForStratos: false, column: 0 },
  { id: 'K-02', lane: 'L2', family: 'api_system', label: 'CIP — identity verify', newForStratos: false, column: 1 },
  { id: 'K-03', lane: 'L2', family: 'api_system', label: 'AML / OFAC screen', newForStratos: false, column: 2 },
  { id: 'K-04', lane: 'L2', family: 'human_review', label: 'AML escalation (if flagged)', newForStratos: false, column: 3, note: 'OQ-3: queue ownership at Stratos.' },
  { id: 'K-05', lane: 'L2', family: 'state', label: 'KYC Approved (per owner)', newForStratos: false, column: 4 },

  // L3 — Risk routing (rules engine)
  { id: 'S-10', lane: 'L3', family: 'process', label: 'Rules engine evaluates account', newForStratos: true, column: 1, note: '11 high-risk rules + 3 universal triggers.' },
  { id: 'S-11', lane: 'L3', family: 'gate', label: 'Tag set produced?', newForStratos: true, column: 3 },
  { id: 'S-12', lane: 'L3', family: 'state', label: 'Bypass review (clean account)', newForStratos: true, column: 5, note: 'Solid green path → skip L4, go directly to L5.' },

  // L4 — Review (single queue, parallel actions)
  { id: 'S-20', lane: 'L4', family: 'human_review', label: 'Suitability review', newForStratos: true, column: 0, note: 'Fires on suitability tags. Conditional in Stratos (unconditional in Guardian).' },
  { id: 'S-21', lane: 'L4', family: 'human_review', label: 'Best Interest review', newForStratos: true, column: 1, note: 'Universal for qualified accounts. OQ-10: reviewer assignment.' },
  { id: 'S-22', lane: 'L4', family: 'human_review', label: 'Compliance review', newForStratos: true, column: 2, note: 'Compliance attributes — OBA, advisor=client, fee threshold, entity attributes.' },
  { id: 'S-23', lane: 'L4', family: 'human_review', label: 'SIM document review', newForStratos: true, column: 3, note: 'Universal for SIM-fee accounts.' },
  { id: 'S-24', lane: 'L4', family: 'gate', label: 'All approved?', newForStratos: true, column: 4, note: 'Converges parallel reviews. Any NIGO → consolidated return.' },
  { id: 'S-25', lane: 'L4', family: 'nigo_rework', label: 'Consolidated NIGO → advisor', newForStratos: true, column: 5, note: 'Single round-trip; one notification across all reviewers.' },

  // L5 — Sign & open
  { id: 'S-30', lane: 'L5', family: 'process', label: 'Generate eSign envelope (ADV 2B + disclosures)', newForStratos: true, column: 0, note: 'OQ-8: ADV 2B storage / versioning.' },
  { id: 'S-31', lane: 'L5', family: 'state', label: 'Awaiting client signature', newForStratos: false, column: 1 },
  { id: 'S-32', lane: 'L5', family: 'human_review', label: 'Documentation completeness review (post-eSign)', newForStratos: true, column: 2, note: 'Operations-owned. May NIGO → de-link.' },
  { id: 'S-33', lane: 'L5', family: 'hold_block', label: 'De-Linked (reversible)', newForStratos: true, column: 3, note: 'Manual reviewer action, not auto-timer.' },
  { id: 'S-34', lane: 'L5', family: 'api_system', label: 'Final licensing recheck + AML 90d check', newForStratos: false, column: 4 },
  { id: 'S-35', lane: 'L5', family: 'api_system', label: 'Submit to custodian (SEI)', newForStratos: true, column: 5, note: 'Configurable per RIA; SEI is Stratos.' },
  { id: 'S-36', lane: 'L5', family: 'start_end', label: 'Opened', newForStratos: false, column: 6 },
]

// Edges drawn between nodes (kept loose — visual only, no React Flow).
const EDGES: Array<{ from: string; to: string; kind?: 'bypass' | 'nigo' | 'kyc-fork' }> = [
  // L1 spine
  { from: 'S-01', to: 'G-10' },
  { from: 'G-10', to: 'S-02' },
  { from: 'S-02', to: 'S-03' },
  { from: 'S-03', to: 'S-04' },
  { from: 'S-04', to: 'S-05' },
  { from: 'S-04', to: 'S-06' },
  // L1 → L3 (after validation)
  { from: 'S-06', to: 'S-10' },
  // L2 KYC fork
  { from: 'S-02', to: 'K-01', kind: 'kyc-fork' },
  { from: 'K-01', to: 'K-02' },
  { from: 'K-02', to: 'K-03' },
  { from: 'K-03', to: 'K-04' },
  { from: 'K-04', to: 'K-05' },
  { from: 'K-05', to: 'S-34', kind: 'kyc-fork' },  // KYC gates final custodian submission
  // L3
  { from: 'S-10', to: 'S-11' },
  { from: 'S-11', to: 'S-12', kind: 'bypass' },     // no tags → bypass
  { from: 'S-11', to: 'S-20' },                      // tags → review actions
  { from: 'S-11', to: 'S-21' },
  { from: 'S-11', to: 'S-22' },
  { from: 'S-11', to: 'S-23' },
  // L4 converge
  { from: 'S-20', to: 'S-24' },
  { from: 'S-21', to: 'S-24' },
  { from: 'S-22', to: 'S-24' },
  { from: 'S-23', to: 'S-24' },
  { from: 'S-24', to: 'S-25', kind: 'nigo' },        // any NIGO → consolidated
  { from: 'S-25', to: 'S-02', kind: 'nigo' },         // back to advisor
  // L4 → L5
  { from: 'S-12', to: 'S-30', kind: 'bypass' },       // bypass directly to eSign
  { from: 'S-24', to: 'S-30' },                       // all approved → eSign
  // L5 spine
  { from: 'S-30', to: 'S-31' },
  { from: 'S-31', to: 'S-32' },
  { from: 'S-32', to: 'S-33', kind: 'nigo' },          // doc deficiency → de-link
  { from: 'S-32', to: 'S-34' },
  { from: 'S-33', to: 'S-32' },                        // docs arrive → back to review
  { from: 'S-34', to: 'S-35' },
  { from: 'S-35', to: 'S-36' },
]

// ─── Family → Tailwind classes ─────────────────────────────────────────

function familyClass(family: V2NodeFamily, newForStratos: boolean): string {
  // §6.3 visual conventions. Amber border on every new-for-Stratos node.
  const border = newForStratos ? 'border-2 border-orange-400' : 'border border-gray-300'
  const newBg = newForStratos ? 'bg-amber-50' : 'bg-white'
  switch (family) {
    case 'start_end':
      return `${border} ${newBg} text-foreground`
    case 'process':
      return `${border} ${newBg} text-foreground`
    case 'gate':
      return `${newForStratos ? 'border-2 border-orange-400' : 'border border-yellow-400'} bg-yellow-50 text-yellow-900`
    case 'hold_block':
      return `${newForStratos ? 'border-2 border-orange-400' : 'border border-rose-300'} bg-rose-50 text-rose-900`
    case 'state':
      return `${newForStratos ? 'border-2 border-orange-400' : 'border border-emerald-300'} bg-emerald-50 text-emerald-900`
    case 'api_system':
      return `${newForStratos ? 'border-2 border-orange-400' : 'border border-violet-300'} bg-violet-50 text-violet-900`
    case 'human_review':
      return `${newForStratos ? 'border-2 border-orange-400' : 'border border-orange-300'} bg-orange-50 text-orange-900`
    case 'nigo_rework':
      return `${newForStratos ? 'border-2 border-orange-400' : 'border border-stone-300'} bg-stone-100 text-stone-800`
  }
}

function laneTint(laneId: V2LaneId): string {
  switch (laneId) {
    case 'L1': return 'bg-slate-50/60'
    case 'L2': return 'bg-violet-50/40'
    case 'L3': return 'bg-yellow-50/40'
    case 'L4': return 'bg-orange-50/40'
    case 'L5': return 'bg-emerald-50/40'
  }
}

// ─── Page ──────────────────────────────────────────────────────────────

export function WorkflowV2Page() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  )
}

function Body() {
  const [activeNode, setActiveNode] = useState<V2Node | null>(null)

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex h-5 items-center rounded bg-amber-100 px-2 text-[10px] font-bold text-amber-900 uppercase tracking-wide">
            V2
          </span>
          <h1 className="text-2xl font-semibold text-foreground">
            Open Accounts workflow — RIA segment
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          5-lane account-opening workflow per the V2 spec. White nodes are
          reused from the Guardian (broker-dealer) model; amber-bordered
          nodes are new for the RIA segment with Stratos as the first
          instance. Click any node for spec notes.
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs">
          <Link
            to="/rules"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 hover:bg-muted/40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Rules explorer
          </Link>
          <Link
            to="/queue"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 hover:bg-muted/40"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Review queue + lifecycle
          </Link>
          <Link
            to="/workflow-v1"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-muted-foreground hover:bg-muted/40"
          >
            V1 (archived)
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Lane diagram */}
        <div className="space-y-3">
          {V2_LANES.map((lane) => {
            const nodes = V2_NODES.filter((n) => n.lane === lane.id).sort(
              (a, b) => (a.column ?? 0) - (b.column ?? 0),
            )
            return (
              <div
                key={lane.id}
                className={cn(
                  'rounded-xl border border-border overflow-hidden',
                  laneTint(lane.id),
                )}
              >
                <div className="grid grid-cols-[180px_1fr]">
                  {/* Lane label */}
                  <div className="px-4 py-3 border-r border-border bg-white/60">
                    <div className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                      {lane.id}
                    </div>
                    <div className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                      {lane.name}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                      {lane.purpose}
                    </p>
                  </div>

                  {/* Lane nodes */}
                  <div className="p-3 flex flex-wrap items-stretch gap-2">
                    {nodes.map((n, i) => (
                      <NodeChip
                        key={n.id}
                        node={n}
                        active={activeNode?.id === n.id}
                        onClick={() => setActiveNode(n)}
                        showConnector={i > 0}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Connection legend */}
          <div className="mt-4 rounded-xl border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Connections + conventions
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <LegendRow
                color="border-emerald-500"
                style="solid"
                label="Bypass review (no rules fired)"
              />
              <LegendRow
                color="border-rose-500"
                style="dashed"
                label="NIGO return path"
              />
              <LegendRow
                color="border-violet-500"
                style="dashed"
                label="Per-owner KYC fork (parallel)"
              />
              <LegendRow
                color="border-orange-400"
                style="thick"
                label="Amber border — new for Stratos"
              />
              <LegendRow
                color="border-gray-300"
                style="solid"
                label="White / thin border — reused from Guardian"
              />
              <LegendRow
                color="border-stone-300"
                style="dashed"
                label="Gate / decision diamond"
              />
            </div>
          </div>

          {/* Edge inventory (text summary) */}
          <details className="mt-3 rounded-xl border border-border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
              Edge inventory ({EDGES.length}) — for QA traceability
            </summary>
            <div className="px-4 pb-3 text-xs grid grid-cols-2 gap-x-6 gap-y-1">
              {EDGES.map((e, i) => (
                <div key={i} className="flex items-center gap-2 font-mono">
                  <span className="text-muted-foreground">{e.from}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground">{e.to}</span>
                  {e.kind && (
                    <span
                      className={cn(
                        'inline-flex h-4 items-center rounded px-1 text-[9px] font-semibold uppercase tracking-wide',
                        e.kind === 'bypass' && 'bg-emerald-100 text-emerald-800',
                        e.kind === 'nigo' && 'bg-rose-100 text-rose-800',
                        e.kind === 'kyc-fork' && 'bg-violet-100 text-violet-800',
                      )}
                    >
                      {e.kind}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Right rail: details + open questions */}
        <aside className="space-y-4">
          <NodeDetailPanel node={activeNode} />
          <OpenQuestionsPanel />
        </aside>
      </div>
    </div>
  )
}

function NodeChip({
  node,
  active,
  onClick,
  showConnector,
}: {
  node: V2Node
  active: boolean
  onClick: () => void
  showConnector: boolean
}) {
  return (
    <div className="inline-flex items-center">
      {showConnector && (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-0.5 shrink-0" />
      )}
      <button
        onClick={onClick}
        className={cn(
          'rounded-md px-3 py-2 text-xs font-medium leading-tight transition-all min-w-[120px] max-w-[180px] text-left',
          familyClass(node.family, node.newForStratos),
          active && 'ring-2 ring-offset-1 ring-foreground/40 shadow-sm',
        )}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-mono text-[9px] opacity-60">{node.id}</span>
          {node.newForStratos && (
            <span className="inline-flex h-3 items-center rounded bg-amber-200 px-1 text-[8px] font-bold text-amber-900 uppercase">
              NEW
            </span>
          )}
        </div>
        <div>{node.label}</div>
      </button>
    </div>
  )
}

function LegendRow({
  color,
  style,
  label,
}: {
  color: string
  style: 'solid' | 'dashed' | 'thick'
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-0',
          color,
          style === 'solid' && 'border-t-2',
          style === 'dashed' && 'border-t-2 border-dashed',
          style === 'thick' && 'border-t-4',
          'w-10',
        )}
      />
      <span className="text-foreground/80">{label}</span>
    </div>
  )
}

function NodeDetailPanel({ node }: { node: V2Node | null }) {
  if (!node) {
    return (
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Node details
        </h3>
        <p className="text-xs text-muted-foreground">
          Click any node in the workflow to see its spec notes, ID, and
          which lane / family it belongs to.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">{node.id}</span>
        <span className="inline-flex h-4 items-center rounded bg-muted px-1.5 text-[9px] font-semibold uppercase tracking-wide text-foreground/80">
          {node.lane} · {node.family.replace('_', ' ')}
        </span>
        {node.newForStratos && (
          <span className="inline-flex h-4 items-center rounded bg-amber-100 px-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
            New
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{node.label}</h3>
      {node.note && (
        <p className="text-xs text-foreground/85 leading-snug mt-2">
          {node.note}
        </p>
      )}
    </div>
  )
}

function OpenQuestionsPanel() {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <FileQuestion className="h-4 w-4 text-amber-700" />
        <h3 className="text-sm font-semibold text-foreground">
          Open questions ({V2_OPEN_QUESTIONS.length})
        </h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
        Decisions the platform team or Stratos has not yet made. Each must
        be resolved before the affected requirement can ship.
      </p>
      <ul className="space-y-2">
        {V2_OPEN_QUESTIONS.map((q) => (
          <li
            key={q.id}
            className="rounded-md border border-amber-200 bg-amber-50/60 p-2"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-mono text-[9px] font-bold text-amber-800">
                {q.id}
              </span>
              <span className="text-[9px] text-muted-foreground">
                affects {q.affects}
              </span>
            </div>
            <p className="text-[11px] text-foreground leading-snug">
              {q.question}
            </p>
          </li>
        ))}
      </ul>
      <a
        href="https://github.com/ericsandrib/acc-open-smoke-mirrors"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="h-3 w-3" /> Spec source on GitHub
      </a>
    </div>
  )
}
