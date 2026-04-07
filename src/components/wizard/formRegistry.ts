import { RelatedPartiesForm } from './forms/RelatedPartiesForm'
import { ExistingAccountsForm } from './forms/ExistingAccountsForm'
import { KycForm } from './forms/KycForm'
import { KycChildInfoForm } from './forms/KycChildInfoForm'
import { KycChildDocumentsForm } from './forms/KycChildDocumentsForm'

import { Placeholder2Form } from './forms/PlaceholderForm'
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
  'acct-child-account-owners': AcctChildOwnerInfoForm,
  'acct-child-funding-transfers': FundChildFundingForm,
  'funding-line-child-setup': FundingLineSetupForm,
  'acct-child-features-services': FundChildFeaturesForm,
  'feature-service-line-child-setup': FeatureServiceLineSetupForm,
  'acct-child-documents-review': AcctChildDocumentsReviewForm,
  'placeholder-2': Placeholder2Form,
}

export const taskDescriptions: Partial<Record<string, string>> = {
  'existing-accounts':
    'Review and maintain the client\'s current financial accounts held elsewhere (brokerage, retirement, trust, and banking).',
  'related-parties':
    'Capture household members and related contacts for this client. People added here can be selected for KYC verification in a later step.',
  // 'kyc' intentionally omitted — KycForm has context-sensitive phase intros
  'kyc-child-info':
    'Review and confirm the personal information for this household member.',
  'kyc-child-documents':
    'Upload the required identity documents for compliance verification.',
  'open-accounts':
    'Select the types of accounts to open, review documents, and prepare for signature.',
  'acct-child-account-owners':
    'Confirm account registration details, add owners and participants, complete supplementary account questions, and satisfy owner-level document requirements.',
  'acct-child-funding-transfers':
    'Kick off one or more funding and account transfer workflows for this account—each line opens its own detail flow, similar to Accounts to be Opened on the parent task.',
  'funding-line-child-setup':
    'Define funding method, amounts, external account transfers, bank instructions, and servicing for this workflow line.',
  'acct-child-features-services':
    'Kick off one or more account feature and service workflows—administrative, setup, or lifecycle (not money movements). Each line opens its own detail flow, same pattern as Funding & asset movement.',
  'feature-service-line-child-setup':
    'Capture status, routing, dates, and notes for this feature or service workflow line.',
  'acct-child-documents-review':
    'Finalize this account’s paperwork: lists, uploads, exceptions. Documents (right) tracked rule-driven needs since Task 1; the single aggregated eSign envelope is built on the Open Accounts parent step.',
  'placeholder-2':
    'Review the information gathered during onboarding and confirm everything is accurate before submitting.',
}
