import type { Journey, JourneyCategory } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { actions, tasks } from './seed'

function buildJourney(
  id: string,
  name: string,
  category: JourneyCategory,
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
    category,
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
  // Onboarding journeys
  buildJourney('journey-smith', 'Smith Family Onboarding', 'Onboarding', 'The Smith Family', 'Alice Chen', 'Edward Kim', '2026-02-10', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'complete',
    'placeholder-2': 'complete',
  }),
  buildJourney('journey-johnson', 'Johnson Trust Onboarding', 'Onboarding', 'Johnson Trust', 'Bob Martinez', 'Alice Chen', '2026-03-05', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'blocked',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-davis', 'Davis Household Onboarding', 'Onboarding', 'Davis Household', 'Carol Williams', 'Bob Martinez', '2026-03-20', {
    'client-info': 'in_progress',
    'related-parties': 'not_started',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-garcia', 'Garcia Family Onboarding', 'Onboarding', 'The Garcia Family', 'Diana Torres', 'Carol Williams', '2026-03-28', {
    'client-info': 'complete',
    'related-parties': 'in_progress',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),

  // Account Transfer journeys
  buildJourney('journey-patel', 'Patel IRA Transfer', 'Account Transfer', 'Raj Patel', 'Alice Chen', 'Alice Chen', '2026-03-01', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'in_progress',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-chen', 'Chen 401k Rollover', 'Account Transfer', 'Wei Chen', 'Bob Martinez', 'Diana Torres', '2026-03-15', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'in_progress',
    'placeholder-2': 'not_started',
  }),

  // Investment Review journeys
  buildJourney('journey-williams', 'Williams Portfolio Review', 'Investment Review', 'Williams Family Trust', 'Carol Williams', 'Edward Kim', '2026-02-28', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'complete',
    'placeholder-2': 'complete',
  }),
  buildJourney('journey-thompson', 'Thompson Asset Rebalance', 'Investment Review', 'Mark Thompson', 'Diana Torres', 'Alice Chen', '2026-03-10', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'in_progress',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),

  // Tax Planning journeys
  buildJourney('journey-lee', 'Lee Tax Optimization', 'Tax Planning', 'Dr. Sandra Lee', 'Alice Chen', 'Bob Martinez', '2026-01-15', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'in_progress',
    'placeholder-2': 'not_started',
  }),

  // Consolidation journeys
  buildJourney('journey-brown', 'Brown Account Consolidation', 'Consolidation', 'The Brown Family', 'Bob Martinez', 'Carol Williams', '2026-03-22', {
    'client-info': 'complete',
    'related-parties': 'in_progress',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
  buildJourney('journey-nguyen', 'Nguyen Multi-Custodian Consolidation', 'Consolidation', 'Nguyen Trust', 'Diana Torres', 'Edward Kim', '2026-03-25', {
    'client-info': 'in_progress',
    'related-parties': 'not_started',
    'financial-accounts': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),

  // Estate Planning journeys
  buildJourney('journey-anderson', 'Anderson Estate Plan', 'Estate Planning', 'The Anderson Family', 'Carol Williams', 'Alice Chen', '2026-02-20', {
    'client-info': 'complete',
    'related-parties': 'complete',
    'financial-accounts': 'complete',
    'kyc-review': 'in_progress',
    'open-accounts': 'not_started',
    'placeholder-2': 'not_started',
  }),
]
