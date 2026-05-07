import type { CombinedAccordionKey } from '@/components/wizard/openAccountsVariantContext'

/**
 * Hierarchical sections for the v2+ combined Open Accounts accordions (`OpenAccountsCombinedForm`).
 * Top-level entries map to an accordion; nested entries map to `<section>` ids inside that accordion.
 */
export type CombinedAccordionSection = {
  id: string
  label: string
}

export type CombinedAccordionSectionGroup = {
  key: CombinedAccordionKey
  label: string
  description?: string
  sections: CombinedAccordionSection[]
}

export const combinedOpenAccountsSections: CombinedAccordionSectionGroup[] = [
  {
    key: 'with-annuity',
    label: 'Accounts with Annuities',
    sections: [
      { id: 'oa-accounts', label: 'Accounts' },
      { id: 'oa-netx360-next-steps', label: 'Continue the rest of the account opening' },
      { id: 'oa-netx360-submit', label: 'Submit to NetX360' },
    ],
  },
  {
    key: 'no-annuity',
    label: 'Accounts without Annuities',
    sections: [
      { id: 'oa-accounts', label: 'Accounts' },
      { id: 'oa-documents', label: 'Supporting Documents' },
      { id: 'oa-kyc', label: 'KYC Verification' },
      { id: 'oa-esign', label: 'Envelopes' },
    ],
  },
]
