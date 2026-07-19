/**
 * Maps an SEI registration id (the `applicationType` written by the picker for
 * custodian = SEI) to one of the 10 SEI form variants (A–J). The mapping is
 * data-driven from `sei_account_types.json`; form display names come from
 * `sei_forms.json`. Both are extracted from SEI's form-analysis workbook.
 */
import accountTypes from './sei_account_types.json'
import forms from './sei_forms.json'
import type { SeiFormLetter } from './seiRegistry'

interface RawAccountType {
  id: string
  label: string
  form: string
  formName: string
  taxQualified: boolean
  notes: string
}

interface RawForm {
  letter: string
  id: string
  name: string
}

const REGISTRATION_TO_FORM: Record<string, SeiFormLetter> = (() => {
  const m: Record<string, SeiFormLetter> = {}
  for (const a of accountTypes as RawAccountType[]) m[a.id] = a.form as SeiFormLetter
  return m
})()

/** Form letter A–J for a registration id, or undefined if unmapped. */
export function getSeiFormForRegistration(registrationId: string | undefined): SeiFormLetter | undefined {
  if (!registrationId) return undefined
  return REGISTRATION_TO_FORM[registrationId]
}

/** Long display name per form letter, e.g. "Form C — Inherited IRA (Trad/Roth)". */
export const SEI_FORM_NAMES: Record<SeiFormLetter, string> = (() => {
  const m = {} as Record<SeiFormLetter, string>
  for (const f of forms as RawForm[]) m[f.letter as SeiFormLetter] = f.name
  return m
})()

/** Short code shown in the form header chip, e.g. "SEI Form C". */
export const SEI_FORM_CODES: Record<SeiFormLetter, string> = (() => {
  const m = {} as Record<SeiFormLetter, string>
  for (const f of forms as RawForm[]) m[f.letter as SeiFormLetter] = `SEI Form ${f.letter}`
  return m
})()

/** All 27 registration ids that map to a form (for validation / iteration). */
export const SEI_REGISTRATION_IDS: string[] = (accountTypes as RawAccountType[]).map((a) => a.id)

/**
 * Owner-slot count for an SEI registration. Joint forms (F) and Tenants in
 * Common (G) allow multiple owners; every other SEI registration is a single
 * owner / single entity. Mirrors the Schwab `schwabMaxOwners` derivation so the
 * shared owner picker doesn't default to the 8-slot entity cap (SEI children
 * carry no `registrationType`).
 */
export function getSeiMaxOwners(registrationId: string | undefined): number {
  const letter = getSeiFormForRegistration(registrationId)
  return letter === 'F' || letter === 'G' ? 2 : 1
}
