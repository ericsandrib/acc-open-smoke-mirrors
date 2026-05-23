import type { WorkflowState } from '@/types/workflow'
import { shouldHideKycInOnboardingListings } from '@/utils/onboardingJourneyActionTree'

export type V5NoAnnuityOpenAccountsNavPage = 'instructions' | 'kyc' | 'documents' | 'envelopes'

/**
 * KYC nav visibility now derives entirely from the KYC orchestration mode
 * (Settings → KYC orchestration). Single-flow hides the separate KYC nav.
 */
export function getPersistedHideKycChildWorkflows(): boolean {
  return shouldHideKycInOnboardingListings()
}

/** Hide separate KYC child workflows / parent KYC nav when single-flow mode is enabled. */
export function shouldHideKycChildWorkflows(_state?: WorkflowState): boolean {
  return shouldHideKycInOnboardingListings()
}

export function getV5NoAnnuityOpenAccountsNavPageOrder(
  hideKycPage = shouldHideKycChildWorkflows(),
): V5NoAnnuityOpenAccountsNavPage[] {
  const order: V5NoAnnuityOpenAccountsNavPage[] = ['instructions']
  if (!hideKycPage) order.push('kyc')
  order.push('envelopes')
  return order
}

/** Map legacy `documents` sub-page to a step still present in the nav order. */
export function normalizeV5NoAnnuityPageForNav(
  page: V5NoAnnuityOpenAccountsNavPage | null | undefined,
  hideKycPage = shouldHideKycChildWorkflows(),
): V5NoAnnuityOpenAccountsNavPage {
  if (page == null) return 'instructions'
  if (page === 'documents') return hideKycPage ? 'instructions' : 'kyc'
  if (page === 'kyc' && hideKycPage) return 'instructions'
  const order = getV5NoAnnuityOpenAccountsNavPageOrder(hideKycPage)
  return order.includes(page) ? page : 'instructions'
}
