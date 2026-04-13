import type { DocumentRequirement } from './accountDocuments'
import type { RelatedParty } from '@/types/workflow'
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

/** Prefix for per-trustee government ID rows (`${prefix}${TrustPartyRef.id}`). Legacy; merged into {@link GOVERNMENT_ISSUED_ID_DOC_ID} for open accounts. */
export const TRUSTEE_GOVERNMENT_ID_DOC_ID_PREFIX = 'cip-gov-id-trustee-'

/** Single trust CIP upload card: choose document type per row (replaces separate PAS lines). */
export const TRUST_VERIFICATION_DOC_ID = 'cip-trust-verification-bundle'

export const TRUST_VERIFICATION_SUBTYPES: DocumentSubType[] = [
  {
    value: 'cert-or-trust-agreement',
    label: 'Certificate of Trust or Trust Agreement (excerpts or full)',
  },
  {
    value: 'testamentary-probate',
    label: 'Testamentary trust: will and probate evidence',
  },
  {
    value: 'trust-ein-tax-id',
    label: 'Trust EIN / tax ID documentation',
  },
]

export type RegistrationDocumentsOptions = {
  relatedParties?: RelatedParty[]
}

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

function isTrustEntityForTrusteeDocs(p: RelatedParty): boolean {
  if (p.type !== 'related_organization') return false
  if ((p.entityType ?? '').toLowerCase() === 'trust') return true
  if ((p.role ?? '').toLowerCase() === 'trust') return true
  return false
}

/**
 * Household party IDs for trustees listed on trust org(s) the user selected as account owner(s).
 * Only reads `trustParties` from those org records—does not infer from registration type or other trusts in related parties.
 */
export function getTrusteePartyIdsForSelectedTrustOwners(
  relatedParties: RelatedParty[] | undefined,
  selectedOwnerPartyIds: Iterable<string>,
): string[] {
  if (!relatedParties?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const ownerId of selectedOwnerPartyIds) {
    const party = relatedParties.find((p) => p.id === ownerId)
    if (!party || !isTrustEntityForTrusteeDocs(party) || !party.trustParties?.length) continue
    for (const tp of party.trustParties) {
      if (tp.partyId && !seen.has(tp.partyId)) {
        seen.add(tp.partyId)
        out.push(tp.partyId)
      }
    }
  }
  return out
}

/**
 * Deduped party IDs for government ID uploads: **natural-person** account owners (household / related contact)
 * plus trustees from any selected trust legal-entity owner. Legal entities (e.g. a trust LLC) are excluded—CIP for
 * trusts is via trustees; entity-level docs use trust verification and other uploads.
 */
export function getPartyIdsRequiringGovernmentIdUpload(
  relatedParties: RelatedParty[] | undefined,
  accountOwnerPartyIds: Iterable<string>,
): string[] {
  const s = new Set<string>()
  if (relatedParties?.length) {
    for (const id of accountOwnerPartyIds) {
      const party = relatedParties.find((p) => p.id === id)
      if (!party || party.type === 'related_organization') continue
      s.add(id)
    }
  }
  for (const id of getTrusteePartyIdsForSelectedTrustOwners(relatedParties, accountOwnerPartyIds)) {
    s.add(id)
  }
  return Array.from(s)
}

/**
 * Trust legal-entity party IDs among selected account owners. Seeds trust verification uploads (Certificate of
 * Trust, EIN docs, etc.) at the entity level—distinct from trustee government ID rows.
 */
export function getTrustOrganizationIdsForAccountOwners(
  relatedParties: RelatedParty[] | undefined,
  accountOwnerPartyIds: Iterable<string>,
): string[] {
  if (!relatedParties?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of accountOwnerPartyIds) {
    if (seen.has(id)) continue
    const party = relatedParties.find((p) => p.id === id)
    if (!party || !isTrustEntityForTrusteeDocs(party)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/**
 * Party IDs that should have client-upload rows for this document on an account—the same rules as Open Accounts
 * seeding: government ID → natural-person owners and trust trustees (not the trust entity); trust verification →
 * trust legal-entity owner(s); other uploads → all selected account owner parties.
 */
export function getAssigneePartyIdsForClientUploadDoc(
  docId: string,
  relatedParties: RelatedParty[] | undefined,
  accountOwnerPartyIds: Iterable<string>,
): string[] {
  const owners = Array.from(new Set(accountOwnerPartyIds))
  if (docId === GOVERNMENT_ISSUED_ID_DOC_ID) {
    return getPartyIdsRequiringGovernmentIdUpload(relatedParties, accountOwnerPartyIds)
  }
  if (docId === TRUST_VERIFICATION_DOC_ID) {
    return getTrustOrganizationIdsForAccountOwners(relatedParties, accountOwnerPartyIds)
  }
  return owners
}

function trustVerificationBundleRequirement(): DocumentRequirementWithSubTypes {
  return {
    id: TRUST_VERIFICATION_DOC_ID,
    label: 'Trust verification documents',
    description:
      'Trust-related client uploads in one place. Add a row per file and pick the document type (Certificate of Trust or Trust Agreement; testamentary / probate; or trust EIN / tax ID).',
    subTypes: TRUST_VERIFICATION_SUBTYPES,
    fulfillment: 'upload',
  }
}

/** Puts Government-issued ID first (most common accounts), then trust verification, then other uploads. */
export function sortUploadDocumentsForOpenAccounts(
  docs: DocumentRequirementWithSubTypes[],
): DocumentRequirementWithSubTypes[] {
  const order: string[] = [GOVERNMENT_ISSUED_ID_DOC_ID, TRUST_VERIFICATION_DOC_ID]
  const rank = (id: string) => {
    const i = order.indexOf(id)
    return i === -1 ? order.length + 1 : i
  }
  return [...docs].sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label))
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
  // Trust registration — verification options (PAS CIP); trustee ID and trust tax ID may be separate rows.
  if (/certificate of trust|trust agreement/i.test(text)) {
    description =
      'Verify the trust’s legal existence using one of the usual paths: (1) Certificate of Trust (certification or abstract)—a condensed, legally recognized summary that confirms the trust exists and identifies trustee authority without disclosing sensitive beneficiary or asset detail; or (2) Trust Agreement—relevant excerpts (often first and last pages: trust name, effective date, trustee signatures) or the full agreement if your firm or custodian requires it. Distinct from any e-sign “Executed Trust Agreement” package when that fulfillment is electronic.'
  } else if (/testamentary|probate|\bwill\b/i.test(text)) {
    description =
      'Only when the trust was created under a will (testamentary trust): provide the will and evidence it was filed in probate court—such as a court stamp on the will, Letters Testamentary, or comparable court documentation your firm accepts.'
  } else if (/tax id|ein|tax identification/i.test(text)) {
    description =
      'Documentation of the trust’s taxpayer identification number (for example EIN assignment letter, CP 575, or SS-4 acknowledgment), consistent with the trust profile on the account.'
  } else if (/trust instrument/i.test(text)) {
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
  if (docId === TRUST_VERIFICATION_DOC_ID) return TRUST_VERIFICATION_SUBTYPES
  if (docId.startsWith(TRUSTEE_GOVERNMENT_ID_DOC_ID_PREFIX)) return GOVERNMENT_ID_SUBTYPES
  return []
}

export function getRegistrationDocumentsForType(
  type: RegistrationType,
  _options?: RegistrationDocumentsOptions,
): DocumentRequirementWithSubTypes[] {
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

  if (type === 'TRUST') {
    // PAS lists no CIP upload lines for TRUST (trust verification is a separate bundle below), but trustee /
    // owner government ID is still required—Open Accounts merges assignees with trustees from selected trust owners.
    if (!govIdAdded) {
      list.push(governmentIssuedIdRequirement())
    }
    list.push(trustVerificationBundleRequirement())
  }

  return mergeDocs(list)
}

export function getRegistrationDocuments(
  registrationTypes: RegistrationType[],
  relatedParties?: RelatedParty[],
): DocumentRequirementWithSubTypes[] {
  const opts: RegistrationDocumentsOptions | undefined = relatedParties ? { relatedParties } : undefined
  const list: DocumentRequirementWithSubTypes[] = []
  for (const type of registrationTypes) {
    list.push(...getRegistrationDocumentsForType(type, opts))
  }
  return mergeDocs(list)
}
