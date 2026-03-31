import type { AccountType } from '@/types/workflow'

export interface DocumentRequirement {
  id: string
  label: string
  description: string
}

const ALL_DOCUMENTS: Record<string, DocumentRequirement> = {
  'gov-id': {
    id: 'gov-id',
    label: 'Government-Issued ID',
    description: 'Passport, driver\'s license, or state ID for all account holders',
  },
  'proof-of-address': {
    id: 'proof-of-address',
    label: 'Proof of Address',
    description: 'Utility bill or bank statement dated within the last 90 days',
  },
  'w9': {
    id: 'w9',
    label: 'W-9 Form',
    description: 'IRS Form W-9 for tax identification purposes',
  },
  'trust-agreement': {
    id: 'trust-agreement',
    label: 'Trust Agreement',
    description: 'Full executed trust agreement with all amendments',
  },
  'ein-letter': {
    id: 'ein-letter',
    label: 'EIN Verification Letter',
    description: 'IRS EIN confirmation letter (CP 575 or 147C)',
  },
  'beneficiary-designation': {
    id: 'beneficiary-designation',
    label: 'Beneficiary Designation Form',
    description: 'Completed beneficiary designation for retirement accounts',
  },
  'employer-plan-docs': {
    id: 'employer-plan-docs',
    label: 'Employer Plan Documents',
    description: 'Plan adoption agreement and summary plan description',
  },
  'transfer-form': {
    id: 'transfer-form',
    label: 'Account Transfer Form',
    description: 'ACAT or non-ACAT transfer authorization form',
  },
}

const ACCOUNT_TYPE_DOCUMENTS: Record<AccountType, string[]> = {
  brokerage: ['gov-id', 'proof-of-address', 'w9'],
  ira: ['gov-id', 'proof-of-address', 'w9', 'beneficiary-designation', 'transfer-form'],
  roth_ira: ['gov-id', 'proof-of-address', 'w9', 'beneficiary-designation', 'transfer-form'],
  '401k': ['gov-id', 'proof-of-address', 'w9', 'beneficiary-designation', 'employer-plan-docs'],
  trust: ['gov-id', 'proof-of-address', 'w9', 'trust-agreement', 'ein-letter'],
  checking: ['gov-id', 'proof-of-address', 'w9'],
  savings: ['gov-id', 'proof-of-address', 'w9'],
}

export function getRequiredDocuments(accountTypes: AccountType[]): DocumentRequirement[] {
  const docIds = new Set<string>()
  for (const type of accountTypes) {
    const docs = ACCOUNT_TYPE_DOCUMENTS[type] ?? []
    for (const id of docs) {
      docIds.add(id)
    }
  }
  return Array.from(docIds)
    .map((id) => ALL_DOCUMENTS[id])
    .filter(Boolean)
}
