import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowState } from '@/types/workflow'

export function workflowToFlow(state: WorkflowState) {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const sortedActions = [...state.actions].sort((a, b) => a.order - b.order)

  for (const action of sortedActions) {
    nodes.push({
      id: action.id,
      type: 'actionNode',
      data: { label: action.title },
      position: { x: 0, y: 0 },
    })

    const actionTasks = state.tasks
      .filter((t) => t.actionId === action.id)
      .sort((a, b) => a.order - b.order)

    for (let i = 0; i < actionTasks.length; i++) {
      const task = actionTasks[i]
      nodes.push({
        id: task.id,
        type: 'taskNode',
        data: { label: task.title, status: task.status, assignedTo: task.assignedTo },
        position: { x: 0, y: 0 },
      })

      edges.push({
        id: `e-${action.id}-${task.id}`,
        source: action.id,
        target: task.id,
        type: 'smoothstep',
      })

      if (i > 0) {
        edges.push({
          id: `e-${actionTasks[i - 1].id}-${task.id}`,
          source: actionTasks[i - 1].id,
          target: task.id,
          type: 'smoothstep',
          style: { strokeDasharray: '5,5' },
        })
      }

      if (task.children) {
        for (const child of task.children) {
          nodes.push({
            id: child.id,
            type: 'kycChildNode',
            data: { label: child.name, status: child.status },
            position: { x: 0, y: 0 },
          })
          edges.push({
            id: `e-${task.id}-${child.id}`,
            source: task.id,
            target: child.id,
            type: 'smoothstep',
          })
        }
      }
    }
  }

  // Connect actions sequentially
  for (let i = 0; i < sortedActions.length - 1; i++) {
    const currentActionTasks = state.tasks
      .filter((t) => t.actionId === sortedActions[i].id)
      .sort((a, b) => a.order - b.order)
    const lastTask = currentActionTasks[currentActionTasks.length - 1]

    if (lastTask) {
      edges.push({
        id: `e-${sortedActions[i].id}-${sortedActions[i + 1].id}`,
        source: lastTask.id,
        target: sortedActions[i + 1].id,
        type: 'smoothstep',
        animated: true,
      })
    }
  }

  // Apply dagre layout
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  for (const node of nodes) {
    const width = node.type === 'actionNode' ? 200 : 180
    const height = node.type === 'actionNode' ? 50 : 70
    g.setNode(node.id, { width, height })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const width = node.type === 'actionNode' ? 200 : 180
    const height = node.type === 'actionNode' ? 50 : 70
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
