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

export const formComponents: Record<string, React.ComponentType> = {
  'existing-accounts': ExistingAccountsForm,
  'related-parties': RelatedPartiesForm,
  'kyc': KycForm,
  'kyc-child-info': KycChildInfoForm,
  'kyc-child-documents': KycChildDocumentsForm,
  'open-accounts': OpenAccountsForm,
  'open-accounts-with-annuity': OpenAccountsForm,
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
    'Set up accounts without an annuity.',
  'open-accounts-with-annuity':
    'Set up accounts that include an annuity.',
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

export type TaskSection = { id: string; label: string; children?: Array<{ id: string; label: string }> }

export const taskSections: Partial<Record<string, Array<TaskSection>>> = {
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
    {
      id: 'oa-instructions-group',
      label: 'Account instructions',
      children: [
        { id: 'oa-accounts', label: 'Accounts' },
        { id: 'oa-documents', label: 'Supporting Documents' },
      ],
    },
    {
      id: 'oa-kyc',
      label: 'KYC Verification',
      children: [
        { id: 'oa-kyc-owners', label: 'Account Owners' },
        { id: 'oa-kyc-cases', label: 'KYC Cases' },
      ],
    },
    { id: 'oa-esign', label: 'Envelopes' },
  ],
  'open-accounts-with-annuity': [
    { id: 'oa-accounts', label: 'Accounts' },
    { id: 'oa-netx360-next-steps', label: 'Continue the rest of the account opening' },
    { id: 'oa-netx360-submit', label: 'Submit to NetX360' },
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
