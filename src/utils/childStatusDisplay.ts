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
  | 'awaiting_documents'
  | 'canceled'
  | 'complete'

/** In-app routing assigns work to team views (RBAC/ABAC); pills stay a single queue label. */
const NEED_REVIEW_PILL =
  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-800'

export const childStatusConfig: Record<ChildDisplayStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
  },
  awaiting_review: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  aml_review: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  document_review: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  ho_kyc_review: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  escalation_hold: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  principal_review: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  nigo: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  nigo_document: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  nigo_principal: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  rejected_aml: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  awaiting_documents: {
    label: 'Need Review',
    className: NEED_REVIEW_PILL,
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-muted text-muted-foreground border-border',
  },
  complete: {
    label: 'Complete',
    className: 'bg-green-50 text-green-700 border-green-200',
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
    if (amlReview?.status === 'escalated' || amlReview?.status === 'flagged') return 'rejected_aml'
    if (principalReview?.status === 'nigo') return 'nigo_principal'
    if (docReview?.status === 'nigo') return 'nigo_document'
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

  if (rawStatus === 'in_progress') return 'draft'
  if (rawStatus === 'not_started') return 'draft'

  return 'draft'
}
