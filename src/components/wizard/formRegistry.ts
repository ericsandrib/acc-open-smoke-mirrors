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
import { AcctChildAnnuityForm } from './forms/AcctChildAnnuityForm'

export const formComponents: Record<string, React.ComponentType> = {
  'client-info': ClientInfoForm,
  'related-parties': RelatedPartiesForm,
  'kyc': KycForm,
  'kyc-child-info': KycChildInfoForm,
  'kyc-child-documents': KycChildDocumentsForm,
  'kyc-child-results': KycChildResultsForm,
  'open-accounts': OpenAccountsForm,
  'acct-child-owner-info': AcctChildOwnerInfoForm,
  'acct-child-funding-servicing': AcctChildFundingServicingForm,
  'acct-child-annuity': AcctChildAnnuityForm,
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
  'acct-child-owner-info':
    'Add the owners for this account. Select existing household members or create new individuals.',
  'acct-child-funding-servicing':
    'Configure the funding source, servicing model, and distribution preferences for this account.',
  'acct-child-annuity':
    'Set up annuity details including type, carrier, payout configuration, and beneficiaries.',
  'placeholder-2':
    'Review the information gathered during onboarding and confirm everything is accurate before submitting.',
}
