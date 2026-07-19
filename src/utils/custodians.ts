/**
 * Multi-custody catalog for Stratos. The picker dialog lists these; downstream
 * forms branch on `custodian` to render the custodian-native paperwork (e.g.
 * Schwab uses native field-by-field forms; SEI/Fidelity still fall back to the
 * generic owner/info child form until native experiences are built).
 */
export type CustodianId = 'sei' | 'schwab' | 'fidelity'

export interface CustodianOption {
  id: CustodianId
  label: string
  /** Short label for badges / chips. */
  shortLabel: string
}

export const CUSTODIAN_OPTIONS: CustodianOption[] = [
  { id: 'sei', label: 'SEI', shortLabel: 'SEI' },
  { id: 'schwab', label: 'Charles Schwab', shortLabel: 'Schwab' },
  { id: 'fidelity', label: 'Fidelity', shortLabel: 'Fidelity' },
]

export function getCustodianLabel(id: CustodianId | string | undefined): string {
  if (!id) return ''
  return CUSTODIAN_OPTIONS.find((c) => c.id === id)?.label ?? String(id)
}

/**
 * Category of work for the selected custodian. Only `open-new` is supported in
 * this prototype; "Link existing" categories are future scope.
 */
export type AccountCategoryId = 'open-new'

export interface AccountCategoryOption {
  id: AccountCategoryId
  label: string
}

export const ACCOUNT_CATEGORY_OPTIONS: AccountCategoryOption[] = [
  { id: 'open-new', label: 'Open a new account' },
]

export function getAccountCategoryLabel(id: AccountCategoryId | string | undefined): string {
  if (!id) return ''
  return ACCOUNT_CATEGORY_OPTIONS.find((c) => c.id === id)?.label ?? String(id)
}

/**
 * Application type — replaces registration type in the picker. The user picks
 * which Schwab form to fill; the actual registration (Individual / Joint /
 * Traditional IRA / etc.) is captured inside the form's sections.
 */
export type SchwabApplicationType =
  | 'schwab-one-personal'
  | 'schwab-ira'
  | 'schwab-managed-account'
  | 'schwab-transfer'

export interface SchwabApplicationOption {
  id: SchwabApplicationType
  label: string
  /** Short label used for the spawned child task name. */
  shortLabel: string
}

export const SCHWAB_APPLICATION_OPTIONS: SchwabApplicationOption[] = [
  { id: 'schwab-one-personal', label: 'Schwab One for Personal Accounts', shortLabel: 'Schwab One Account' },
  { id: 'schwab-ira', label: 'IRA Account', shortLabel: 'IRA Account' },
  { id: 'schwab-managed-account', label: 'Managed Account Marketplace', shortLabel: 'Managed Account' },
  { id: 'schwab-transfer', label: 'Transfer account to Schwab', shortLabel: 'Account Transfer' },
]

export function getSchwabApplicationLabel(id: SchwabApplicationType | string | undefined): string {
  if (!id) return ''
  return SCHWAB_APPLICATION_OPTIONS.find((o) => o.id === id)?.label ?? String(id)
}

/**
 * SEI exposes a *registration type* (account type) rather than an application
 * type — the picker collects the registration directly here instead of inside a
 * form. These are the 27 SEI account-type identifiers confirmed with SEI
 * (id = exact SEI `account_type` identifier; label = SEI
 * `account_type_description`). Source: "SEI × Stratos — Account-Opening
 * Integration: Items for SEI to Confirm", section A.
 */
export interface SeiRegistrationOption {
  /** Exact SEI account_type identifier sent to the SEI account-open API. */
  id: string
  label: string
  /** Short label used for the spawned child task name. */
  shortLabel: string
  /** SEI Tax-Qualified flag for the registration. */
  taxQualified: boolean
}

export const SEI_REGISTRATION_OPTIONS: SeiRegistrationOption[] = [
  { id: 'TRADITIONAL_IRA', label: 'Traditional IRA', shortLabel: 'Traditional IRA', taxQualified: true },
  { id: 'ROTH_IRA', label: 'Roth IRA', shortLabel: 'Roth IRA', taxQualified: true },
  { id: 'SEP_IRA', label: 'SEP IRA', shortLabel: 'SEP IRA', taxQualified: true },
  { id: 'SIMPLE_IRA', label: 'SIMPLE IRA', shortLabel: 'SIMPLE IRA', taxQualified: true },
  { id: 'INHERITED_TRADITIONAL_IRA', label: 'Inherited Traditional IRA', shortLabel: 'Inherited Traditional IRA', taxQualified: true },
  { id: 'INHERITED_ROTH_IRA', label: 'Inherited Roth IRA', shortLabel: 'Inherited Roth IRA', taxQualified: true },
  { id: 'INDIVIDUAL', label: 'Individual', shortLabel: 'Individual', taxQualified: false },
  { id: 'INDIVIDUAL_MINOR', label: 'Guardianship/Conservatorship', shortLabel: 'Guardianship/Conservatorship', taxQualified: false },
  { id: 'JOINT_TENANTS_WITH_RIGHTS_OF_SURVIVORSHIP', label: 'Joint Tenants with Rights of Survivorship', shortLabel: 'Joint Tenants (JTWROS)', taxQualified: false },
  { id: 'COMMUNITY_PROPERTY', label: 'Community Property', shortLabel: 'Community Property', taxQualified: false },
  { id: 'COMMUNITY_PROPERTY_WITH_RIGHTS_OF_SURVIVORSHIP', label: 'Community Property with Rights of Survivorship', shortLabel: 'Community Property (WROS)', taxQualified: false },
  { id: 'TENANTS_BY_ENTIRETY', label: 'Tenants by Entirety', shortLabel: 'Tenants by Entirety', taxQualified: false },
  { id: 'TENANTS_IN_COMMON', label: 'Tenants in Common', shortLabel: 'Tenants in Common', taxQualified: false },
  { id: 'TRUST', label: 'Trust', shortLabel: 'Trust', taxQualified: false },
  { id: '401K', label: '401(k) including Roth 401(k)', shortLabel: '401(k)', taxQualified: true },
  { id: '403B', label: '403(B)', shortLabel: '403(B)', taxQualified: true },
  { id: 'DEFINED_BENEFIT', label: 'Defined Benefit (including cash balance)', shortLabel: 'Defined Benefit', taxQualified: true },
  { id: 'MONEY_PURCHASE', label: 'Money Purchase', shortLabel: 'Money Purchase', taxQualified: true },
  { id: 'PROFIT_SHARING', label: 'Profit Sharing', shortLabel: 'Profit Sharing', taxQualified: true },
  { id: 'ESTATE', label: 'Estate', shortLabel: 'Estate', taxQualified: false },
  { id: 'FOUNDATION', label: 'Foundation', shortLabel: 'Foundation', taxQualified: false },
  { id: 'PARTNERSHIP', label: 'Partnership', shortLabel: 'Partnership', taxQualified: false },
  { id: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship', shortLabel: 'Sole Proprietorship', taxQualified: false },
  { id: 'PRIVATE_CORPORATION', label: 'Private Corporation', shortLabel: 'Private Corporation', taxQualified: false },
  { id: 'PUBLIC_CORPORATION', label: 'Public Corporation', shortLabel: 'Public Corporation', taxQualified: false },
  { id: 'TAX_EXEMPT', label: 'Tax Exempt/Non-Profit', shortLabel: 'Tax Exempt/Non-Profit', taxQualified: false },
  { id: 'ENDOWMENT', label: 'Endowment', shortLabel: 'Endowment', taxQualified: false },
]

export function getSeiRegistrationLabel(id: string | undefined): string {
  if (!id) return ''
  return SEI_REGISTRATION_OPTIONS.find((o) => o.id === id)?.label ?? String(id)
}

/**
 * The "Add accounts" picker collects either an *application type* (Schwab,
 * Fidelity — the client picks which form to start, registration is chosen inside
 * it) or a *registration type* (SEI — the registration/account type is selected
 * directly). The middle module is therefore conditional on the custodian.
 */
export type AccountSelectorKind = 'application' | 'registration'

export interface AccountSelectorOption {
  id: string
  label: string
  shortLabel: string
}

export interface AccountSelectorConfig {
  kind: AccountSelectorKind
  /** Field/column label, e.g. "Application type" or "Registration type". */
  fieldLabel: string
  placeholder: string
  options: AccountSelectorOption[]
}

const toSelectorOption = (o: { id: string; label: string; shortLabel: string }): AccountSelectorOption => ({
  id: o.id,
  label: o.label,
  shortLabel: o.shortLabel,
})

export function getAccountSelectorConfig(custodian: CustodianId | ''): AccountSelectorConfig {
  if (custodian === 'sei') {
    return {
      kind: 'registration',
      fieldLabel: 'Registration type',
      placeholder: 'Select registration type…',
      options: SEI_REGISTRATION_OPTIONS.map(toSelectorOption),
    }
  }
  // Schwab + Fidelity (and the no-custodian default) use the application-type picker.
  return {
    kind: 'application',
    fieldLabel: 'Application type',
    placeholder: 'Select application type…',
    options: SCHWAB_APPLICATION_OPTIONS.map(toSelectorOption),
  }
}
