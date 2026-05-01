import type { RelatedParty, WorkflowState } from '@/types/workflow'
import { deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import { getAllOpenAccountsTasks } from '@/utils/openAccountsTaskContext'

/**
 * Household members must have completed KYC (party verified or matching KYC child workflow complete).
 * Legal-entity owners skip this check in the demo (entity-level verification is out of scope).
 */
export function isAccountOwnerKycVerified(state: WorkflowState, party: RelatedParty): boolean {
  if (party.type === 'related_organization') {
    return true
  }
  const kycFromStandalone = state.tasks.find((t) => t.formKey === 'kyc')
  const kycChildren = kycFromStandalone
    ? (kycFromStandalone.children?.filter((c) => c.childType === 'kyc') ?? [])
    : getAllOpenAccountsTasks(state).flatMap((t) => t.children?.filter((c) => c.childType === 'kyc') ?? [])
  const coveredByCompletedTrustCaseFallback = kycChildren.some((c) => {
    const reviewState = state.childReviewsByChildId?.[c.id]
    if (deriveChildDisplayStatus(c.status, reviewState) !== 'complete') return false

    const meta = state.taskData[c.id] as Record<string, unknown> | undefined
    const subjectType = meta?.kycSubjectType as string | undefined
    const subjectPartyId = meta?.kycSubjectPartyId as string | undefined
    const subjectParty =
      (subjectPartyId
        ? state.relatedParties.find((p) => p.id === subjectPartyId)
        : undefined) ??
      state.relatedParties.find((p) => p.type === 'related_organization' && p.name === c.name)
    const infoTaskData = (state.taskData[`${c.id}-info`] as Record<string, unknown> | undefined) ?? {}
    const infoBeneficialOwners = (infoTaskData.beneficialOwners as Array<{ name?: string }> | undefined) ?? []
    const infoControlPersonName = `${(infoTaskData.cpFirstName as string | undefined) ?? ''} ${(infoTaskData.cpLastName as string | undefined) ?? ''}`.trim()

    const isEntityByMetaOrParty =
      subjectType === 'entity' || subjectParty?.type === 'related_organization'
    if (!isEntityByMetaOrParty) return false

    const isTrustee = (subjectParty?.trustParties ?? []).some((tp) => tp.partyId === party.id)
    if (isTrustee) return true

    const byName = normalizeName(party.name)
    const isBeneficialOwner =
      (subjectParty?.beneficialOwners ?? []).some(
        (bo) => normalizeName(bo.name) === byName,
      ) ||
      infoBeneficialOwners.some((bo) => normalizeName(bo.name) === byName)
    if (isBeneficialOwner) return true

    const isControlPerson =
      normalizeName(infoControlPersonName) === byName ||
      normalizeName(subjectParty?.contactPerson) === byName
    if (isControlPerson) return true

    return false
  })
  if (coveredByCompletedTrustCaseFallback) {
    return true
  }
  const coveredByCompletedTrustCase = kycChildren.some((c) => {
    const meta = state.taskData[c.id] as Record<string, unknown> | undefined
    const subjectType = meta?.kycSubjectType as string | undefined
    const relatedIds = meta?.kycRelatedSubjectPartyIds as string[] | undefined
    if (subjectType !== 'entity' || !Array.isArray(relatedIds) || !relatedIds.includes(party.id)) {
      return false
    }
    const reviewState = state.childReviewsByChildId?.[c.id]
    return deriveChildDisplayStatus(c.status, reviewState) === 'complete'
  })
  if (coveredByCompletedTrustCase) {
    return true
  }
  const matchingChild = kycChildren.find((c) => c.name === party.name)
  if (matchingChild) {
    const reviewState = state.childReviewsByChildId?.[matchingChild.id]
    return deriveChildDisplayStatus(matchingChild.status, reviewState) === 'complete'
  }
  return party.kycStatus === 'verified'
}

type OwnerRow = { id: string; type: string; partyId?: string }

function normalizeName(name?: string): string {
  return (name ?? '').trim().toLowerCase()
}

/**
 * Natural-person parties that should complete KYC for a given account-opening child:
 * - Individual owners selected directly
 * - Trustees linked on trust owners (`trustParties.partyId`)
 * - Beneficial owners on trust owners when the name matches a related-party person
 *
 * Legal entities are intentionally excluded from per-person KYC checks.
 */
export function getAccountPartiesRequiringKyc(
  state: WorkflowState,
  accountChildId: string,
): RelatedParty[] {
  const ownersData = state.taskData[`${accountChildId}-account-owners`] as Record<string, unknown> | undefined
  const owners = (ownersData?.owners as OwnerRow[] | undefined) ?? []

  const byId = new Map<string, RelatedParty>()
  const byNormalizedName = new Map<string, RelatedParty[]>()

  for (const p of state.relatedParties) {
    if (p.type === 'related_organization') continue
    byId.set(p.id, p)
    const key = normalizeName(p.name)
    if (!key) continue
    const current = byNormalizedName.get(key) ?? []
    current.push(p)
    byNormalizedName.set(key, current)
  }

  const required = new Map<string, RelatedParty>()
  const addPartyId = (partyId?: string) => {
    if (!partyId) return
    const p = byId.get(partyId)
    if (p) required.set(p.id, p)
  }

  for (const row of owners) {
    if (row.type !== 'existing' || !row.partyId) continue
    const owner = state.relatedParties.find((p) => p.id === row.partyId)
    if (!owner) continue

    // Direct natural-person owner
    if (owner.type !== 'related_organization') {
      required.set(owner.id, owner)
      continue
    }

    // Trust owner: trustees linked by party id
    for (const tp of owner.trustParties ?? []) {
      addPartyId(tp.partyId)
    }

    // Trust owner: beneficial owners matched by name against known people
    for (const bo of owner.beneficialOwners ?? []) {
      const matches = byNormalizedName.get(normalizeName(bo.name)) ?? []
      for (const match of matches) {
        required.set(match.id, match)
      }
    }
  }

  return Array.from(required.values())
}

/**
 * Returns account owners on this child who are not yet KYC-verified (for blocking submit for review).
 */
export function getAccountOwnersMissingKyc(
  state: WorkflowState,
  accountChildId: string,
): { names: string[] } {
  const names: string[] = []

  for (const party of getAccountPartiesRequiringKyc(state, accountChildId)) {
    if (!isAccountOwnerKycVerified(state, party)) {
      names.push(party.name)
    }
  }

  return { names }
}
