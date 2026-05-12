import type { SchwabApplicationType } from '@/utils/custodians'

/**
 * Schwab application type is the form key directly — the picker lets the user
 * choose which Schwab paperwork to start. The actual registration (Individual,
 * Joint, IRA subtype, etc.) is captured inside the form.
 */
export type SchwabFormKey = SchwabApplicationType

export function getSchwabFormKey(
  applicationType: SchwabApplicationType | undefined,
): SchwabFormKey {
  return applicationType ?? 'schwab-one-personal'
}

export const SCHWAB_FORM_LABELS: Record<SchwabFormKey, string> = {
  'schwab-one-personal': 'Schwab One Account Application',
  'schwab-ira': 'Schwab IRA Account Application',
  'schwab-managed-account': 'Schwab Managed Account Marketplace Application',
  'schwab-transfer': 'Transfer Your Account to Schwab',
}

export const SCHWAB_FORM_CODES: Record<SchwabFormKey, string> = {
  'schwab-one-personal': 'APP13582',
  'schwab-ira': 'APP10539',
  'schwab-managed-account': 'APP20284',
  'schwab-transfer': 'APP10864',
}
