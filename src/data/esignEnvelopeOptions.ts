import type { PaperworkDeliveryMethod } from '@/types/esignEnvelope'

export type { PaperworkDeliveryMethod }

export const PAPERWORK_DELIVERY_OPTIONS: { value: PaperworkDeliveryMethod; label: string }[] = [
  { value: 'esignature', label: 'eSignature' },
  { value: 'inperson_esignature', label: 'In-person eSignature' },
  { value: 'in_person', label: 'In person' },
  { value: 'mail', label: 'Mail' },
]

/** Optional forms that can be added beyond registration-required firm/custodian forms. */
export const OPTIONAL_ESIGN_FORM_CATALOG = [
  { id: 'opt-loa', label: 'Letter of Authorization (LOA)' },
  { id: 'opt-fee-disclosure', label: 'Fee disclosure addendum' },
  { id: 'opt-privacy', label: 'Privacy policy acknowledgment' },
  { id: 'opt-trusted-contact', label: 'Trusted contact designation' },
  { id: 'opt-margin-supplement', label: 'Margin agreement supplement' },
  { id: 'opt-options-supplement', label: 'Options agreement supplement' },
  { id: 'opt-alternative-strategy-selection', label: 'Alternative Strategy Selection form' },
] as const
