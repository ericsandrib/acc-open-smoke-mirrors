import { RelatedPartiesForm } from './forms/RelatedPartiesForm'
import { ExistingAccountsForm } from './forms/ExistingAccountsForm'
import { KycForm } from './forms/KycForm'
import { KycChildInfoForm } from './forms/KycChildInfoForm'
import { KycChildDocumentsForm } from './forms/KycChildDocumentsForm'
import { AmlSubjectProfileReviewForm } from './forms/AmlSubjectProfileReviewForm'
import { AmlSupportingDocumentsReviewForm } from './forms/AmlSupportingDocumentsReviewForm'
import { ChildAmlReviewContent } from './ChildAmlReviewContent'

import { OpenAccountsForm } from './forms/OpenAccountsForm'
import { AcctChildOwnerInfoForm } from './forms/AcctChildOwnerInfoForm'
import { FundChildFundingForm } from './forms/FundChildFundingForm'
import { FundingLineSetupForm } from './forms/FundingLineSetupForm'
import { FundChildFeaturesForm } from './forms/FundChildFeaturesForm'
import { FeatureServiceLineSetupForm } from './forms/FeatureServiceLineSetupForm'
import {
  AcctChildDocumentsReviewForm,
  AcctChildFormsPackageForm,
  AcctChildSupportingDocumentsForm,
} from './forms/AcctChildDocumentsReviewForm'
import { AmlReviewTaskForm } from './forms/AmlReviewTaskForm'
import { CipReviewTaskForm } from './forms/CipReviewTaskForm'

export const formComponents: Record<string, React.ComponentType> = {
  'existing-accounts': ExistingAccountsForm,
  'related-parties': RelatedPartiesForm,
  'kyc': KycForm,
  'kyc-child-info': KycChildInfoForm,
  'kyc-child-documents': KycChildDocumentsForm,
  'kyc-child-aml-subject-profile': AmlSubjectProfileReviewForm,
  'kyc-child-aml-documents': AmlSupportingDocumentsReviewForm,
  'kyc-child-aml-review': ChildAmlReviewContent,
  'open-accounts': OpenAccountsForm,
  'open-accounts-with-annuity': OpenAccountsForm,
  'acct-child-account-owners': AcctChildOwnerInfoForm,
  'acct-child-funding-transfers': FundChildFundingForm,
  'funding-line-child-setup': FundingLineSetupForm,
  'acct-child-features-services': FundChildFeaturesForm,
  'feature-service-line-child-setup': FeatureServiceLineSetupForm,
  'acct-child-forms-package': AcctChildFormsPackageForm,
  'acct-child-supporting-documents': AcctChildSupportingDocumentsForm,
  'acct-child-documents-review': AcctChildDocumentsReviewForm,
  'acct-child-aml-review': AmlReviewTaskForm,
  'acct-child-cip-review': CipReviewTaskForm,
}

export const taskDescriptions: Partial<Record<string, string>> = {
  'existing-accounts':
    'Review and maintain the client\'s current accounts held at other institutions (e.g., brokerage, retirement, trust, banking).',
  'related-parties':
    'Add the people and entities associated with this client to support account opening and servicing.',
  'kyc':
    'Review household members and select who requires identity verification.',
  'kyc-child-info':
    'Collect verification profile data and run identity (CIP) screening for this subject.',
  'kyc-child-documents':
    'Supporting documents are optional unless requested during review.',
  'kyc-child-aml-subject-profile':
    'Submitted identity and financial profile for this subject. Read-only — request corrections from the advisor if data is incomplete or inconsistent.',
  'kyc-child-aml-documents':
    'Evidence uploaded with this subject. Review files before recording an AML disposition.',
  'kyc-child-aml-review':
    'Screening outcomes, risk indicators, and disposition actions for this AML case.',
  'open-accounts':
    'Set up accounts, complete identity verification, and prepare documents for client signature.',
  'open-accounts-with-annuity':
    'Set up accounts that include an annuity.',
  'acct-child-account-owners':
    'Set up the account, add owners and participants, request margin and options, answer remaining account questions, and attach supporting owner documents as needed.',
  'acct-child-funding-transfers':
    'Kick off one or more funding and account transfer workflows for this account—each line opens its own detail flow, similar to Accounts to Be Opened on the parent task.',
  'funding-line-child-setup':
    'Define funding method, amounts, external account transfers, bank instructions, and servicing for this workflow line.',
  'acct-child-features-services':
    'Kick off one or more account feature and service workflows—administrative, setup, or lifecycle (not money movements).',
  'feature-service-line-child-setup':
    'Capture status, routing, dates, and notes for this feature or service workflow line.',
  'acct-child-forms-package':
    'Review firm and custodian forms for this account, including executed eSign copies and manual uploads.',
  'acct-child-supporting-documents':
    'Upload and manage supporting documents for this account when needed for review.',
  'acct-child-documents-review':
    'Finalize account documentation and collect client documents when needed for review.',
  'acct-child-aml-review':
    'Review AML screening results for each account participant.',
  'acct-child-cip-review':
    'Review CIP verification results for each account participant.',
}
