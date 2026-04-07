export type PaperworkDeliveryMethod =
  | 'esignature'
  | 'inperson_esignature'
  | 'in_person'
  | 'mail'

export interface EsignEnvelopeSigner {
  id: string
  name: string
  email: string
}

/** One generated firm/custodian form row (grouped by account in the UI). */
export interface EnvelopeFormSelection {
  formId: string
  label: string
  /** Stable key for grouping — one open-account child workflow. */
  accountChildId: string
  /** Account line label from Open Accounts (e.g. registration row name). Omitted on older saved envelopes. */
  accountOpeningName?: string
  /** Display: assigned account #, else short name, else placeholder. */
  accountNumberLabel: string
  /** Registration-required firm/custodian form — checkbox always on, read-only. */
  required: boolean
  included: boolean
}

export interface EnvelopeUploadedFile {
  id: string
  fileName: string
  /** When true, advisor will map fields and signature tabs manually in the e-sign tool. */
  manualFieldMapping: boolean
}

export interface EsignEnvelope {
  id: string
  name: string
  deliveryMethod: PaperworkDeliveryMethod
  templateId?: string
  /** Required + generated forms per account (required rows are locked on). */
  formSelections: EnvelopeFormSelection[]
  /** Optional add-on forms from the catalog (checkbox). */
  optionalFormIdsIncluded: string[]
  uploadedFiles: EnvelopeUploadedFile[]
  signers: EsignEnvelopeSigner[]
  createdAt: string
}
