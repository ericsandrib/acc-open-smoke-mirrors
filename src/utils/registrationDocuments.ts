import type { DocumentRequirement } from './accountDocuments'

export type RegistrationType =
  | 'individual'
  | 'joint_tenants'
  | 'tenants_in_common'
  | 'community_property'
  | 'transfer_on_death'
  | 'custodial_utma'
  | 'sole_proprietor'
  | 'corporate'
  | 'partnership'
  | 'llc'
  | 'trust_revocable'
  | 'trust_irrevocable'
  | 'estate'
  | 'nonprofit'

export const registrationTypeLabels: Record<RegistrationType, string> = {
  individual: 'Individual',
  joint_tenants: 'Joint Tenants with Rights of Survivorship (JTWROS)',
  tenants_in_common: 'Tenants in Common (TIC)',
  community_property: 'Community Property',
  transfer_on_death: 'Transfer on Death (TOD)',
  custodial_utma: 'Custodial (UTMA/UGMA)',
  sole_proprietor: 'Sole Proprietor',
  corporate: 'Corporate',
  partnership: 'Partnership',
  llc: 'Limited Liability Company (LLC)',
  trust_revocable: 'Revocable Living Trust',
  trust_irrevocable: 'Irrevocable Trust',
  estate: 'Estate',
  nonprofit: 'Non-Profit / Charitable Organization',
}

export const registrationTypeDescriptions: Record<RegistrationType, string> = {
  individual: 'A single owner with full control of the account.',
  joint_tenants: 'Two or more owners with equal rights; ownership passes to surviving owners.',
  tenants_in_common: 'Two or more owners with defined shares; ownership passes to each owner\'s estate.',
  community_property: 'Married spouses in a community-property state with equal ownership.',
  transfer_on_death: 'Individual or joint account with named beneficiaries who inherit upon death.',
  custodial_utma: 'Adult custodian manages assets on behalf of a minor under the Uniform Transfers to Minors Act.',
  sole_proprietor: 'Business account for an unincorporated single-owner business.',
  corporate: 'Account owned by a corporation; requires corporate resolution.',
  partnership: 'Account owned by a general or limited partnership.',
  llc: 'Account owned by a limited liability company.',
  trust_revocable: 'Trust that can be amended or revoked by the grantor during their lifetime.',
  trust_irrevocable: 'Trust that generally cannot be modified once established.',
  estate: 'Account held on behalf of a decedent\'s estate by the executor or administrator.',
  nonprofit: 'Account for a 501(c)(3) or other tax-exempt charitable organization.',
}

export interface DocumentSubType {
  value: string
  label: string
}

export interface DocumentRequirementWithSubTypes extends DocumentRequirement {
  subTypes?: DocumentSubType[]
}

const ALL_REGISTRATION_DOCUMENTS: Record<string, DocumentRequirementWithSubTypes> = {
  'gov-id': {
    id: 'gov-id',
    label: 'Government-Issued ID',
    description: 'Passport, driver\'s license, or state ID for all account holders',
    subTypes: [
      { value: 'drivers-license', label: 'Driver\'s License' },
      { value: 'passport', label: 'Passport' },
      { value: 'state-id', label: 'State ID Card' },
      { value: 'military-id', label: 'Military ID' },
      { value: 'global-entry', label: 'Global Entry Card' },
    ],
  },
  'proof-of-address': {
    id: 'proof-of-address',
    label: 'Proof of Address',
    description: 'Dated within the last 90 days showing current residential address',
    subTypes: [
      { value: 'utility-bill', label: 'Utility Bill' },
      { value: 'bank-statement', label: 'Bank Statement' },
      { value: 'mortgage-statement', label: 'Mortgage Statement' },
      { value: 'lease-agreement', label: 'Lease Agreement' },
      { value: 'property-tax-bill', label: 'Property Tax Bill' },
      { value: 'insurance-statement', label: 'Insurance Statement' },
    ],
  },
  'w9': {
    id: 'w9',
    label: 'Tax Form',
    description: 'IRS tax identification form',
    subTypes: [
      { value: 'w9', label: 'W-9 Form' },
      { value: 'w8-ben', label: 'W-8BEN (Foreign Individual)' },
      { value: 'w8-ben-e', label: 'W-8BEN-E (Foreign Entity)' },
    ],
  },
  'joint-agreement': {
    id: 'joint-agreement',
    label: 'Joint Account Agreement',
    description: 'Signed agreement between all joint account holders',
  },
  'community-property-agreement': {
    id: 'community-property-agreement',
    label: 'Community Property Agreement',
    description: 'Spousal consent and community property declaration',
  },
  'tod-beneficiary-form': {
    id: 'tod-beneficiary-form',
    label: 'TOD Beneficiary Designation',
    description: 'Transfer on Death beneficiary designation form',
  },
  'minor-birth-certificate': {
    id: 'minor-birth-certificate',
    label: 'Minor\'s Birth Certificate',
    description: 'Certified birth certificate or proof of age for the minor beneficiary',
  },
  'custodian-id': {
    id: 'custodian-id',
    label: 'Custodian Identification',
    description: 'Government-issued ID for the custodian of the UTMA/UGMA account',
    subTypes: [
      { value: 'drivers-license', label: 'Driver\'s License' },
      { value: 'passport', label: 'Passport' },
      { value: 'state-id', label: 'State ID Card' },
    ],
  },
  'minor-ssn': {
    id: 'minor-ssn',
    label: 'Minor\'s Social Security Card',
    description: 'Social Security card for the minor beneficiary',
  },
  'dba-filing': {
    id: 'dba-filing',
    label: 'DBA Filing / Business License',
    description: 'Business name filing or license',
    subTypes: [
      { value: 'dba-certificate', label: 'DBA Certificate' },
      { value: 'business-license', label: 'Business License' },
      { value: 'business-permit', label: 'Business Permit' },
    ],
  },
  'articles-of-incorporation': {
    id: 'articles-of-incorporation',
    label: 'Articles of Incorporation',
    description: 'Filed articles of incorporation from the Secretary of State',
  },
  'corporate-resolution': {
    id: 'corporate-resolution',
    label: 'Corporate Resolution',
    description: 'Board resolution authorizing the opening and operation of the account',
  },
  'corporate-bylaws': {
    id: 'corporate-bylaws',
    label: 'Corporate Bylaws',
    description: 'Current corporate bylaws governing organizational procedures',
  },
  'ein-letter': {
    id: 'ein-letter',
    label: 'EIN Verification Letter',
    description: 'IRS EIN confirmation letter',
    subTypes: [
      { value: 'cp-575', label: 'CP 575 Letter' },
      { value: '147c', label: '147C Letter' },
      { value: 'ss-4-confirmation', label: 'SS-4 Confirmation' },
    ],
  },
  'partnership-agreement': {
    id: 'partnership-agreement',
    label: 'Partnership Agreement',
    description: 'Executed partnership agreement listing partners and their authority',
  },
  'partnership-certificate': {
    id: 'partnership-certificate',
    label: 'Certificate of Partnership',
    description: 'State-filed certificate of limited or general partnership',
  },
  'operating-agreement': {
    id: 'operating-agreement',
    label: 'LLC Operating Agreement',
    description: 'Operating agreement specifying management structure and authorized signers',
  },
  'articles-of-organization': {
    id: 'articles-of-organization',
    label: 'Articles of Organization',
    description: 'Filed articles of organization from the Secretary of State',
  },
  'llc-certificate': {
    id: 'llc-certificate',
    label: 'Certificate of Formation',
    description: 'State-issued certificate confirming LLC formation',
  },
  'trust-agreement': {
    id: 'trust-agreement',
    label: 'Trust Agreement',
    description: 'Full executed trust agreement with all amendments',
  },
  'trustee-certification': {
    id: 'trustee-certification',
    label: 'Certification of Trust',
    description: 'Certification identifying trustees, date of trust, powers, and beneficiaries',
  },
  'trustee-id': {
    id: 'trustee-id',
    label: 'Trustee Identification',
    description: 'Government-issued ID for each named trustee',
    subTypes: [
      { value: 'drivers-license', label: 'Driver\'s License' },
      { value: 'passport', label: 'Passport' },
      { value: 'state-id', label: 'State ID Card' },
    ],
  },
  'letters-testamentary': {
    id: 'letters-testamentary',
    label: 'Letters Testamentary / Administration',
    description: 'Court-issued authority for the executor or administrator',
    subTypes: [
      { value: 'letters-testamentary', label: 'Letters Testamentary' },
      { value: 'letters-of-administration', label: 'Letters of Administration' },
    ],
  },
  'death-certificate': {
    id: 'death-certificate',
    label: 'Death Certificate',
    description: 'Certified copy of the decedent\'s death certificate',
  },
  'executor-id': {
    id: 'executor-id',
    label: 'Executor / Administrator ID',
    description: 'Government-issued ID for the executor or administrator of the estate',
    subTypes: [
      { value: 'drivers-license', label: 'Driver\'s License' },
      { value: 'passport', label: 'Passport' },
      { value: 'state-id', label: 'State ID Card' },
    ],
  },
  'irs-determination-letter': {
    id: 'irs-determination-letter',
    label: 'IRS Determination Letter',
    description: 'IRS letter confirming 501(c)(3) or other tax-exempt status',
  },
  'organizational-charter': {
    id: 'organizational-charter',
    label: 'Organizational Charter / Bylaws',
    description: 'Governing documents of the non-profit organization',
    subTypes: [
      { value: 'charter', label: 'Organizational Charter' },
      { value: 'bylaws', label: 'Non-Profit Bylaws' },
      { value: 'articles', label: 'Articles of Incorporation' },
    ],
  },
  'board-resolution': {
    id: 'board-resolution',
    label: 'Board Resolution',
    description: 'Resolution from the board of directors authorizing the account',
  },
  'authorized-signer-id': {
    id: 'authorized-signer-id',
    label: 'Authorized Signer ID',
    description: 'Government-issued ID for each authorized signer on the account',
    subTypes: [
      { value: 'drivers-license', label: 'Driver\'s License' },
      { value: 'passport', label: 'Passport' },
      { value: 'state-id', label: 'State ID Card' },
    ],
  },
}

const REGISTRATION_TYPE_DOCUMENTS: Record<RegistrationType, string[]> = {
  individual: [
    'gov-id', 'proof-of-address', 'w9',
  ],
  joint_tenants: [
    'gov-id', 'proof-of-address', 'w9', 'joint-agreement',
  ],
  tenants_in_common: [
    'gov-id', 'proof-of-address', 'w9', 'joint-agreement',
  ],
  community_property: [
    'gov-id', 'proof-of-address', 'w9', 'community-property-agreement',
  ],
  transfer_on_death: [
    'gov-id', 'proof-of-address', 'w9', 'tod-beneficiary-form',
  ],
  custodial_utma: [
    'custodian-id', 'minor-birth-certificate', 'minor-ssn', 'proof-of-address', 'w9',
  ],
  sole_proprietor: [
    'gov-id', 'proof-of-address', 'w9', 'dba-filing',
  ],
  corporate: [
    'gov-id', 'articles-of-incorporation', 'corporate-resolution', 'corporate-bylaws', 'ein-letter', 'w9',
  ],
  partnership: [
    'gov-id', 'partnership-agreement', 'partnership-certificate', 'ein-letter', 'w9',
  ],
  llc: [
    'gov-id', 'articles-of-organization', 'operating-agreement', 'llc-certificate', 'ein-letter', 'w9',
  ],
  trust_revocable: [
    'trustee-id', 'trust-agreement', 'trustee-certification', 'ein-letter', 'w9',
  ],
  trust_irrevocable: [
    'trustee-id', 'trust-agreement', 'trustee-certification', 'ein-letter', 'w9',
  ],
  estate: [
    'executor-id', 'letters-testamentary', 'death-certificate', 'ein-letter', 'w9',
  ],
  nonprofit: [
    'authorized-signer-id', 'irs-determination-letter', 'organizational-charter', 'board-resolution', 'ein-letter', 'w9',
  ],
}

export function getDocSubTypes(docId: string): DocumentSubType[] {
  return ALL_REGISTRATION_DOCUMENTS[docId]?.subTypes ?? []
}

export function getRegistrationDocuments(registrationTypes: RegistrationType[]): DocumentRequirementWithSubTypes[] {
  const docIds = new Set<string>()
  for (const type of registrationTypes) {
    const docs = REGISTRATION_TYPE_DOCUMENTS[type] ?? []
    for (const id of docs) {
      docIds.add(id)
    }
  }
  return Array.from(docIds)
    .map((id) => ALL_REGISTRATION_DOCUMENTS[id])
    .filter(Boolean)
}

export function getRegistrationDocumentsForType(type: RegistrationType): DocumentRequirementWithSubTypes[] {
  const docIds = REGISTRATION_TYPE_DOCUMENTS[type] ?? []
  return docIds
    .map((id) => ALL_REGISTRATION_DOCUMENTS[id])
    .filter(Boolean)
}
