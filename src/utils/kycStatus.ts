import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import { getMissingOwnerKycFields, OWNER_KYC_REQUIRED_FIELD_LABELS } from '@/utils/ownerKycReview'

/**
 * Participant-level verification outcome only — not account workflow routing.
 *
 * Workflow states (Escalation / Hold, Document Review, etc.) live on
 * {@link ChildReviewState.accountWorkflowPhase} and Application Status UI.
 */
export type KycStatus = 'pass' | 'fail' | 'pending_review' | 'unverified' | 'expired'

export type KycStatusTone = 'success' | 'danger' | 'neutral' | 'warning'

export interface KycStatusBadge {
  status: KycStatus
  label: string
  tone: KycStatusTone
  /** Short verification hint — only when {@link getKycStatusBadge} is called with `includeHint`. */
  hint?: string
}

const STATUS_LABELS: Record<KycStatus, string> = {
  pass: 'Pass',
  fail: 'Fail',
  pending_review: 'Pending Review',
  unverified: 'Unverified',
  expired: 'Expired',
}

const STATUS_TONES: Record<KycStatus, KycStatusTone> = {
  pass: 'success',
  fail: 'danger',
  pending_review: 'neutral',
  unverified: 'neutral',
  expired: 'warning',
}

/** Advisor-facing lines beneath the participant KYC badge (not reviewer findings). */
const PARTICIPANT_KYC_SUPPORTING_COPY = {
  amlScreeningMatch:
    'Potential screening match detected. Additional review or supporting documents may be required.',
  cipIdentityFail:
    'Identity verification could not be completed. Supporting documents may be required.',
  supportingDocuments: 'Supporting documents are required to continue onboarding.',
  clarification:
    'Additional clarification is required before verification can be completed.',
  pendingComplianceReview: 'This participant is currently under compliance review.',
  verificationInProgress: 'Verification checks are in progress.',
} as const

type AmlBucket = 'clear' | 'flagged' | 'pending'

function getAmlBucket(owner?: OwnerKycReviewState): AmlBucket {
  const aml = owner?.amlReview?.status
  if (aml === 'cleared') return 'clear'
  if (aml === 'flagged' || aml === 'escalated') return 'flagged'
  return 'pending'
}

/** CIP verified — identity checks passed; not blocked on additional documentation. */
export function isCipVerified(owner?: OwnerKycReviewState): boolean {
  if (!owner?.autoTriggeredAt) return false
  if (owner.hoKycReview?.status === 'changes_requested') return false
  if (owner.cipStatus?.overallStatus === 'fail') return false
  if (owner.cipStatus?.overallStatus === 'pass' || owner.hoKycReview?.status === 'approved') {
    return true
  }
  return false
}

function isCipAdditionalInformationRequired(owner?: OwnerKycReviewState): boolean {
  return (
    owner?.hoKycReview?.status === 'changes_requested' || owner?.cipStatus?.overallStatus === 'fail'
  )
}

function isCipPending(owner?: OwnerKycReviewState): boolean {
  if (!owner?.autoTriggeredAt) return true
  if (isCipVerified(owner) || isCipAdditionalInformationRequired(owner)) return false
  return true
}

/** AML rejected after reviewer disposition. */
function isAmlDispositionFailure(owner?: OwnerKycReviewState): boolean {
  if (!owner) return false
  const aml = owner.amlReview?.status
  if (aml === 'escalated') return true
  if (aml !== 'flagged') return false
  return (owner.verificationSnapshots ?? []).some((s) => s.eventKind === 'aml_reject')
}

/**
 * Resolve participant verification outcome (AML + CIP), independent of account workflow phase.
 *
 * | AML     | CIP                              | KYC              |
 * | ------- | -------------------------------- | ---------------- |
 * | Clear   | Verified                         | Pass             |
 * | Flagged | Verified                         | Fail             |
 * | Clear   | Additional Information Required  | Fail             |
 * | Flagged | Additional Information Required  | Fail             |
 * | Pending | Verified                         | Pending Review   |
 * | Pending | Pending                          | Pending Review   |
 *
 * Screening not started / missing required fields → Unverified.
 */
export function getKycStatus(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
): KycStatus {
  if (party && getMissingOwnerKycFields(party).length > 0) return 'unverified'
  if (!owner?.autoTriggeredAt) return 'unverified'

  if (isAmlDispositionFailure(owner)) return 'fail'
  if (isCipAdditionalInformationRequired(owner)) return 'fail'

  const aml = getAmlBucket(owner)
  const cipVerified = isCipVerified(owner)

  if (aml === 'clear' && cipVerified) return 'pass'
  if (aml === 'flagged') return 'fail'

  return 'pending_review'
}

function isCipIdentityVerificationFailed(owner?: OwnerKycReviewState): boolean {
  const cip = owner?.cipStatus
  if (!cip) return false
  return (
    cip.overallStatus === 'fail' ||
    cip.idVerification === 'fail' ||
    cip.addressMatch === 'fail' ||
    cip.dobMatch === 'fail'
  )
}

/**
 * Short, actionable copy under the participant KYC badge for advisors.
 * Derived from AML/CIP/review state — not workflow queue labels or reviewer notes.
 */
export function getParticipantKycSupportingCopy(
  owner: OwnerKycReviewState | undefined,
  party: RelatedParty | undefined,
  status: KycStatus,
): string | undefined {
  if (status === 'pass') return undefined

  const aml = owner?.amlReview?.status
  const ho = owner?.hoKycReview?.status

  if (aml === 'info_requested') {
    return PARTICIPANT_KYC_SUPPORTING_COPY.clarification
  }
  if (ho === 'changes_requested') {
    return PARTICIPANT_KYC_SUPPORTING_COPY.supportingDocuments
  }

  if (status === 'unverified') {
    return getUnverifiedHint(owner, party)
  }

  if (status === 'pending_review') {
    if (isCipPending(owner)) return PARTICIPANT_KYC_SUPPORTING_COPY.verificationInProgress
    return PARTICIPANT_KYC_SUPPORTING_COPY.pendingComplianceReview
  }

  if (status === 'fail') {
    const amlScreeningIssue = aml === 'flagged' || aml === 'escalated'
    if (amlScreeningIssue) return PARTICIPANT_KYC_SUPPORTING_COPY.amlScreeningMatch
    if (isCipIdentityVerificationFailed(owner)) {
      return PARTICIPANT_KYC_SUPPORTING_COPY.cipIdentityFail
    }
    if (isAmlDispositionFailure(owner)) {
      return PARTICIPANT_KYC_SUPPORTING_COPY.clarification
    }
    return PARTICIPANT_KYC_SUPPORTING_COPY.amlScreeningMatch
  }

  return undefined
}

/** Secondary AML guidance line in the drawer (findings shown above). */
export function getAmlDrawerSupportingCopy(owner?: OwnerKycReviewState): string | undefined {
  const guidance = getAmlSubsystemSupportingCopy(owner)
  if (!guidance) return undefined
  if (guidance === PARTICIPANT_KYC_SUPPORTING_COPY.amlScreeningMatch) {
    return 'Additional review or supporting documents may be required.'
  }
  return guidance
}

/** AML subsystem guidance for the verification drawer (not shown under overall KYC status). */
export function getAmlSubsystemSupportingCopy(owner?: OwnerKycReviewState): string | undefined {
  const aml = owner?.amlReview?.status
  if (aml === 'info_requested') return PARTICIPANT_KYC_SUPPORTING_COPY.clarification
  if (aml === 'flagged' || aml === 'escalated') return PARTICIPANT_KYC_SUPPORTING_COPY.amlScreeningMatch
  if (aml === 'pending') return PARTICIPANT_KYC_SUPPORTING_COPY.pendingComplianceReview
  if (isAmlDispositionFailure(owner)) return PARTICIPANT_KYC_SUPPORTING_COPY.clarification
  return undefined
}

/** CIP subsystem guidance for the verification drawer (not shown under overall KYC status). */
export function getCipSubsystemSupportingCopy(owner?: OwnerKycReviewState): string | undefined {
  if (owner?.hoKycReview?.status === 'changes_requested') {
    return PARTICIPANT_KYC_SUPPORTING_COPY.supportingDocuments
  }
  if (isCipIdentityVerificationFailed(owner)) {
    return PARTICIPANT_KYC_SUPPORTING_COPY.cipIdentityFail
  }
  if (owner?.autoTriggeredAt && isCipPending(owner)) {
    return PARTICIPANT_KYC_SUPPORTING_COPY.verificationInProgress
  }
  return undefined
}

function getUnverifiedHint(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
): string | undefined {
  if (party) {
    const missing = getMissingOwnerKycFields(party)
    if (missing.length > 0) {
      const labels = missing.slice(0, 2).map((k) => OWNER_KYC_REQUIRED_FIELD_LABELS[k])
      const extra = missing.length > 2 ? ` (+${missing.length - 2} more)` : ''
      return `Missing ${labels.join(', ')}${extra}`
    }
  }
  if (!owner?.autoTriggeredAt) {
    return 'Verification will run automatically before final submission.'
  }
  return undefined
}

/**
 * Resolve the badge shown on verification subject rows and Account & Owners surfaces.
 */
export function getKycStatusBadge(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
  options?: { includeHint?: boolean },
): KycStatusBadge {
  const status = getKycStatus(owner, party)
  const label = STATUS_LABELS[status]
  const tone = STATUS_TONES[status]
  let hint: string | undefined
  if (options?.includeHint) {
    hint = getParticipantKycSupportingCopy(owner, party, status)
  }
  return { status, label, tone, hint }
}

/**
 * Sort priority — lower number = higher operational priority (shown first).
 */
export function getKycStatusPriority(status: KycStatus): number {
  switch (status) {
    case 'fail':
      return 0
    case 'pending_review':
      return 1
    case 'unverified':
      return 2
    case 'expired':
      return 2
    case 'pass':
      return 5
  }
}

export function isKycStatusAttention(status: KycStatus): boolean {
  return status === 'fail' || status === 'pending_review' || status === 'unverified'
}

/** AML cleared via automated screening with no watchlist hits (seed / demo copy). */
export function isAutomatedAmlClearMessage(reason?: string | null): boolean {
  if (!reason?.trim()) return false
  return /^automated screening\s*[—–-]\s*no hits$/i.test(reason.trim())
}

/** Neutral drawer copy for automated AML clears — not framed as a manual approval note. */
export function getAmlAutomatedClearDrawerCopy(owner?: OwnerKycReviewState): string | undefined {
  if (owner?.amlReview?.status !== 'cleared') return undefined
  if (isAutomatedAmlClearMessage(owner.amlReview.approvalReason)) {
    return 'No matches identified during screening.'
  }
  return undefined
}
