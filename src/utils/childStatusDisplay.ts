import type { WorkflowState } from '@/types/workflow'

export type ChildDisplayStatus =
  | 'draft'
  | 'awaiting_review'
  | 'escalation_hold'
  | 'principal_review'
  | 'nigo'
  | 'nigo_document'
  | 'nigo_principal'
  | 'rejected_aml'
  | 'awaiting_documents'
  | 'complete'

export const childStatusConfig: Record<ChildDisplayStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
  },
  awaiting_review: {
    label: 'Awaiting Review',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  escalation_hold: {
    label: 'Escalation / Hold',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  principal_review: {
    label: 'Principal Review',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  nigo: {
    label: 'NIGO',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  nigo_document: {
    label: 'NIGO - Document Review',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  nigo_principal: {
    label: 'NIGO - Principal',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  rejected_aml: {
    label: 'Rejected - AML Review',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  awaiting_documents: {
    label: 'Awaiting Documents',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
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
  reviewState?: WorkflowState['childReviewState'],
): ChildDisplayStatus {
  if (rawStatus === 'complete') return 'complete'

  if (rawStatus === 'rejected') {
    if (!reviewState) return 'nigo'
    const docReview = reviewState.documentReview
    const principalReview = reviewState.principalReview
    const amlReview = reviewState.amlReview
    const principalKycReview = reviewState.principalKycReview
    if (amlReview?.status === 'escalated' || amlReview?.status === 'flagged') return 'rejected_aml'
    if (principalKycReview?.status === 'rejected') return 'nigo_principal'
    if (principalReview?.status === 'nigo') return 'nigo_principal'
    if (docReview?.status === 'nigo') return 'nigo_document'
    return 'nigo'
  }

  if (rawStatus === 'awaiting_review') {
    if (!reviewState) return 'awaiting_review'
    const docReview = reviewState.documentReview
    const amlFlagged = reviewState.amlFlagged
    if (amlFlagged && (!docReview || docReview.status === 'pending')) return 'escalation_hold'
    if (docReview?.status === 'igo') return 'principal_review'
    return 'awaiting_review'
  }

  if (rawStatus === 'in_progress') return 'draft'
  if (rawStatus === 'not_started') return 'draft'

  return 'draft'
}
