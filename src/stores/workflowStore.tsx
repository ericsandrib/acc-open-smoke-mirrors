import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { WorkflowState, WorkflowAction, Task } from '@/types/workflow'
import { actions, tasks, initialRelatedParties } from '@/data/seed'

function computeFlatTaskOrder(allTasks: Task[], allActions: typeof actions): string[] {
  const order: string[] = []
  const sortedActions = [...allActions].sort((a, b) => a.order - b.order)

  for (const action of sortedActions) {
    const actionTasks = allTasks
      .filter((t) => t.actionId === action.id)
      .sort((a, b) => a.order - b.order)

    for (const task of actionTasks) {
      order.push(task.id)
      if (task.children) {
        for (const child of task.children) {
          order.push(child.id)
        }
      }
    }
  }

  return order
}

const initialState: WorkflowState = {
  actions,
  tasks: tasks.map((t) => ({ ...t, children: t.children ? [...t.children] : undefined })),
  relatedParties: [...initialRelatedParties],
  activeTaskId: tasks[0].id,
  flatTaskOrder: computeFlatTaskOrder(tasks, actions),
}

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_ACTIVE_TASK': {
      const taskExists =
        state.flatTaskOrder.includes(action.taskId)
      if (!taskExists) return state
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.taskId && t.status === 'not_started') {
          return { ...t, status: 'in_progress' as const }
        }
        return t
      })
      return { ...state, tasks: newTasks, activeTaskId: action.taskId }
    }

    case 'SET_TASK_STATUS': {
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.taskId) {
          return { ...t, status: action.status }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === action.taskId ? { ...c, status: action.status } : c
          )
          return { ...t, children: newChildren }
        }
        return t
      })
      return { ...state, tasks: newTasks }
    }

    case 'SPAWN_KYC_CHILD': {
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId && t.children) {
          const childId = `kyc-child-${Date.now()}`
          return {
            ...t,
            children: [
              ...t.children,
              {
                id: childId,
                name: action.childName,
                status: 'not_started' as const,
                formKey: 'kyc-child',
              },
            ],
          }
        }
        return t
      })
      const newOrder = computeFlatTaskOrder(newTasks, state.actions)
      return { ...state, tasks: newTasks, flatTaskOrder: newOrder }
    }

    case 'REMOVE_KYC_CHILD': {
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId && t.children) {
          return {
            ...t,
            children: t.children.filter((c) => c.id !== action.childId),
          }
        }
        return t
      })
      const newOrder = computeFlatTaskOrder(newTasks, state.actions)
      const activeStillExists = newOrder.includes(state.activeTaskId)
      return {
        ...state,
        tasks: newTasks,
        flatTaskOrder: newOrder,
        activeTaskId: activeStillExists ? state.activeTaskId : action.parentTaskId,
      }
    }

    case 'ADD_RELATED_PARTY': {
      return { ...state, relatedParties: [...state.relatedParties, action.party] }
    }

    case 'UPDATE_RELATED_PARTY': {
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.id === action.partyId ? { ...p, ...action.updates } : p
        ),
      }
    }

    case 'REMOVE_RELATED_PARTY': {
      return {
        ...state,
        relatedParties: state.relatedParties.filter((p) => p.id !== action.partyId),
      }
    }

    case 'GO_NEXT': {
      const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
      if (idx < state.flatTaskOrder.length - 1) {
        const nextId = state.flatTaskOrder[idx + 1]

        // Find which action the current and next tasks belong to
        const currentTask = state.tasks.find((t) => t.id === state.activeTaskId || t.children?.some((c) => c.id === state.activeTaskId))
        const nextTask = state.tasks.find((t) => t.id === nextId || t.children?.some((c) => c.id === nextId))
        const currentActionId = currentTask?.actionId
        const nextActionId = nextTask?.actionId
        const crossingActionBoundary = currentActionId && nextActionId && currentActionId !== nextActionId

        const newTasks = state.tasks.map((t) => {
          // When crossing action boundary, complete all tasks in the previous action
          if (crossingActionBoundary && t.actionId === currentActionId) {
            const completedChildren = t.children?.map((c) => ({ ...c, status: 'complete' as const }))
            return { ...t, status: 'complete' as const, children: completedChildren }
          }
          // Start the next task
          if (t.id === nextId && t.status === 'not_started') {
            return { ...t, status: 'in_progress' as const }
          }
          if (t.children) {
            const newChildren = t.children.map((c) =>
              c.id === nextId && c.status === 'not_started'
                ? { ...c, status: 'in_progress' as const }
                : c
            )
            return { ...t, children: newChildren }
          }
          return t
        })
        return { ...state, tasks: newTasks, activeTaskId: nextId }
      }

      // Last task in the workflow — complete the entire final action
      if (idx === state.flatTaskOrder.length - 1) {
        const currentTask = state.tasks.find((t) => t.id === state.activeTaskId || t.children?.some((c) => c.id === state.activeTaskId))
        const currentActionId = currentTask?.actionId
        const newTasks = state.tasks.map((t) => {
          if (t.actionId === currentActionId) {
            const completedChildren = t.children?.map((c) => ({ ...c, status: 'complete' as const }))
            return { ...t, status: 'complete' as const, children: completedChildren }
          }
          return t
        })
        return { ...state, tasks: newTasks }
      }

      return state
    }

    case 'GO_BACK': {
      const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
      if (idx > 0) {
        const prevId = state.flatTaskOrder[idx - 1]
        return { ...state, activeTaskId: prevId }
      }
      return state
    }

    default:
      return state
  }
}

const WorkflowContext = createContext<{
  state: WorkflowState
  dispatch: React.Dispatch<WorkflowAction>
} | null>(null)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState)
  return (
    <WorkflowContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider')
  return context
}
