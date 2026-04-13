import type { RelatedParty, WorkflowState } from '@/types/workflow'

/**
 * Household members must have completed KYC (party verified or matching KYC child workflow complete).
 * Legal-entity owners skip this check in the demo (entity-level verification is out of scope).
 */
export function isAccountOwnerKycVerified(state: WorkflowState, party: RelatedParty): boolean {
  if (party.type === 'related_organization') {
    return true
  }
  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  const kycChildren = kycTask?.children?.filter((c) => c.childType === 'kyc') ?? []
  const matchingChild = kycChildren.find((c) => c.name === party.name)
  if (matchingChild) {
    return matchingChild.status === 'complete'
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
