import type { ChildReviewState, ChildType, OwnerKycReviewState, VerificationSnapshot } from '@/types/workflow'
import { formatStructuredReviewText } from '@/utils/formatStructuredReviewText'

/** Demo defaults when reviewers submit without entering text — never shown in activity. */
const PLACEHOLDER_REVIEWER_MESSAGES = new Set([
  'additional aml information requested.',
  'additional cip information requested.',
  'additional principal review information requested.',
  'rejected after aml review.',
  'escalated by aml team.',
  'document review rejected.',
  'principal rejected the application.',
  'rejected after aml screening.',
  'flagged after aml screening.',
])

/** Audit/timeline message from a disposition snapshot with structured AML reject fields. */
export function dispositionSnapshotMessage(snapshot: VerificationSnapshot): string | undefined {
  const structured = snapshot.rejectionReason?.trim() ?? ''
  const notes = snapshot.reviewerNotes?.trim() ?? ''
  const combined = formatStructuredReviewText(structured, notes)
  if (isMeaningfulReviewerMessage(combined)) return combined
  return isMeaningfulReviewerMessage(snapshot.note) ? snapshot.note : undefined
}

export function isMeaningfulReviewerMessage(text: string | undefined): text is string {
  const trimmed = text?.trim()
  if (!trimmed) return false
  return !PLACEHOLDER_REVIEWER_MESSAGES.has(trimmed.toLowerCase())
}

function pushUniqueMessage(messages: string[], text: string | undefined): void {
  if (!isMeaningfulReviewerMessage(text)) return
  if (!messages.includes(text)) messages.push(text)
}

function ownerClarificationMessages(owner: OwnerKycReviewState): string[] {
  const out: string[] = []
  if (owner.hoKycReview?.status === 'changes_requested') {
    pushUniqueMessage(out, owner.hoKycReview.comments)
  }
  if (owner.amlReview?.status === 'info_requested') {
    pushUniqueMessage(out, owner.amlReview.infoRequestComments)
  }
  for (const snapshot of owner.verificationSnapshots ?? []) {
    if (snapshot.eventKind === 'cip_request_info' || snapshot.eventKind === 'aml_request_info') {
      pushUniqueMessage(out, snapshot.note)
    }
  }
  return out
}

function ownerAmlReviewMessages(owner: OwnerKycReviewState): string[] {
  const out: string[] = []
  const aml = owner.amlReview
  if (aml?.status === 'cleared') {
    pushUniqueMessage(out, aml.approvalReason)
  } else if (aml?.status === 'flagged') {
    pushUniqueMessage(out, aml.findings)
  }
  for (const snapshot of owner.verificationSnapshots ?? []) {
    if (snapshot.eventKind === 'aml_approve' || snapshot.eventKind === 'aml_approve_reused') {
      pushUniqueMessage(out, snapshot.note)
    } else if (snapshot.eventKind === 'aml_reject') {
      pushUniqueMessage(out, dispositionSnapshotMessage(snapshot))
    }
  }
  return out
}

/**
 * Reviewer-entered messages shown under the matching timeline stage.
 * Omits empty values and system default placeholder strings.
 */
export function getStageReviewerMessages(
  stageLabel: string,
  childType: ChildType,
  reviewState?: ChildReviewState,
): string[] {
  if (!reviewState) return []

  const owners = Object.values(reviewState.ownerReviews ?? {})
  const messages: string[] = []

  if (stageLabel === 'Clarification / Document Required') {
    for (const owner of owners) {
      for (const msg of ownerClarificationMessages(owner)) {
        pushUniqueMessage(messages, msg)
      }
    }

    const doc = reviewState.documentReview
    if (doc?.status === 'nigo') {
      pushUniqueMessage(messages, doc.nigoReason)
      pushUniqueMessage(messages, doc.nigoFeedback)
    }

    const principal = reviewState.principalReview
    if (principal?.status === 'nigo') {
      pushUniqueMessage(messages, principal.nigoReason)
      pushUniqueMessage(messages, principal.nigoFeedback)
    }

    if (childType === 'kyc' && reviewState.hoKycReview?.status === 'changes_requested') {
      pushUniqueMessage(messages, reviewState.hoKycReview.comments)
    }

    if (reviewState.amlReview?.status === 'info_requested') {
      pushUniqueMessage(messages, reviewState.amlReview.infoRequestComments)
    }
    if (reviewState.amlReview?.status === 'flagged') {
      pushUniqueMessage(messages, reviewState.amlReview.findings)
    }

    return messages
  }

  if (stageLabel === 'AML Review') {
    for (const owner of owners) {
      for (const msg of ownerAmlReviewMessages(owner)) {
        pushUniqueMessage(messages, msg)
      }
    }

    const aml = reviewState.amlReview
    if (aml?.status === 'cleared') {
      pushUniqueMessage(messages, aml.approvalReason)
    } else if (aml?.status === 'flagged') {
      pushUniqueMessage(messages, aml.findings)
    } else if (aml?.status === 'escalated') {
      pushUniqueMessage(messages, aml.reason)
    }

    return messages
  }

  if (stageLabel === 'Document Review') {
    if (childType === 'kyc' && reviewState.hoKycReview?.status === 'approved') {
      // HO KYC approve rarely includes a free-text message; only show if present later.
    } else if (reviewState.documentReview?.status === 'nigo') {
      pushUniqueMessage(messages, reviewState.documentReview.nigoReason)
      pushUniqueMessage(messages, reviewState.documentReview.nigoFeedback)
    }
    return messages
  }

  if (stageLabel === 'Principal Review' && reviewState.principalReview?.status === 'nigo') {
    pushUniqueMessage(messages, reviewState.principalReview.nigoReason)
    pushUniqueMessage(messages, reviewState.principalReview.nigoFeedback)
    return messages
  }

  return messages
}
