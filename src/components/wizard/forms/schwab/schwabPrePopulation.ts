import type { RelatedParty } from '@/types/workflow'
import { teamMembers } from '@/data/teamMembers'

interface SupportingDocInstance {
  id: string
  docTypeId: string
  fileName?: string
  subType?: string
}

/**
 * Prototype-only fake ID metadata derived from a filename. Real production
 * would parse the document via OCR / KYC vendor; here we generate plausible
 * values so downstream forms feel pre-filled.
 */
export interface DocumentDerivedIdentity {
  idType?: string
  idNumber?: string
  idCountry?: string
  idState?: string
  idIssueDate?: string
  idExpirationDate?: string
  /** Filename of the uploaded doc that produced this identity (audit trail). */
  sourceFileName?: string
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function inferIdTypeFromDoc(doc: SupportingDocInstance): string | undefined {
  const sub = (doc.subType ?? '').toLowerCase()
  const name = (doc.fileName ?? '').toLowerCase()
  if (sub.includes('passport') || name.includes('passport')) return 'Passport'
  if (sub.includes('driver') || name.includes('driver') || name.includes('dl')) return "Driver's License"
  if (sub.includes('state') || name.includes('state-id') || name.includes('stateid')) return "Gov't-Issued ID"
  if (sub.includes('permanent-resident') || name.includes('green-card')) return "Gov't-Issued ID"
  if (sub.includes('other-government-id')) return "Gov't-Issued ID"
  return undefined
}

const US_STATES = [
  'CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'MA', 'CO', 'GA', 'AZ',
] as const

function fakeIdentityFromDoc(doc: SupportingDocInstance): DocumentDerivedIdentity {
  const seed = hashString(doc.fileName ?? doc.id ?? 'doc')
  const today = new Date()
  const issueYear = today.getFullYear() - (3 + (seed % 7))
  const issue = new Date(issueYear, seed % 12, 1 + (seed % 27))
  const exp = new Date(issue.getFullYear() + 8, issue.getMonth(), issue.getDate())
  const idType = inferIdTypeFromDoc(doc) ?? "Driver's License"
  const isPassport = idType === 'Passport'
  const number = isPassport
    ? `${String.fromCharCode(65 + (seed % 26))}${(100000000 + (seed % 899999999))}`
    : `${String.fromCharCode(65 + (seed % 26))}${100000 + (seed % 8999999)}`
  return {
    idType,
    idNumber: number,
    idCountry: 'United States',
    idState: isPassport ? '' : US_STATES[seed % US_STATES.length],
    idIssueDate: issue.toISOString().slice(0, 10),
    idExpirationDate: exp.toISOString().slice(0, 10),
    sourceFileName: doc.fileName,
  }
}

/**
 * Find the first uploaded supporting-document instance across the supplied
 * task-data bag (keyed `doc-instances-*`) and derive a fake identity from it.
 * Returns undefined when no documents have been uploaded yet.
 */
export function deriveIdentityFromUploadedDocs(
  openAccountsTaskData: Record<string, unknown> | undefined,
): DocumentDerivedIdentity | undefined {
  if (!openAccountsTaskData) return undefined
  for (const key of Object.keys(openAccountsTaskData)) {
    if (!key.startsWith('doc-instances-')) continue
    const instances = openAccountsTaskData[key] as SupportingDocInstance[] | undefined
    if (!Array.isArray(instances)) continue
    const uploaded = instances.find((i) => i?.fileName)
    if (uploaded) return fakeIdentityFromDoc(uploaded)
  }
  return undefined
}

/** Snapshot of workflow-state values that should pre-populate Schwab forms. */
export interface SchwabPrefill {
  // Account holder (first selected owner if any, else primary household member)
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  ssn?: string
  dob?: string
  preferredName?: string
  // Home / legal address
  homeStreet?: string
  homeCity?: string
  homeState?: string
  homeZip?: string
  homeCountry?: string
  // Mailing address
  mailingStreet?: string
  mailingCity?: string
  mailingState?: string
  mailingZip?: string
  mailingCountry?: string
  // Contact
  phone?: string
  mobile?: string
  workNumber?: string
  workExtension?: string
  email?: string
  mothersMaidenName?: string
  // Citizenship / legal residence
  citizenshipUsa?: boolean
  citizenshipOther?: string
  legalResidenceCountry?: string
  // Identification
  idType?: string
  idNumber?: string
  idCountry?: string
  idState?: string
  idIssueDate?: string
  idExpirationDate?: string
  // Employment
  employmentStatus?: string
  occupation?: string
  occupationOther?: string
  employerName?: string
  businessStreet?: string
  businessCity?: string
  businessState?: string
  businessZip?: string
  businessCountry?: string
  // Affiliations
  finraAffiliation?: string
  finraCompanyName?: string
  controlPerson?: string
  controlPersonCompanyName?: string
  controlPersonSymbol?: string

  // Additional account holder (joint/co-owner) — second selected owner if any
  additional?: SchwabPrefill

  // Trusted contact — derived from first trusted-contact related party if any
  trustedContact?: {
    firstName?: string
    lastName?: string
    relationship?: string
    phone?: string
    email?: string
  }

  // Advisor (IA) cover-section values
  advisor?: {
    firmName?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    masterAccountNumber?: string
    serviceTeam?: string
  }

  // For transfer-of-account form when category = link-existing
  transfer?: {
    deliveringFirmName?: string
    deliveringAccountNumber?: string
    deliveringAccountType?: string
  }
}

function pickPartyForOwner(parties: RelatedParty[]): RelatedParty | undefined {
  return (
    parties.find((p) => p.isPrimary && p.type === 'household_member') ??
    parties.find((p) => p.type === 'household_member') ??
    parties[0]
  )
}

function partyToPrefill(party: RelatedParty | undefined): SchwabPrefill {
  if (!party) return {}
  const profile = party.accountOwnerIndividual ?? {}
  const nameParts = (party.name ?? '').split(' ').filter(Boolean)
  const firstName = party.firstName ?? nameParts[0]
  const lastName = party.lastName ?? nameParts.slice(-1)[0]
  return {
    firstName,
    middleName: profile.middleName,
    lastName,
    suffix: profile.suffix,
    ssn: party.ssn ?? party.taxId,
    dob: party.dob,
    homeStreet: profile.legalStreet,
    homeCity: profile.legalCity,
    homeState: profile.legalState,
    homeZip: profile.legalZip,
    homeCountry: profile.legalCountry,
    mailingStreet: profile.mailingSameAsLegal ? profile.legalStreet : profile.mailingStreet,
    mailingCity: profile.mailingSameAsLegal ? profile.legalCity : profile.mailingCity,
    mailingState: profile.mailingSameAsLegal ? profile.legalState : profile.mailingState,
    mailingZip: profile.mailingSameAsLegal ? profile.legalZip : profile.mailingZip,
    mailingCountry: profile.mailingSameAsLegal ? profile.legalCountry : profile.mailingCountry,
    phone: party.phone,
    email: party.email,
    employmentStatus: profile.employmentStatus,
    occupation: profile.occupation,
    employerName: profile.employerName,
    idType: profile.kycIdType,
    idNumber: profile.kycIdNumber,
    idState: profile.kycIdState,
    idExpirationDate: profile.kycIdExpiration,
    finraAffiliation: profile.bdAffiliation === 'yes' ? 'Yes' : profile.bdAffiliation ? 'No' : undefined,
    controlPerson: profile.controlPerson === 'yes' ? 'Yes' : profile.controlPerson ? 'No' : undefined,
  }
}

/** Derive pre-fill from current workflow state. Caller passes selected-owner IDs when known. */
export function buildSchwabPrefill(args: {
  relatedParties: RelatedParty[]
  selectedOwnerPartyIds?: string[]
  investmentProfessionalId?: string
  clientInfo?: Record<string, unknown>
  documentIdentity?: DocumentDerivedIdentity
}): SchwabPrefill {
  const { relatedParties, selectedOwnerPartyIds, investmentProfessionalId, clientInfo, documentIdentity } = args

  let primaryParty: RelatedParty | undefined
  let secondaryParty: RelatedParty | undefined
  if (selectedOwnerPartyIds && selectedOwnerPartyIds.length) {
    primaryParty = relatedParties.find((p) => p.id === selectedOwnerPartyIds[0])
    secondaryParty = selectedOwnerPartyIds[1]
      ? relatedParties.find((p) => p.id === selectedOwnerPartyIds[1])
      : undefined
  }
  if (!primaryParty) primaryParty = pickPartyForOwner(relatedParties)

  const primary = partyToPrefill(primaryParty)

  // Pull client-info form data if present (covers cases before any owner is picked)
  if (clientInfo) {
    primary.firstName = primary.firstName ?? (clientInfo.firstName as string | undefined)
    primary.lastName = primary.lastName ?? (clientInfo.lastName as string | undefined)
    primary.email = primary.email ?? (clientInfo.email as string | undefined)
    primary.phone = primary.phone ?? (clientInfo.phone as string | undefined)
    primary.dob = primary.dob ?? (clientInfo.dob as string | undefined)
    primary.ssn = primary.ssn ?? (clientInfo.ssn as string | undefined)
  }

  // Doc-derived identity wins over party-profile ID fields — the operator just
  // uploaded a fresh document; treat it as authoritative for the prototype.
  if (documentIdentity) {
    primary.idType = documentIdentity.idType ?? primary.idType
    primary.idNumber = documentIdentity.idNumber ?? primary.idNumber
    primary.idCountry = documentIdentity.idCountry ?? primary.idCountry
    primary.idState = documentIdentity.idState ?? primary.idState
    primary.idIssueDate = documentIdentity.idIssueDate ?? primary.idIssueDate
    primary.idExpirationDate = documentIdentity.idExpirationDate ?? primary.idExpirationDate
  }

  const additional = secondaryParty ? partyToPrefill(secondaryParty) : undefined

  // Trusted contact — first related contact with a trusted-contact-ish role
  const trustedContactParty = relatedParties.find(
    (p) =>
      p.type === 'related_contact' &&
      (p.role?.toLowerCase().includes('trusted') ||
        p.relationship?.toLowerCase().includes('trusted')),
  )
  const trustedContact = trustedContactParty
    ? {
        firstName: trustedContactParty.firstName ?? trustedContactParty.name?.split(' ')[0],
        lastName: trustedContactParty.lastName ?? trustedContactParty.name?.split(' ').slice(-1)[0],
        relationship: trustedContactParty.relationship,
        phone: trustedContactParty.phone,
        email: trustedContactParty.email,
      }
    : undefined

  const advisorMember = teamMembers.find((m) => m.id === investmentProfessionalId)
  const advisor = advisorMember
    ? {
        firmName: 'Ocean Capital',
        contactName: advisorMember.name,
        contactEmail: `${advisorMember.id}@oceancapital.com`,
        contactPhone: '',
        masterAccountNumber: advisorMember.rrCode,
        serviceTeam: advisorMember.teamCode,
      }
    : undefined

  return { ...primary, additional, trustedContact, advisor }
}
