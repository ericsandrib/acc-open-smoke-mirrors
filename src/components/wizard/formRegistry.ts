import { ClientInfoForm } from './forms/ClientInfoForm'
import { RelatedPartiesForm } from './forms/RelatedPartiesForm'
import { FinancialAccountsForm } from './forms/FinancialAccountsForm'
import { KycForm } from './forms/KycForm'
import { KycChildInfoForm } from './forms/KycChildInfoForm'
import { KycChildDocumentsForm } from './forms/KycChildDocumentsForm'
import { KycChildResultsForm } from './forms/KycChildResultsForm'
import { Placeholder1Form, Placeholder2Form } from './forms/PlaceholderForm'

export const formComponents: Record<string, React.ComponentType> = {
  'client-info': ClientInfoForm,
  'related-parties': RelatedPartiesForm,
  'financial-accounts': FinancialAccountsForm,
  'kyc': KycForm,
  'kyc-child-info': KycChildInfoForm,
  'kyc-child-documents': KycChildDocumentsForm,
  'kyc-child-results': KycChildResultsForm,
  'placeholder-1': Placeholder1Form,
  'placeholder-2': Placeholder2Form,
}

export const taskDescriptions: Partial<Record<string, string>> = {
  'client-info':
    'Capture the primary contact\'s details and account type. This information is referenced throughout the onboarding process.',
  'related-parties':
    'Identify household members, related contacts, and organizations connected to this client. Members added here can be selected for KYC verification in a later step.',
  'financial-accounts':
    'List the financial accounts that will be managed under this relationship.',
  // 'kyc' intentionally omitted — KycForm has context-sensitive phase intros
  'kyc-child-info':
    'Review and confirm the personal information for this household member.',
  'kyc-child-documents':
    'Upload the required identity documents for compliance verification.',
  'kyc-child-results':
    'View the results of the compliance review for this household member.',
  'placeholder-1':
    'Configure the account\'s branch assignment, relationship manager, and access settings.',
  'placeholder-2':
    'Review the information gathered during onboarding and confirm everything is accurate before submitting.',
}
