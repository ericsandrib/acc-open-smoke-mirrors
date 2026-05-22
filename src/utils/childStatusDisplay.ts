import type { ChildReviewState } from '@/types/workflow'
import { ownersPassedOwnerLevelKyc } from '@/utils/ownerKycReview'
import { getStatusSemanticClasses } from '@/utils/statusSemanticColors'

export type ChildDisplayStatus =
  | 'draft'
  | 'awaiting_client_signature'
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

/** Parent rollup "Needs attention" — warning bucket. */
export const NEEDS_ATTENTION_PILL = getStatusSemanticClasses('escalation_hold').pill

/** Awaiting documents — neutral grey. */
export const AWAITING_DOCUMENTS_PILL = getStatusSemanticClasses('awaiting_documents').pill

export const childStatusConfig: Record<
  ChildDisplayStatus,
  { label: string; className: string; pillVariant?: 'draft' | 'completed' | 'declined' }
> = {
  draft: {
    label: 'Draft',
    className: getStatusSemanticClasses('draft').pill,
    pillVariant: 'draft',
  },
  awaiting_client_signature: {
    label: 'Awaiting Client Signature',
    className: getStatusSemanticClasses('awaiting_client_signature').pill,
  },
  awaiting_review: {
    label: 'Awaiting Review',
    className: getStatusSemanticClasses('awaiting_review').pill,
  },
  aml_review: {
    label: 'AML Review',
    className: getStatusSemanticClasses('aml_review').pill,
  },
  document_review: {
    label: 'Document Review',
    className: getStatusSemanticClasses('document_review').pill,
  },
  ho_kyc_review: {
    label: 'Document Review',
    className: getStatusSemanticClasses('ho_kyc_review').pill,
  },
  escalation_hold: {
    label: 'Escalation / Hold',
    className: getStatusSemanticClasses('escalation_hold').pill,
  },
  principal_review: {
    label: 'Principal Review',
    className: getStatusSemanticClasses('principal_review').pill,
  },
  nigo: {
    label: 'Clarification / Document Required',
    className: getStatusSemanticClasses('nigo').pill,
  },
  nigo_document: {
    label: 'Clarification / Document Required',
    className: getStatusSemanticClasses('nigo_document').pill,
  },
  nigo_principal: {
    label: 'Clarification / Document Required',
    className: getStatusSemanticClasses('nigo_principal').pill,
  },
  rejected_aml: {
    label: 'AML Rejection',
    className: getStatusSemanticClasses('rejected_aml').pill,
    pillVariant: 'declined',
  },
  clarification_required: {
    label: 'Clarification / Document Required',
    className: getStatusSemanticClasses('clarification_required').pill,
  },
  awaiting_documents: {
    label: 'Awaiting Documents',
    className: getStatusSemanticClasses('awaiting_documents').pill,
  },
  canceled: {
    label: 'Canceled',
    className: getStatusSemanticClasses('canceled').pill,
  },
  complete: {
    label: 'Completed',
    className: getStatusSemanticClasses('complete').pill,
    pillVariant: 'completed',
  },
}

/**
 * Derives a display status from the raw child task status.
 * When `reviewState` is provided (active child), uses the two-pass review
 * state for richer labels. Otherwise falls back to mapping from the raw status.
 */
/** Account still in advisor setup — owner screening may exist but must not drive workflow badges yet. */
function isPreSubmitAccountOpening(
  reviewState?: ChildReviewState,
  rawStatus?: string,
): boolean {
  if (reviewState?.accountOpeningPreReviewTimeline?.submittedForReviewAt) return false
  if (
    rawStatus === 'rejected' ||
    rawStatus === 'awaiting_review' ||
    rawStatus === 'complete' ||
    rawStatus === 'canceled'
  ) {
    return false
  }
  return true
}

/** Owner-level AML screening returned a hit (single-flow account opening). */
export function hasOwnerLevelAmlFlag(reviewState?: ChildReviewState): boolean {
  return Object.values(reviewState?.ownerReviews ?? {}).some(
    (owner) =>
      owner.amlReview?.status === 'flagged' || owner.amlReview?.status === 'escalated',
  )
}

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
    if (isAccountOpeningAwaitingClarification(reviewState, rawStatus)) return 'clarification_required'
    return 'nigo'
  }

  if (rawStatus === 'awaiting_review') {
    if (!reviewState) return 'awaiting_review'
    const phase = reviewState.accountWorkflowPhase
    if (phase === 'aml_review') {
      return hasOwnerLevelAmlFlag(reviewState) ? 'escalation_hold' : 'aml_review'
    }
    if (phase === 'document_review') {
      const docStatus = reviewState.documentReview?.status
      if (docStatus === 'igo') return 'principal_review'
      if (ownersPassedOwnerLevelKyc(reviewState)) return 'awaiting_review'
      return 'document_review'
    }
    if (phase === 'principal_review') {
      if (reviewState.documentReview?.status !== 'igo' && ownersPassedOwnerLevelKyc(reviewState)) {
        return 'awaiting_review'
      }
      return 'principal_review'
    }
    if (phase === 'escalation_hold') return 'escalation_hold'
    if (phase === 'pending_release') return 'awaiting_review'
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
      if (docReview.status === 'igo') return 'principal_review'
      if (docReview.status === 'pending' && ownersPassedOwnerLevelKyc(reviewState)) {
        return 'awaiting_review'
      }
      if (docReview.status === 'pending') return 'document_review'
    }

    return 'awaiting_review'
  }

  if (rawStatus === 'in_progress' || rawStatus === 'not_started') {
    if (isChildAwaitingAdvisorClarification(reviewState, rawStatus)) {
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

function hasOwnerLevelAccountOpeningClarification(
  reviewState?: ChildReviewState,
  rawStatus?: string,
): boolean {
  if (isPreSubmitAccountOpening(reviewState, rawStatus)) return false
  const owners = reviewState?.ownerReviews
  if (!owners) return false
  return Object.values(owners).some(
    (owner) =>
      owner.amlReview?.status === 'info_requested' ||
      owner.amlReview?.status === 'flagged' ||
      owner.hoKycReview?.status === 'changes_requested',
  )
}

/** Account opening returned after document/principal NIGO or owner-level AML/CIP remediation. */
export function isAccountOpeningAwaitingClarification(
  reviewState?: ChildReviewState,
  rawStatus?: string,
): boolean {
  if (isPreSubmitAccountOpening(reviewState, rawStatus)) {
    return (
      reviewState?.documentReview?.status === 'nigo' ||
      reviewState?.principalReview?.status === 'nigo'
    )
  }
  return (
    reviewState?.documentReview?.status === 'nigo' ||
    reviewState?.principalReview?.status === 'nigo' ||
    reviewState?.amlReview?.status === 'info_requested' ||
    reviewState?.amlReview?.status === 'flagged' ||
    hasOwnerLevelAccountOpeningClarification(reviewState, rawStatus)
  )
}

/** KYC or account opening returned to the advisor for clarification or documents. */
export function isChildAwaitingAdvisorClarification(
  reviewState?: ChildReviewState,
  rawStatus?: string,
): boolean {
  return (
    isKycAwaitingAdvisorClarification(reviewState) ||
    isAccountOpeningAwaitingClarification(reviewState, rawStatus)
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
