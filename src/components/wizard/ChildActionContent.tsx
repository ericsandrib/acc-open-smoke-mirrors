import { useChildActionContext } from '@/stores/workflowStore'
import { formComponents, taskDescriptions } from './formRegistry'

export function ChildActionContent() {
  const ctx = useChildActionContext()

  if (!ctx) return null

  const { child, currentSubTask } = ctx
  const FormComponent = formComponents[currentSubTask.formKey] ?? null
  const description = taskDescriptions[currentSubTask.formKey]

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-1">{child.name}</p>
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          {currentSubTask.title}
        </h2>
        {description && (
          <p className="text-base text-muted-foreground mb-6">{description}</p>
        )}
        {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
      </div>
    </main>
  )
}
