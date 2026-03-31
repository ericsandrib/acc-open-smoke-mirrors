import { useWorkflow } from '@/stores/workflowStore'
import { ClientInfoForm } from './forms/ClientInfoForm'
import { RelatedPartiesForm } from './forms/RelatedPartiesForm'
import { FinancialAccountsForm } from './forms/FinancialAccountsForm'
import { KycForm } from './forms/KycForm'
import { KycChildForm } from './forms/KycChildForm'
import { Placeholder1Form, Placeholder2Form } from './forms/PlaceholderForm'

const formComponents: Record<string, React.ComponentType> = {
  'client-info': ClientInfoForm,
  'related-parties': RelatedPartiesForm,
  'financial-accounts': FinancialAccountsForm,
  'kyc': KycForm,
  'kyc-child': KycChildForm,
  'placeholder-1': Placeholder1Form,
  'placeholder-2': Placeholder2Form,
}

const taskDescriptions: Partial<Record<string, string>> = {
  'client-info':
    'Capture the primary contact\'s details and account type. This information is referenced throughout the onboarding process.',
  'related-parties':
    'Identify household members, related contacts, and organizations connected to this client. Members added here can be selected for KYC verification in a later step.',
  'financial-accounts':
    'List the financial accounts that will be managed under this relationship.',
  // 'kyc' intentionally omitted — KycForm has context-sensitive phase intros
  'kyc-child':
    'Provide a government-issued ID and complete the required compliance checks for this household member.',
  'placeholder-1':
    'Configure the account\'s branch assignment, relationship manager, and access settings.',
  'placeholder-2':
    'Review the information gathered during onboarding and confirm everything is accurate before submitting.',
}

export function TaskContent() {
  const { state } = useWorkflow()

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const activeChild = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  const formKey = activeTask?.formKey ?? activeChild?.formKey
  const title = activeTask?.title ?? activeChild?.name ?? ''

  const FormComponent = formKey ? formComponents[formKey] : null

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-foreground mb-6">{title}</h2>
        {formKey && taskDescriptions[formKey] && (
          <p className="text-base text-muted-foreground mb-6">{taskDescriptions[formKey]}</p>
        )}
        {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
      </div>
    </main>
  )
}
