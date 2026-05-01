import { useEffect } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { formComponents, taskDescriptions, taskSections } from './formRegistry'
import { parseChildSubTaskId, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { Clock, AlertTriangle } from 'lucide-react'

function ReviewBanner() {
  const { state } = useWorkflow()
  const review = state.reviewState

  if (!review) return null

  if (review.reviewStatus === 'pending') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 mb-6">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-yellow-800">Awaiting Home Office Review</p>
            <p className="text-xs text-yellow-700">
              Assigned to {review.assignedTo}. All tasks are read-only until the review is complete.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (review.reviewStatus === 'rejected') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-6">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-red-800">Submission Rejected</p>
            {review.rejectionReason && (
              <p className="text-xs text-red-700">
                <span className="font-medium">Reason:</span> {review.rejectionReason}
              </p>
            )}
            {review.rejectionFeedback && (
              <p className="text-xs text-red-700">
                <span className="font-medium">Feedback:</span> {review.rejectionFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function TaskContent() {
  const { state, dispatch } = useWorkflow()

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const activeChild = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  const parsed = parseChildSubTaskId(state.activeTaskId)
  const subTaskChild = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null
  const subTaskDef = parsed
    ? parsed.config.subTasks.find((s) => s.suffix === parsed.suffix)
    : null

  const formKey = activeTask?.formKey ?? activeChild?.formKey ?? subTaskDef?.formKey
  const title = activeTask?.title
    ?? (subTaskChild && subTaskDef && parsed
      ? `${subTaskChild.name} — ${getSubTaskDisplayTitle(parsed.config.childType, subTaskDef, state.demoViewMode)}`
      : null)
    ?? activeChild?.name
    ?? ''

  const FormComponent = formKey ? formComponents[formKey] : null
  const hasExplicitSections = Boolean(formKey && taskSections[formKey]?.length)

  useEffect(() => {
    const targetSectionId = state.parentSectionFocusId
    if (!targetSectionId) return
    if (targetSectionId === '__top__') {
      const main = document.querySelector('main')
      if (main instanceof HTMLElement) {
        main.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
      return
    }
    const el = document.getElementById(targetSectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
  }, [state.parentSectionFocusId, dispatch])

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[52.5rem] mx-auto">
        <ReviewBanner />
        <h2 className="text-3xl font-semibold text-foreground mb-2">{title}</h2>
        {formKey && taskDescriptions[formKey] && (
          <p className="text-base text-muted-foreground mb-6">{taskDescriptions[formKey]}</p>
        )}
        {!hasExplicitSections ? (
          <section id="__top__" className="space-y-1.5 scroll-mt-16 mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h3>
          </section>
        ) : null}
        {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
      </div>
    </main>
  )
}
