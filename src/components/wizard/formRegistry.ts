import { RelatedPartiesForm } from './forms/RelatedPartiesForm'
import { ExistingAccountsForm } from './forms/ExistingAccountsForm'
import { KycForm } from './forms/KycForm'
import { KycChildInfoForm } from './forms/KycChildInfoForm'
import { KycChildDocumentsForm } from './forms/KycChildDocumentsForm'

import { OpenAccountsForm } from './forms/OpenAccountsForm'
import { AcctChildOwnerInfoForm } from './forms/AcctChildOwnerInfoForm'
import { FundChildFundingForm } from './forms/FundChildFundingForm'
import { FundingLineSetupForm } from './forms/FundingLineSetupForm'
import { FundChildFeaturesForm } from './forms/FundChildFeaturesForm'
import { FeatureServiceLineSetupForm } from './forms/FeatureServiceLineSetupForm'
import { AcctChildDocumentsReviewForm } from './forms/AcctChildDocumentsReviewForm'

// Annuity / NetX360 split-path forms removed in this fork. The
// `open-accounts-with-annuity` and `acct-child-netx360-next-steps` form keys
// are intentionally left out of `formComponents`; nothing in this fork's
// onboarding seed creates tasks pointing at them.
export const formComponents: Record<string, React.ComponentType> = {
  'existing-accounts': ExistingAccountsForm,
  'related-parties': RelatedPartiesForm,
  'kyc': KycForm,
  'kyc-child-info': KycChildInfoForm,
  'kyc-child-documents': KycChildDocumentsForm,
  'open-accounts': OpenAccountsForm,
  'acct-child-account-owners': AcctChildOwnerInfoForm,
  'acct-child-funding-transfers': FundChildFundingForm,
  'funding-line-child-setup': FundingLineSetupForm,
  'acct-child-features-services': FundChildFeaturesForm,
  'feature-service-line-child-setup': FeatureServiceLineSetupForm,
  'acct-child-documents-review': AcctChildDocumentsReviewForm,
}

export const taskDescriptions: Partial<Record<string, string>> = {
  'existing-accounts':
    'Review and maintain the client\'s current accounts held at other institutions (e.g., brokerage, retirement, trust, banking).',
  'related-parties':
    'Add the people and entities associated with this client to support account opening and servicing.',
  'kyc':
    'Review household members and select who requires identity verification.',
  'kyc-child-info':
    'Collect and verify KYC/KYB data for this subject (individual or legal entity).',
  'kyc-child-documents':
    'Upload supporting KYC/KYB documents if step-up verification is required.',
  'open-accounts':
    'Set up new accounts, complete KYC, and prepare documents for client signature.',
  'acct-child-account-owners':
    'Set up the account, add owners and participants, request margin and options, answer remaining account questions, and collect required owner documents.',
  'acct-child-funding-transfers':
    'Kick off one or more funding and account transfer workflows for this account—each line opens its own detail flow, similar to Accounts to Be Opened on the parent task.',
  'funding-line-child-setup':
    'Define funding method, amounts, external account transfers, bank instructions, and servicing for this workflow line.',
  'acct-child-features-services':
    'Kick off one or more account feature and service workflows—administrative, setup, or lifecycle (not money movements).',
  'feature-service-line-child-setup':
    'Capture status, routing, dates, and notes for this feature or service workflow line.',
  'acct-child-documents-review':
    'Finalize account documentation and collect required client documents',
}

export const taskSections: Partial<Record<string, Array<{ id: string; label: string }>>> = {
  'related-parties': [
    { id: 'rcd-household', label: 'Household' },
    { id: 'rcd-related-individuals', label: 'Related Individuals' },
    { id: 'rcd-trusts', label: 'Trusts' },
    { id: 'rcd-other-entities', label: 'Other Entities' },
    { id: 'rcd-professional-contacts', label: 'Professional Contacts' },
  ],
  'existing-accounts': [
    { id: 'ea-existing-accounts', label: 'Accounts' },
    { id: 'ea-additional-instructions', label: 'Additional Instructions' },
  ],
  'open-accounts': [
    { id: 'oa-accounts', label: 'Accounts' },
    { id: 'oa-documents', label: 'Supporting Documents' },
    { id: 'oa-kyc', label: 'KYC Verification' },
    { id: 'oa-esign', label: 'Envelopes' },
  ],
  'acct-child-account-owners': [
    { id: 'acct-owners', label: 'Owners & Participants' },
    { id: 'acct-beneficiaries', label: 'Beneficiaries' },
    { id: 'acct-info', label: 'Account Information' },
    { id: 'acct-features', label: 'Investment Elections' },
  ],
  'acct-child-documents-review': [
    { id: 'acct-docs-forms', label: 'Forms for This Account' },
    { id: 'acct-docs-client-upload', label: 'Supporting Client Documents' },
  ],
  'acct-child-funding-transfers': [
    { id: '__top__', label: 'Movement Details' },
  ],
  'acct-child-features-services': [
    { id: '__top__', label: 'Feature Details' },
  ],
}
