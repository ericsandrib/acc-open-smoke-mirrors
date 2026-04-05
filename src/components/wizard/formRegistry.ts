import { ClientInfoForm } from './forms/ClientInfoForm'
import { RelatedPartiesForm } from './forms/RelatedPartiesForm'
import { KycForm } from './forms/KycForm'
import { KycChildInfoForm } from './forms/KycChildInfoForm'
import { KycChildDocumentsForm } from './forms/KycChildDocumentsForm'
import { KycChildResultsForm } from './forms/KycChildResultsForm'
import { Placeholder2Form } from './forms/PlaceholderForm'
import { OpenAccountsForm } from './forms/OpenAccountsForm'
import { AcctChildOwnerInfoForm } from './forms/AcctChildOwnerInfoForm'
import { AcctChildFundingServicingForm } from './forms/AcctChildFundingServicingForm'
import { AcctChildFeaturesServicesForm } from './forms/AcctChildFeaturesServicesForm'
import { AcctChildDocumentsReviewForm } from './forms/AcctChildDocumentsReviewForm'

export const formComponents: Record<string, React.ComponentType> = {
  'client-info': ClientInfoForm,
  'related-parties': RelatedPartiesForm,
  'kyc': KycForm,
  'kyc-child-info': KycChildInfoForm,
  'kyc-child-documents': KycChildDocumentsForm,
  'kyc-child-results': KycChildResultsForm,
  'open-accounts': OpenAccountsForm,
  'acct-child-account-owners': AcctChildOwnerInfoForm,
  'acct-child-funding-transfers': AcctChildFundingServicingForm,
  'acct-child-features-services': AcctChildFeaturesServicesForm,
  'acct-child-documents-review': AcctChildDocumentsReviewForm,
  'placeholder-2': Placeholder2Form,
}

export const taskDescriptions: Partial<Record<string, string>> = {
  'client-info':
    'Capture the primary contact\'s details and account type. This information is referenced throughout the onboarding process.',
  'related-parties':
    'Identify household members, related contacts, and organizations connected to this client. Members added here can be selected for KYC verification in a later step.',
  // 'kyc' intentionally omitted — KycForm has context-sensitive phase intros
  'kyc-child-info':
    'Review and confirm the personal information for this household member.',
  'kyc-child-documents':
    'Upload the required identity documents for compliance verification.',
  'kyc-child-results':
    'View the results of the compliance review for this household member.',
  'open-accounts':
    'Select the types of accounts to open, review documents, and prepare for signature.',
  'acct-child-account-owners':
    'Create the account shell and capture owners/participants—fields here drive eligibility and the first pass of document rules.',
  'acct-child-funding-transfers':
    'Capture how the account will be funded and any transfer-related items; funding choices often trigger a different document set.',
  'acct-child-features-services':
    'Optional features and add-ons (margin, options, cards, statement delivery, beneficiaries / TOD, interested parties). Use the left sub-step list to reach this screen after Account & owners and Funding.',
  'acct-child-documents-review':
    'Finalize this account’s paperwork: lists, uploads, exceptions. Documents (right) tracked rule-driven needs since Task 1; the single aggregated eSign envelope is built on the Open Accounts parent step.',
  'placeholder-2':
    'Review the information gathered during onboarding and confirm everything is accurate before submitting.',
}
