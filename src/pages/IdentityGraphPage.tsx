import { useMemo } from 'react'
import { ReactFlow, Background, Controls, type NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AppShell } from '@/components/layout/AppShell'
import { EntityGraphNode } from '@/components/zions/EntityGraphNode'
import { identityGraphToFlow } from '@/components/zions/identityGraphToFlow'
import { ZIONS_IDENTITY_GRAPH } from '@/data/zions/identityGraphSeed'
import { OPPORTUNITY_LABEL } from '@/types/identityGraph'
import { Badge } from '@/components/ui/badge'

const nodeTypes: NodeTypes = { entityNode: EntityGraphNode }

function fmtM(v?: number): string | null {
  if (v == null) return null
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

export function IdentityGraphPage() {
  const { nodes, edges } = useMemo(() => identityGraphToFlow(ZIONS_IDENTITY_GRAPH), [])
  const opps = ZIONS_IDENTITY_GRAPH.opportunities

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relationship Graph</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            One legal entity, one node — unified across Fi-Tek (Wealth + Corporate Trust), LPL, Transtar,
            eMoney, and the bank core, spanning Zions's affiliate banks. Wealth Access aggregates
            dashboards; Avantos aggregates identity.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 rounded-xl border border-border overflow-hidden h-[calc(100vh-13rem)] bg-secondary/30">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          <aside className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto h-[calc(100vh-13rem)] pr-1">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Cross-silo opportunities</h2>
              <p className="text-[12px] text-muted-foreground">
                Surfaced only because identity is unified across silos.
              </p>
            </div>
            {opps.map((o) => (
              <div key={o.id} className="rounded-xl border border-[#0b4f9c33] bg-card p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="bg-[#0b4f9c1a] text-[#0b4f9c] border-[#0b4f9c33] text-[10px]">
                    {OPPORTUNITY_LABEL[o.kind]}
                  </Badge>
                  {o.estimatedValue != null && (
                    <span className="text-sm font-semibold tabular-nums text-foreground">{fmtM(o.estimatedValue)}</span>
                  )}
                </div>
                <div className="text-[13px] font-medium text-foreground leading-snug">{o.signal}</div>
                <div className="text-[12px] text-muted-foreground leading-snug">{o.rationale}</div>
                {o.advisor && (
                  <div className="text-[11px] text-muted-foreground pt-0.5">
                    Route to <span className="font-medium text-foreground">{o.advisor}</span>
                  </div>
                )}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
