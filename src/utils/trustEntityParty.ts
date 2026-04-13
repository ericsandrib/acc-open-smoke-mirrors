import type { RelatedParty } from '@/types/workflow'

/**
 * True when the party is an org-style profile that represents trust titling for this demo:
 * entity type Trust, role Trust (e.g. seed "Smith Family Trust LLC" has role only), or trust in the legal name.
 * Mirrors the Related parties "trusts" grouping so trust account owners stay consistent.
 */
export function isTrustEntityParty(party: RelatedParty): boolean {
  if (party.isHidden) return false
  const isOrgLike =
    party.type === 'related_organization' ||
    (party.type === 'related_contact' && Boolean(party.organizationName))
  if (!isOrgLike) return false
  if ((party.entityType ?? '').toLowerCase() === 'trust') return true
  if ((party.role ?? '').toLowerCase() === 'trust') return true
  if ((party.organizationName ?? party.name ?? '').toLowerCase().includes('trust')) return true
  return false
}
