import { SEI_ACCOUNT_TYPES } from '@/data/sei/seiAccountTypes'

/**
 * Simulated SEI reference-data layer.
 *
 * In production these values are fetched from SEI's reference-data APIs, keyed on
 * the logged-in advisor's `sm_universal_id`:
 *   - GET /users/{smUniversalId}/external  → firm (swpFirmId), advisor, offices, and
 *     the firm's account types.
 *   - GET /investmentPrograms/.../advisors/{advisorId}/accountTypes/{accountTypeId}
 *     → the investment programs valid for that advisor + account type.
 *
 * So swpFirmId / primaryAdvisorId / offices are DERIVED from who is logged in
 * (not typed), the account-type and investment-program lists are reference-driven
 * dropdowns, and the owner comes from the client record (Client Setup).
 *
 * Here we seed one response for the demo advisor, Greta Fure.
 */

export interface SeiOffice {
  officeLocationId: number
  officeName: string
  swpSubfirmId: number
}

export interface SeiAdvisorProfile {
  /** GET /users/{smUniversalId}/external — the session key. */
  smUniversalId: number
  /** primaryAdvisorId sent to the account-creation API. */
  advisorId: number
  advisorName: string
  firm: {
    swpFirmId: number
    firmName: string
    hasSubFirms: boolean
    /** Only relevant when hasSubFirms is true. */
    locations: SeiOffice[]
  }
}

/** The logged-in advisor's SEI profile (would come from GET /users/{id}/external). */
export const SEI_ADVISOR_PROFILE: SeiAdvisorProfile = {
  smUniversalId: 14199980,
  advisorId: 14199980,
  advisorName: 'Greta Fure',
  firm: {
    swpFirmId: 4070264,
    firmName: 'Stratos Wealth Partners',
    hasSubFirms: false,
    locations: [],
  },
}

export interface SeiInvestmentProgram {
  investmentProgramId: number
  investmentProgramDescription: string
}

/**
 * Investment programs by SEI accountTypeId (would come from the investment-programs
 * API for this advisor + account type). Keyed by accountTypeId; a default list backs
 * any type not explicitly mapped.
 */
const SEI_PROGRAMS_DEFAULT: SeiInvestmentProgram[] = [
  { investmentProgramId: 1, investmentProgramDescription: 'Mutual Fund Strategies or Custom Strategies' },
  { investmentProgramId: 2, investmentProgramDescription: 'Managed Account Solution' },
  { investmentProgramId: 3, investmentProgramDescription: 'Distribution Focused Strategies' },
  { investmentProgramId: 6, investmentProgramDescription: 'Custom High Net Worth Strategies' },
]

const SEI_PROGRAMS_BY_ACCOUNT_TYPE: Record<number, SeiInvestmentProgram[]> = {
  // Flagship Individual (7)
  7: SEI_PROGRAMS_DEFAULT,
}

export function getSeiInvestmentPrograms(accountTypeId: number | undefined): SeiInvestmentProgram[] {
  if (accountTypeId == null) return []
  return SEI_PROGRAMS_BY_ACCOUNT_TYPE[accountTypeId] ?? SEI_PROGRAMS_DEFAULT
}

/** The firm's account types (would come from users/external → accountTypes[]). */
export function getSeiFirmAccountTypes() {
  return SEI_ACCOUNT_TYPES
}
