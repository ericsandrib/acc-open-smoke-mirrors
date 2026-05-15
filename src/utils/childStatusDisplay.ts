import type { ChildReviewState } from '@/types/workflow'

export type ChildDisplayStatus =
  | 'draft'
  | 'awaiting_review'
  | 'aml_review'
  | 'document_review'
  | 'ho_kyc_review'
  | 'escalation_hold'
  | 'principal_review'
  | 'nigo'
  | 'nigo_document'
  | 'nigo_principal'
  | 'rejected_aml'
  | 'clarification_required'
  | 'awaiting_documents'
  | 'canceled'
  | 'complete'

/** Styling for in-review pipeline stages (servicing tables + wizard child badges). */
const REVIEW_PIPELINE_PILL =
  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-800'

/** AML rejection — same pill shape as pipeline; red hue (not violet). */
const AML_REJECTION_PILL =
  'bg-red-50/40 text-red-800 border-red-200 dark:bg-red-950/25 dark:text-red-200 dark:border-red-800'

/** Parent rollup “Needs attention” — amber light fill (not violet pipeline). */
export const NEEDS_ATTENTION_PILL =
  'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'

/** Awaiting documents — neutral grey (not violet pipeline). */
export const AWAITING_DOCUMENTS_PILL =
  'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300'

export const childStatusConfig: Record<
  ChildDisplayStatus,
  { label: string; className: string; pillVariant?: 'draft' | 'completed' | 'declined' }
> = {
  draft: {
    label: 'Draft',
    className: 'border-gray-200 bg-gray-50 text-gray-600',
    pillVariant: 'draft',
  },
  awaiting_review: {
    label: 'Awaiting Review',
    className: REVIEW_PIPELINE_PILL,
  },
  aml_review: {
    label: 'AML Review',
    className: REVIEW_PIPELINE_PILL,
  },
  document_review: {
    label: 'Document Review',
    className: REVIEW_PIPELINE_PILL,
  },
  ho_kyc_review: {
    label: 'Document Review',
    className: REVIEW_PIPELINE_PILL,
  },
  escalation_hold: {
    label: 'Escalation Hold',
    className: REVIEW_PIPELINE_PILL,
  },
  principal_review: {
    label: 'Principal Review',
    className: REVIEW_PIPELINE_PILL,
  },
  nigo: {
    label: 'Clarification / Document Required',
    className: REVIEW_PIPELINE_PILL,
  },
  nigo_document: {
    label: 'Clarification / Document Required',
    className: REVIEW_PIPELINE_PILL,
  },
  nigo_principal: {
    label: 'Clarification / Document Required',
    className: REVIEW_PIPELINE_PILL,
  },
  rejected_aml: {
    label: 'AML Rejection',
    className: 'border-red-200 bg-red-50 text-red-700',
    pillVariant: 'declined',
  },
  clarification_required: {
    label: 'Clarification / Document Required',
    className: REVIEW_PIPELINE_PILL,
  },
  awaiting_documents: {
    label: 'Awaiting Documents',
    className: AWAITING_DOCUMENTS_PILL,
  },
  canceled: {
    label: 'Declined',
    className: 'border-red-200 bg-red-50 text-red-700',
    pillVariant: 'declined',
  },
  complete: {
    label: 'Completed',
    className: 'border-gray-200 bg-gray-100 text-gray-800',
    pillVariant: 'completed',
  },
}

/**
 * Derives a display status from the raw child task status.
 * When `reviewState` is provided (active child), uses the two-pass review
 * state for richer labels. Otherwise falls back to mapping from the raw status.
 */
export function deriveChildDisplayStatus(
  rawStatus: string,
  reviewState?: ChildReviewState,
): ChildDisplayStatus {
  if (rawStatus === 'complete') return 'complete'
  if (rawStatus === 'canceled') return 'canceled'

  if (rawStatus === 'rejected') {
    if (!reviewState) return 'nigo'
    const docReview = reviewState.documentReview
    const principalReview = reviewState.principalReview
    const amlReview = reviewState.amlReview
    if (isKycAwaitingAdvisorClarification(reviewState)) {
      return 'clarification_required'
    }
    if (amlReview?.status === 'escalated') return 'rejected_aml'
    if (isAccountOpeningAwaitingClarification(reviewState)) return 'clarification_required'
    return 'nigo'
  }

  if (rawStatus === 'awaiting_review') {
    if (!reviewState) return 'awaiting_review'
    const amlReview = reviewState.amlReview
    const docReview = reviewState.documentReview
    const hoKycReview = reviewState.hoKycReview
    const amlFlagged = reviewState.amlFlagged

    if (amlReview?.status === 'pending') return 'aml_review'
    if (amlFlagged && (!docReview || docReview.status === 'pending')) return 'escalation_hold'

    if (hoKycReview) {
      if (hoKycReview.status === 'pending') return 'ho_kyc_review'
      if (hoKycReview.status === 'approved') return 'complete'
    }

    if (docReview) {
      if (docReview.status === 'pending') return 'document_review'
      if (docReview.status === 'igo') return 'principal_review'
    }

    return 'awaiting_review'
  }

  if (rawStatus === 'in_progress' || rawStatus === 'not_started') {
    if (isChildAwaitingAdvisorClarification(reviewState)) {
      return 'clarification_required'
    }
    return 'draft'
  }

  return 'draft'
}

/** KYC returned to the advisor after AML requested clarification or documents. */
export function isKycAwaitingAmlClarification(
  reviewState?: ChildReviewState,
): boolean {
  return (
    reviewState?.amlReview?.status === 'flagged' ||
    reviewState?.amlReview?.status === 'info_requested'
  )
}

/** KYC returned to the advisor for clarification (AML or Document Review team). */
export function isKycAwaitingAdvisorClarification(
  reviewState?: ChildReviewState,
): boolean {
  return (
    isKycAwaitingAmlClarification(reviewState) ||
    reviewState?.hoKycReview?.status === 'changes_requested'
  )
}

/** Account opening returned after document or principal review NIGO. */
export function isAccountOpeningAwaitingClarification(
  reviewState?: ChildReviewState,
): boolean {
  return (
    reviewState?.documentReview?.status === 'nigo' ||
    reviewState?.principalReview?.status === 'nigo'
  )
}

/** KYC or account opening returned to the advisor for clarification or documents. */
export function isChildAwaitingAdvisorClarification(
  reviewState?: ChildReviewState,
): boolean {
  return (
    isKycAwaitingAdvisorClarification(reviewState) ||
    isAccountOpeningAwaitingClarification(reviewState)
  )
}

/** True while the KYC package is in the AML review queue (intake fields read-only). */
export function isKycChildInAmlReview(
  rawStatus: string,
  reviewState?: ChildReviewState,
): boolean {
  return (
    rawStatus === 'awaiting_review' &&
    reviewState?.amlReview?.status === 'pending'
  )
}
