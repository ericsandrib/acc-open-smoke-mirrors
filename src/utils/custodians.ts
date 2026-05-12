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
