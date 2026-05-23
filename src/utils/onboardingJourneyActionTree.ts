import type { JourneyAction } from '@/types/servicing'
import { getPersistedKycWorkflowMode, isSingleFlowKycMode } from '@/utils/kycWorkflowMode'

/** KYC Reviews section or a per-person KYC child row (KYC is embedded on account children). */
export function isOnboardingKycNestedChildWorkflowAction(action: JourneyAction): boolean {
  const id = action.id
  const parentId = action.parentActionId ?? ''
  return id.endsWith('-kyc-child-actions') || parentId.endsWith('-kyc-child-actions')
}

/** Accounts section, account-opening children, and funding / feature groups. */
export function isOnboardingAccountNestedChildWorkflowAction(action: JourneyAction): boolean {
  if (isOnboardingKycNestedChildWorkflowAction(action)) return false
  const id = action.id
  const parentId = action.parentActionId ?? ''
  if (id.endsWith('-account-opening-child') || parentId.endsWith('-account-opening-child')) return true
  if (action.groupType) return true
  if (action.childId) return true
  return false
}

/** @deprecated Prefer isOnboardingKycNestedChildWorkflowAction / isOnboardingAccountNestedChildWorkflowAction */
export function isOnboardingNestedChildWorkflowAction(action: JourneyAction): boolean {
  return (
    isOnboardingKycNestedChildWorkflowAction(action) ||
    isOnboardingAccountNestedChildWorkflowAction(action)
  )
}

/** True when separate KYC child workflows should be hidden (single-flow). */
export function shouldHideKycInOnboardingListings(
  mode = getPersistedKycWorkflowMode(),
): boolean {
  return isSingleFlowKycMode(mode)
}

/**
 * Filter journey actions for onboarding list UIs.
 * @param hideKycChildWorkflows — hide KYC Reviews section and KYC child rows (Actions + Journeys when single-flow).
 * @param hideAccountChildWorkflows — hide Accounts section and account child rows (Journeys tab only).
 */
export function visibleOnboardingJourneyActions(
  actions: JourneyAction[],
  hideKycChildWorkflows: boolean = shouldHideKycInOnboardingListings(),
  hideAccountChildWorkflows = false,
): JourneyAction[] {
  return actions.filter((a) => {
    if (hideKycChildWorkflows && isOnboardingKycNestedChildWorkflowAction(a)) return false
    if (hideAccountChildWorkflows && isOnboardingAccountNestedChildWorkflowAction(a)) return false
    return true
  })
}
