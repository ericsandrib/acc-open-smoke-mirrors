import type { RegistrationType } from '@/utils/registrationDocuments'
import { registrationTypeLabels } from '@/utils/registrationDocuments'
import { SEI_ACCOUNT_TYPES } from '@/data/sei/seiAccountTypes'

/**
 * Custodian drives the whole account-opening experience: which account types are
 * offered, which forms render, and — later — whether investment selection /
 * funding / personalization are hosted by the custodian (SEI, via deeplink) or
 * rendered natively in Avantos (Schwab / Fidelity, which have no such ecosystem).
 */
export type Custodian = 'sei' | 'schwab' | 'fidelity'

export interface CustodianOption {
  value: Custodian
  label: string
  /** 'api' = native API rail (SEI DAO). 'forms' = forms-based (built in Avantos, later). */
  rail: 'api' | 'forms'
  /** Whether this custodian's account-open experience is wired up in the demo yet. */
  available: boolean
  note?: string
}

export const CUSTODIAN_OPTIONS: CustodianOption[] = [
  { value: 'sei', label: 'SEI', rail: 'api', available: true, note: 'Digital Account Open (API)' },
  { value: 'schwab', label: 'Schwab', rail: 'forms', available: false, note: 'Forms-based — coming soon' },
  { value: 'fidelity', label: 'Fidelity', rail: 'forms', available: false, note: 'Forms-based — coming soon' },
]

export const CUSTODIAN_LABELS: Record<Custodian, string> = {
  sei: 'SEI',
  schwab: 'Schwab',
  fidelity: 'Fidelity',
}

/** Registration types offered on the forms-based (Schwab/Fidelity) rail, for now
 *  the full prototype catalog. Their custodian-specific forms are built later. */
const FORMS_RAIL_REGISTRATIONS = Object.keys(registrationTypeLabels) as RegistrationType[]

export interface AccountTypeOption {
  /** Stable value used in the picker. For SEI = the SEI account type id; otherwise = the registration type. */
  value: string
  label: string
  /** Canonical downstream registration key — always a valid RegistrationType. */
  registrationType: RegistrationType
  /** Present for SEI selections only. */
  seiAccountType?: string
}

/** Account-type options for a custodian — SEI shows its 27-type taxonomy;
 *  forms-based custodians show the prototype registration catalog. */
export function getAccountTypeOptionsForCustodian(custodian: Custodian): AccountTypeOption[] {
  if (custodian === 'sei') {
    return SEI_ACCOUNT_TYPES.map((t) => ({
      value: t.seiAccountType,
      label: t.label,
      registrationType: t.registrationType,
      seiAccountType: t.seiAccountType,
    }))
  }
  return FORMS_RAIL_REGISTRATIONS.map((rt) => ({
    value: rt,
    label: registrationTypeLabels[rt],
    registrationType: rt,
  }))
}
