import type { Journey } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { actions, tasks } from './seed'

function buildJourney(
  id: string,
  relationshipName: string,
  assignedTo: string,
  createdAt: string,
  taskStatuses: Record<string, TaskStatus>,
): Journey {
  const journeyActions = actions.map((action) => {
    const actionTasks = tasks
      .filter((t) => t.actionId === action.id)
      .map((t) => ({
        id: `${id}-${t.id}`,
        actionId: `${id}-${action.id}`,
        journeyId: id,
        title: t.title,
        status: taskStatuses[t.id] ?? 'not_started' as TaskStatus,
        assignedTo: t.assignedTo,
      }))

    const allComplete = actionTasks.every((t) => t.status === 'complete')
    const anyBlocked = actionTasks.some((t) => t.status === 'blocked')
    const anyStarted = actionTasks.some(
      (t) => t.status === 'in_progress' || t.status === 'complete',
    )

    return {
      id: `${id}-${action.id}`,
      journeyId: id,
      title: action.title,
      status: allComplete
        ? 'complete' as const
        : anyBlocked
          ? 'in_progress' as const
          : anyStarted
            ? 'in_progress' as const
            : 'not_started' as const,
      tasks: actionTasks,
    }
  })

  const allActionsComplete = journeyActions.every((a) => a.status === 'complete')
  const anyActionStarted = journeyActions.some((a) => a.status !== 'not_started')

  return {
    id,
    relationshipName,
    assignedTo,
    createdAt,
    status: allActionsComplete
      ? 'complete'
      : anyActionStarted
        ? 'in_progress'
        : 'not_started',
    actions: journeyActions,
  }
}

export const seededJourneys: Journey[] = [
  buildJourney('journey-smith', 'The Smith Family', 'Alice Chen', '2026-02-10', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'complete',
    'placeholder-1': 'complete',
    'placeholder-2': 'complete',
  }),
  buildJourney('journey-johnson', 'Johnson Trust', 'Bob Martinez', '2026-03-05', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'blocked',
    'placeholder-1': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-davis', 'Davis Household', 'Carol Williams', '2026-03-20', {
    'client-info': 'in_progress',
    'related-parties': 'not_started',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'placeholder-1': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-smith-2', 'The Smith Family', 'Alice Chen', '2026-03-28', {
    'client-info': 'not_started',
    'related-parties': 'not_started',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'placeholder-1': 'not_started',
    'placeholder-2': 'not_started',
  }),
]
