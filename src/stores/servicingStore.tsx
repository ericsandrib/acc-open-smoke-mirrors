import { createContext, useContext, type ReactNode } from 'react'
import type { Journey, JourneyAction, JourneyTask } from '@/types/servicing'
import type { WorkflowState } from '@/types/workflow'
import { seededJourneys } from '@/data/servicingSeed'
import { useWorkflow } from './workflowStore'
import { getActionStatus } from '@/utils/getActionStatus'

function deriveLiveJourney(state: WorkflowState): Journey | null {
  const primaryParty = state.relatedParties.find((p) => p.isPrimary)
  if (!primaryParty) return null

  const anyTaskStarted = state.tasks.some((t) => t.status !== 'not_started')
  if (!anyTaskStarted) return null

  const journeyActions = state.actions.map((action) => {
    const actionStatus = getActionStatus(state.tasks, action.id)
    const actionTasks = state.tasks
      .filter((t) => t.actionId === action.id)
      .map((t) => ({
        id: `live-${t.id}`,
        actionId: `live-${action.id}`,
        journeyId: 'live-current',
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo,
      }))

    return {
      id: `live-${action.id}`,
      journeyId: 'live-current',
      title: action.title,
      status: actionStatus === 'blocked' ? 'in_progress' as const : actionStatus,
      tasks: actionTasks,
    }
  })

  const allComplete = journeyActions.every((a) => a.status === 'complete')

  return {
    id: 'live-current',
    relationshipName: primaryParty.name ?? 'Current Journey',
    status: allComplete ? 'complete' : 'in_progress',
    createdAt: new Date().toISOString().split('T')[0],
    assignedTo: 'Relationship Manager',
    actions: journeyActions,
  }
}

interface ServicingContextValue {
  journeys: Journey[]
  allActions: JourneyAction[]
  allTasks: JourneyTask[]
}

const ServicingContext = createContext<ServicingContextValue | null>(null)

export function ServicingProvider({ children }: { children: ReactNode }) {
  const { state } = useWorkflow()
  const liveJourney = deriveLiveJourney(state)

  const journeys = liveJourney
    ? [...seededJourneys, liveJourney]
    : seededJourneys

  const allActions = journeys.flatMap((j) =>
    j.actions.map((a) => ({ ...a, journeyId: j.id })),
  )

  const allTasks = journeys.flatMap((j) =>
    j.actions.flatMap((a) =>
      a.tasks.map((t) => ({ ...t, journeyId: j.id, actionId: a.id })),
    ),
  )

  return (
    <ServicingContext.Provider value={{ journeys, allActions, allTasks }}>
      {children}
    </ServicingContext.Provider>
  )
}

export function useServicing() {
  const context = useContext(ServicingContext)
  if (!context) throw new Error('useServicing must be used within ServicingProvider')
  return context
}
