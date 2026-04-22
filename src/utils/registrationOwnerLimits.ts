import pasData from '@/data/pasRequiredDocuments.json'
import type { RegistrationType } from '@/utils/registrationDocuments'

/** Joint-style personal registrations: two individuals on the registration. */
const TWO_OWNER_PERSONAL = new Set<RegistrationType>(['JT', 'TOD_JT'])

/**
 * Guardian / UTMA: typically two natural-person parties (e.g. guardian + ward or custodian + minor).
 */
const TWO_OWNER_CUSTODIAL = new Set<RegistrationType>(['GUARDIAN', 'UTMA_UGMA'])

/**
 * 529 plans often list multiple participants (owner, successor, beneficiary) — cap for the demo UI.
 */
const FOUR_OWNER_529 = new Set<RegistrationType>(['529_ON_PLATFORM', '529_OFF_PLATFORM'])

/** Entity types with a single controlling individual (demo simplification). */
const ENTITY_SINGLE_CONTROL = new Set<RegistrationType>(['SOLE_PROPRIETORSHIP'])

/** Trust registration: one titling trust entity as account owner (demo). */
const TRUST_SINGLE_OWNER = new Set<RegistrationType>(['TRUST'])

/**
 * Entity-category registrations where a `related_organization` may be titled as account owner.
 * Individual / joint / IRA / 529 / UTMA and other personal registrations are natural-person only here.
 */
const LEGAL_ENTITY_ACCOUNT_OWNER_REGISTRATIONS = new Set<RegistrationType>([
  'LLC',
  'CORPORATION',
  'PARTNERSHIP',
  'NON_PROFIT',
  'SOLE_PROPRIETORSHIP',
  'CAPTIVE_INSURANCE',
  'ESTATE',
  'ADVISORY_ON_PLATFORM_ENTITY',
  'ADVISORY_OFF_PLATFORM_ENTITY',
  'OFF_PLATFORM_COB_ENTITY',
])

/** Default cap for estates, corps, LLCs, plans — trustees, signers, control persons. */
const ENTITY_MULTI_OWNER_CAP = 8

function findRegistrationEntry(type: RegistrationType) {
  return (
    pasData.registration_types.personal_accounts.find((e) => e.id === type) ??
    pasData.registration_types.entity_accounts.find((e) => e.id === type)
  )
}

/**
 * Maximum account-owner slots allowed for this PAS registration (household members or entities on the account).
 */
export function getMaxAccountOwnersForRegistration(
  registrationType: RegistrationType | null | undefined,
): number {
  if (!registrationType) {
    return ENTITY_MULTI_OWNER_CAP
  }

  const entry = findRegistrationEntry(registrationType)
  if (!entry) {
    return ENTITY_MULTI_OWNER_CAP
  }

  if (entry.category === 'entity') {
    if (ENTITY_SINGLE_CONTROL.has(registrationType)) return 1
    if (TRUST_SINGLE_OWNER.has(registrationType)) return 1
    return ENTITY_MULTI_OWNER_CAP
  }

  // Personal
  if (TWO_OWNER_PERSONAL.has(registrationType)) return 2
  if (TWO_OWNER_CUSTODIAL.has(registrationType)) return 2
  if (FOUR_OWNER_529.has(registrationType)) return 4
  return 1
}

/**
 * Whether this registration allows a legal entity (`related_organization`) as account owner.
 * Trust registrations use a separate flow (trust legal entity only); this covers business/estate entity accounts.
 */
export function registrationAllowsLegalEntityAsAccountOwner(
  registrationType: RegistrationType | null | undefined,
): boolean {
  if (!registrationType) return false
  return LEGAL_ENTITY_ACCOUNT_OWNER_REGISTRATIONS.has(registrationType)
}

/** Short helper line for the owners section. */
export function getAccountOwnerLimitDescription(maxOwners: number): string {
  if (maxOwners <= 1) {
    return 'This registration type allows one account owner.'
  }
  if (maxOwners === 2) {
    return 'This registration type allows up to two account owners (e.g. joint or custodial).'
  }
  return `This registration type allows up to ${maxOwners} account owners on the registration.`
}
