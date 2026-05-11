import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNextVisibleFlatTaskId, useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Pencil, ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TaskStatus } from '@/types/workflow'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { getOpenAccountsSubmitForReviewBlockers } from '@/utils/openAccountsDocumentValidation'
import {
  isAnnuityExternalPlatformOpenAccountsTask,
  isOpenAccountsTask,
  OPEN_ACCOUNTS_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { useOpenAccountsVariant } from '@/components/wizard/openAccountsVariantContext'

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

export function CompleteAccountOpeningConfirmModal({
  onConfirm,
  onCancel,
  warnings,
  mode = 'submit-children',
  submitButtonLabel = 'Submit for Review',
}: {
  onConfirm: () => void
  onCancel: () => void
  warnings: string[]
  mode?: 'submit-children' | 'complete-parent'
  submitButtonLabel?: string
}) {
  const isCompleteParent = mode === 'complete-parent'
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
              {isCompleteParent ? 'Complete Open Accounts task?' : 'Submit account workflows for review?'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isCompleteParent
                ? 'All account workflows are in terminal states (approved or canceled). Confirm to complete the Open Accounts task.'
                : 'This submits ready account workflows under Accounts to Be Opened for home office review. Each account is reviewed independently in its child workflow.'}
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
            {isCompleteParent ? 'Complete task' : submitButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WizardFooter() {
  const { state, dispatch } = useWorkflow()
  const navigate = useNavigate()
  const openAccountsVariant = useOpenAccountsVariant()
  const [completeAccountOpeningOpen, setCompleteAccountOpeningOpen] = useState(false)
  const [completeAccountOpeningWarnings, setCompleteAccountOpeningWarnings] = useState<string[]>([])
  const [exitWorkflowOpen, setExitWorkflowOpen] = useState(false)
  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1
  const hasNextVisibleTask = getNextVisibleFlatTaskId(state) != null
  const activeStatus = getActiveTaskStatus(state)
  const isSubmitted = state.submittedTaskIds.includes(state.activeTaskId)
  const active = state.tasks.find((t) => t.id === state.activeTaskId)
  const v5OpenAccountsMoreSubPages =
    openAccountsVariant === 'v5' &&
    active?.formKey === OPEN_ACCOUNTS_FORM_KEY &&
    state.v5NoAnnuityOpenAccountsPage != null &&
    state.v5NoAnnuityOpenAccountsPage !== 'envelopes'
  const isOnOpenAccountsTask = isOpenAccountsTask(active)
  const isAnnuityOpenAccountsTask = isAnnuityExternalPlatformOpenAccountsTask(active)
  const openAccountsChildren = active?.children ?? []
  const accountOpeningChildren = openAccountsChildren.filter((c) => c.childType === 'account-opening')
  const allAccountChildrenTerminal =
    accountOpeningChildren.length > 0 &&
    accountOpeningChildren.every((c) =>
      c.status === 'complete' || c.status === 'canceled',
    )
  // Annuity Open Accounts submission lives in-page (Netx360HandoffSection); the footer
  // only handles Next/Complete for that task.
  const showsOpenAccountsSubmit =
    isOnOpenAccountsTask && !isAnnuityOpenAccountsTask && !allAccountChildrenTerminal
  const showsAnnuityComplete =
    isOnOpenAccountsTask && isAnnuityOpenAccountsTask && allAccountChildrenTerminal
  const openAccountsSubmitLabel = 'Submit for Review'
  const isV5OrV6 = openAccountsVariant === 'v5' || openAccountsVariant === 'v6'

  return (
    <>
    <footer className="border-t border-border bg-background px-8 py-3 min-h-14 flex justify-between items-center shrink-0 box-border">
      <div className="max-w-[52.5rem] mx-auto w-full flex items-center justify-between">
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

          {v5OpenAccountsMoreSubPages ? (
            <Button variant={isV5OrV6 ? 'outline' : undefined} onClick={() => dispatch({ type: 'GO_NEXT' })}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : isV5OrV6 &&
            (isLast || !hasNextVisibleTask) &&
            !showsOpenAccountsSubmit &&
            !showsAnnuityComplete ? (
            <Button variant="outline" onClick={() => dispatch({ type: 'GO_NEXT' })}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : isV5OrV6 && showsOpenAccountsSubmit ? (
            <Button variant="outline" onClick={() => dispatch({ type: 'GO_NEXT' })}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : isLast || !hasNextVisibleTask || showsOpenAccountsSubmit || showsAnnuityComplete ? (
            <Button
              onClick={() => {
                setCompleteAccountOpeningWarnings([])
                setCompleteAccountOpeningOpen(true)
              }}
              disabled={
                isOnOpenAccountsTask
                  ? false
                  : activeStatus === 'complete' || isSubmitted
              }
            >
              {isOnOpenAccountsTask
                ? allAccountChildrenTerminal
                  ? 'Complete'
                  : openAccountsSubmitLabel
                : 'Complete'}
            </Button>
          ) : (
            isV5OrV6 ? (
              active?.formKey === 'related-parties' || active?.formKey === 'existing-accounts' ? (
                <Button variant="outline" onClick={() => dispatch({ type: 'GO_NEXT' })}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="!bg-black !text-white hover:!bg-black/90" onClick={() => setExitWorkflowOpen(true)}>
                  Exit workflow
                </Button>
              )
            ) : (
              <Button
                onClick={() => dispatch({ type: 'GO_NEXT' })}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    </footer>
    {completeAccountOpeningOpen && (
      <CompleteAccountOpeningConfirmModal
        warnings={completeAccountOpeningWarnings}
        mode={
          isOnOpenAccountsTask && allAccountChildrenTerminal
            ? 'complete-parent'
            : 'submit-children'
        }
        submitButtonLabel={openAccountsSubmitLabel}
        onCancel={() => {
          setCompleteAccountOpeningOpen(false)
          setCompleteAccountOpeningWarnings([])
        }}
        onConfirm={() => {
          if (isOnOpenAccountsTask) {
            if (allAccountChildrenTerminal) {
              dispatch({ type: 'CONFIRM_TASK', taskId: state.activeTaskId })
              setCompleteAccountOpeningOpen(false)
              setCompleteAccountOpeningWarnings([])
              return
            }
            const blockers = getOpenAccountsSubmitForReviewBlockers(state, state.activeTaskId)
            if (blockers.length > 0) {
              setCompleteAccountOpeningWarnings(blockers)
              return
            }
            dispatch({
              type: 'SUBMIT_ALL_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW',
              openAccountsTaskId: state.activeTaskId,
            })
            setCompleteAccountOpeningOpen(false)
            setCompleteAccountOpeningWarnings([])
            return
          }
          dispatch({ type: 'CONFIRM_TASK', taskId: state.activeTaskId })
          setCompleteAccountOpeningOpen(false)
          setCompleteAccountOpeningWarnings([])
        }}
      />
    )}
    <Dialog open={exitWorkflowOpen} onOpenChange={setExitWorkflowOpen}>
      <DialogContent className="max-w-md !data-[state=closed]:zoom-out-100 !data-[state=open]:zoom-in-100 !data-[state=closed]:slide-out-to-left-0 !data-[state=open]:slide-in-from-left-0 !data-[state=closed]:slide-out-to-top-[50%] !data-[state=open]:slide-in-from-top-[50%]">
        <DialogHeader>
          <DialogTitle>Exit current workflow?</DialogTitle>
          <DialogDescription>
            This takes you out of the current workflow and back to the home page.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setExitWorkflowOpen(false)}>
            Continue workflow
          </Button>
          <Button
            type="button"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
            className="hover:opacity-90"
            onClick={() => {
              setExitWorkflowOpen(false)
              navigate('/')
            }}
          >
            Exit workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
