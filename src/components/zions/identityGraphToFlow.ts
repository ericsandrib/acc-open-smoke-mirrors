// Transform the Zions identity graph -> React Flow nodes/edges (Spec 007 Phase 2).
// Hierarchical TB layout via dagre, mirroring the workflow viewer's approach.
import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'
import type { IdentityGraph } from '@/types/identityGraph'

const NODE_W = 290
const BASE_H = 96
const ROW_H = 22

function nodeHeight(identityCount: number, prospect: boolean) {
  return BASE_H + identityCount * ROW_H + (prospect ? 30 : 0)
}

// Edges that represent a cross-silo BRIDGE (the money) get the Zions-blue animated treatment.
const BRIDGE_KINDS = new Set(['officer_of', 'owner_of', 'board_member_of', 'beneficiary_of'])

export function identityGraphToFlow(graph: IdentityGraph) {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 90, marginx: 24, marginy: 24 })

  for (const e of graph.entities) {
    g.setNode(e.id, { width: NODE_W, height: nodeHeight(e.identities.length, !!e.wealthProspect) })
  }
  for (const edge of graph.edges) {
    g.setEdge(edge.source, edge.target)
  }
  dagre.layout(g)

  const oppByEntity = new Map(graph.opportunities.map((o) => [o.entityId, o]))

  for (const e of graph.entities) {
    const pos = g.node(e.id)
    const h = nodeHeight(e.identities.length, !!e.wealthProspect)
    nodes.push({
      id: e.id,
      type: 'entityNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - h / 2 },
      data: { entity: e, opportunity: oppByEntity.get(e.id) ?? null },
      style: { width: NODE_W },
    })
  }

  for (const edge of graph.edges) {
    const isBridge = BRIDGE_KINDS.has(edge.kind)
    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: edge.label,
      animated: isBridge,
      style: isBridge
        ? { stroke: 'var(--fill-brand-primary, #0b4f9c)', strokeWidth: 2 }
        : { stroke: '#94a3b8', strokeWidth: 1.5 },
      labelStyle: { fontSize: 11, fill: '#475569' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
    })
  }

  return { nodes, edges }
}
