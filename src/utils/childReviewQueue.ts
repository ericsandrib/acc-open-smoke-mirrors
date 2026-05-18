import type { ChildReviewState, ChildTask } from '@/types/workflow'

type ChildForQueue = Pick<ChildTask, 'status' | 'childType'>

/** Advisor-owned work — not yet in a reviewer team's queue. */
export function isChildDraftForReview(child: ChildForQueue): boolean {
  return child.status === 'not_started' || child.status === 'in_progress'
}

/** AML team queue: submitted and AML screening is pending. */
export function isChildInAmlReviewQueue(
  child: ChildForQueue,
  reviewState?: ChildReviewState,
): boolean {
  return child.status === 'awaiting_review' && reviewState?.amlReview?.status === 'pending'
}

/** Document Review team queue (KYC package): AML cleared, HO KYC review pending. */
export function isChildInHoKycReviewQueue(
  child: ChildForQueue,
  reviewState?: ChildReviewState,
): boolean {
  return (
    child.childType === 'kyc' &&
    child.status === 'awaiting_review' &&
    reviewState?.amlReview?.status === 'cleared' &&
    reviewState?.hoKycReview?.status === 'pending'
  )
}

/** Document Review team queue (account opening): document review pending. */
export function isChildInDocumentReviewQueue(
  child: ChildForQueue,
  reviewState?: ChildReviewState,
): boolean {
  return (
    child.childType === 'account-opening' &&
    child.status === 'awaiting_review' &&
    reviewState?.documentReview?.status === 'pending'
  )
}

/** Principal Review team queue: document review accepted (IGO), principal decision pending. */
export function isChildInPrincipalReviewQueue(
  child: ChildForQueue,
  reviewState?: ChildReviewState,
): boolean {
  return (
    child.childType === 'account-opening' &&
    child.status === 'awaiting_review' &&
    reviewState?.documentReview?.status === 'igo' &&
    reviewState?.principalReview?.status === 'pending'
  )
}
