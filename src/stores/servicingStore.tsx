import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Journey, JourneyAction, JourneyStatus, JourneyTask } from '@/types/servicing'
import type { TaskStatus, WorkflowState } from '@/types/workflow'
import { seededJourneys } from '@/data/servicingSeed'
import { useWorkflow } from './workflowStore'
import { getActionStatus } from '@/utils/getActionStatus'
import { getChildTypeConfig } from '@/utils/childTaskRegistry'
import { deriveChildDisplayStatus } from '@/utils/childStatusDisplay'

/** Map workflow task status to servicing journey action status (spelling + blocked). */
function toJourneyActionStatus(s: TaskStatus): JourneyStatus {
  if (s === 'blocked') return 'in_progress'
  if (s === 'canceled') return 'cancelled'
  return s
}

function deriveLiveJourney(state: WorkflowState): Journey | null {
  const primaryParty = state.relatedParties.find((p) => p.isPrimary)
  if (!primaryParty) return null
  if (!state.journeyId) return null

  const journeyId = state.journeyId
  const journeyName = state.journeyName ?? 'Client Onboarding'

  const journeyActions = state.actions.flatMap((action) => {
    const actionStatus = getActionStatus(state.tasks, action.id)
    const actionTasks = state.tasks.filter((t) => t.actionId === action.id)

    // Collect parent-level tasks (without children) for this action
    const parentJourneyTasks = actionTasks.map((t): JourneyTask => ({
      id: `${journeyId}-${t.id}`,
      actionId: `${journeyId}-${action.id}`,
      journeyId,
      title: t.title,
      status: t.status,
      assignedTo: t.assignedTo,
      nickname: `${journeyName} - ${action.title}`,
    }))

    // Set parent action for certain actions to create nesting
    // Both KYC Cases and Accounts are nested under "Account Opening"
    let parentActionId: string | undefined
    if (action.id === 'kyc-child-actions') {
      parentActionId = `${journeyId}-account-opening`
    } else if (action.id === 'account-opening-child') {
      parentActionId = `${journeyId}-account-opening`
    }

    const parentAction: JourneyAction = {
      id: `${journeyId}-${action.id}`,
      journeyId,
      title: action.title,
      status: toJourneyActionStatus(actionStatus),
      nickname: `${journeyName} - ${action.title}`,
      tasks: parentJourneyTasks,
      parentActionId,
    }

    // Create a separate JourneyAction for each child with its sub-tasks
    const childActions: JourneyAction[] = actionTasks.flatMap((t) =>
      (t.children ?? []).map((c): JourneyAction => {
        const childConfig = getChildTypeConfig(c.childType)
        const isTerminal = c.status === 'complete' || c.status === 'awaiting_review' || c.status === 'canceled'
        const hwm = state.childHighWaterMark?.[c.id] ?? -1
        const childTasks: JourneyTask[] = childConfig.subTasks.map((sub, idx): JourneyTask => {
          let subStatus: TaskStatus = 'not_started'
          if (isTerminal) {
            subStatus = c.status
          } else if (idx <= hwm) {
            subStatus = 'in_progress'
          }
          return {
            id: `${journeyId}-${c.id}-${sub.suffix}`,
            actionId: `${journeyId}-${action.id}-${c.id}`,
            journeyId,
            title: sub.title,
            status: subStatus,
            assignedTo: t.assignedTo,
            nickname: `${journeyName} - ${childConfig.displayLabel}: ${c.name}`,
          }
        })
        // Group child workflows under the correct parent action
        let childParentActionId = `${journeyId}-${action.id}`
        if (c.childType === 'kyc') {
          childParentActionId = `${journeyId}-kyc-child-actions`
        } else if (c.childType === 'account-opening') {
          childParentActionId = `${journeyId}-account-opening-child`
        } else if (c.childType === 'funding-line' || c.childType === 'feature-service-line') {
          const parentAcctId = (state.taskData[c.id] as Record<string, unknown>)?.parentAccountChildId as string | undefined
          if (parentAcctId) {
            const groupType = c.childType === 'funding-line' ? 'funding' : 'feature-service'
            childParentActionId = `${journeyId}-${action.id}-${parentAcctId}-${groupType}`
          }
        }
        const reviewState = state.childReviewsByChildId?.[c.id]
        const displayStatus = deriveChildDisplayStatus(c.status, reviewState)
        return {
          id: `${journeyId}-${action.id}-${c.id}`,
          journeyId,
          title: c.name,
          status: toJourneyActionStatus(c.status),
          displayStatus,
          nickname: `${journeyName} - ${childConfig.displayLabel}: ${c.name}`,
          parentActionId: childParentActionId,
          childId: c.id,
          tasks: childTasks,
        }
      }),
    )

    // Create group actions (Funding & Asset Movement, Features & Services)
    // for every account-opening child, even if no nested children exist yet
    const groupActions: JourneyAction[] = []
    for (const t of actionTasks) {
      for (const c of t.children ?? []) {
        if (c.childType !== 'account-opening') continue
        for (const groupType of ['funding', 'feature-service'] as const) {
          const groupId = `${journeyId}-${action.id}-${c.id}-${groupType}`
          groupActions.push({
            id: groupId,
            journeyId,
            title: groupType === 'funding' ? 'Funding & Asset Movement' : 'Features & Services',
            status: 'not_started',
            nickname: '',
            parentActionId: `${journeyId}-${action.id}-${c.id}`,
            groupType,
            tasks: [],
          })
        }
      }
    }

    return [parentAction, ...childActions, ...groupActions]
  })

  const anyStarted = state.tasks.some((t) => t.status !== 'not_started')
  const allComplete = journeyActions.every((a) => a.status === 'complete')

  return {
    id: journeyId,
    name: journeyName,
    category: 'Onboarding' as const,
    relationshipName: primaryParty.name ?? 'Current Journey',
    status: allComplete ? 'complete' : anyStarted ? 'in_progress' : 'not_started',
    createdAt: new Date().toISOString().split('T')[0],
    assignedTo: state.assignedTo ?? 'Unassigned',
    createdBy: state.assignedTo ?? 'Unassigned',
    actions: journeyActions,
  }
}

interface ServicingContextValue {
  journeys: Journey[]
  onboardingJourneys: Journey[]
  allActions: JourneyAction[]
  allTasks: JourneyTask[]
  currentLiveJourney: Journey | null
  saveCurrentJourney: (journey: Journey) => void
  updateJourneyAssignee: (journeyId: string, assignee: string) => void
}

const ServicingContext = createContext<ServicingContextValue | null>(null)

function applyAssigneeOverride(journey: Journey, assignee: string): Journey {
  return {
    ...journey,
    assignedTo: assignee,
    actions: journey.actions.map((a) => ({
      ...a,
      tasks: a.tasks.map((t) => ({ ...t, assignedTo: assignee })),
    })),
  }
}

export function ServicingProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useWorkflow()
  const [savedJourneys, setSavedJourneys] = useState<Journey[]>([])
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string>>({})

  const liveJourney = deriveLiveJourney(state)

  const saveCurrentJourney = useCallback((journey: Journey) => {
    setSavedJourneys((prev) => [...prev, journey])
  }, [])

  const updateJourneyAssignee = useCallback((journeyId: string, assignee: string) => {
    // For the live journey, dispatch to workflow store
    if (liveJourney && journeyId === liveJourney.id) {
      dispatch({ type: 'SET_JOURNEY_ASSIGNEE', assignee })
      return
    }
    // For seeded/saved journeys, store override
    setAssigneeOverrides((prev) => ({ ...prev, [journeyId]: assignee }))
  }, [liveJourney, dispatch])

  const journeys = [
    ...savedJourneys,
    ...seededJourneys,
    ...(liveJourney ? [liveJourney] : []),
  ].map((j) => {
    const override = assigneeOverrides[j.id]
    return override ? applyAssigneeOverride(j, override) : j
  })

  const onboardingJourneys = (() => {
    const journeyMap = new Map<string, Journey>()
    seededJourneys.filter((j) => j.category === 'Onboarding').forEach((j) => journeyMap.set(j.id, j))
    savedJourneys.forEach((j) => journeyMap.set(j.id, j))
    if (liveJourney) journeyMap.set(liveJourney.id, liveJourney)
    return Array.from(journeyMap.values()).map((j) => {
      const override = assigneeOverrides[j.id]
      return override ? applyAssigneeOverride(j, override) : j
    })
  })()

  const allActions = journeys.flatMap((j) =>
    j.actions.map((a) => ({ ...a, journeyId: j.id })),
  )

  const allTasks = journeys.flatMap((j) =>
    j.actions.flatMap((a) =>
      a.tasks.map((t) => ({ ...t, journeyId: j.id, actionId: a.id })),
    ),
  )

  return (
    <ServicingContext.Provider value={{ journeys, onboardingJourneys, allActions, allTasks, currentLiveJourney: liveJourney, saveCurrentJourney, updateJourneyAssignee }}>
      {children}
    </ServicingContext.Provider>
  )
}

export function useServicing() {
  const context = useContext(ServicingContext)
  if (!context) throw new Error('useServicing must be used within ServicingProvider')
  return context
}
