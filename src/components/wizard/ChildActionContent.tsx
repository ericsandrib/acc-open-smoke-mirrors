import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { formComponents, taskDescriptions } from './formRegistry'
import { ShieldCheck, Lock } from 'lucide-react'

function AdvisorLockedBanner() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-4 py-3 mb-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Read-Only — Under Home Office Review</p>
          <p className="text-xs text-blue-800/80 dark:text-blue-200/70">
            This submission is being reviewed by the home office team. All fields are locked until the review is complete.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ChildActionContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const isAdvisorView = state.demoViewMode === 'advisor'

  if (!ctx) return null

  const { child, currentSubTask } = ctx
  const FormComponent = formComponents[currentSubTask.formKey] ?? null
  const description = taskDescriptions[currentSubTask.formKey]
  const inReview = child.status === 'awaiting_review'

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        {inReview && !isAdvisorView && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/40 px-4 py-3 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  Home Office Review
                </p>
                <p className="text-xs text-violet-800/80 dark:text-violet-200/70">
                  This account opening is currently being reviewed by the Home Office
                  Team. All fields are read-only until the review is accepted or
                  returned for corrections.
                </p>
              </div>
            </div>
          </div>
        )}
        {isAdvisorView && <AdvisorLockedBanner />}
        <p className="text-sm text-muted-foreground mb-1">{child.name}</p>
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          {currentSubTask.title}
        </h2>
        {description && (
          <p className="text-base text-muted-foreground mb-6">{description}</p>
        )}
        <div className={isAdvisorView ? 'pointer-events-none opacity-75 select-none' : ''}>
          {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
        </div>
      </div>
    </main>
  )
}
