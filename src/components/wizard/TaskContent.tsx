import { useWorkflow } from '@/stores/workflowStore'
import { formComponents, taskDescriptions } from './formRegistry'

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
