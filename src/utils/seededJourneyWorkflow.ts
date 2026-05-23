import {
  isHoDemoServicingJourneyId,
  JOHN_SMITH_ONBOARDING_JOURNEY_ID,
} from '@/data/defaultOnboardingJourney'
import type { WorkflowState } from '@/types/workflow'
import { collectOrphanAccountOpeningChildIds } from '@/utils/repairAccountOpeningChildNames'
import { OPEN_ACCOUNTS_FORM_KEY, OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY } from '@/utils/openAccountsTaskContext'

function isJohnSmithHouseholdState(state: WorkflowState): boolean {
  const primary =
    state.relatedParties.find((p) => p.isPrimary) ??
    state.relatedParties.find((p) => p.type === 'household_member') ??
    state.relatedParties[0]
  if (!primary) return false
  if (primary.id === 'member-1') return true
  const name = `${primary.firstName ?? ''} ${primary.lastName ?? ''}`.trim() || primary.name
  return name.toLowerCase() === 'john smith'
}

function hasAccountOpeningChildrenOnTask(state: WorkflowState): boolean {
  return state.tasks.some(
    (task) =>
      (task.formKey === OPEN_ACCOUNTS_FORM_KEY ||
        task.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) &&
      (task.children?.some((child) => child.childType === 'account-opening') ?? false),
  )
}

/** Reviews, sub-task data, or eSign rows for accounts that were created in this session. */
export function hasAccountOpeningWorkflowEvidence(state: WorkflowState): boolean {
  if (hasAccountOpeningChildrenOnTask(state)) return true
  if (collectOrphanAccountOpeningChildIds(state).length > 0) return true
  return false
}

/**
 * Seeded journey rows should not call INITIALIZE_FROM_RELATIONSHIP when localStorage already
 * holds in-progress workflow for that journey (created accounts, child workflows, etc.).
 */
export function hasPersistedWorkflowForSeededJourney(
  state: WorkflowState,
  targetJourneyId: string,
): boolean {
  if (!state.journeyId && !hasAccountOpeningWorkflowEvidence(state)) return false
  if (state.journeyId === targetJourneyId) return true
  if (
    targetJourneyId === JOHN_SMITH_ONBOARDING_JOURNEY_ID &&
    isHoDemoServicingJourneyId(state.journeyId) &&
    isJohnSmithHouseholdState(state)
  ) {
    return true
  }
  return false
}
