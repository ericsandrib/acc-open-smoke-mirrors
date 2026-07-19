import type { RegistrationType } from '@/utils/registrationDocuments'

/**
 * SEI custody account opening — the 27 account types, split across the three
 * consolidated SEI forms (Linear WRK-1005 / WRK-1006 / WRK-1007).
 *
 * Each SEI type carries a `registrationType` mapping to the prototype's existing
 * downstream registration model so every existing rule (documents, owner limits,
 * beneficiaries, forms package, KYC) keeps working unchanged — `registrationType`
 * stays the canonical downstream key, while `seiAccountType` preserves the true
 * SEI taxonomy for the SEI form + MRDC call.
 */
export type SeiForm = 'individual-owner' | 'inherited-ira' | 'organization'

export interface SeiAccountType {
  /** The true SEI account type id (as used by the SEI account-creation API). */
  seiAccountType: string
  label: string
  /** Which of the three SEI forms opens this type. */
  form: SeiForm
  /** Closest downstream registration analogue — keeps existing flow rules intact. */
  registrationType: RegistrationType
}

export const SEI_ACCOUNT_TYPES: SeiAccountType[] = [
  // ── WRK-1005 · Individual-Owner (11) — the live form for this demo ──
  { seiAccountType: 'INDIVIDUAL', label: 'Individual', form: 'individual-owner', registrationType: 'IND' },
  { seiAccountType: 'INDIVIDUAL_MINOR', label: 'Individual — Minor', form: 'individual-owner', registrationType: 'UTMA_UGMA' },
  { seiAccountType: 'TRADITIONAL_IRA', label: 'Traditional IRA', form: 'individual-owner', registrationType: 'IRA' },
  { seiAccountType: 'ROTH_IRA', label: 'Roth IRA', form: 'individual-owner', registrationType: 'ROTH_IRA' },
  { seiAccountType: 'SEP_IRA', label: 'SEP IRA', form: 'individual-owner', registrationType: 'SEP_IRA' },
  { seiAccountType: 'SIMPLE_IRA', label: 'SIMPLE IRA', form: 'individual-owner', registrationType: 'SIMPLE_5304_IRA' },
  { seiAccountType: 'JOINT_TENANTS_WITH_RIGHTS_OF_SURVIVORSHIP', label: 'Joint Tenants with Rights of Survivorship', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'COMMUNITY_PROPERTY', label: 'Community Property', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'COMMUNITY_PROPERTY_WITH_RIGHTS_OF_SURVIVORSHIP', label: 'Community Property with Rights of Survivorship', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'TENANTS_BY_ENTIRETY', label: 'Tenants by the Entirety', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'TENANTS_IN_COMMON', label: 'Tenants in Common', form: 'individual-owner', registrationType: 'JT' },

  // ── WRK-1006 · Inherited IRA (2) ──
  { seiAccountType: 'INHERITED_TRADITIONAL_IRA', label: 'Inherited Traditional IRA', form: 'inherited-ira', registrationType: 'INHERITED_IRA' },
  { seiAccountType: 'INHERITED_ROTH_IRA', label: 'Inherited Roth IRA', form: 'inherited-ira', registrationType: 'INHERITED_ROTH_IRA' },

  // ── WRK-1007 · Organization / entity (14) ──
  { seiAccountType: 'TRUST', label: 'Trust', form: 'organization', registrationType: 'TRUST' },
  { seiAccountType: '401K', label: '401(k)', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: '403B', label: '403(b)', form: 'organization', registrationType: 'NON_QUALIFIED_DEFERRED_COMP' },
  { seiAccountType: 'DEFINED_BENEFIT', label: 'Defined Benefit Plan', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: 'MONEY_PURCHASE', label: 'Money Purchase Plan', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: 'PROFIT_SHARING', label: 'Profit Sharing Plan', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: 'ESTATE', label: 'Estate', form: 'organization', registrationType: 'ESTATE' },
  { seiAccountType: 'FOUNDATION', label: 'Foundation', form: 'organization', registrationType: 'NON_PROFIT' },
  { seiAccountType: 'PARTNERSHIP', label: 'Partnership', form: 'organization', registrationType: 'PARTNERSHIP' },
  { seiAccountType: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship', form: 'organization', registrationType: 'SOLE_PROPRIETORSHIP' },
  { seiAccountType: 'PRIVATE_CORPORATION', label: 'Private Corporation', form: 'organization', registrationType: 'CORPORATION' },
  { seiAccountType: 'PUBLIC_CORPORATION', label: 'Public Corporation', form: 'organization', registrationType: 'CORPORATION' },
  { seiAccountType: 'TAX_EXEMPT', label: 'Tax-Exempt Organization', form: 'organization', registrationType: 'NON_PROFIT' },
  { seiAccountType: 'ENDOWMENT', label: 'Endowment', form: 'organization', registrationType: 'NON_PROFIT' },
]

export const SEI_FORM_LABELS: Record<SeiForm, string> = {
  'individual-owner': 'Individual-Owner Accounts',
  'inherited-ira': 'Inherited IRA',
  organization: 'Organization Accounts',
}

/** Only the Individual-Owner form (WRK-1005) is rendered live in this demo. */
export const SEI_LIVE_FORMS: SeiForm[] = ['individual-owner']

export function getSeiAccountType(seiAccountType: string | undefined): SeiAccountType | undefined {
  return SEI_ACCOUNT_TYPES.find((t) => t.seiAccountType === seiAccountType)
}

/** SEI investment programs (investmentProgramId in the SEI account-creation API). */
export interface SeiInvestmentProgram {
  id: string
  label: string
}

export const SEI_INVESTMENT_PROGRAMS: SeiInvestmentProgram[] = [
  { id: '5', label: 'SEI Managed Account — Moderate Growth' },
  { id: '12', label: 'SEI Managed Account — Conservative' },
  { id: '18', label: 'SEI Managed Account — Aggressive Growth' },
  { id: '24', label: 'SEI Strategic Portfolios — Core Market' },
  { id: '31', label: 'SEI Tax-Managed — Balanced' },
]
