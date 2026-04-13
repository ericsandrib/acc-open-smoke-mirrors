import type { DocumentRequirement } from './accountDocuments'
import pasData from '../data/pasRequiredDocuments.json'

type PasRegistrationEntry =
  | (typeof pasData.registration_types.personal_accounts)[number]
  | (typeof pasData.registration_types.entity_accounts)[number]

export type RegistrationType = PasRegistrationEntry['id']

export const registrationTypeLabels: Record<RegistrationType, string> = (() => {
  const out = {} as Record<RegistrationType, string>
  for (const e of pasData.registration_types.personal_accounts) {
    out[e.id] = e.label
  }
  for (const e of pasData.registration_types.entity_accounts) {
    out[e.id] = e.label
  }
  return out
})()

export const registrationTypeDescriptions: Record<RegistrationType, string> = (() => {
  const out = {} as Record<RegistrationType, string>
  for (const e of pasData.registration_types.personal_accounts) {
    out[e.id] = e.notes ?? ''
  }
  for (const e of pasData.registration_types.entity_accounts) {
    out[e.id] = e.notes ?? ''
  }
  return out
})()

export interface DocumentSubType {
  value: string
  label: string
}

/** `upload` = client supplies a file; `esign` = firm/custodian form populated in the e-sign workflow (not uploaded here). */
export type DocumentFulfillment = 'upload' | 'esign'

export interface DocumentRequirementWithSubTypes extends DocumentRequirement {
  subTypes?: DocumentSubType[]
  fulfillment?: DocumentFulfillment
}

/** Stable id for merged CIP lines that require government-issued ID. */
export const GOVERNMENT_ISSUED_ID_DOC_ID = 'cip-government-issued-id'

export const GOVERNMENT_ID_SUBTYPES: DocumentSubType[] = [
  { value: 'drivers-license', label: "Driver's license" },
  { value: 'passport', label: 'Passport' },
  { value: 'state-id', label: 'State ID card' },
  { value: 'military-id', label: 'Military ID' },
  { value: 'global-entry', label: 'Global Entry card' },
  { value: 'other', label: 'Other government-issued photo ID' },
]

function isGovernmentIssuedIdCipLine(text: string): boolean {
  return /government\s*issued\s*id/i.test(text)
}

function governmentIssuedIdRequirement(): DocumentRequirementWithSubTypes {
  return {
    id: GOVERNMENT_ISSUED_ID_DOC_ID,
    label: 'Government-issued ID',
    description:
      'Upload a legible copy of one ID. Choose the document type you are providing (passport, driver\'s license, etc.).',
    subTypes: GOVERNMENT_ID_SUBTYPES,
    fulfillment: 'upload',
  }
}

export function partitionRegistrationDocumentsByFulfillment(
  docs: DocumentRequirementWithSubTypes[],
): { upload: DocumentRequirementWithSubTypes[]; esign: DocumentRequirementWithSubTypes[] } {
  const upload: DocumentRequirementWithSubTypes[] = []
  const esign: DocumentRequirementWithSubTypes[] = []
  for (const d of docs) {
    if (d.fulfillment === 'esign') esign.push(d)
    else upload.push(d)
  }
  return { upload, esign }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'req'
}

function findRegistrationEntry(type: RegistrationType): PasRegistrationEntry | undefined {
  return (
    pasData.registration_types.personal_accounts.find((e) => e.id === type) ??
    pasData.registration_types.entity_accounts.find((e) => e.id === type)
  )
}

type PasFormRow = {
  name: string
  index_code: string | null
  esignature_platform: string
  pershing_form: boolean
  conditional: string | null
}

function formToRequirement(f: PasFormRow): DocumentRequirementWithSubTypes {
  const id = f.index_code ? `form-${f.index_code}` : `form-${slugify(f.name)}`
  const parts: string[] = [
    'Completed in the e-sign experience; application data is mapped onto this form automatically—no upload here.',
  ]
  if (f.conditional) parts.push(String(f.conditional))
  parts.push(`E-signature: ${f.esignature_platform}`)
  if (f.pershing_form) parts.push('Pershing form for on-platform accounts.')
  return {
    id,
    label: f.name,
    description: parts.join(' '),
    fulfillment: 'esign',
  }
}

function cipToRequirement(text: string, index: number): DocumentRequirementWithSubTypes {
  const base = slugify(text)
  let description = 'Client-provided supporting documentation (upload).'
  // PAS CIP line — title + signature pages; not the same row as the full “Executed Trust Agreement” e-sign form.
  if (/trust instrument/i.test(text)) {
    description =
      'Title and signature pages from the governing trust instrument (CIP). Separate from the full executed trust agreement when that is satisfied via e-sign forms.'
  }
  return {
    id: `cip-${base}-${index}`,
    label: text,
    description,
    fulfillment: 'upload',
  }
}

function mergeDocs(list: DocumentRequirementWithSubTypes[]): DocumentRequirementWithSubTypes[] {
  const byId = new Map<string, DocumentRequirementWithSubTypes>()
  for (const d of list) {
    if (!byId.has(d.id)) byId.set(d.id, d)
  }
  return Array.from(byId.values())
}

export function getDocSubTypes(docId: string): DocumentSubType[] {
  if (docId === GOVERNMENT_ISSUED_ID_DOC_ID) return GOVERNMENT_ID_SUBTYPES
  return []
}

export function getRegistrationDocumentsForType(type: RegistrationType): DocumentRequirementWithSubTypes[] {
  const entry = findRegistrationEntry(type)
  if (!entry) return []

  const list: DocumentRequirementWithSubTypes[] = []

  if (entry.category === 'personal') {
    for (const f of pasData.global_requirements.forms) {
      list.push(formToRequirement(f))
    }
  }

  for (const f of entry.required_forms) {
    list.push(formToRequirement(f))
  }

  let govIdAdded = false
  let cipUploadIndex = 0
  for (const cip of entry.cip_requirements) {
    if (isGovernmentIssuedIdCipLine(cip)) {
      if (!govIdAdded) {
        list.push(governmentIssuedIdRequirement())
        govIdAdded = true
      }
      continue
    }
    list.push(cipToRequirement(cip, cipUploadIndex))
    cipUploadIndex += 1
  }

  return mergeDocs(list)
}

export function getRegistrationDocuments(registrationTypes: RegistrationType[]): DocumentRequirementWithSubTypes[] {
  const list: DocumentRequirementWithSubTypes[] = []
  for (const type of registrationTypes) {
    list.push(...getRegistrationDocumentsForType(type))
  }
  return mergeDocs(list)
}
