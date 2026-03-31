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

  const journeyActions = state.actions.map((action) => {
    const actionStatus = getActionStatus(state.tasks, action.id)
    const actionTasks = state.tasks
      .filter((t) => t.actionId === action.id)
      .map((t) => ({
        id: `${journeyId}-${t.id}`,
        actionId: `${journeyId}-${action.id}`,
        journeyId,
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo,
      }))

    return {
      id: `${journeyId}-${action.id}`,
      journeyId,
      title: action.title,
      status: actionStatus === 'blocked' ? 'in_progress' as const : actionStatus,
      tasks: actionTasks,
    }
  })

  const anyStarted = state.tasks.some((t) => t.status !== 'not_started')
  const allComplete = journeyActions.every((a) => a.status === 'complete')

  return {
    id: journeyId,
    name: state.journeyName ?? 'Client Onboarding',
    relationshipName: primaryParty.name ?? 'Current Journey',
    status: allComplete ? 'complete' : anyStarted ? 'in_progress' : 'not_started',
    createdAt: new Date().toISOString().split('T')[0],
    assignedTo: 'Relationship Manager',
    actions: journeyActions,
  }
}

interface ServicingContextValue {
  journeys: Journey[]
  allActions: JourneyAction[]
  allTasks: JourneyTask[]
  currentLiveJourney: Journey | null
  saveCurrentJourney: (journey: Journey) => void
}

const ServicingContext = createContext<ServicingContextValue | null>(null)

export function ServicingProvider({ children }: { children: ReactNode }) {
  const { state } = useWorkflow()
  const [savedJourneys, setSavedJourneys] = useState<Journey[]>([])

  const liveJourney = deriveLiveJourney(state)

  const saveCurrentJourney = useCallback((journey: Journey) => {
    setSavedJourneys((prev) => [...prev, journey])
  }, [])

  const journeys = [
    ...savedJourneys,
    ...seededJourneys,
    ...(liveJourney ? [liveJourney] : []),
  ]

  const allActions = journeys.flatMap((j) =>
    j.actions.map((a) => ({ ...a, journeyId: j.id })),
  )

  const allTasks = journeys.flatMap((j) =>
    j.actions.flatMap((a) =>
      a.tasks.map((t) => ({ ...t, journeyId: j.id, actionId: a.id })),
    ),
  )

  return (
    <ServicingContext.Provider value={{ journeys, allActions, allTasks, currentLiveJourney: liveJourney, saveCurrentJourney }}>
      {children}
    </ServicingContext.Provider>
  )
}

export function useServicing() {
  const context = useContext(ServicingContext)
  if (!context) throw new Error('useServicing must be used within ServicingProvider')
  return context
}
