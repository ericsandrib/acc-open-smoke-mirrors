import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'

const IRA_REGISTRATIONS = new Set<RegistrationType>([
  'IRA',
  'SEP_IRA',
  'SIMPLE_5304_IRA',
  'INHERITED_IRA',
  'GUARDIAN_IRA',
  'NON_QUALIFIED_DEFERRED_COMP',
  'THIRD_PARTY_CUSTODIAN_ERISA_QRP',
])

const ROTH_REGISTRATIONS = new Set<RegistrationType>(['ROTH_IRA', 'INHERITED_ROTH_IRA'])

const TRUST_REGISTRATIONS = new Set<RegistrationType>(['TRUST', 'ESTATE'])

const RETIREMENT_401K = new Set<RegistrationType>([
  'CORP_PENSION_PROFIT_SHARING_401K',
  'INDIVIDUAL_401K_ASCENSUS',
])

const SAVINGS_529 = new Set<RegistrationType>(['529_ON_PLATFORM', '529_OFF_PLATFORM'])

/**
 * Default product account type implied by PAS registration id (open-account matrix).
 */
export function getAccountProductTypeForRegistration(
  registrationType: RegistrationType | null | undefined,
): AccountType {
  if (!registrationType) return 'brokerage'

  if (TRUST_REGISTRATIONS.has(registrationType)) return 'trust'
  if (ROTH_REGISTRATIONS.has(registrationType)) return 'roth_ira'
  if (IRA_REGISTRATIONS.has(registrationType)) return 'ira'
  if (RETIREMENT_401K.has(registrationType)) return '401k'
  if (SAVINGS_529.has(registrationType)) return 'savings'

  return 'brokerage'
}
