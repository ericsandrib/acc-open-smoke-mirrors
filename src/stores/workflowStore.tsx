import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { WorkflowState, WorkflowAction, Task } from '@/types/workflow'
import { actions, tasks, initialRelatedParties, initialFinancialAccounts } from '@/data/seed'
import { getChildSubTaskIds, getChildTypeConfig, parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { generateAccountOpenIdentifiers } from '@/utils/accountOpenIdentifiers'

let childIdCounter = 0

function computeFlatTaskOrder(allTasks: Task[], allActions: typeof actions): string[] {
  const order: string[] = []
  const sortedActions = [...allActions].sort((a, b) => a.order - b.order)

  for (const action of sortedActions) {
    const actionTasks = allTasks
      .filter((t) => t.actionId === action.id)
      .sort((a, b) => a.order - b.order)

    for (const task of actionTasks) {
      order.push(task.id)
    }
  }

  return order
}

const initialState: WorkflowState = {
  actions,
  tasks: tasks.map((t) => ({
    ...t,
    children: t.children ? [...t.children] : undefined,
    status: 'in_progress' as const,
    unread: true,
    edited: false,
  })),
  relatedParties: [...initialRelatedParties],
  financialAccounts: [...initialFinancialAccounts],
  activeTaskId: tasks[0].id,
  flatTaskOrder: computeFlatTaskOrder(tasks, actions),
  taskData: {},
  submittedTaskIds: [],
}

function markTaskEdited(allTasks: Task[], formKey: string): Task[] {
  return allTasks.map((t) => (t.formKey === formKey ? { ...t, edited: true } : t))
}

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_ACTIVE_TASK': {
      const taskExists =
        state.flatTaskOrder.includes(action.taskId)
      if (!taskExists) return state
      const newTasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, unread: false } : t
      )
      return { ...state, activeTaskId: action.taskId, tasks: newTasks }
    }

    case 'GO_TO_TASK': {
      if (!state.flatTaskOrder.includes(action.taskId)) return state
      const goToTasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, unread: false } : t
      )
      return {
        ...state,
        activeTaskId: action.taskId,
        tasks: goToTasks,
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
      }
    }

    case 'SET_TASK_STATUS': {
      const parsed = parseChildSubTaskId(action.taskId)
      const childId = parsed?.childId ?? action.taskId
      const newTasks = state.tasks.map((t) => {
        if (t.id === childId) {
          return { ...t, status: action.status }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === childId ? { ...c, status: action.status } : c
          )
          return { ...t, children: newChildren }
        }
        return t
      })
      return { ...state, tasks: newTasks }
    }

    case 'CONFIRM_TASK': {
      const newSubmitted = state.submittedTaskIds.includes(action.taskId)
        ? state.submittedTaskIds
        : [...state.submittedTaskIds, action.taskId]

      // Check if this is the last task in the flat order (Final Review)
      const lastTaskId = state.flatTaskOrder[state.flatTaskOrder.length - 1]
      const isFinalTask = action.taskId === lastTaskId

      if (isFinalTask) {
        // Final Review completed — transition all tasks to awaiting_review
        const newTasks = state.tasks.map((t) => {
          const updatedTask = { ...t, status: 'awaiting_review' as const }
          if (updatedTask.children) {
            const newChildren = updatedTask.children.map((c) => ({
              ...c,
              status: 'awaiting_review' as const,
            }))
            return { ...updatedTask, children: newChildren }
          }
          return updatedTask
        })
        return {
          ...state,
          tasks: newTasks,
          submittedTaskIds: [],
          reviewState: {
            reviewStatus: 'pending',
            assignedTo: 'Home Office Review Team',
          },
          submittedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          demoViewMode: 'advisor',
        }
      }

      // Not the final task — just record the submission
      return { ...state, submittedTaskIds: newSubmitted }
    }

    case 'REOPEN_TASK': {
      const parsedReopen = parseChildSubTaskId(action.taskId)
      const reopenChildId = parsedReopen?.childId ?? action.taskId
      const newTasks = state.tasks.map((t) => {
        if (t.id === reopenChildId && t.status === 'complete') {
          return { ...t, status: 'in_progress' as const }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === reopenChildId && c.status === 'complete'
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
        submittedTaskIds: state.submittedTaskIds.filter((id) => id !== action.taskId),
      }
    }

    case 'SET_JOURNEY_ASSIGNEE': {
      const newTasks = state.tasks.map((t) => ({
        ...t,
        assignedTo: action.assignee,
      }))
      return { ...state, tasks: newTasks, assignedTo: action.assignee }
    }

    case 'SPAWN_CHILD': {
      const config = getChildTypeConfig(action.childType)
      let spawnedChildId = ''
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId && t.children) {
          const childId = `${config.idPrefix}-${Date.now()}-${++childIdCounter}`
          spawnedChildId = childId
          return {
            ...t,
            edited: true,
            children: [
              ...t.children,
              {
                id: childId,
                name: action.childName,
                status: 'not_started' as const,
                formKey: config.idPrefix,
                childType: action.childType,
              },
            ],
          }
        }
        return t
      })
      const newOrder = computeFlatTaskOrder(newTasks, state.actions)
      let newTaskData = state.taskData
      if (spawnedChildId) {
        const merged = {
          ...(state.taskData[spawnedChildId] ?? {}),
          ...(action.metadata ?? {}),
        }
        if (action.childType === 'account-opening') {
          const gen = generateAccountOpenIdentifiers(action.childName, spawnedChildId)
          merged.accountNumber = (merged.accountNumber as string | undefined) ?? gen.accountNumber
          merged.shortName = (merged.shortName as string | undefined) ?? gen.shortName
        }
        newTaskData = { ...state.taskData, [spawnedChildId]: merged }
      }
      return { ...state, tasks: newTasks, flatTaskOrder: newOrder, taskData: newTaskData }
    }

    case 'SPAWN_AND_ENTER_CHILD': {
      const spawnConfig = getChildTypeConfig(action.childType)
      let newChildId = ''
      const spawnTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId && t.children) {
          const childId = `${spawnConfig.idPrefix}-${Date.now()}-${++childIdCounter}`
          newChildId = childId
          return {
            ...t,
            edited: true,
            children: [
              ...t.children,
              {
                id: childId,
                name: action.childName,
                status: 'not_started' as const,
                formKey: spawnConfig.idPrefix,
                childType: action.childType,
              },
            ],
          }
        }
        return t
      })
      const spawnOrder = computeFlatTaskOrder(spawnTasks, state.actions)
      return {
        ...state,
        tasks: spawnTasks,
        flatTaskOrder: spawnOrder,
        activeChildActionId: newChildId,
        activeChildSubTaskIndex: 0,
      }
    }

    case 'REMOVE_CHILD': {
      let removedChildType: import('@/types/workflow').ChildType | null = null
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId && t.children) {
          const child = t.children.find((c) => c.id === action.childId)
          if (child) removedChildType = child.childType
          return {
            ...t,
            edited: true,
            children: t.children.filter((c) => c.id !== action.childId),
          }
        }
        return t
      })
      const newOrder = computeFlatTaskOrder(newTasks, state.actions)
      const activeStillExists = newOrder.includes(state.activeTaskId)
      // Clean up all sub-task data keys for the removed child
      const remainingTaskData = { ...state.taskData }
      if (removedChildType) {
        const subTaskIds = getChildSubTaskIds(action.childId, removedChildType)
        for (const id of subTaskIds) {
          delete remainingTaskData[id]
        }
      }
      return {
        ...state,
        tasks: newTasks,
        flatTaskOrder: newOrder,
        activeTaskId: activeStillExists ? state.activeTaskId : action.parentTaskId,
        taskData: remainingTaskData,
      }
    }

    case 'ADD_RELATED_PARTY': {
      return {
        ...state,
        relatedParties: [...state.relatedParties, action.party],
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'UPDATE_RELATED_PARTY': {
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.id === action.partyId ? { ...p, ...action.updates } : p
        ),
        tasks: markTaskEdited(state.tasks, 'related-parties'),
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
        tasks: markTaskEdited(state.tasks, 'related-parties'),
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
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'RESTORE_RELATED_PARTIES': {
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          action.partyIds.includes(p.id) ? { ...p, isHidden: false } : p
        ),
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'ADD_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: [...state.financialAccounts, action.account],
        tasks: markTaskEdited(state.tasks, 'existing-accounts'),
      }
    }

    case 'UPDATE_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: state.financialAccounts.map((a) =>
          a.id === action.accountId ? { ...a, ...action.updates } : a
        ),
        tasks: markTaskEdited(state.tasks, 'existing-accounts'),
      }
    }

    case 'REMOVE_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: state.financialAccounts.filter((a) => a.id !== action.accountId),
        tasks: markTaskEdited(state.tasks, 'existing-accounts'),
      }
    }

    case 'SET_TASK_DATA': {
      const parsedData = parseChildSubTaskId(action.taskId)
      const dataChildId = parsedData?.childId ?? action.taskId
      const newTasks = state.tasks.map((t) => {
        // Direct task match — mark edited
        if (t.id === dataChildId) {
          return { ...t, edited: true }
        }
        // Child match — mark parent edited + transition child not_started → in_progress
        if (t.children) {
          const hasChild = t.children.some((c) => c.id === dataChildId)
          const newChildren = t.children.map((c) =>
            c.id === dataChildId && c.status === 'not_started'
              ? { ...c, status: 'in_progress' as const }
              : c
          )
          return hasChild
            ? { ...t, edited: true, children: newChildren }
            : { ...t, children: newChildren }
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
      const assignee = action.assignedTo ?? 'Unassigned'
      const freshTasks = tasks.map((t) => ({
        ...t,
        status: 'in_progress' as const,
        assignedTo: assignee,
        children: t.children ? [] : undefined,
        unread: true,
        edited: false,
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
        assignedTo: assignee,
        submittedTaskIds: [],
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
      }
    }

    case 'GO_NEXT': {
      const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
      if (idx >= state.flatTaskOrder.length - 1) return state

      const nextId = state.flatTaskOrder[idx + 1]
      const goNextTasks = state.tasks.map((t) =>
        t.id === nextId ? { ...t, unread: false } : t
      )
      return { ...state, activeTaskId: nextId, tasks: goNextTasks }
    }

    case 'GO_BACK': {
      const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
      if (idx > 0) {
        const prevId = state.flatTaskOrder[idx - 1]
        const goBackTasks = state.tasks.map((t) =>
          t.id === prevId ? { ...t, unread: false } : t
        )
        return { ...state, activeTaskId: prevId, tasks: goBackTasks }
      }
      return state
    }

    case 'ENTER_CHILD_ACTION': {
      const enteredChild = state.tasks
        .flatMap((t) => t.children ?? [])
        .find((c) => c.id === action.childId)
      const isAwaitingReview = enteredChild?.status === 'awaiting_review'
      return {
        ...state,
        activeChildActionId: action.childId,
        activeChildSubTaskIndex: action.subTaskIndex ?? 0,
        childActionResume: action.resumeAfterExit,
        demoViewMode: isAwaitingReview ? (state.demoViewMode ?? 'advisor') : state.demoViewMode,
        submittedAt: isAwaitingReview
          ? (state.submittedAt ?? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
          : state.submittedAt,
      }
    }

    case 'EXIT_CHILD_ACTION': {
      if (state.childActionResume) {
        const { accountChildId, subTaskIndex } = state.childActionResume
        return {
          ...state,
          activeChildActionId: accountChildId,
          activeChildSubTaskIndex: subTaskIndex,
          childActionResume: undefined,
        }
      }
      return {
        ...state,
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
        demoViewMode: undefined,
        submittedAt: undefined,
        childReviewDecision: undefined,
        childReviewState: undefined,
      }
    }

    case 'SET_CHILD_SUB_TASK': {
      return { ...state, activeChildSubTaskIndex: action.index }
    }

    case 'CHILD_GO_NEXT': {
      if (state.activeChildActionId == null || state.activeChildSubTaskIndex == null) return state
      const child = state.tasks
        .flatMap((t) => t.children ?? [])
        .find((c) => c.id === state.activeChildActionId)
      if (!child) return state
      const config = getChildTypeConfig(child.childType)
      const maxIndex = config.subTasks.length - 1
      if (state.activeChildSubTaskIndex >= maxIndex) return state
      return { ...state, activeChildSubTaskIndex: state.activeChildSubTaskIndex + 1 }
    }

    case 'CHILD_GO_BACK': {
      if (state.activeChildActionId == null || state.activeChildSubTaskIndex == null) return state
      if (state.activeChildSubTaskIndex <= 0) {
        if (state.childActionResume) {
          const { accountChildId, subTaskIndex } = state.childActionResume
          return {
            ...state,
            activeChildActionId: accountChildId,
            activeChildSubTaskIndex: subTaskIndex,
            childActionResume: undefined,
          }
        }
        return {
          ...state,
          activeChildActionId: undefined,
          activeChildSubTaskIndex: undefined,
          childActionResume: undefined,
        }
      }
      return { ...state, activeChildSubTaskIndex: state.activeChildSubTaskIndex - 1 }
    }

    case 'SUBMIT_FOR_REVIEW': {
      const reviewTasks = state.tasks.map((t) => {
        const updated = { ...t, status: 'awaiting_review' as const }
        if (updated.children) {
          return { ...updated, children: updated.children.map((c) => ({ ...c, status: 'awaiting_review' as const })) }
        }
        return updated
      })
      return {
        ...state,
        tasks: reviewTasks,
        submittedTaskIds: [],
        reviewState: {
          reviewStatus: 'pending',
          assignedTo: 'Home Office Review Team',
        },
      }
    }

    case 'ACCEPT_REVIEW': {
      const acceptedTasks = state.tasks.map((t) => {
        const updated = { ...t, status: 'complete' as const }
        if (updated.children) {
          return { ...updated, children: updated.children.map((c) => ({ ...c, status: 'complete' as const })) }
        }
        return updated
      })
      return {
        ...state,
        tasks: acceptedTasks,
        reviewState: {
          ...state.reviewState!,
          reviewStatus: 'accepted',
        },
      }
    }

    case 'REJECT_REVIEW': {
      const rejectedTasks = state.tasks.map((t) => {
        const updated = { ...t, status: 'rejected' as const }
        if (updated.children) {
          return { ...updated, children: updated.children.map((c) => ({ ...c, status: 'rejected' as const })) }
        }
        return updated
      })
      return {
        ...state,
        tasks: rejectedTasks,
        reviewState: {
          ...state.reviewState!,
          reviewStatus: 'rejected',
          rejectionReason: action.reason,
          rejectionFeedback: action.feedback,
        },
      }
    }

    case 'SUBMIT_CHILD_FOR_REVIEW': {
      if (!state.activeChildActionId) return state
      const cid = state.activeChildActionId
      const submittedChild = state.tasks
        .flatMap((t) => t.children ?? [])
        .find((c) => c.id === cid)
      const isKycChild = submittedChild?.childType === 'kyc'
      const updTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === cid ? { ...c, status: 'awaiting_review' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: updTasks,
        activeChildSubTaskIndex: 0,
        childReviewState: {
          ...state.childReviewState,
          ...(isKycChild
            ? {
                amlReview: { status: 'pending' as const },
                cipStatus: {
                  idVerification: 'pass' as const,
                  addressMatch: 'pass' as const,
                  dobMatch: 'pass' as const,
                  overallStatus: 'pass' as const,
                },
                hoKycReview: { status: 'pending' as const },
                validationErrors: [],
              }
            : { amlReview: { status: 'pending' as const }, documentReview: { status: 'pending' }, principalReview: { status: 'pending' } }
          ),
        },
      }
    }

    case 'ACCEPT_CHILD_REVIEW': {
      if (!state.activeChildActionId) return state
      const acId = state.activeChildActionId
      const acTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === acId ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: acTasks,
        childReviewDecision: {
          outcome: 'approved',
          decidedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        },
      }
    }

    case 'REJECT_CHILD_REVIEW': {
      if (!state.activeChildActionId) return state
      const rcId = state.activeChildActionId
      const rcTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === rcId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: rcTasks,
        taskData: {
          ...state.taskData,
          [`${rcId}-review`]: {
            rejectionReason: action.reason,
            rejectionFeedback: action.feedback,
          },
        },
        childReviewDecision: {
          outcome: 'rejected',
          decidedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        },
      }
    }

    case 'SET_AML_FLAG': {
      return {
        ...state,
        childReviewState: {
          ...state.childReviewState,
          amlFlagged: action.flagged,
          amlNotes: action.notes,
        },
      }
    }

    case 'DOCUMENT_REVIEW_IGO': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      return {
        ...state,
        childReviewState: {
          ...state.childReviewState,
          documentReview: { status: 'igo', decidedAt: ts },
        },
      }
    }

    case 'DOCUMENT_REVIEW_NIGO': {
      if (!state.activeChildActionId) return state
      const dnigoId = state.activeChildActionId
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const dnigoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === dnigoId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: dnigoTasks,
        childReviewState: {
          ...state.childReviewState,
          documentReview: { status: 'nigo', decidedAt: ts, nigoReason: action.reason, nigoFeedback: action.feedback },
        },
        childReviewDecision: { outcome: 'rejected', decidedAt: ts },
        taskData: {
          ...state.taskData,
          [`${dnigoId}-review`]: {
            rejectionReason: action.reason,
            rejectionFeedback: action.feedback,
            rejectedBy: 'Document Review Team',
          },
        },
      }
    }

    case 'PRINCIPAL_REVIEW_IGO': {
      if (!state.activeChildActionId) return state
      const pigoId = state.activeChildActionId
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const docIgo = state.childReviewState?.documentReview?.status === 'igo'
      const pigoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === pigoId && docIgo ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: pigoTasks,
        childReviewState: {
          ...state.childReviewState,
          principalReview: { status: 'igo', decidedAt: ts },
        },
        childReviewDecision: docIgo ? { outcome: 'approved', decidedAt: ts } : state.childReviewDecision,
      }
    }

    case 'PRINCIPAL_REVIEW_NIGO': {
      if (!state.activeChildActionId) return state
      const pnigoId = state.activeChildActionId
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const pnigoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === pnigoId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: pnigoTasks,
        childReviewState: {
          ...state.childReviewState,
          principalReview: { status: 'nigo', decidedAt: ts, nigoReason: action.reason, nigoFeedback: action.feedback },
        },
        childReviewDecision: { outcome: 'rejected', decidedAt: ts },
        taskData: {
          ...state.taskData,
          [`${pnigoId}-review`]: {
            rejectionReason: action.reason,
            rejectionFeedback: action.feedback,
            rejectedBy: 'Principal Review Team',
          },
        },
      }
    }

    case 'AML_REVIEW_CLEAR': {
      if (!state.activeChildActionId) return state
      const amlClearTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      return {
        ...state,
        childReviewState: {
          ...state.childReviewState,
          amlReview: { status: 'cleared', decidedAt: amlClearTs },
        },
      }
    }

    case 'AML_REVIEW_FLAG': {
      if (!state.activeChildActionId) return state
      const amlFlagTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const amlFlagId = state.activeChildActionId
      const amlFlagTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === amlFlagId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: amlFlagTasks,
        childReviewState: {
          ...state.childReviewState,
          amlReview: { status: 'flagged', decidedAt: amlFlagTs, findings: action.findings },
        },
        childReviewDecision: { outcome: 'rejected', decidedAt: amlFlagTs },
      }
    }

    case 'HO_KYC_APPROVE': {
      if (!state.activeChildActionId) return state
      const hoApproveTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const hoApproveId = state.activeChildActionId
      const hoApproveTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === hoApproveId ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: hoApproveTasks,
        childReviewState: {
          ...state.childReviewState,
          hoKycReview: { status: 'approved', decidedAt: hoApproveTs },
        },
        childReviewDecision: { outcome: 'approved', decidedAt: hoApproveTs },
      }
    }

    case 'HO_KYC_REQUEST_CHANGES': {
      if (!state.activeChildActionId) return state
      const hoReqTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const hoReqId = state.activeChildActionId
      const hoReqTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === hoReqId ? { ...c, status: 'in_progress' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: hoReqTasks,
        childReviewState: {
          ...state.childReviewState,
          hoKycReview: { status: 'changes_requested', decidedAt: hoReqTs, comments: action.comments },
        },
        childReviewDecision: { outcome: 'rejected', decidedAt: hoReqTs },
        demoViewMode: 'advisor',
      }
    }

    case 'AML_REQUEST_MORE_INFO': {
      if (!state.activeChildActionId) return state
      const amlInfoTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      return {
        ...state,
        childReviewState: {
          ...state.childReviewState,
          amlReview: {
            ...state.childReviewState?.amlReview,
            status: 'info_requested' as const,
            decidedAt: amlInfoTs,
            infoRequestComments: action.comments,
          },
        },
      }
    }

    case 'AML_ESCALATE_SAR': {
      if (!state.activeChildActionId) return state
      const sarTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const sarId = state.activeChildActionId
      const sarTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === sarId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: sarTasks,
        childReviewState: {
          ...state.childReviewState,
          amlReview: {
            ...state.childReviewState?.amlReview,
            status: 'escalated' as const,
            decidedAt: sarTs,
            reason: action.reason,
          },
        },
        childReviewDecision: { outcome: 'rejected', decidedAt: sarTs },
      }
    }

    case 'PRINCIPAL_KYC_APPROVE': {
      if (!state.activeChildActionId) return state
      const pkApproveTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const pkApproveId = state.activeChildActionId
      const pkApproveTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === pkApproveId ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: pkApproveTasks,
        childReviewState: {
          ...state.childReviewState,
          principalKycReview: { status: 'approved', decidedAt: pkApproveTs },
        },
        childReviewDecision: { outcome: 'approved', decidedAt: pkApproveTs },
      }
    }

    case 'PRINCIPAL_KYC_REJECT': {
      if (!state.activeChildActionId) return state
      const pkRejectTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const pkRejectId = state.activeChildActionId
      const pkRejectTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === pkRejectId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: pkRejectTasks,
        childReviewState: {
          ...state.childReviewState,
          principalKycReview: { status: 'rejected', decidedAt: pkRejectTs, reason: action.reason },
        },
        childReviewDecision: { outcome: 'rejected', decidedAt: pkRejectTs },
      }
    }

    case 'SET_DEMO_VIEW': {
      return {
        ...state,
        demoViewMode: action.mode,
        submittedAt: state.submittedAt ?? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
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

export function useChildActionContext() {
  const { state } = useWorkflow()
  if (!state.activeChildActionId) return null

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)
  if (!child) return null

  const config = getChildTypeConfig(child.childType)
  const n = config.subTasks.length
  if (n === 0) return null

  const raw = state.activeChildSubTaskIndex
  const subTaskIndex =
    raw == null || Number.isNaN(Number(raw)) ? 0 : Math.min(Math.max(0, raw), n - 1)

  const currentSubTask = config.subTasks[subTaskIndex]
  if (!currentSubTask) return null

  const subTaskId = `${child.id}-${currentSubTask.suffix}`

  const parentTask = state.tasks.find((t) =>
    t.children?.some((c) => c.id === child.id)
  )

  return {
    child,
    config,
    currentSubTask,
    subTaskId,
    subTaskIndex,
    totalSubTasks: config.subTasks.length,
    isFirst: subTaskIndex === 0,
    isLast: subTaskIndex === config.subTasks.length - 1,
    parentTask,
  }
}

/**
 * Returns `true` when the advisor is viewing a child that has been sent back
 * with feedback by any reviewer (AML, HO Document, HO Principal, HO KYC,
 * or Principal KYC).  Forms use this to re-enable editing so the advisor
 * can fix issues and resubmit.
 */
export function useAdvisorUnlocked(): boolean {
  const { state } = useWorkflow()
  if (state.demoViewMode !== 'advisor') return false
  const rs = state.childReviewState
  if (!rs) return false

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)
  if (!child) return false

  if (child.childType === 'kyc') {
    return (
      rs.amlReview?.status === 'info_requested' ||
      rs.amlReview?.status === 'flagged' ||
      rs.hoKycReview?.status === 'changes_requested' ||
      rs.principalKycReview?.status === 'rejected' ||
      false
    )
  }

  return (
    rs.amlReview?.status === 'info_requested' ||
    rs.amlReview?.status === 'flagged' ||
    rs.documentReview?.status === 'nigo' ||
    rs.principalReview?.status === 'nigo' ||
    false
  )
}
