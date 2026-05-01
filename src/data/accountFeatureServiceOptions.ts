/** Optional account-level elections captured on the parent account (`featureRequests`). */
export const ACCOUNT_EMBEDDED_FEATURE_VALUES = ['margin', 'options', 'alternative_strategy_selection'] as const

/** Account features & services — administrative, setup, or lifecycle (not transactional movements). */
export const ACCOUNT_FEATURE_SERVICE_OPTIONS = [
  { value: 'corestone_agreement_checking_accounts', label: 'Corestone Agreement — Checking Accounts' },
  { value: 'edelivery', label: 'eDelivery' },
  { value: 'margin', label: 'Margin' },
  { value: 'options', label: 'Options' },
  { value: 'selectlink_statement_consolidation', label: 'SelectLink (Statement Consolidation)' },
  {
    value: 'changes_to_accounts_held_directly_with_third_party_asset_managers',
    label: 'Changes to Accounts held Directly with Third Party Asset Managers',
  },
  { value: 'alternative_strategy_selection', label: 'Alternative Strategy Selection' },
  {
    value: 'advisory_on_platform_source_of_funds_household_billing',
    label: 'Advisory On-Platform: Source of Funds Form, Household Billing Form',
  },
  {
    value: 'advisory_off_platform_source_of_funds_alternate_strategy_selection',
    label: 'Advisory Off-Platform: Source of Funds Form, Alternate Strategy Selection Form',
  },
  { value: 'power_of_attorney', label: 'Power of Attorney' },
  { value: 'check_image_direct_third_party', label: 'Check Image (Direct & Third Party)' },
  { value: 'name_change', label: 'Name Change' },
  { value: 'change_of_rr_iar', label: 'Change of RR/IAR' },
  { value: 'annuity_application_supporting_docs', label: 'Annuity Application and Supporting Docs' },
  { value: 'eoi_suitability_questionnaire', label: 'EOI and Suitability Questionnaire' },
  { value: 'request_to_exchange_investments_switch_letters', label: 'Request to Exchange Investments (Switch Letters)' },
] as const

export type AccountFeatureServiceValue = (typeof ACCOUNT_FEATURE_SERVICE_OPTIONS)[number]['value']

/** Options for spawning **separate** feature/service workflow lines (excludes margin & options). */
export const ACCOUNT_FEATURE_SERVICE_SPAWN_OPTIONS = ACCOUNT_FEATURE_SERVICE_OPTIONS.filter(
  (o) => !(ACCOUNT_EMBEDDED_FEATURE_VALUES as readonly string[]).includes(o.value),
)

export function getAccountFeatureServiceLabel(value: string): string {
  const found = ACCOUNT_FEATURE_SERVICE_OPTIONS.find((o) => o.value === value)
  return found?.label ?? value
}
