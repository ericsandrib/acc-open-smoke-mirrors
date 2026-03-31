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
        <h2 className="text-2xl font-semibold text-foreground mb-6">{title}</h2>
        {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
      </div>
    </main>
  )
}
