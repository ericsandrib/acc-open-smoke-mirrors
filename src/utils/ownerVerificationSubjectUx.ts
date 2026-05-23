import type { OwnerKycReviewState, RelatedParty, WorkflowState } from '@/types/workflow'
import { getKycStatus, getKycStatusPriority, isKycStatusAttention } from '@/utils/kycStatus'

/** Two-letter avatar initials for verification rows. */
export function getSubjectInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function priorityForParty(
  party: { id: string },
  ownerForParty: (partyId: string) => OwnerKycReviewState | undefined,
  partyById?: Map<string, RelatedParty>,
): number {
  const owner = ownerForParty(party.id)
  const fullParty = partyById?.get(party.id)
  return getKycStatusPriority(getKycStatus(owner, fullParty))
}

/** Number of subjects whose KYC status needs operator attention (anything but Pass). */
export function countSubjectsNeedingAttention<T extends RelatedParty>(
  parties: T[],
  ownerForParty: (partyId: string) => OwnerKycReviewState | undefined,
): number {
  return parties.filter((p) => isKycStatusAttention(getKycStatus(ownerForParty(p.id), p))).length
}

/**
 * Stable sort by participant verification priority (fail → pending → not run → pass).
 * Preserves original order within the same priority bucket.
 */
export function sortPartiesByVerificationPriority<T extends RelatedParty>(
  parties: T[],
  ownerForParty: (partyId: string) => OwnerKycReviewState | undefined,
): T[] {
  return [...parties].sort((a, b) => {
    const pa = priorityForParty(a, ownerForParty)
    const pb = priorityForParty(b, ownerForParty)
    if (pa !== pb) return pa - pb
    return 0
  })
}

function normalizeName(name?: string): string {
  return (name ?? '').trim().toLowerCase()
}

/** Display role for the verification row (trustee, beneficial owner, account owner, etc.). */
export function getVerificationSubjectTypeLabel(
  party: RelatedParty,
  state: WorkflowState,
  accountChildId: string,
): string {
  const ownersData = state.taskData[`${accountChildId}-account-owners`] as Record<string, unknown> | undefined
  const owners = (ownersData?.owners as Array<{ partyId?: string; role?: string }> | undefined) ?? []
  const ownerRow = owners.find((o) => o.partyId === party.id)
  if (ownerRow?.role?.trim()) return ownerRow.role.trim()
  if (party.role?.trim()) return party.role.trim()
  if (party.relationship?.trim()) return party.relationship.trim()

  for (const org of state.relatedParties) {
    if (org.type !== 'related_organization') continue
    if ((org.trustParties ?? []).some((tp) => tp.partyId === party.id)) return 'Trustee'
    if (
      (org.beneficialOwners ?? []).some((bo) => normalizeName(bo.name) === normalizeName(party.name))
    ) {
      return 'Beneficial Owner'
    }
    const cpName = org.controlPerson
      ? `${org.controlPerson.firstName ?? ''} ${org.controlPerson.lastName ?? ''}`.trim()
      : org.contactPerson
    if (cpName && normalizeName(cpName) === normalizeName(party.name)) return 'Control Person'
  }

  if (party.type === 'household_member') return 'Account Owner'
  if (party.type === 'related_contact') return 'Related Contact'
  return 'Individual'
}
