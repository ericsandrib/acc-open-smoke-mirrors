/**
 * Static option lists for SEI dropdown / radio / multiselect fields.
 *
 * SEI normally serves these from live reference-data endpoints (see each
 * field's `apiSource`). The prototype has no SEI connectivity, so we supply
 * curated demo lists — exhaustive enough for the driver fields whose values gate
 * conditional rendering (Type of Owner, Fee Payment Method, Investment Program,
 * Taxpayer ID Type, etc.), and representative for the rest.
 */
import type { SeiField } from './seiRegistry'

export interface SeiOption {
  value: string
  label: string
}

const opt = (...labels: string[]): SeiOption[] => labels.map((l) => ({ value: l, label: l }))

export const US_STATES: SeiOption[] = opt(
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
  'WI', 'WY', 'DC',
)

export const COUNTRIES: SeiOption[] = opt(
  'United States', 'Canada', 'Mexico', 'United Kingdom', 'Ireland', 'France', 'Germany', 'Italy',
  'Spain', 'Switzerland', 'India', 'China', 'Japan', 'Australia', 'Brazil', 'Other',
)

const SUFFIXES = opt('Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'MD', 'PhD', 'Esq.')

/** Curated option sets keyed by exact field display label. */
const OPTION_SETS: Record<string, SeiOption[]> = {
  'Type of Owner': opt('Individual (Adult)', 'Individual (Minor)', 'Trust', 'Estate'),
  'Taxpayer ID Type': opt('SSN', 'EIN'),
  'Type of Trust': opt('Revocable', 'Irrevocable'),
  'Marital Status': opt('Single', 'Married', 'Divorced', 'Widowed', 'Domestic Partner'),
  'Account Owner Marital Status': opt('Single', 'Married', 'Divorced', 'Widowed', 'Domestic Partner'),
  'Fee Payment Method': opt('Per Flat Rate', 'Per Fee Schedule', 'Add to Existing Fee Group'),
  'Investment Program': opt(
    'Managed Account',
    'Mutual Fund',
    'Distribution Focused Strategies (DFS)',
    'Custom High Net Worth (CHNW)',
    'Advisor As Portfolio Manager',
  ),
  'Funding Method': opt('ACH', 'Wire', 'Check', 'Transfer / ACAT', 'Journal', 'No Funding at this time'),
  'Distribution Method': opt('ACH', 'Wire', 'Check', 'Reinvest'),
  'Account Statement Frequency': opt('Monthly', 'Quarterly', 'Annually'),
  'Third Party Statement Frequency': opt('Monthly', 'Quarterly', 'Annually'),
  Frequency: opt('One-Time', 'Weekly', 'Monthly', 'Quarterly'),
  'DCA Starts On': opt('Immediately on Receipt of Assets', 'Specific Date'),
  'Schedule By': opt('Total Sum by Target', 'Fixed Contribution'),
  'Beneficiary Type': opt('Spouse', 'Non-Spouse', 'Eligible Designated Beneficiary'),
  'Country of Citizenship': COUNTRIES,
  'Source of Funds': opt(
    'Salary / Wages / Savings',
    'Sale of Property or Business',
    'Inheritance / Gift',
    'Investment Proceeds',
    'Retirement Funds',
    'Other',
  ),
  Suffix: SUFFIXES,
  State: US_STATES,
  Country: COUNTRIES,
}

/** Try to parse an enumerated static `options` string into options. */
function parseOptionsString(raw: string): SeiOption[] | null {
  const s = raw.trim()
  if (!s) return null
  const low = s.toLowerCase()
  if (low.startsWith('dynamic') || low.includes('cannot provide') || low.includes('elasticsearch') || low.includes('reference data')) {
    return null
  }
  // "Static list: A B C" → strip the prefix and split on multi-space.
  const body = s.replace(/^static list:\s*/i, '')
  // Prefer comma/semicolon/slash-delimited lists.
  for (const delim of [',', ';', ' / ', '|']) {
    if (body.includes(delim)) {
      const parts = body.split(delim).map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2 && parts.length <= 30) return opt(...parts)
    }
  }
  return null
}

/** Field labels whose apiField/label imply a US-states list. */
function looksLikeState(field: SeiField): boolean {
  return /\bstate\b/i.test(field.field) && !/statement/i.test(field.field)
}
function looksLikeCountry(field: SeiField): boolean {
  return /\bcountry\b/i.test(field.field)
}

/** Resolve the option list a dropdown/radio/multiselect field should show. */
export function getOptionsFor(field: SeiField): SeiOption[] {
  if (OPTION_SETS[field.field]) return OPTION_SETS[field.field]
  if (looksLikeState(field)) return US_STATES
  if (looksLikeCountry(field)) return COUNTRIES
  const parsed = parseOptionsString(field.options)
  if (parsed) return parsed
  return []
}
