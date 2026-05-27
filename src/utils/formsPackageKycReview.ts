import type { EsignEnvelope } from '@/types/esignEnvelope'
import type { OwnerKycReviewState, RelatedParty, WorkflowState } from '@/types/workflow'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { applyAutoRunOwnerKycToState, getOwnerReviewState } from '@/utils/ownerKycReview'
import {
  getKycStatus,
  getKycStatusPriority,
  isCipVerified,
  type KycStatus,
} from '@/utils/kycStatus'

/** Advisor-facing AML/CIP line on the forms-package warning modal. */
export type ScreeningLineLabel = 'Pass' | 'Review Required' | 'Pending'

export interface FormsPackageParticipantKycSummary {
  partyId: string
  partyName: string
  amlLabel: ScreeningLineLabel
  cipLabel: ScreeningLineLabel
  kycStatus: KycStatus
  /** Optional scannable hint (e.g. identity verification). */
  detailLine?: string
  accountChildIds: string[]
}

/** Firm knowledge base — accepted identity / AML remediation documents (demo). */
export const KYC_ACCEPTED_SUPPORTING_DOCUMENTS_GUIDE_URL =
  'https://www.finra.org/rules-guidance/key-topics/aml'

function isCipReviewRequired(owner?: OwnerKycReviewState): boolean {
  if (!owner?.autoTriggeredAt) return false
  if (owner.hoKycReview?.status === 'changes_requested') return true
  return owner.cipStatus?.overallStatus === 'fail'
}

function isCipPendingScreening(owner?: OwnerKycReviewState): boolean {
  if (!owner?.autoTriggeredAt) return true
  if (isCipVerified(owner) || isCipReviewRequired(owner)) return false
  return true
}

export function getAmlScreeningLineLabel(owner?: OwnerKycReviewState): ScreeningLineLabel {
  if (!owner?.autoTriggeredAt) return 'Pending'
  const aml = owner.amlReview?.status
  if (aml === 'cleared') return 'Pass'
  if (aml === 'flagged' || aml === 'escalated' || aml === 'info_requested') {
    return 'Review Required'
  }
  return 'Pending'
}

export function getCipScreeningLineLabel(owner?: OwnerKycReviewState): ScreeningLineLabel {
  if (!owner?.autoTriggeredAt) return 'Pending'
  if (isCipVerified(owner)) return 'Pass'
  if (isCipReviewRequired(owner)) return 'Review Required'
  if (isCipPendingScreening(owner)) return 'Pending'
  return 'Review Required'
}

function participantDetailLine(
  amlLabel: ScreeningLineLabel,
  cipLabel: ScreeningLineLabel,
): string | undefined {
  if (cipLabel === 'Review Required' || cipLabel === 'Pending') {
    return 'Additional identity verification may be required.'
  }
  if (amlLabel === 'Review Required') {
    return 'Additional review or supporting documents may be required.'
  }
  return undefined
}

export function buildParticipantKycSummary(
  state: WorkflowState,
  accountChildId: string,
  party: RelatedParty,
): FormsPackageParticipantKycSummary {
  const owner = getOwnerReviewState(state, accountChildId, party.id)
  const amlLabel = getAmlScreeningLineLabel(owner)
  const cipLabel = getCipScreeningLineLabel(owner)
  const kycStatus = getKycStatus(owner, party)
  return {
    partyId: party.id,
    partyName: party.name?.trim() || party.organizationName?.trim() || 'Participant',
    amlLabel,
    cipLabel,
    kycStatus,
    detailLine: participantDetailLine(amlLabel, cipLabel),
    accountChildIds: [accountChildId],
  }
}

function mergeParticipantSummaries(
  existing: FormsPackageParticipantKycSummary,
  incoming: FormsPackageParticipantKycSummary,
): FormsPackageParticipantKycSummary {
  const kycStatus =
    getKycStatusPriority(incoming.kycStatus) < getKycStatusPriority(existing.kycStatus)
      ? incoming.kycStatus
      : existing.kycStatus
  const amlLabel =
    incoming.amlLabel === 'Review Required' || existing.amlLabel === 'Review Required'
      ? 'Review Required'
      : incoming.amlLabel === 'Pending' || existing.amlLabel === 'Pending'
        ? 'Pending'
        : 'Pass'
  const cipLabel =
    incoming.cipLabel === 'Review Required' || existing.cipLabel === 'Review Required'
      ? 'Review Required'
      : incoming.cipLabel === 'Pending' || existing.cipLabel === 'Pending'
        ? 'Pending'
        : 'Pass'
  return {
    partyId: existing.partyId,
    partyName: existing.partyName,
    amlLabel,
    cipLabel,
    kycStatus,
    detailLine: participantDetailLine(amlLabel, cipLabel) ?? existing.detailLine,
    accountChildIds: Array.from(new Set([...existing.accountChildIds, ...incoming.accountChildIds])),
  }
}

export function dedupeParticipantKycSummaries(
  rows: FormsPackageParticipantKycSummary[],
): FormsPackageParticipantKycSummary[] {
  const byParty = new Map<string, FormsPackageParticipantKycSummary>()
  for (const row of rows) {
    const prev = byParty.get(row.partyId)
    byParty.set(row.partyId, prev ? mergeParticipantSummaries(prev, row) : row)
  }
  return Array.from(byParty.values()).sort(
    (a, b) => getKycStatusPriority(a.kycStatus) - getKycStatusPriority(b.kycStatus),
  )
}

export function participantRequiresKycReviewAcknowledgment(
  summary: FormsPackageParticipantKycSummary,
): boolean {
  return summary.kycStatus !== 'pass'
}

export function envelopeRequiresKycReviewAcknowledgment(
  participants: FormsPackageParticipantKycSummary[],
): boolean {
  return participants.some(participantRequiresKycReviewAcknowledgment)
}

/** Advisor-facing participant block — no AML/CIP/vendor breakdown. */
export interface FormsPackageImpactedParticipant {
  partyId: string
  partyName: string
  guidanceLines: string[]
  recommendedDocuments: string[]
  showHomeOfficeNote?: boolean
  accountChildIds: string[]
}

/**
 * Build display rows for participants who did not fully pass verification.
 * Uses internal screening labels only — never surfaced in the modal UI.
 */
export function buildImpactedParticipantsForFormsPackage(
  summaries: FormsPackageParticipantKycSummary[],
): FormsPackageImpactedParticipant[] {
  return summaries
    .filter(participantRequiresKycReviewAcknowledgment)
    .map(buildImpactedParticipantFromSummary)
    .filter((row): row is FormsPackageImpactedParticipant => row !== null)
}

function buildImpactedParticipantFromSummary(
  summary: FormsPackageParticipantKycSummary,
): FormsPackageImpactedParticipant | null {
  if (!participantRequiresKycReviewAcknowledgment(summary)) return null

  const guidanceLines: string[] = []
  const recommendedDocuments = new Set<string>()
  let showHomeOfficeNote = false

  const cipNeedsReview =
    summary.cipLabel === 'Review Required' || summary.cipLabel === 'Pending'
  const complianceNeedsReview =
    summary.amlLabel === 'Review Required' ||
    summary.amlLabel === 'Pending' ||
    summary.kycStatus === 'fail' ||
    summary.kycStatus === 'pending_review'

  if (summary.kycStatus === 'unverified') {
    guidanceLines.push('Required owner information must be completed before verification can finish.')
    return {
      partyId: summary.partyId,
      partyName: summary.partyName,
      guidanceLines,
      recommendedDocuments: [],
      accountChildIds: summary.accountChildIds,
    }
  }

  if (cipNeedsReview) {
    guidanceLines.push('Identity verification could not be completed automatically.')
    recommendedDocuments.add('Government-issued ID')
    recommendedDocuments.add('Proof of address')
  }

  if (complianceNeedsReview && !cipNeedsReview) {
    guidanceLines.push('Additional verification may be required before this account can be approved.')
    recommendedDocuments.add('Government-issued ID')
    recommendedDocuments.add('Proof of address')
    showHomeOfficeNote = true
  } else if (complianceNeedsReview) {
    showHomeOfficeNote = true
  }

  if (guidanceLines.length === 0) {
    guidanceLines.push('Additional verification may be required before this account can be approved.')
    recommendedDocuments.add('Government-issued ID')
    recommendedDocuments.add('Proof of address')
    showHomeOfficeNote = true
  }

  return {
    partyId: summary.partyId,
    partyName: summary.partyName,
    guidanceLines,
    recommendedDocuments: Array.from(recommendedDocuments),
    showHomeOfficeNote,
    accountChildIds: summary.accountChildIds,
  }
}

export function includedAccountChildIdsFromEnvelope(env: EsignEnvelope): string[] {
  return Array.from(
    new Set(env.formSelections.filter((row) => row.included).map((row) => row.accountChildId)),
  )
}

/**
 * Run automated CIP + AML screening for every KYC participant on included accounts
 * (in-memory; does not mutate live workflow state).
 */
export function simulateFormsPackageKycScreening(
  state: WorkflowState,
  accountChildIds: string[],
): { state: WorkflowState; participants: FormsPackageParticipantKycSummary[] } {
  let next = state
  const rows: FormsPackageParticipantKycSummary[] = []
  for (const accountChildId of accountChildIds) {
    for (const party of getAccountPartiesRequiringKyc(next, accountChildId)) {
      next = applyAutoRunOwnerKycToState(next, accountChildId, party.id, {
        runBy: 'advisor',
      })
      rows.push(buildParticipantKycSummary(next, accountChildId, party))
    }
  }
  return { state: next, participants: dedupeParticipantKycSummaries(rows) }
}
