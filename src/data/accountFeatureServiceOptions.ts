/** Account features & services — administrative, setup, or lifecycle (not transactional movements). */
export const ACCOUNT_FEATURE_SERVICE_OPTIONS = [
  { value: 'accounts_new', label: 'Accounts / Accounts (New)', description: 'Account opening and updates' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'billing_account_validation', label: 'Billing Account Validation' },
  { value: 'business_process_events', label: 'Business Process Events' },
  { value: 'custodial_document_booking', label: 'Custodial Document Booking System' },
  { value: 'dividend_capital_gain_reinvestment', label: 'Dividend and Capital Gain Reinvestment' },
  { value: 'e_delivery', label: 'eDelivery' },
  { value: 'entitlements', label: 'Entitlements' },
  { value: 'forms_document_management', label: 'Forms and Document Management' },
  { value: 'items_for_attention', label: 'Items for Attention' },
  { value: 'lending_solutions', label: 'Lending Solutions' },
  { value: 'mutual_fund_breakpoint_relationships', label: 'Mutual Fund Breakpoint Relationships' },
  { value: 'netxinvestor_id_links', label: 'NetXInvestor ID Links' },
  { value: 'restrictions', label: 'Restrictions' },
  { value: 'retirement_account_information', label: 'Retirement Account Information' },
  { value: 'securities_lending', label: 'Securities Lending' },
  { value: 'shareholder_communications', label: 'Shareholder Communications' },
  { value: 'statement_groups', label: 'Statement Groups' },
] as const

export type AccountFeatureServiceValue = (typeof ACCOUNT_FEATURE_SERVICE_OPTIONS)[number]['value']

export function getAccountFeatureServiceLabel(value: string): string {
  const found = ACCOUNT_FEATURE_SERVICE_OPTIONS.find((o) => o.value === value)
  return found?.label ?? value
}
