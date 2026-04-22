import type { DirectoryPerson } from '@/data/people-directory'
import type { AccountOwnerIndividualProfile, RelatedParty } from '@/types/workflow'

export const EMPLOYMENT_STATUSES = ['Employed', 'Self-employed', 'Retired', 'Unemployed'] as const

export const NAME_SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'Esq.'] as const

export const INCOME_RANGES = [
  'Under $25,000',
  '$25,000–$49,999',
  '$50,000–$99,999',
  '$100,000–$249,999',
  '$250,000–$499,999',
  '$500,000–$999,999',
  '$1,000,000+',
] as const

export const NET_WORTH_RANGES = [
  'Under $100,000',
  '$100,000–$249,999',
  '$250,000–$499,999',
  '$500,000–$999,999',
  '$1M–$2M',
  'Over $2M',
] as const

export const LIQUID_NET_WORTH_RANGES = [
  'Under $50,000',
  '$50,000–$99,999',
  '$100,000–$249,999',
  '$250,000–$499,999',
  '$500,000+',
] as const

export const INVESTMENT_OBJECTIVES = [
  'Income',
  'Growth',
  'Capital preservation',
  'Speculation',
] as const

export const RISK_TOLERANCES = ['Conservative', 'Moderate', 'Aggressive'] as const

export const TIME_HORIZONS = ['Less than 3 years', '3–7 years', '7–15 years', '15+ years'] as const

export const YES_NO = ['Yes', 'No'] as const

export const PEP_OPTIONS = ['Yes', 'No', 'Not applicable'] as const

/** Full in-form state including top-level party fields edited in the sheet. */
export type IndividualAccountOwnerFormState = {
  firstName: string
  lastName: string
  middleName: string
  suffix: string
  dob: string
  taxId: string
  relationship: string
  role: string
  email: string
  phone: string
} & Required<
  Pick<
    AccountOwnerIndividualProfile,
    | 'legalStreet'
    | 'legalApt'
    | 'legalCity'
    | 'legalState'
    | 'legalZip'
    | 'legalCountry'
    | 'mailingSameAsLegal'
    | 'mailingStreet'
    | 'mailingApt'
    | 'mailingCity'
    | 'mailingState'
    | 'mailingZip'
    | 'mailingCountry'
    | 'employmentStatus'
    | 'employerName'
    | 'occupation'
    | 'industry'
    | 'annualIncomeRange'
    | 'netWorthRange'
    | 'liquidNetWorthRange'
    | 'sourceOfFunds'
    | 'investmentObjective'
    | 'riskTolerance'
    | 'timeHorizon'
    | 'investmentExperience'
    | 'controlPerson'
    | 'bdAffiliation'
    | 'familyAffiliation'
    | 'pep'
    | 'insiderRule144'
    | 'trustedContactName'
    | 'trustedContactRelationship'
    | 'trustedContactPhoneEmail'
  >
>

export function createEmptyIndividualAccountOwnerForm(): IndividualAccountOwnerFormState {
  return {
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    dob: '',
    taxId: '',
    relationship: '',
    role: '',
    email: '',
    phone: '',
    legalStreet: '',
    legalApt: '',
    legalCity: '',
    legalState: '',
    legalZip: '',
    legalCountry: '',
    mailingSameAsLegal: true,
    mailingStreet: '',
    mailingApt: '',
    mailingCity: '',
    mailingState: '',
    mailingZip: '',
    mailingCountry: '',
    employmentStatus: '',
    employerName: '',
    occupation: '',
    industry: '',
    annualIncomeRange: '',
    netWorthRange: '',
    liquidNetWorthRange: '',
    sourceOfFunds: '',
    investmentObjective: '',
    riskTolerance: '',
    timeHorizon: '',
    investmentExperience: '',
    controlPerson: '',
    bdAffiliation: '',
    familyAffiliation: '',
    pep: '',
    insiderRule144: '',
    trustedContactName: '',
    trustedContactRelationship: '',
    trustedContactPhoneEmail: '',
  }
}

function applyAccountOwnerIndividualProfileToForm(
  base: IndividualAccountOwnerFormState,
  ext: Partial<AccountOwnerIndividualProfile>,
): IndividualAccountOwnerFormState {
  return {
    ...base,
    middleName: ext.middleName ?? '',
    suffix: ext.suffix ?? '',
    legalStreet: ext.legalStreet ?? '',
    legalApt: ext.legalApt ?? '',
    legalCity: ext.legalCity ?? '',
    legalState: ext.legalState ?? '',
    legalZip: ext.legalZip ?? '',
    legalCountry: ext.legalCountry ?? '',
    mailingSameAsLegal: ext.mailingSameAsLegal !== false,
    mailingStreet: ext.mailingStreet ?? '',
    mailingApt: ext.mailingApt ?? '',
    mailingCity: ext.mailingCity ?? '',
    mailingState: ext.mailingState ?? '',
    mailingZip: ext.mailingZip ?? '',
    mailingCountry: ext.mailingCountry ?? '',
    employmentStatus: ext.employmentStatus ?? '',
    employerName: ext.employerName ?? '',
    occupation: ext.occupation ?? '',
    industry: ext.industry ?? '',
    annualIncomeRange: ext.annualIncomeRange ?? '',
    netWorthRange: ext.netWorthRange ?? '',
    liquidNetWorthRange: ext.liquidNetWorthRange ?? '',
    sourceOfFunds: ext.sourceOfFunds ?? '',
    investmentObjective: ext.investmentObjective ?? '',
    riskTolerance: ext.riskTolerance ?? '',
    timeHorizon: ext.timeHorizon ?? '',
    investmentExperience: ext.investmentExperience ?? '',
    controlPerson: ext.controlPerson ?? '',
    bdAffiliation: ext.bdAffiliation ?? '',
    familyAffiliation: ext.familyAffiliation ?? '',
    pep: ext.pep ?? '',
    insiderRule144: ext.insiderRule144 ?? '',
    trustedContactName: ext.trustedContactName ?? '',
    trustedContactRelationship: ext.trustedContactRelationship ?? '',
    trustedContactPhoneEmail: ext.trustedContactPhoneEmail ?? '',
  }
}

/** Seed full account-owner form state from a directory search hit (same shape as Create New for owners). */
export function hydrateIndividualFormFromDirectoryPerson(person: DirectoryPerson): IndividualAccountOwnerFormState {
  const base = createEmptyIndividualAccountOwnerForm()
  const withProfile = applyAccountOwnerIndividualProfileToForm(base, person.accountOwnerProfile ?? {})
  return {
    ...withProfile,
    firstName: person.firstName ?? '',
    lastName: person.lastName ?? '',
    email: person.email ?? '',
    phone: person.phone ?? '',
    dob: person.dob ?? '',
    taxId: person.taxId ?? person.ssn ?? '',
  }
}

export function hydrateIndividualFormFromParty(p: RelatedParty): IndividualAccountOwnerFormState {
  const base = createEmptyIndividualAccountOwnerForm()
  const ext = p.accountOwnerIndividual ?? {}
  const withProfile = applyAccountOwnerIndividualProfileToForm(base, ext)
  return {
    ...withProfile,
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    dob: p.dob ?? '',
    taxId: p.taxId ?? '',
    relationship: p.relationship ?? '',
    role: p.role ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
  }
}

function trimOrUndef(s: string): string | undefined {
  const t = s.trim()
  return t === '' ? undefined : t
}

export function buildIndividualDisplayName(s: IndividualAccountOwnerFormState): string {
  const parts = [s.firstName.trim(), s.middleName.trim(), s.lastName.trim()].filter(Boolean)
  let name = parts.join(' ')
  if (s.suffix.trim()) name = `${name} ${s.suffix.trim()}`.trim()
  return name
}

export function splitFormIntoPartyUpdate(s: IndividualAccountOwnerFormState): {
  top: Pick<
    RelatedParty,
    'firstName' | 'lastName' | 'name' | 'dob' | 'taxId' | 'email' | 'phone' | 'relationship' | 'role'
  >
  accountOwnerIndividual: AccountOwnerIndividualProfile
} {
  const profile: AccountOwnerIndividualProfile = {
    middleName: trimOrUndef(s.middleName),
    suffix: trimOrUndef(s.suffix),
    legalStreet: trimOrUndef(s.legalStreet),
    legalApt: trimOrUndef(s.legalApt),
    legalCity: trimOrUndef(s.legalCity),
    legalState: trimOrUndef(s.legalState),
    legalZip: trimOrUndef(s.legalZip),
    legalCountry: trimOrUndef(s.legalCountry),
    mailingSameAsLegal: s.mailingSameAsLegal,
    mailingStreet: trimOrUndef(s.mailingStreet),
    mailingApt: trimOrUndef(s.mailingApt),
    mailingCity: trimOrUndef(s.mailingCity),
    mailingState: trimOrUndef(s.mailingState),
    mailingZip: trimOrUndef(s.mailingZip),
    mailingCountry: trimOrUndef(s.mailingCountry),
    employmentStatus: trimOrUndef(s.employmentStatus),
    employerName: trimOrUndef(s.employerName),
    occupation: trimOrUndef(s.occupation),
    industry: trimOrUndef(s.industry),
    annualIncomeRange: trimOrUndef(s.annualIncomeRange),
    netWorthRange: trimOrUndef(s.netWorthRange),
    liquidNetWorthRange: trimOrUndef(s.liquidNetWorthRange),
    sourceOfFunds: trimOrUndef(s.sourceOfFunds),
    investmentObjective: trimOrUndef(s.investmentObjective),
    riskTolerance: trimOrUndef(s.riskTolerance),
    timeHorizon: trimOrUndef(s.timeHorizon),
    investmentExperience: trimOrUndef(s.investmentExperience),
    controlPerson: trimOrUndef(s.controlPerson),
    bdAffiliation: trimOrUndef(s.bdAffiliation),
    familyAffiliation: trimOrUndef(s.familyAffiliation),
    pep: trimOrUndef(s.pep),
    insiderRule144: trimOrUndef(s.insiderRule144),
    trustedContactName: trimOrUndef(s.trustedContactName),
    trustedContactRelationship: trimOrUndef(s.trustedContactRelationship),
    trustedContactPhoneEmail: trimOrUndef(s.trustedContactPhoneEmail),
  }

  return {
    top: {
      firstName: s.firstName.trim(),
      lastName: s.lastName.trim(),
      name: buildIndividualDisplayName(s),
      dob: trimOrUndef(s.dob),
      taxId: trimOrUndef(s.taxId),
      email: trimOrUndef(s.email),
      phone: trimOrUndef(s.phone),
      relationship: trimOrUndef(s.relationship),
      role: trimOrUndef(s.role),
    },
    accountOwnerIndividual: profile,
  }
}
