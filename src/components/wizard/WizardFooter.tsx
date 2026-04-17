import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check, Pencil, ShieldAlert } from 'lucide-react'
import type { TaskStatus } from '@/types/workflow'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { getOpenAccountsSubmitForReviewBlockers } from '@/utils/openAccountsDocumentValidation'

function getActiveTaskStatus(state: ReturnType<typeof useWorkflow>['state']): TaskStatus {
  // Check parent tasks
  const parentTask = state.tasks.find((t) => t.id === state.activeTaskId)
  if (parentTask) return parentTask.status
  // Check child tasks
  for (const t of state.tasks) {
    const child = t.children?.find((c) => c.id === state.activeTaskId)
    if (child) return child.status
  }
  // Check child sub-task IDs
  const parsed = parseChildSubTaskId(state.activeTaskId)
  if (parsed) {
    for (const t of state.tasks) {
      const child = t.children?.find((c) => c.id === parsed.childId)
      if (child) return child.status
    }
  }
  return 'not_started'
}

function CompleteAccountOpeningConfirmModal({
  onConfirm,
  onCancel,
  warnings,
}: {
  onConfirm: () => void
  onCancel: () => void
  warnings: string[]
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-account-opening-title"
        className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full max-h-[min(90vh,32rem)] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 dark:bg-amber-950/50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 id="complete-account-opening-title" className="text-base font-semibold">
              Submit Open Accounts for review?
            </h3>
            <p className="text-sm text-muted-foreground">
              This submits all account workflows under Accounts to be Opened for home office review and marks the
              Open Accounts task complete.
            </p>
          </div>
        </div>
        {warnings.length > 0 ? (
          <div
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <p className="font-medium">Finish the following before completing this task:</p>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Submit for review
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WizardFooter() {
  const { state, dispatch } = useWorkflow()
  const [completeAccountOpeningOpen, setCompleteAccountOpeningOpen] = useState(false)
  const [completeAccountOpeningWarnings, setCompleteAccountOpeningWarnings] = useState<string[]>([])
  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1
  const activeStatus = getActiveTaskStatus(state)
  const isSubmitted = state.submittedTaskIds.includes(state.activeTaskId)

  return (
    <>
    <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border">
      <div>
        {!isFirst && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'GO_BACK' })}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSubmitted && activeStatus === 'in_progress' && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'REOPEN_TASK', taskId: state.activeTaskId })}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        {activeStatus === 'complete' && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'REOPEN_TASK', taskId: state.activeTaskId })}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        {activeStatus === 'blocked' && (
          <span className="text-sm text-muted-foreground">Assigned to compliance</span>
        )}

        {isLast ? (
          <Button
            onClick={() => {
              setCompleteAccountOpeningWarnings([])
              setCompleteAccountOpeningOpen(true)
            }}
            disabled={activeStatus === 'complete' || isSubmitted}
          >
            <Check className="h-4 w-4" />
            Submit for review
          </Button>
        ) : (
          <Button
            onClick={() => dispatch({ type: 'GO_NEXT' })}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </footer>
    {completeAccountOpeningOpen && (
      <CompleteAccountOpeningConfirmModal
        warnings={completeAccountOpeningWarnings}
        onCancel={() => {
          setCompleteAccountOpeningOpen(false)
          setCompleteAccountOpeningWarnings([])
        }}
        onConfirm={() => {
          const active = state.tasks.find((t) => t.id === state.activeTaskId)
          if (active?.formKey === 'open-accounts') {
            const blockers = getOpenAccountsSubmitForReviewBlockers(state)
            if (blockers.length > 0) {
              setCompleteAccountOpeningWarnings(blockers)
              return
            }
            dispatch({ type: 'SUBMIT_ALL_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW' })
          }
          dispatch({ type: 'CONFIRM_TASK', taskId: state.activeTaskId })
          setCompleteAccountOpeningOpen(false)
          setCompleteAccountOpeningWarnings([])
        }}
      />
    )}
    </>
  )
}
