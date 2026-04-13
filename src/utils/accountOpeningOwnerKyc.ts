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

/**
 * Returns account owners on this child who are not yet KYC-verified (for blocking submit for review).
 */
export function getAccountOwnersMissingKyc(
  state: WorkflowState,
  accountChildId: string,
): { names: string[] } {
  const ownersData = state.taskData[`${accountChildId}-account-owners`] as Record<string, unknown> | undefined
  const owners = (ownersData?.owners as OwnerRow[] | undefined) ?? []
  const names: string[] = []

  for (const row of owners) {
    if (row.type !== 'existing' || !row.partyId) continue
    const party = state.relatedParties.find((p) => p.id === row.partyId)
    if (!party) continue
    if (!isAccountOwnerKycVerified(state, party)) {
      names.push(party.name)
    }
  }

  return { names }
}
