import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { WorkflowState, WorkflowAction, Task } from '@/types/workflow'
import { actions, tasks, initialRelatedParties, initialFinancialAccounts } from '@/data/seed'

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
  financialAccounts: [...initialFinancialAccounts],
  activeTaskId: tasks[0].id,
  flatTaskOrder: computeFlatTaskOrder(tasks, actions),
  taskData: {},
}

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_ACTIVE_TASK': {
      const taskExists =
        state.flatTaskOrder.includes(action.taskId)
      if (!taskExists) return state
      return { ...state, activeTaskId: action.taskId }
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

    case 'CONFIRM_TASK': {
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.taskId && t.status === 'in_progress') {
          return { ...t, status: 'complete' as const }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === action.taskId && c.status === 'in_progress'
              ? { ...c, status: 'complete' as const }
              : c
          )
          return { ...t, children: newChildren }
        }
        return t
      })
      return { ...state, tasks: newTasks }
    }

    case 'REOPEN_TASK': {
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.taskId && t.status === 'complete') {
          return { ...t, status: 'in_progress' as const }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === action.taskId && c.status === 'complete'
              ? { ...c, status: 'in_progress' as const }
              : c
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
      const { [action.childId]: _, ...remainingTaskData } = state.taskData
      return {
        ...state,
        tasks: newTasks,
        flatTaskOrder: newOrder,
        activeTaskId: activeStillExists ? state.activeTaskId : action.parentTaskId,
        taskData: remainingTaskData,
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

    case 'SET_PRIMARY_MEMBER': {
      const target = state.relatedParties.find((p) => p.id === action.partyId)
      if (!target || target.type !== 'household_member') return state
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.type === 'household_member'
            ? { ...p, isPrimary: p.id === action.partyId }
            : p
        ),
      }
    }

    case 'REMOVE_RELATED_PARTY': {
      const party = state.relatedParties.find((p) => p.id === action.partyId)
      if (party?.isPrimary) return state
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.id === action.partyId ? { ...p, isHidden: true } : p
        ),
      }
    }

    case 'RESTORE_RELATED_PARTIES': {
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          action.partyIds.includes(p.id) ? { ...p, isHidden: false } : p
        ),
      }
    }

    case 'ADD_FINANCIAL_ACCOUNT': {
      return { ...state, financialAccounts: [...state.financialAccounts, action.account] }
    }

    case 'UPDATE_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: state.financialAccounts.map((a) =>
          a.id === action.accountId ? { ...a, ...action.updates } : a
        ),
      }
    }

    case 'REMOVE_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: state.financialAccounts.filter((a) => a.id !== action.accountId),
      }
    }

    case 'SET_TASK_DATA': {
      // Mark task as in_progress on first data entry
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.taskId && t.status === 'not_started') {
          return { ...t, status: 'in_progress' as const }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === action.taskId && c.status === 'not_started'
              ? { ...c, status: 'in_progress' as const }
              : c
          )
          return { ...t, children: newChildren }
        }
        return t
      })
      return {
        ...state,
        tasks: newTasks,
        taskData: {
          ...state.taskData,
          [action.taskId]: {
            ...state.taskData[action.taskId],
            ...action.fields,
          },
        },
      }
    }

    case 'INITIALIZE_FROM_RELATIONSHIP': {
      const freshTasks = tasks.map((t) => ({
        ...t,
        status: 'not_started' as const,
        children: t.children ? [] : undefined,
      }))
      const newOrder = computeFlatTaskOrder(freshTasks, actions)
      return {
        actions: [...actions],
        tasks: freshTasks,
        relatedParties: action.relatedParties,
        financialAccounts: action.financialAccounts,
        activeTaskId: freshTasks[0].id,
        flatTaskOrder: newOrder,
        taskData: {
          'client-info': action.clientInfo,
        },
        journeyName: action.journeyName,
        journeyId: `journey-${Date.now()}`,
      }
    }

    case 'GO_NEXT': {
      const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
      if (idx >= state.flatTaskOrder.length - 1) return state

      const nextId = state.flatTaskOrder[idx + 1]
      return { ...state, activeTaskId: nextId }
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

export function useTaskData(taskId: string) {
  const { state, dispatch } = useWorkflow()
  const data = state.taskData[taskId] ?? {}

  const updateField = useCallback(
    (field: string, value: unknown) => {
      dispatch({ type: 'SET_TASK_DATA', taskId, fields: { [field]: value } })
    },
    [dispatch, taskId]
  )

  const updateFields = useCallback(
    (fields: Record<string, unknown>) => {
      dispatch({ type: 'SET_TASK_DATA', taskId, fields })
    },
    [dispatch, taskId]
  )

  return { data, updateField, updateFields }
}
