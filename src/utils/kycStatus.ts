import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import { getMissingOwnerKycFields, OWNER_KYC_REQUIRED_FIELD_LABELS } from '@/utils/ownerKycReview'
import { isMeaningfulReviewerMessage } from '@/utils/reviewerStageMessages'

/**
 * Synthesized primary KYC disposition for a verification subject.
 *
 * The reviewer should immediately understand "can this participant move forward?"
 * by looking at a single status — AML and CIP are supporting evidence inside the
 * side sheet, not competing peer states at the row level.
 */
export type KycStatus = 'pass' | 'fail' | 'pending_review' | 'unverified' | 'expired'

export type KycStatusTone = 'success' | 'danger' | 'neutral' | 'warning'

export interface KycStatusBadge {
  status: KycStatus
  label: string
  tone: KycStatusTone
  /** Short operational hint, e.g. "Address mismatch" or "Awaiting AML team review". */
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

/**
 * Resolve a party + owner review into one of the five KYC dispositions.
 *
 * Rules (first match wins):
 *   - `unverified` — no autoTriggeredAt OR any required field missing on the party
 *   - `fail`       — AML flagged/escalated OR CIP overallStatus === 'fail'
 *   - `pass`       — AML cleared AND HO KYC approved
 *   - `pending_review` — KYC has run but isn't in pass/fail
 *   - `expired`    — future hook (no current producer)
 */
export function getKycStatus(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
): KycStatus {
  if (party && getMissingOwnerKycFields(party).length > 0) return 'unverified'
  if (!owner?.autoTriggeredAt) return 'unverified'

  const aml = owner.amlReview?.status
  const ho = owner.hoKycReview?.status
  const cip = owner.cipStatus

  if (aml === 'flagged' || aml === 'escalated') return 'fail'
  if (cip?.overallStatus === 'fail') return 'fail'

  if (aml === 'cleared' && ho === 'approved') return 'pass'

  return 'pending_review'
}

function getFailureReason(owner?: OwnerKycReviewState): string | undefined {
  const aml = owner?.amlReview?.status
  const cip = owner?.cipStatus
  const mismatches = owner?.cipPayloadDemo?.mismatches ?? []
  const findings = owner?.amlReview?.findings

  if (aml === 'escalated') return 'AML escalated to compliance'
  if (aml === 'flagged') {
    if (isMeaningfulReviewerMessage(findings)) return findings
    return 'AML watchlist review required'
  }
  if (cip?.overallStatus === 'fail') {
    if (mismatches[0]) return mismatches[0]
    if (cip.addressMatch === 'fail') return 'Address mismatch'
    if (cip.dobMatch === 'fail') return 'DOB mismatch'
    if (cip.idVerification === 'fail') return 'Identity verification mismatch'
  }
  return undefined
}

function getPendingHint(owner?: OwnerKycReviewState): string | undefined {
  const aml = owner?.amlReview?.status
  const ho = owner?.hoKycReview?.status
  const cip = owner?.cipStatus

  if (aml === 'info_requested') {
    const note = owner?.amlReview?.infoRequestComments
    return isMeaningfulReviewerMessage(note) ? note : 'AML information requested'
  }
  if (ho === 'changes_requested') {
    const note = owner?.hoKycReview?.comments
    return isMeaningfulReviewerMessage(note) ? note : 'Document review requested changes'
  }
  if (aml === 'pending') return 'Awaiting AML team review'
  if (ho === 'pending') return 'Awaiting document review'
  if (!cip || cip.overallStatus === 'pending') return 'Verification in progress'
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
  if (!owner?.autoTriggeredAt) return 'KYC not yet run'
  return undefined
}

/**
 * Resolve the badge shown on the primary verification surfaces (Account & Owners chip,
 * verification subject rows in the AML and CIP review tasks).
 */
export function getKycStatusBadge(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
): KycStatusBadge {
  const status = getKycStatus(owner, party)
  const label = STATUS_LABELS[status]
  const tone = STATUS_TONES[status]
  let hint: string | undefined
  if (status === 'fail') hint = getFailureReason(owner)
  else if (status === 'pending_review') hint = getPendingHint(owner)
  else if (status === 'unverified') hint = getUnverifiedHint(owner, party)
  return { status, label, tone, hint }
}

/**
 * Sort priority — lower number = higher operational priority (shown first).
 * Used to surface attention-needing rows in the AML / CIP review tasks.
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
