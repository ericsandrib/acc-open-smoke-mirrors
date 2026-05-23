import type {
  ChildReviewState,
  OwnerKycReviewState,
  ParticipantVerificationProfile,
  RelatedParty,
  VerificationSnapshot,
  WorkflowState,
} from '@/types/workflow'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import {
  appendOwnerVerificationSnapshot,
  getAccountChildReviewState,
  getAccountWorkflowPhase,
  getOwnerReviewState,
  listAccountOpeningChildIdsForParty,
  mergeOwnerReviewPatch,
} from '@/utils/ownerKycReview'

/** Demo retention window for reusable AML dispositions (1 year). */
export const PARTICIPANT_AML_DISPOSITION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000

export const AML_APPROVE_MANUAL_WORKFLOW_NOTE =
  'AML screening approved by AML reviewer. Workflow advanced to Document Review.'

export const AML_APPROVE_REUSED_WORKFLOW_NOTE =
  'AML review requirement resolved from existing participant verification. Workflow advanced to Document Review.'

const SCREENING_PAYLOAD_VERSION = 'v1'

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function hashString(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i)
  }
  return `fp_${(h >>> 0).toString(16)}`
}

function partyAddressKey(party: RelatedParty): string {
  const a = party.accountOwnerIndividual
  if (!a) return ''
  return [a.legalStreet, a.legalCity, a.legalState, a.legalZip].map((v) => normalize(String(v ?? ''))).join('|')
}

/** Deterministic screening fingerprint for safe AML disposition reuse. */
export function screeningPayloadVersion(owner?: OwnerKycReviewState): string {
  const hits = [...(owner?.amlPayloadDemo?.watchlistHits ?? [])].sort()
  const ofac = owner?.amlPayloadDemo?.ofacMatches ?? 0
  const summary = normalize(owner?.amlPayloadDemo?.summary ?? '')
  return `${SCREENING_PAYLOAD_VERSION}|ofac:${ofac}|hits:${hits.join(';')}|summary:${summary}`
}

export function computeScreeningFingerprint(
  party: RelatedParty,
  owner?: OwnerKycReviewState,
): string {
  const parts = [
    normalize(party.firstName ?? ''),
    normalize(party.lastName ?? ''),
    normalize(party.dob ?? ''),
    normalize(String(party.taxId ?? party.ssn ?? '')),
    partyAddressKey(party),
    normalize(owner?.provider ?? 'LexisNexis InstantID (demo)'),
    screeningPayloadVersion(owner),
  ]
  return hashString(parts.join('::'))
}

export function isParticipantVerificationExpired(profile: ParticipantVerificationProfile): boolean {
  if (!profile.expiresAt) return true
  return new Date(profile.expiresAt).getTime() < Date.now()
}

function hasNewerFlaggedScreeningSince(
  owner: OwnerKycReviewState | undefined,
  dispositionAtIso: string,
): boolean {
  const dispositionTs = new Date(dispositionAtIso).getTime()
  if (Number.isNaN(dispositionTs)) return false
  for (const snapshot of owner?.verificationSnapshots ?? []) {
    if (snapshot.eventKind !== 'screening_run') continue
    const ranTs = new Date(snapshot.ranAt).getTime()
    if (Number.isNaN(ranTs) || ranTs <= dispositionTs) continue
    if (snapshot.amlOutcome === 'flagged' || snapshot.amlOutcome === 'escalated') return true
    const hits = snapshot.note?.toLowerCase() ?? ''
    if (hits.includes('match') || hits.includes('hit') || hits.includes('flagged')) return true
  }
  const hits = owner?.amlPayloadDemo?.watchlistHits ?? []
  if (hits.length > 0 && owner?.amlReview?.status === 'flagged') {
    const lastRun = owner.kycVerificationLastCheckedAt ?? owner.autoTriggeredAt
    if (lastRun && new Date(lastRun).getTime() > dispositionTs) return true
  }
  return false
}

/** True when a stored participant profile can satisfy AML for this party + screening inputs. */
export function isParticipantVerificationReusable(
  profile: ParticipantVerificationProfile | undefined,
  party: RelatedParty,
  owner: OwnerKycReviewState | undefined,
): boolean {
  if (!profile || profile.amlStatus !== 'cleared') return false
  if (isParticipantVerificationExpired(profile)) return false
  const currentFingerprint = computeScreeningFingerprint(party, owner)
  if (currentFingerprint !== profile.screeningFingerprint) return false
  if (hasNewerFlaggedScreeningSince(owner, profile.lastAmlDispositionAt)) return false
  return true
}

export function ownerNeedsAmlEscalationResolution(owner?: OwnerKycReviewState): boolean {
  const aml = owner?.amlReview?.status
  return aml === 'pending' || aml === 'flagged' || aml === 'info_requested' || aml === 'escalated'
}

function accountPhaseAwaitingAmlResolution(phase: ChildReviewState['accountWorkflowPhase']): boolean {
  return phase === 'aml_review' || phase === 'escalation_hold'
}

export function allAccountOwnersAmlCleared(
  state: WorkflowState,
  accountChildId: string,
): boolean {
  const parties = getAccountPartiesRequiringKyc(state, accountChildId)
  if (parties.length === 0) return false
  return parties.every((p) => getOwnerReviewState(state, accountChildId, p.id)?.amlReview?.status === 'cleared')
}

export function canAutoResolveAccountAmlFromParticipantProfile(
  state: WorkflowState,
  accountChildId: string,
  partyId: string,
  profile: ParticipantVerificationProfile,
  sourceAccountChildId: string,
): boolean {
  if (accountChildId === sourceAccountChildId) return false
  const party = state.relatedParties.find((p) => p.id === partyId)
  if (!party) return false
  const review = getAccountChildReviewState(state, accountChildId)
  if (!review || !accountPhaseAwaitingAmlResolution(review.accountWorkflowPhase)) return false
  const owner = getOwnerReviewState(state, accountChildId, partyId)
  if (!owner || !ownerNeedsAmlEscalationResolution(owner)) return false
  return isParticipantVerificationReusable(profile, party, owner)
}

function buildParticipantProfileFromApproval(
  partyId: string,
  fingerprint: string,
  owner: OwnerKycReviewState,
  options: { approvalReason?: string; reviewer?: string; sourceAccountChildId: string },
  nowIso: string,
): ParticipantVerificationProfile {
  const expiresAt = new Date(Date.now() + PARTICIPANT_AML_DISPOSITION_RETENTION_MS).toISOString()
  return {
    participantId: partyId,
    screeningFingerprint: fingerprint,
    screeningPayloadVersion: screeningPayloadVersion(owner),
    amlStatus: 'cleared',
    cipStatus: owner.cipStatus?.overallStatus === 'pass' ? 'verified' : 'pending',
    lastVerifiedAt: nowIso,
    expiresAt,
    lastAmlDispositionAt: nowIso,
    dispositionReviewer: options.reviewer,
    approvalReason: options.approvalReason,
    provider: owner.provider,
    sourceAccountChildId: options.sourceAccountChildId,
  }
}

function patchOwnerAmlCleared(
  state: WorkflowState,
  accountChildId: string,
  partyId: string,
  patch: Partial<OwnerKycReviewState>,
): WorkflowState {
  const prev = state.childReviewsByChildId?.[accountChildId] ?? {}
  const merged = mergeOwnerReviewPatch(prev, partyId, patch)
  return {
    ...state,
    childReviewsByChildId: {
      ...state.childReviewsByChildId,
      [accountChildId]: merged,
    },
  }
}

function advanceAccountToDocumentReviewIfReady(state: WorkflowState, accountChildId: string): WorkflowState {
  const phase = getAccountWorkflowPhase(state, accountChildId)
  if (!accountPhaseAwaitingAmlResolution(phase)) return state
  if (!allAccountOwnersAmlCleared(state, accountChildId)) return state
  const prev = state.childReviewsByChildId?.[accountChildId] ?? {}
  return {
    ...state,
    childReviewsByChildId: {
      ...state.childReviewsByChildId,
      [accountChildId]: { ...prev, accountWorkflowPhase: 'document_review' },
    },
  }
}

/**
 * Apply AML approval on the source account, persist a reusable participant verification profile,
 * auto-resolve eligible sibling accounts, and advance workflows to Document Review when ready.
 */
export function applyParticipantAmlApprovalForAccount(
  state: WorkflowState,
  sourceAccountChildId: string,
  partyIds: string[],
  options: { approvalReason?: string; runBy?: string },
): WorkflowState {
  const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const nowIso = new Date().toISOString()
  const runBy = options.runBy ?? 'aml'
  let next = state
  const touchedAccounts = new Set<string>([sourceAccountChildId])

  for (const partyId of partyIds) {
    const party = next.relatedParties.find((p) => p.id === partyId)
    if (!party) continue
    const sourceOwner = getOwnerReviewState(next, sourceAccountChildId, partyId)
    if (!sourceOwner) continue

    const fingerprint = computeScreeningFingerprint(party, sourceOwner)
    const profile = buildParticipantProfileFromApproval(
      partyId,
      fingerprint,
      sourceOwner,
      {
        approvalReason: options.approvalReason,
        reviewer: runBy,
        sourceAccountChildId,
      },
      nowIso,
    )

    next = {
      ...next,
      participantVerificationsByPartyId: {
        ...next.participantVerificationsByPartyId,
        [partyId]: profile,
      },
    }

    const ownerClearPatch: Partial<OwnerKycReviewState> = {
      screeningFingerprint: fingerprint,
      amlReview: {
        status: 'cleared',
        decidedAt: ts,
        ...(options.approvalReason ? { approvalReason: options.approvalReason } : {}),
      },
    }

    for (const accountChildId of listAccountOpeningChildIdsForParty(next, partyId)) {
      touchedAccounts.add(accountChildId)
      const owner = getOwnerReviewState(next, accountChildId, partyId)
      if (!owner && accountChildId !== sourceAccountChildId) continue

      const isSource = accountChildId === sourceAccountChildId
      const autoResolve = canAutoResolveAccountAmlFromParticipantProfile(
        next,
        accountChildId,
        partyId,
        profile,
        sourceAccountChildId,
      )

      if (isSource || autoResolve || ownerNeedsAmlEscalationResolution(owner)) {
        next = patchOwnerAmlCleared(next, accountChildId, partyId, ownerClearPatch)
      }

      if (isSource) {
        const manualNote = options.approvalReason?.trim()
          ? `${AML_APPROVE_MANUAL_WORKFLOW_NOTE} ${options.approvalReason.trim()}`
          : AML_APPROVE_MANUAL_WORKFLOW_NOTE
        next = appendOwnerVerificationSnapshot(next, accountChildId, partyId, {
          ranAt: nowIso,
          eventKind: 'aml_approve',
          runBy,
          amlOutcome: 'cleared',
          note: manualNote,
        })
      } else if (autoResolve) {
        next = appendOwnerVerificationSnapshot(next, accountChildId, partyId, {
          ranAt: nowIso,
          eventKind: 'aml_approve_reused',
          runBy,
          amlOutcome: 'cleared',
          note: AML_APPROVE_REUSED_WORKFLOW_NOTE,
        })
      }
    }
  }

  for (const accountChildId of touchedAccounts) {
    next = advanceAccountToDocumentReviewIfReady(next, accountChildId)
  }

  return next
}

const IDENTITY_PARTY_KEYS = new Set([
  'firstName',
  'lastName',
  'dob',
  'taxId',
  'ssn',
  'accountOwnerIndividual',
])

/** Invalidate reusable AML disposition when participant identity / screening inputs change. */
export function invalidateParticipantVerificationForParty(
  state: WorkflowState,
  partyId: string,
  updates: Partial<RelatedParty>,
): WorkflowState {
  const touchesIdentity = Object.keys(updates).some((k) => IDENTITY_PARTY_KEYS.has(k))
  if (!touchesIdentity) return state

  const party = state.relatedParties.find((p) => p.id === partyId)
  if (!party) return state

  let next: WorkflowState = {
    ...state,
    participantVerificationsByPartyId: {
      ...state.participantVerificationsByPartyId,
    },
  }
  delete next.participantVerificationsByPartyId?.[partyId]

  for (const accountChildId of listAccountOpeningChildIdsForParty(next, partyId)) {
    const owner = getOwnerReviewState(next, accountChildId, partyId)
    if (!owner) continue
    const fingerprint = computeScreeningFingerprint(party, owner)
    const hadCleared = owner.amlReview?.status === 'cleared'
    const hadHits = (owner.amlPayloadDemo?.watchlistHits?.length ?? 0) > 0
    const patch: Partial<OwnerKycReviewState> = { screeningFingerprint: fingerprint }
    if (hadCleared) {
      patch.amlReview = {
        status: hadHits ? 'flagged' : 'pending',
        decidedAt: new Date().toISOString(),
      }
    }
    next = patchOwnerAmlCleared(next, accountChildId, partyId, patch)
  }

  return next
}

function listAccountOpeningChildIds(state: WorkflowState): string[] {
  return state.tasks
    .flatMap((task) => task.children ?? [])
    .filter((child) => child.childType === 'account-opening')
    .map((child) => child.id)
}

/**
 * Persisted workflows: advance accounts stuck in AML / Escalation when every owner is AML-cleared.
 */
export function repairAmlClearedAccountWorkflowPhase(state: WorkflowState): WorkflowState {
  const reviews = state.childReviewsByChildId
  if (!reviews) return state
  let changed = false
  const nextReviews = { ...reviews }
  for (const childId of listAccountOpeningChildIds(state)) {
    const review = nextReviews[childId]
    if (!review) continue
    const phase = review.accountWorkflowPhase
    if (phase !== 'aml_review' && phase !== 'escalation_hold') continue
    const probe = { ...state, childReviewsByChildId: nextReviews }
    if (!allAccountOwnersAmlCleared(probe, childId)) continue
    nextReviews[childId] = { ...review, accountWorkflowPhase: 'document_review' }
    changed = true
  }
  if (!changed) return state
  return { ...state, childReviewsByChildId: nextReviews }
}

/**
 * Persisted workflows: apply stored participant AML profiles to sibling accounts that were
 * approved on another account but still show unresolved AML / Escalation phase.
 */
export function repairParticipantAmlReuseAcrossAccounts(state: WorkflowState): WorkflowState {
  const profiles = state.participantVerificationsByPartyId
  if (!profiles || Object.keys(profiles).length === 0) {
    return repairAmlClearedAccountWorkflowPhase(state)
  }

  const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const nowIso = new Date().toISOString()
  let next = state

  for (const [partyId, profile] of Object.entries(profiles)) {
    if (profile.amlStatus !== 'cleared') continue
    const party = next.relatedParties.find((p) => p.id === partyId)
    if (!party) continue
    const refOwner = profile.sourceAccountChildId
      ? getOwnerReviewState(next, profile.sourceAccountChildId, partyId)
      : undefined
    if (!isParticipantVerificationReusable(profile, party, refOwner)) continue

    for (const accountChildId of listAccountOpeningChildIdsForParty(next, partyId)) {
      if (accountChildId === profile.sourceAccountChildId) continue
      const review = getAccountChildReviewState(next, accountChildId)
      if (!review || !accountPhaseAwaitingAmlResolution(review.accountWorkflowPhase)) continue
      const owner = getOwnerReviewState(next, accountChildId, partyId)
      if (!owner || !ownerNeedsAmlEscalationResolution(owner)) continue

      next = patchOwnerAmlCleared(next, accountChildId, partyId, {
        screeningFingerprint: profile.screeningFingerprint,
        amlReview: {
          status: 'cleared',
          decidedAt: ts,
          ...(profile.approvalReason ? { approvalReason: profile.approvalReason } : {}),
        },
      })

      const hasDispositionAudit = (owner.verificationSnapshots ?? []).some(
        (s) => s.eventKind === 'aml_approve' || s.eventKind === 'aml_approve_reused',
      )
      if (!hasDispositionAudit) {
        next = appendOwnerVerificationSnapshot(next, accountChildId, partyId, {
          ranAt: nowIso,
          eventKind: 'aml_approve_reused',
          runBy: profile.dispositionReviewer ?? 'aml',
          amlOutcome: 'cleared',
          note: AML_APPROVE_REUSED_WORKFLOW_NOTE,
        })
      }
    }
  }

  return repairAmlClearedAccountWorkflowPhase(next)
}

/** Stamp screening fingerprint on owner state after automated screening. */
export function withScreeningFingerprint(
  party: RelatedParty,
  patch: Partial<OwnerKycReviewState>,
): Partial<OwnerKycReviewState> {
  return {
    ...patch,
    screeningFingerprint: computeScreeningFingerprint(party, patch as OwnerKycReviewState),
  }
}
