export type PaperworkDeliveryMethod =
  | 'esignature'
  | 'inperson_esignature'
  | 'in_person'
  | 'mail'

export interface EsignEnvelopeSigner {
  id: string
  /** Related-party id for account owner source-of-truth mapping. */
  partyId?: string
  name: string
  email: string
  /** Account-opening children this signer should sign for. */
  accountChildIds?: string[]
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
  /** Browser object URL for in-app preview (session-only). */
  previewUrl?: string
  mimeType?: string
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
