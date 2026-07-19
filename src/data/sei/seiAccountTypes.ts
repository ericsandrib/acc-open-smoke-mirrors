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
  /** Numeric accountTypeId sent to the SEI account-creation API. Flagship Individual = 7
   *  and the other spec-grouped ids are grounded in the API spec; the rest are
   *  illustrative pending the live `users/external → accountTypes[]` response. */
  accountTypeId: number
  label: string
  /** Which of the three SEI forms opens this type. */
  form: SeiForm
  /** Closest downstream registration analogue — keeps existing flow rules intact. */
  registrationType: RegistrationType
}

export const SEI_ACCOUNT_TYPES: SeiAccountType[] = [
  // ── WRK-1005 · Individual-Owner (11) — the live form for this demo ──
  { seiAccountType: 'INDIVIDUAL', accountTypeId: 7, label: 'Individual', form: 'individual-owner', registrationType: 'IND' },
  { seiAccountType: 'INDIVIDUAL_MINOR', accountTypeId: 8, label: 'Individual — Minor', form: 'individual-owner', registrationType: 'UTMA_UGMA' },
  { seiAccountType: 'TRADITIONAL_IRA', accountTypeId: 18, label: 'Traditional IRA', form: 'individual-owner', registrationType: 'IRA' },
  { seiAccountType: 'ROTH_IRA', accountTypeId: 22, label: 'Roth IRA', form: 'individual-owner', registrationType: 'ROTH_IRA' },
  { seiAccountType: 'SEP_IRA', accountTypeId: 23, label: 'SEP IRA', form: 'individual-owner', registrationType: 'SEP_IRA' },
  { seiAccountType: 'SIMPLE_IRA', accountTypeId: 24, label: 'SIMPLE IRA', form: 'individual-owner', registrationType: 'SIMPLE_5304_IRA' },
  { seiAccountType: 'JOINT_TENANTS_WITH_RIGHTS_OF_SURVIVORSHIP', accountTypeId: 3, label: 'Joint Tenants with Rights of Survivorship', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'COMMUNITY_PROPERTY', accountTypeId: 4, label: 'Community Property', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'COMMUNITY_PROPERTY_WITH_RIGHTS_OF_SURVIVORSHIP', accountTypeId: 29, label: 'Community Property with Rights of Survivorship', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'TENANTS_BY_ENTIRETY', accountTypeId: 19, label: 'Tenants by the Entirety', form: 'individual-owner', registrationType: 'JT' },
  { seiAccountType: 'TENANTS_IN_COMMON', accountTypeId: 30, label: 'Tenants in Common', form: 'individual-owner', registrationType: 'JT' },

  // ── WRK-1006 · Inherited IRA (2) ──
  { seiAccountType: 'INHERITED_TRADITIONAL_IRA', accountTypeId: 16, label: 'Inherited Traditional IRA', form: 'inherited-ira', registrationType: 'INHERITED_IRA' },
  { seiAccountType: 'INHERITED_ROTH_IRA', accountTypeId: 17, label: 'Inherited Roth IRA', form: 'inherited-ira', registrationType: 'INHERITED_ROTH_IRA' },

  // ── WRK-1007 · Organization / entity (14) ──
  { seiAccountType: 'TRUST', accountTypeId: 34, label: 'Trust', form: 'organization', registrationType: 'TRUST' },
  { seiAccountType: '401K', accountTypeId: 10, label: '401(k)', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: '403B', accountTypeId: 12, label: '403(b)', form: 'organization', registrationType: 'NON_QUALIFIED_DEFERRED_COMP' },
  { seiAccountType: 'DEFINED_BENEFIT', accountTypeId: 13, label: 'Defined Benefit Plan', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: 'MONEY_PURCHASE', accountTypeId: 14, label: 'Money Purchase Plan', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: 'PROFIT_SHARING', accountTypeId: 15, label: 'Profit Sharing Plan', form: 'organization', registrationType: 'CORP_PENSION_PROFIT_SHARING_401K' },
  { seiAccountType: 'ESTATE', accountTypeId: 21, label: 'Estate', form: 'organization', registrationType: 'ESTATE' },
  { seiAccountType: 'FOUNDATION', accountTypeId: 25, label: 'Foundation', form: 'organization', registrationType: 'NON_PROFIT' },
  { seiAccountType: 'PARTNERSHIP', accountTypeId: 26, label: 'Partnership', form: 'organization', registrationType: 'PARTNERSHIP' },
  { seiAccountType: 'SOLE_PROPRIETORSHIP', accountTypeId: 27, label: 'Sole Proprietorship', form: 'organization', registrationType: 'SOLE_PROPRIETORSHIP' },
  { seiAccountType: 'PRIVATE_CORPORATION', accountTypeId: 28, label: 'Private Corporation', form: 'organization', registrationType: 'CORPORATION' },
  { seiAccountType: 'PUBLIC_CORPORATION', accountTypeId: 31, label: 'Public Corporation', form: 'organization', registrationType: 'CORPORATION' },
  { seiAccountType: 'TAX_EXEMPT', accountTypeId: 33, label: 'Tax-Exempt Organization', form: 'organization', registrationType: 'NON_PROFIT' },
  { seiAccountType: 'ENDOWMENT', accountTypeId: 32, label: 'Endowment', form: 'organization', registrationType: 'NON_PROFIT' },
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
