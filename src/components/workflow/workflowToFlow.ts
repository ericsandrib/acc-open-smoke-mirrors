import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowState } from '@/types/workflow'
import { getActionStatus } from '@/utils/getActionStatus'

const TASK_W = 180
const TASK_H = 70
const KYC_W = 150
const KYC_H = 50
const HEADER_H = 50
const PAD = 20
const TASK_GAP = 16
const KYC_GAP = 12

export function workflowToFlow(state: WorkflowState) {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const sortedActions = [...state.actions].sort((a, b) => a.order - b.order)

  // Track group dimensions for dagre pass
  const groupDimensions: Record<string, { width: number; height: number }> = {}

  // Pass 1: Inner layout per action
  for (const action of sortedActions) {
    const actionTasks = state.tasks
      .filter((t) => t.actionId === action.id)
      .sort((a, b) => a.order - b.order)

    let cursorY = HEADER_H + PAD
    let maxWidth = TASK_W

    for (let i = 0; i < actionTasks.length; i++) {
      const task = actionTasks[i]

      // Push task node with parent-relative position
      nodes.push({
        id: task.id,
        type: 'taskNode',
        parentId: action.id,
        extent: 'parent' as const,
        data: { label: task.title, status: task.status, assignedTo: task.assignedTo },
        position: { x: PAD, y: cursorY },
      })

      cursorY += TASK_H

      // Sequential task-to-task edges (dashed)
      if (i > 0) {
        edges.push({
          id: `e-${actionTasks[i - 1].id}-${task.id}`,
          source: actionTasks[i - 1].id,
          target: task.id,
          type: 'smoothstep',
          style: { strokeDasharray: '5,5' },
        })
      }

      // KYC children in horizontal row below task
      if (task.children && task.children.length > 0) {
        cursorY += TASK_GAP

        const totalChildrenWidth =
          task.children.length * KYC_W + (task.children.length - 1) * KYC_GAP

        for (let j = 0; j < task.children.length; j++) {
          const child = task.children[j]
          const childX = PAD + j * (KYC_W + KYC_GAP)

          nodes.push({
            id: child.id,
            type: 'kycChildNode',
            parentId: action.id,
            extent: 'parent' as const,
            data: { label: child.name, status: child.status },
            position: { x: childX, y: cursorY },
          })

          edges.push({
            id: `e-${task.id}-${child.id}`,
            source: task.id,
            target: child.id,
            type: 'smoothstep',
          })
        }

        maxWidth = Math.max(maxWidth, totalChildrenWidth)
        cursorY += KYC_H
      }

      cursorY += TASK_GAP
    }

    const groupW = maxWidth + 2 * PAD
    const groupH = cursorY - TASK_GAP + PAD // remove trailing gap, add padding

    groupDimensions[action.id] = { width: groupW, height: groupH }

    // Push group node BEFORE children — but we already pushed children above.
    // React Flow requires parents before children in the array, so we insert at the right position.
    // We'll fix ordering after the loop.
    nodes.push({
      id: action.id,
      type: 'actionGroupNode',
      data: { label: action.title, status: getActionStatus(state.tasks, action.id) },
      position: { x: 0, y: 0 },
      style: { width: groupW, height: groupH },
    })
  }

  // Fix node ordering: parents must come before children
  // Sort so that nodes without parentId come before nodes with parentId
  nodes.sort((a, b) => {
    const aIsParent = !a.parentId ? 0 : 1
    const bIsParent = !b.parentId ? 0 : 1
    return aIsParent - bIsParent
  })

  // Group-to-group edges
  for (let i = 0; i < sortedActions.length - 1; i++) {
    edges.push({
      id: `e-${sortedActions[i].id}-${sortedActions[i + 1].id}`,
      source: sortedActions[i].id,
      target: sortedActions[i + 1].id,
      type: 'smoothstep',
      animated: true,
    })
  }

  // Pass 2: Dagre layout for group nodes only
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  for (const action of sortedActions) {
    const dim = groupDimensions[action.id]
    g.setNode(action.id, { width: dim.width, height: dim.height })
  }

  for (let i = 0; i < sortedActions.length - 1; i++) {
    g.setEdge(sortedActions[i].id, sortedActions[i + 1].id)
  }

  dagre.layout(g)

  // Apply dagre positions to group nodes
  for (const node of nodes) {
    if (!node.parentId && groupDimensions[node.id]) {
      const pos = g.node(node.id)
      const dim = groupDimensions[node.id]
      node.position = {
        x: pos.x - dim.width / 2,
        y: pos.y - dim.height / 2,
      }
    }
  }

  return { nodes, edges }
}
