import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'

/**
 * Default product account type implied by registration structure.
 * Pershing-style: most registrations map to a brokerage account product; trust-style registrations map to trust.
 */
export function getAccountProductTypeForRegistration(
  registrationType: RegistrationType | null | undefined,
): AccountType {
  if (!registrationType) return 'brokerage'

  switch (registrationType) {
    case 'trust_revocable':
    case 'trust_irrevocable':
    case 'estate':
      return 'trust'
    default:
      return 'brokerage'
  }
}
