import type { Journey } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { actions, tasks } from './seed'

function buildJourney(
  id: string,
  name: string,
  relationshipName: string,
  assignedTo: string,
  createdBy: string,
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
        assignedTo,
        nickname: `${name} - ${action.title}`,
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
      nickname: `${name} - ${action.title}`,
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
    name,
    relationshipName,
    assignedTo,
    createdBy,
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
  buildJourney('journey-smith', 'Smith Family Onboarding', 'The Smith Family', 'Alice Chen', 'Edward Kim', '2026-02-10', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'complete',
    'placeholder-2': 'complete',
  }),
  buildJourney('journey-johnson', 'Johnson Trust Onboarding', 'Johnson Trust', 'Bob Martinez', 'Alice Chen', '2026-03-05', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'blocked',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-davis', 'Davis Household Onboarding', 'Davis Household', 'Carol Williams', 'Bob Martinez', '2026-03-20', {
    'client-info': 'in_progress',
    'related-parties': 'not_started',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-garcia', 'Garcia Family Onboarding', 'The Garcia Family', 'Diana Torres', 'Carol Williams', '2026-03-28', {
    'client-info': 'complete',
    'related-parties': 'in_progress',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
]
