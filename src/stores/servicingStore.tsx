import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Journey, JourneyAction, JourneyTask } from '@/types/servicing'
import type { WorkflowState } from '@/types/workflow'
import { seededJourneys } from '@/data/servicingSeed'
import { useWorkflow } from './workflowStore'
import { getActionStatus } from '@/utils/getActionStatus'

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

    const parentAction: JourneyAction = {
      id: `${journeyId}-${action.id}`,
      journeyId,
      title: action.title,
      status: actionStatus === 'blocked' ? 'in_progress' as const : actionStatus,
      nickname: `${journeyName} - ${action.title}`,
      tasks: parentJourneyTasks,
    }

    // Create a separate JourneyAction for each KYC child
    const childActions: JourneyAction[] = actionTasks.flatMap((t) =>
      (t.children ?? []).map((c): JourneyAction => {
        const childTask: JourneyTask = {
          id: `${journeyId}-${c.id}`,
          actionId: `${journeyId}-${action.id}-${c.id}`,
          journeyId,
          title: `KYC: ${c.name}`,
          status: c.status,
          assignedTo: t.assignedTo,
          nickname: `${journeyName} - KYC: ${c.name}`,
        }
        return {
          id: `${journeyId}-${action.id}-${c.id}`,
          journeyId,
          title: action.title,
          status: c.status === 'blocked' ? 'in_progress' as const : c.status,
          nickname: `${journeyName} - KYC: ${c.name}`,
          tasks: [childTask],
        }
      }),
    )

    return [parentAction, ...childActions]
  })

  const anyStarted = state.tasks.some((t) => t.status !== 'not_started')
  const allComplete = journeyActions.every((a) => a.status === 'complete')

  return {
    id: journeyId,
    name: journeyName,
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

  const allActions = journeys.flatMap((j) =>
    j.actions.map((a) => ({ ...a, journeyId: j.id })),
  )

  const allTasks = journeys.flatMap((j) =>
    j.actions.flatMap((a) =>
      a.tasks.map((t) => ({ ...t, journeyId: j.id, actionId: a.id })),
    ),
  )

  return (
    <ServicingContext.Provider value={{ journeys, allActions, allTasks, currentLiveJourney: liveJourney, saveCurrentJourney, updateJourneyAssignee }}>
      {children}
    </ServicingContext.Provider>
  )
}

export function useServicing() {
  const context = useContext(ServicingContext)
  if (!context) throw new Error('useServicing must be used within ServicingProvider')
  return context
}
