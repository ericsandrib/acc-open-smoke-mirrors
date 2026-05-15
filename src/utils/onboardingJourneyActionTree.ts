import type { JourneyAction } from '@/types/servicing'

/** Section shells (KYC Reviews / Accounts) or leaf child workflow rows under Open Accounts. */
export function isOnboardingNestedChildWorkflowAction(action: JourneyAction): boolean {
  if (action.childId) return true
  const id = action.id
  if (id.endsWith('-kyc-child-actions') || id.endsWith('-account-opening-child')) return true
  const parentId = action.parentActionId ?? ''
  if (parentId.endsWith('-kyc-child-actions') || parentId.endsWith('-account-opening-child')) {
    return true
  }
  if (action.groupType) return true
  return false
}

export function visibleOnboardingJourneyActions(
  actions: JourneyAction[],
  hideChildWorkflows: boolean,
): JourneyAction[] {
  if (!hideChildWorkflows) return actions
  return actions.filter((a) => !isOnboardingNestedChildWorkflowAction(a))
}
