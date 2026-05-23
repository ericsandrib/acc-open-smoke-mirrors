import type {
  AccountWorkflowPhase,
  ChildReviewState,
  OwnerKycReviewState,
  RelatedParty,
  TaskStatus,
  VerificationSnapshot,
  WorkflowState,
} from '@/types/workflow'
import { hasOwnerLevelAmlFlag, isAccountOpeningAwaitingClarification } from '@/utils/childStatusDisplay'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { shouldHideKycInOnboardingListings } from '@/utils/onboardingJourneyActionTree'
import {
  getPersistedKycWorkflowMode,
  isSingleFlowKycMode,
  type KycWorkflowMode,
} from '@/utils/kycWorkflowMode'
import {
  computeScreeningFingerprint,
  isParticipantVerificationReusable,
  withScreeningFingerprint,
} from '@/utils/participantVerification'

/** Configurable required fields before auto KYC trigger (natural persons). */
export const OWNER_KYC_REQUIRED_FIELD_KEYS = [
  'firstName',
  'lastName',
  'dob',
  'email',
  'phone',
] as const satisfies readonly (keyof RelatedParty)[]

/**
 * Fields required to run KYC/CIP/AML for a natural-person owner.
 * Used to surface missing-data hints and gate envelope generation per account.
 */
export type OwnerKycRequiredField =
  | 'firstName'
  | 'lastName'
  | 'dob'
  | 'email'
  | 'phone'
  | 'taxId'
  | 'address'

export const OWNER_KYC_REQUIRED_FIELD_LABELS: Record<OwnerKycRequiredField, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  dob: 'Date of birth',
  email: 'Email',
  phone: 'Phone number',
  taxId: 'Tax ID (SSN/TIN)',
  address: 'Legal address',
}

function hasTaxId(party: RelatedParty): boolean {
  return Boolean(String(party.taxId ?? '').trim()) || Boolean(String(party.ssn ?? '').trim())
}

function hasLegalAddress(party: RelatedParty): boolean {
  const a = party.accountOwnerIndividual
  if (!a) return false
  return Boolean(
    String(a.legalStreet ?? '').trim() &&
      String(a.legalCity ?? '').trim() &&
      String(a.legalState ?? '').trim() &&
      String(a.legalZip ?? '').trim(),
  )
}

/** Returns the list of required-but-missing KYC fields for the given owner. */
export function getMissingOwnerKycFields(party: RelatedParty): OwnerKycRequiredField[] {
  const missing: OwnerKycRequiredField[] = []
  if (!String(party.firstName ?? '').trim()) missing.push('firstName')
  if (!String(party.lastName ?? '').trim()) missing.push('lastName')
  if (!String(party.dob ?? '').trim()) missing.push('dob')
  if (!String(party.email ?? '').trim()) missing.push('email')
  if (!String(party.phone ?? '').trim()) missing.push('phone')
  if (!hasTaxId(party)) missing.push('taxId')
  if (!hasLegalAddress(party)) missing.push('address')
  return missing
}

/** True when owner KYC is embedded on Account & Owners (not separate KYC child workflows). */
export function isEmbeddedAccountOwnerKycEnabled(options?: {
  kycWorkflowMode?: KycWorkflowMode
  hideKycChildWorkflows?: boolean
}): boolean {
  const mode = options?.kycWorkflowMode ?? getPersistedKycWorkflowMode()
  if (options?.hideKycChildWorkflows != null) {
    return options.hideKycChildWorkflows
  }
  return shouldHideKycInOnboardingListings(mode)
}

export function isSingleFlowKycEnabled(_state?: WorkflowState): boolean {
  return isEmbeddedAccountOwnerKycEnabled()
}

export function ownerRequiredFieldsKey(party: RelatedParty): string {
  return OWNER_KYC_REQUIRED_FIELD_KEYS.map((k) => String(party[k] ?? '').trim()).join('|')
}

export function areOwnerKycRequiredFieldsComplete(party: RelatedParty): boolean {
  return getMissingOwnerKycFields(party).length === 0
}

export function getAccountChildReviewState(
  state: WorkflowState,
  accountChildId: string,
): ChildReviewState | undefined {
  return state.childReviewsByChildId?.[accountChildId]
}

export function getOwnerReviewState(
  state: WorkflowState,
  accountChildId: string,
  partyId: string,
): OwnerKycReviewState | undefined {
  return getAccountChildReviewState(state, accountChildId)?.ownerReviews?.[partyId]
}

export function getAccountWorkflowPhase(
  state: WorkflowState,
  accountChildId: string,
): AccountWorkflowPhase {
  const review = getAccountChildReviewState(state, accountChildId)
  return review?.accountWorkflowPhase ?? 'draft'
}

export function getOwnerAdvisorStatusLabels(
  owner: OwnerKycReviewState | undefined,
  accountPhase: AccountWorkflowPhase,
): { kyc: string; aml: string; cip: string } {
  if (!owner?.autoTriggeredAt) {
    return {
      kyc: 'Not started',
      aml: 'Not run',
      cip: 'Not run',
    }
  }

  const aml = owner.amlReview?.status
  const cip = owner.cipStatus?.overallStatus
  const ho = owner.hoKycReview?.status

  let kyc = 'In progress'
  if (ho === 'approved' && aml === 'cleared' && cip === 'pass') kyc = 'Verification complete'
  else if (ho === 'changes_requested' || aml === 'info_requested' || aml === 'flagged') {
    kyc = 'Additional information required'
  } else if (accountPhase === 'aml_review' || aml === 'pending') {
    kyc = 'Pending AML review'
  } else if (accountPhase === 'document_review' || ho === 'pending') {
    kyc = 'Pending Home Office review'
  } else if (cip === 'fail') kyc = 'Additional documents required'

  let amlLabel = 'Clear'
  if (aml === 'pending') amlLabel = 'Pending review'
  else if (aml === 'flagged' || aml === 'escalated') amlLabel = 'Flagged'
  else if (aml === 'info_requested') amlLabel = 'Information requested'
  else if (!owner.autoTriggeredAt) amlLabel = 'Not run'

  let cipLabel = 'Verified'
  if (cip === 'pending') cipLabel = 'Pending verification'
  else if (cip === 'fail') cipLabel = 'Additional documents required'
  else if (!owner.kycVerificationLastCheckedAt) cipLabel = 'Not run'

  return { kyc, aml: amlLabel, cip: cipLabel }
}

export function shouldShowOwnerAmlPanel(
  state: WorkflowState,
  accountChildId: string,
): boolean {
  const mode = state.demoViewMode ?? 'advisor'
  const phase = getAccountWorkflowPhase(state, accountChildId)
  return mode === 'aml' || phase === 'aml_review' || phase === 'escalation_hold'
}

export function shouldShowOwnerCipPanel(
  state: WorkflowState,
  accountChildId: string,
): boolean {
  const mode = state.demoViewMode ?? 'advisor'
  const phase = getAccountWorkflowPhase(state, accountChildId)
  return mode === 'ho-documents' || mode === 'ho-kyc' || phase === 'document_review'
}

export function isOwnerKycVerifiedSingleFlow(
  state: WorkflowState,
  accountChildId: string,
  party: RelatedParty,
): boolean {
  const owner = getOwnerReviewState(state, accountChildId, party.id)
  if (!owner?.autoTriggeredAt) return false
  const aml = owner.amlReview?.status
  const cip = owner.cipStatus?.overallStatus
  const ho = owner.hoKycReview?.status
  return aml === 'cleared' && cip === 'pass' && ho === 'approved'
}

/** Every owner on the account has passed automated / owner-level CIP + AML screening. */
export function ownersPassedOwnerLevelKyc(reviewState?: ChildReviewState): boolean {
  const owners = Object.values(reviewState?.ownerReviews ?? {})
  if (owners.length === 0) return false
  return owners.every(
    (owner) =>
      owner.amlReview?.status === 'cleared' &&
      owner.cipStatus?.overallStatus === 'pass' &&
      owner.hoKycReview?.status === 'approved',
  )
}

/**
 * AML screening complete for all owners (cleared + CIP pass). Used for badges after AML
 * disposition — does not require Home Office document review approval yet.
 */
export function ownersAmlScreeningCleared(reviewState?: ChildReviewState): boolean {
  const owners = Object.values(reviewState?.ownerReviews ?? {})
  if (owners.length === 0) return false
  return owners.every(
    (owner) =>
      owner.amlReview?.status === 'cleared' && owner.cipStatus?.overallStatus === 'pass',
  )
}

export function mergeOwnerReviewPatch(
  existing: ChildReviewState | undefined,
  partyId: string,
  patch: Partial<OwnerKycReviewState>,
): ChildReviewState {
  const prev = existing?.ownerReviews?.[partyId] ?? {}
  return {
    ...existing,
    ownerReviews: {
      ...existing?.ownerReviews,
      [partyId]: { ...prev, ...patch },
    },
  }
}

export function deriveSingleFlowAccountDisplayPhase(
  review: ChildReviewState | undefined,
  rawStatus: string,
): AccountWorkflowPhase {
  if (rawStatus === 'complete') return 'complete'
  if (review?.accountWorkflowPhase) return review.accountWorkflowPhase
  if (rawStatus === 'awaiting_review') return 'submitted'
  return 'draft'
}

function defaultOwnerCipPass(): NonNullable<ChildReviewState['cipStatus']> {
  return {
    idVerification: 'pass',
    addressMatch: 'pass',
    dobMatch: 'pass',
    overallStatus: 'pass',
  }
}

/**
 * Demo: a clean KYC run auto-verifies the owner. AML/CIP both pass, HO KYC approved,
 * party kycStatus flips to verified, and the result is marked reusable across future accounts.
 *
 * A reviewer can still flag/escalate via the AML Review or CIP Review tasks if needed.
 */
/**
 * Demo-only: returns true if the party should fail AML on automated screening.
 * Honors the explicit `demoForceFlagAml` flag and falls back to identifying Jane Smith
 * by her seed id / name so the demo works even on stale persisted state.
 */
function isDemoForceFlagAmlParty(party: RelatedParty): boolean {
  if (party.demoForceFlagAml) return true
  if (party.id === 'member-2') return true
  const fullName = `${party.firstName ?? ''} ${party.lastName ?? ''}`.trim().toLowerCase()
  return fullName === 'jane smith'
}

export function buildAutoRunOwnerKycPatch(
  party: RelatedParty,
  options?: { suppressDemoFlag?: boolean },
): Partial<OwnerKycReviewState> {
  const now = new Date().toISOString()
  // Demo flag (Jane Smith) is only honored on initial KYC runs. Re-runs always return clean
  // so the reviewer remediation loop demos cleanly.
  if (!options?.suppressDemoFlag && isDemoForceFlagAmlParty(party)) {
    return withScreeningFingerprint(party, {
      autoTriggeredAt: now,
      requiredFieldsKey: ownerRequiredFieldsKey(party),
      kycVerificationLastCheckedAt: now,
      kycVerificationResultSummary: 'Automated screening returned potential matches — pending AML review.',
      cipStatus: defaultOwnerCipPass(),
      amlReview: {
        status: 'flagged',
        decidedAt: now,
      },
      hoKycReview: { status: 'pending' },
      amlPayloadDemo: {
        ofacMatches: 0,
        watchlistHits: ['PEP — possible match (demo)', 'Adverse media — single article (demo)'],
        summary: 'Potential PEP and adverse-media hits require AML team review.',
      },
      cipPayloadDemo: { identityProvider: 'LexisNexis InstantID (demo)', mismatches: [] },
      reusableVerifiedKyc: false,
      provider: 'LexisNexis InstantID (demo)',
      runType: 'Automated',
      triggerSource: 'Forms package sent to client',
    })
  }
  return withScreeningFingerprint(party, {
    autoTriggeredAt: now,
    requiredFieldsKey: ownerRequiredFieldsKey(party),
    kycVerificationLastCheckedAt: now,
    kycVerificationResultSummary: 'Identity verification passed (automated).',
    cipStatus: defaultOwnerCipPass(),
    amlReview: { status: 'cleared', decidedAt: now, approvalReason: 'Automated screening — no hits' },
    hoKycReview: { status: 'approved', decidedAt: now },
    amlPayloadDemo: {
      ofacMatches: 0,
      watchlistHits: [],
      summary: 'Automated screening completed — no OFAC / PEP / watchlist hits.',
    },
    cipPayloadDemo: { identityProvider: 'LexisNexis InstantID (demo)', mismatches: [] },
    reusableVerifiedKyc: true,
    provider: 'LexisNexis InstantID (demo)',
    runType: 'Automated',
    triggerSource: 'Forms package sent to client',
  })
}

/** Look across all account-opening child reviews for an existing Verified KYC for this owner. */
export function findReusableVerifiedKyc(
  state: WorkflowState,
  partyId: string,
  excludeAccountChildId?: string,
): { accountChildId: string; review: OwnerKycReviewState } | undefined {
  const party = state.relatedParties.find((p) => p.id === partyId)
  const profile = state.participantVerificationsByPartyId?.[partyId]
  const profileSourceId = profile?.sourceAccountChildId
  const profileRefOwner = profileSourceId
    ? getOwnerReviewState(state, profileSourceId, partyId)
    : undefined
  if (party && profile && isParticipantVerificationReusable(profile, party, profileRefOwner)) {
    if (profileSourceId && profileSourceId !== excludeAccountChildId && profileRefOwner) {
      return { accountChildId: profileSourceId, review: profileRefOwner }
    }
  }

  const reviews = state.childReviewsByChildId ?? {}
  for (const [accountChildId, childReview] of Object.entries(reviews)) {
    if (accountChildId === excludeAccountChildId) continue
    const owner = childReview?.ownerReviews?.[partyId]
    if (!owner) continue
    if (party && profile && !isParticipantVerificationReusable(profile, party, owner)) {
      continue
    }
    const verified =
      owner.reusableVerifiedKyc ||
      (owner.amlReview?.status === 'cleared' &&
        owner.hoKycReview?.status === 'approved' &&
        owner.cipStatus?.overallStatus === 'pass')
    if (verified) return { accountChildId, review: owner }
  }
  return undefined
}

export function shouldAutoRunOwnerKyc(
  state: WorkflowState,
  accountChildId: string,
  party: RelatedParty,
): boolean {
  if (!isSingleFlowKycEnabled(state)) return false
  if (party.type === 'related_organization') return false
  if (!areOwnerKycRequiredFieldsComplete(party)) return false
  const owner = getOwnerReviewState(state, accountChildId, party.id)
  if (owner?.autoTriggeredAt && owner.requiredFieldsKey === ownerRequiredFieldsKey(party)) {
    return false
  }
  return true
}

let snapshotIdCounter = 0
function nextSnapshotId(): string {
  snapshotIdCounter += 1
  return `vs-${Date.now()}-${snapshotIdCounter}`
}

/** Capture the owner field values that were verified at this point in time. */
function captureOwnerSnapshot(party: RelatedParty): VerificationSnapshot['snapshotOf'] {
  const ind = party.accountOwnerIndividual ?? {}
  return {
    firstName: party.firstName,
    lastName: party.lastName,
    dob: party.dob,
    email: party.email,
    phone: party.phone,
    taxId: party.taxId ?? party.ssn,
    legalStreet: ind.legalStreet,
    legalCity: ind.legalCity,
    legalState: ind.legalState,
    legalZip: ind.legalZip,
  }
}

/** Append an immutable verification / disposition event to the owner's audit list. */
export function appendOwnerVerificationSnapshot(
  state: WorkflowState,
  accountChildId: string,
  partyId: string,
  snapshot: Omit<VerificationSnapshot, 'id'>,
): WorkflowState {
  const prev = state.childReviewsByChildId?.[accountChildId] ?? {}
  const owner = prev.ownerReviews?.[partyId] ?? {}
  const prior = owner.verificationSnapshots ?? []
  const next: VerificationSnapshot = { id: nextSnapshotId(), ...snapshot }
  const updatedOwner: OwnerKycReviewState = {
    ...owner,
    verificationSnapshots: [...prior, next],
  }
  return {
    ...state,
    childReviewsByChildId: {
      ...state.childReviewsByChildId,
      [accountChildId]: {
        ...prev,
        ownerReviews: { ...prev.ownerReviews, [partyId]: updatedOwner },
      },
    },
  }
}

/**
 * Find the most-recent owner-level KYC state for a party across all account-opening children.
 * Used when an account is created later than another and needs to inherit the party's existing state.
 */
export function findLatestOwnerReviewForParty(
  state: WorkflowState,
  partyId: string,
  excludeAccountChildId?: string,
): OwnerKycReviewState | undefined {
  const reviews = state.childReviewsByChildId ?? {}
  let best: OwnerKycReviewState | undefined
  for (const [accountChildId, childReview] of Object.entries(reviews)) {
    if (accountChildId === excludeAccountChildId) continue
    const owner = childReview?.ownerReviews?.[partyId]
    if (!owner) continue
    if (!best) {
      best = owner
      continue
    }
    const bestTs = best.kycVerificationLastCheckedAt ?? best.autoTriggeredAt ?? ''
    const candidateTs = owner.kycVerificationLastCheckedAt ?? owner.autoTriggeredAt ?? ''
    if (candidateTs > bestTs) best = owner
  }
  return best
}

/**
 * Hydrate ownerReviews on an account-opening child by copying each owner's existing
 * person-level KYC state from any other account where they already appear.
 * Called when the owners list changes so newly-added accounts immediately reflect
 * the canonical per-person KYC state without requiring a re-run.
 */
export function hydrateAccountOwnerReviewsFromExisting(
  state: WorkflowState,
  accountChildId: string,
): WorkflowState {
  const parties = getAccountPartiesRequiringKyc(state, accountChildId)
  if (parties.length === 0) return state
  const prev = state.childReviewsByChildId?.[accountChildId] ?? {}
  const ownerReviews = { ...(prev.ownerReviews ?? {}) }
  let changed = false
  for (const party of parties) {
    if (ownerReviews[party.id]) continue
    const existing = findLatestOwnerReviewForParty(state, party.id, accountChildId)
    if (existing) {
      ownerReviews[party.id] = existing
      changed = true
    }
  }
  if (!changed) return state
  return {
    ...state,
    childReviewsByChildId: {
      ...state.childReviewsByChildId,
      [accountChildId]: { ...prev, ownerReviews },
    },
  }
}

/**
 * KYC is person-level: copy this account's updated ownerReviews[partyId] (including
 * verificationSnapshots) into every other account-opening child where the same party is an owner.
 * So a re-run or disposition on one account propagates to all of John's accounts.
 */
export function propagateOwnerReviewAcrossAccounts(
  state: WorkflowState,
  sourceAccountChildId: string,
  partyId: string,
): WorkflowState {
  const source = state.childReviewsByChildId?.[sourceAccountChildId]?.ownerReviews?.[partyId]
  if (!source) return state
  const otherChildIds = listAccountOpeningChildIdsForParty(state, partyId).filter(
    (id) => id !== sourceAccountChildId,
  )
  if (otherChildIds.length === 0) return state
  const nextReviews = { ...(state.childReviewsByChildId ?? {}) }
  for (const childId of otherChildIds) {
    const prev = nextReviews[childId] ?? {}
    nextReviews[childId] = {
      ...prev,
      ownerReviews: {
        ...prev.ownerReviews,
        [partyId]: source,
      },
    }
  }
  return { ...state, childReviewsByChildId: nextReviews }
}

/** Apply lightweight auto KYC for one owner on one account-opening child. */
export function applyAutoRunOwnerKycToState(
  state: WorkflowState,
  accountChildId: string,
  partyId: string,
  options?: { reRunReason?: string; runBy?: string },
): WorkflowState {
  const party = state.relatedParties.find((p) => p.id === partyId)
  if (!party) return state

  const isReRun = Boolean(options?.reRunReason)
  // Re-runs bypass the "fields unchanged" gate; initial runs honor it.
  if (!isReRun && !shouldAutoRunOwnerKyc(state, accountChildId, party)) return state

  if (isReRun && state.participantVerificationsByPartyId?.[partyId]) {
    const nextProfiles = { ...state.participantVerificationsByPartyId }
    delete nextProfiles[partyId]
    state = { ...state, participantVerificationsByPartyId: nextProfiles }
  }

  // Reuse prior verified KYC if this owner has been verified on another account (initial runs only).
  const reusable = !isReRun ? findReusableVerifiedKyc(state, partyId, accountChildId) : undefined
  const now = new Date().toISOString()
  let patch: Partial<OwnerKycReviewState> = reusable
    ? withScreeningFingerprint(party, {
        ...reusable.review,
        autoTriggeredAt: now,
        requiredFieldsKey: ownerRequiredFieldsKey(party),
        screeningFingerprint: computeScreeningFingerprint(party, reusable.review),
        kycVerificationResultSummary: 'Verified KYC reused from prior verification.',
        reusableVerifiedKyc: true,
        reusableSourceAccountChildId: reusable.accountChildId,
        triggerSource: 'Reused from prior verification',
      })
    : buildAutoRunOwnerKycPatch(party, { suppressDemoFlag: isReRun })

  if (isReRun) {
    patch = {
      ...patch,
      runType: 'Re-run',
      lastReRunBy: options?.runBy,
      reRunReason: options?.reRunReason,
      triggerSource: 'Manual re-run',
    }
  }

  const prev = state.childReviewsByChildId?.[accountChildId] ?? {}
  const merged = mergeOwnerReviewPatch(prev, partyId, patch)
  // Clean run auto-verifies the owner; flagged runs leave the party in pending.
  const verified = patch.amlReview?.status === 'cleared' && patch.hoKycReview?.status === 'approved'
  let intermediate: WorkflowState = {
    ...state,
    relatedParties: state.relatedParties.map((p) =>
      p.id === party.id
        ? { ...p, kycStatus: verified ? ('verified' as const) : ('pending' as const) }
        : p,
    ),
    childReviewsByChildId: {
      ...state.childReviewsByChildId,
      [accountChildId]: merged,
    },
  }
  // Append the screening-run snapshot to the audit trail.
  intermediate = appendOwnerVerificationSnapshot(intermediate, accountChildId, partyId, {
    ranAt: now,
    eventKind: 'screening_run',
    provider: patch.provider,
    runType: patch.runType,
    triggerSource: patch.triggerSource,
    runBy: options?.runBy ?? 'system',
    reRunReason: patch.reRunReason,
    snapshotOf: captureOwnerSnapshot(party),
    amlOutcome: patch.amlReview?.status,
    cipOutcome: patch.cipStatus?.overallStatus,
    note: patch.kycVerificationResultSummary,
  })
  // KYC is person-level: propagate the updated state to every other account where this party appears.
  return propagateOwnerReviewAcrossAccounts(intermediate, accountChildId, partyId)
}

/** Seed the first owner slot with the household primary when single-flow KYC is enabled. */
export function buildSingleFlowPrimaryOwnerSeed(
  relatedParties: RelatedParty[],
): { owners: Array<{ id: string; type: 'existing'; partyId: string }> } | undefined {
  const primary =
    relatedParties.find((p) => p.isPrimary && !p.isHidden && p.type !== 'related_organization') ??
    relatedParties.find((p) => p.type === 'household_member' && !p.isHidden)
  if (!primary || !areOwnerKycRequiredFieldsComplete(primary)) return undefined
  return {
    owners: [{ id: 'owner-1', type: 'existing', partyId: primary.id }],
  }
}

export function syncAutoRunOwnerKycForAccountChild(
  state: WorkflowState,
  accountChildId: string,
): WorkflowState {
  if (!isSingleFlowKycEnabled(state)) return state
  let next = state
  for (const party of getAccountPartiesRequiringKyc(state, accountChildId)) {
    next = applyAutoRunOwnerKycToState(next, accountChildId, party.id)
  }
  return next
}

export function listAccountOpeningChildIdsForParty(
  state: WorkflowState,
  partyId: string,
): string[] {
  const ids: string[] = []
  for (const child of state.tasks.flatMap((t) => t.children ?? [])) {
    if (child.childType !== 'account-opening') continue
    const owners = getAccountPartiesRequiringKyc(state, child.id)
    if (owners.some((p) => p.id === partyId)) ids.push(child.id)
  }
  return ids
}

export function syncAutoRunOwnerKycForParty(state: WorkflowState, partyId: string): WorkflowState {
  if (!isSingleFlowKycEnabled(state)) return state
  let next = state
  for (const accountChildId of listAccountOpeningChildIdsForParty(state, partyId)) {
    next = applyAutoRunOwnerKycToState(next, accountChildId, partyId)
  }
  return next
}

export interface RelatedAccountForParty {
  accountChildId: string
  name: string
  registration?: string
  accountNumber?: string
  hasOpenRemediation: boolean
}

/** Other account-opening children where this owner also appears (used in CIP / AML review tasks). */
export function getRelatedAccountsForParty(
  state: WorkflowState,
  partyId: string,
  excludeAccountChildId?: string,
): RelatedAccountForParty[] {
  const out: RelatedAccountForParty[] = []
  for (const accountChildId of listAccountOpeningChildIdsForParty(state, partyId)) {
    if (accountChildId === excludeAccountChildId) continue
    const child = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === accountChildId)
    if (!child) continue
    const meta = (state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}
    const owner = getOwnerReviewState(state, accountChildId, partyId)
    const hasOpenRemediation =
      owner?.amlReview?.status === 'info_requested' ||
      owner?.hoKycReview?.status === 'changes_requested'
    out.push({
      accountChildId,
      name: child.name,
      registration:
        typeof meta.registrationType === 'string' ? meta.registrationType : undefined,
      accountNumber:
        typeof meta.accountNumber === 'string' && meta.accountNumber
          ? meta.accountNumber
          : typeof meta.shortName === 'string' && meta.shortName
            ? meta.shortName
            : undefined,
      hasOpenRemediation,
    })
  }
  return out
}

function formatAccountOpeningReviewTimestamp(d = new Date()): string {
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function defaultAccountOpeningPreReviewTimeline(): NonNullable<
  ChildReviewState['accountOpeningPreReviewTimeline']
> {
  const now = Date.now()
  return {
    draftAt: formatAccountOpeningReviewTimestamp(new Date(now - 8 * 60 * 1000)),
    clientSignatureAt: formatAccountOpeningReviewTimestamp(new Date(now - 5 * 60 * 1000)),
    submittedForReviewAt: formatAccountOpeningReviewTimestamp(new Date()),
  }
}

function ownerNeedsAmlReReview(owner: OwnerKycReviewState | undefined): boolean {
  const aml = owner?.amlReview?.status
  return aml === 'info_requested' || aml === 'flagged'
}

function ownerNeedsDocumentReReview(owner: OwnerKycReviewState | undefined): boolean {
  return (
    owner?.hoKycReview?.status === 'changes_requested' || owner?.cipStatus?.overallStatus === 'fail'
  )
}

/** Target queue when an advisor resubmits after reviewers returned the package. */
export function deriveSingleFlowResubmitPhase(
  existing: ChildReviewState,
): AccountWorkflowPhase {
  if (existing.principalReview?.status === 'nigo') return 'principal_review'
  if (
    existing.documentReview?.status === 'nigo' ||
    Object.values(existing.ownerReviews ?? {}).some(ownerNeedsDocumentReReview)
  ) {
    return 'document_review'
  }
  if (
    Object.values(existing.ownerReviews ?? {}).some(ownerNeedsAmlReReview) ||
    existing.accountWorkflowPhase === 'aml_review' ||
    existing.amlReview?.status === 'pending' ||
    existing.amlReview?.status === 'flagged'
  ) {
    return hasOwnerLevelAmlFlag(existing) ? 'escalation_hold' : 'aml_review'
  }
  if (existing.accountWorkflowPhase === 'document_review') return 'document_review'
  if (existing.accountWorkflowPhase === 'principal_review') return 'principal_review'
  return 'aml_review'
}

function resetOwnerReviewsForResubmit(
  ownerReviews: Record<string, OwnerKycReviewState>,
  phase: AccountWorkflowPhase,
): Record<string, OwnerKycReviewState> {
  const next: Record<string, OwnerKycReviewState> = { ...ownerReviews }
  for (const [partyId, owner] of Object.entries(next)) {
    let patch: Partial<OwnerKycReviewState> | undefined
    if (phase === 'aml_review' && ownerNeedsAmlReReview(owner)) {
      patch = { amlReview: { status: 'pending' } }
    } else if (phase === 'document_review' && ownerNeedsDocumentReReview(owner)) {
      patch = { hoKycReview: { status: 'pending' } }
    }
    if (patch) next[partyId] = { ...owner, ...patch }
  }
  return next
}

function isSingleFlowAccountResubmit(
  existing: ChildReviewState | undefined,
  childStatus: TaskStatus,
): boolean {
  if (!existing) return false
  const returnedForRemediation =
    childStatus === 'rejected' || isAccountOpeningAwaitingClarification(existing, childStatus)
  const previouslySubmitted = Boolean(existing.accountOpeningPreReviewTimeline?.submittedForReviewAt)
  return returnedForRemediation || (previouslySubmitted && childStatus === 'in_progress')
}

/** First-time submit routing from owner KYC disposition (auto-run / screening). */
export function deriveSingleFlowInitialSubmitPhase(
  state: WorkflowState,
  accountChildId: string,
): AccountWorkflowPhase {
  const owners = getAccountPartiesRequiringKyc(state, accountChildId)
  const review = state.childReviewsByChildId?.[accountChildId]
  let needsAmlQueue = false
  let needsEscalationHold = false
  for (const party of owners) {
    const o = review?.ownerReviews?.[party.id]
    if (!o?.autoTriggeredAt) return 'draft'
    const aml = o.amlReview?.status
    if (aml === 'flagged' || aml === 'escalated') needsEscalationHold = true
    if (aml === 'pending' || aml === 'info_requested') needsAmlQueue = true
  }
  if (needsEscalationHold) return 'escalation_hold'
  if (needsAmlQueue) return 'aml_review'
  for (const party of owners) {
    const o = review?.ownerReviews?.[party.id]
    if (
      o?.hoKycReview?.status === 'pending' ||
      o?.hoKycReview?.status === 'changes_requested' ||
      o?.cipStatus?.overallStatus === 'fail'
    ) {
      return 'document_review'
    }
  }
  /** Owner KYC is clean — account enters HO document review queue (not principal yet). */
  return 'document_review'
}

/**
 * Build review state when an account-opening child is submitted in single-flow mode.
 * Resubmits route back to the prior reviewer queue and reopen owner-level dispositions.
 */
export function buildSingleFlowAccountOpeningReviewOnSubmit(
  state: WorkflowState,
  accountChildId: string,
  childStatus: TaskStatus,
): ChildReviewState {
  const existing = state.childReviewsByChildId?.[accountChildId]
  const resubmit = isSingleFlowAccountResubmit(existing, childStatus)
  const phase = resubmit
    ? deriveSingleFlowResubmitPhase(existing!)
    : deriveSingleFlowInitialSubmitPhase(state, accountChildId)

  const ownerReviews = resubmit
    ? resetOwnerReviewsForResubmit(existing?.ownerReviews ?? {}, phase)
    : (existing?.ownerReviews ?? {})

  const timeline = existing?.accountOpeningPreReviewTimeline ?? defaultAccountOpeningPreReviewTimeline()
  const submittedAt = formatAccountOpeningReviewTimestamp()

  const documentReview =
    phase === 'principal_review' && existing?.documentReview?.status === 'igo'
      ? existing.documentReview
      : { status: 'pending' as const }

  const principalReview =
    phase === 'principal_review'
      ? { status: 'pending' as const }
      : existing?.principalReview

  return {
    ...existing,
    documentReview,
    principalReview,
    ownerReviews,
    accountWorkflowPhase: phase,
    accountOpeningPreReviewTimeline: { ...timeline, submittedForReviewAt: submittedAt },
  }
}

/** Short summary of any open owner-level remediation across this party's accounts. */
export function getOpenSharedRemediationForParty(
  state: WorkflowState,
  partyId: string,
): string | undefined {
  for (const accountChildId of listAccountOpeningChildIdsForParty(state, partyId)) {
    const owner = getOwnerReviewState(state, accountChildId, partyId)
    if (!owner) continue
    if (owner.hoKycReview?.status === 'changes_requested' && owner.hoKycReview.comments) {
      return owner.hoKycReview.comments
    }
    if (owner.amlReview?.status === 'info_requested' && owner.amlReview.infoRequestComments) {
      return owner.amlReview.infoRequestComments
    }
  }
  return undefined
}
