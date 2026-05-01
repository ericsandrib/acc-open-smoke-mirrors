import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useWorkflow,
  useChildActionContext,
  useAdvisorFormsEditable,
  useAdvisorResubmitEligible,
  getChildReviewState,
  getChildReviewDecision,
} from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, ShieldAlert, RotateCcw } from 'lucide-react'
import { getKycValidationErrors, kycChildHasOptionalIdVerification } from './forms/KycChildInfoForm'
import {
  getAccountOpeningChildSubmissionIssues,
  hasAccountOpeningChildBeenSubmittedForReview,
} from '@/utils/accountOpeningChildProgress'
import { OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY } from '@/utils/openAccountsTaskContext'

function SubmissionBlockedModal({
  issues,
  onAcknowledge,
}: {
  issues: string[]
  onAcknowledge: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-blocked-title"
        className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 dark:bg-amber-950/50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-2 min-w-0">
            <h3 id="submission-blocked-title" className="text-base font-semibold">
              Cannot submit for review yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Resolve the issues below before submitting this account opening for review.
            </p>
          </div>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground">
          {issues.map((issue, idx) => (
            <li key={`${idx}-${issue}`}>{issue}</li>
          ))}
        </ul>
        <div className="flex justify-end pt-1">
          <Button type="button" onClick={onAcknowledge}>
            I understand
          </Button>
        </div>
      </div>
    </div>
  )
}

function SubmitConfirmModal({
  childName,
  onConfirm,
  onCancel,
  variant = 'submit',
}: {
  childName: string
  onConfirm: () => void
  onCancel: () => void
  /** `complete-step` — last account-opening subtask; `submit` — resubmit / generic. */
  variant?: 'submit' | 'complete-step'
}) {
  const isCompleteStep = variant === 'complete-step'
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{isCompleteStep ? 'Complete this step?' : 'Submit for Review'}</h3>
            <p className="text-sm text-muted-foreground">
              {isCompleteStep ? (
                <>
                  Finish setup for <span className="font-medium text-foreground">{childName}</span> and submit it for
                  home office review. You will switch to the home office view and advisor edits lock until review
                  completes.
                </>
              ) : (
                <>
                  You are about to submit <span className="font-medium text-foreground">{childName}</span> for
                  compliance verification. Once submitted, the information will be locked and forwarded for review.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>{isCompleteStep ? 'Complete step' : 'Submit for Review'}</Button>
        </div>
      </div>
    </div>
  )
}

export function ChildActionFooter() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const footerRef = useRef<HTMLElement | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [showCompleteStepModal, setShowCompleteStepModal] = useState(false)
  const [submissionIssues, setSubmissionIssues] = useState<string[] | null>(null)
  const advisorFormsEditable = useAdvisorFormsEditable()
  const advisorResubmitEligible = useAdvisorResubmitEligible()

  if (!ctx) return null

  const { isFirst, isLast, child } = ctx
  const isKyc = child.childType === 'kyc'
  const isNestedAccountLineChild =
    child.childType === 'funding-line' || child.childType === 'feature-service-line'
  const isAdvisorView = state.demoViewMode === 'advisor'
  const isAmlView = state.demoViewMode === 'aml'
  const isHoKycView = state.demoViewMode === 'ho-kyc'
  const kycParty =
    isKyc
      ? state.relatedParties.find((p) => p.id === (state.taskData[child.id]?.kycSubjectPartyId as string | undefined)) ??
        state.relatedParties.find((p) => p.name === child.name)
      : null
  const kycSubjectType: 'individual' | 'entity' =
    state.taskData[child.id]?.kycSubjectType === 'entity' || kycParty?.type === 'related_organization'
      ? 'entity'
      : 'individual'
  const annuityOwnersTaskId = `${child.id}-account-owners`
  const annuityOwnersTaskData = state.taskData[annuityOwnersTaskId] as Record<string, unknown> | undefined
  const isAnnuityNetx360NextStepsSubTask =
    child.childType === 'account-opening' &&
    ctx.parentTask?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY &&
    ctx.currentSubTask.suffix === 'netx360-next-steps'
  const isAnnuityAccountOwnersSubTask =
    child.childType === 'account-opening' &&
    ctx.parentTask?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY &&
    ctx.currentSubTask.suffix === 'account-owners'
  const hideNavForCompletedNetx360Step =
    isAnnuityNetx360NextStepsSubTask && child.status === 'complete'
  const hideNextForCompletedAnnuityOwners =
    isAnnuityAccountOwnersSubTask && child.status === 'complete'
  useEffect(() => {
    const node = footerRef.current
    if (!node) return
    const blockFooterWheelScroll = (e: WheelEvent) => {
      e.preventDefault()
    }
    node.addEventListener('wheel', blockFooterWheelScroll, { passive: false })
    return () => {
      node.removeEventListener('wheel', blockFooterWheelScroll as EventListener)
    }
  }, [])

  if (isNestedAccountLineChild) {
    return (
      <footer
        ref={footerRef}
        className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border"
      >
        <div className="max-w-[52.5rem] mx-auto w-full flex items-center justify-between">
          <div>
            {!isFirst && (
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'CHILD_GO_BACK' })}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLast ? (
              <Button onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    )
  }

  const handleResubmit = () => {
    if (isKyc) {
      const infoTaskId = `${child.id}-info`
      const infoData = state.taskData[infoTaskId] ?? {}
      const childMeta = state.taskData[child.id] ?? {}
      const errors = getKycValidationErrors(infoData, {
        optionalIdVerification: kycChildHasOptionalIdVerification(child),
        subjectType:
          childMeta.kycSubjectType === 'entity' || kycSubjectType === 'entity'
            ? 'entity'
            : 'individual',
      })
      if (errors.length > 0) {
        toast.error('Please fix validation errors before resubmitting', {
          description: `${errors.length} required field${errors.length === 1 ? '' : 's'} need attention.`,
        })
        dispatch({
          type: 'SET_TASK_DATA',
          taskId: infoTaskId,
          fields: { _submitAttempted: true, _validationScrollNonce: Date.now() },
        })
        dispatch({ type: 'SET_CHILD_SUB_TASK', index: 0 })
        return
      }
    } else if (child.childType === 'account-opening') {
      const issues = getAccountOpeningChildSubmissionIssues(state, child.id)
      if (issues.length > 0) {
        setSubmissionIssues(issues)
        return
      }
    }
    setShowResubmitModal(true)
  }

  const handleConfirmResubmit = () => {
    if (child.childType === 'account-opening') {
      const issues = getAccountOpeningChildSubmissionIssues(state, child.id)
      if (issues.length > 0) {
        setShowResubmitModal(false)
        setSubmissionIssues(issues)
        return
      }
    }
    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({
      type: 'SET_DEMO_VIEW',
      mode: child.childType === 'account-opening' ? 'ho-documents' : 'advisor',
    })
    setShowResubmitModal(false)
  }

  const handleDone = () => {
    if (isKyc) {
      const infoTaskId = `${child.id}-info`
      const infoData = state.taskData[infoTaskId] ?? {}
      const childMeta = state.taskData[child.id] ?? {}
      const errors = getKycValidationErrors(infoData, {
        optionalIdVerification: kycChildHasOptionalIdVerification(child),
        subjectType:
          childMeta.kycSubjectType === 'entity' || kycSubjectType === 'entity'
            ? 'entity'
            : 'individual',
      })

      if (errors.length > 0) {
        toast.error('Please fix validation errors before submitting', {
          description: `${errors.length} required field${errors.length === 1 ? '' : 's'} need attention. Review the summary at the top of the form.`,
        })
        dispatch({
          type: 'SET_TASK_DATA',
          taskId: infoTaskId,
          fields: { _submitAttempted: true, _validationScrollNonce: Date.now() },
        })
        dispatch({ type: 'SET_CHILD_SUB_TASK', index: 0 })
        return
      }

      setShowConfirmModal(true)
      return
    }

    if (child.childType === 'account-opening') {
      const issues = getAccountOpeningChildSubmissionIssues(state, child.id)
      if (issues.length > 0) {
        setSubmissionIssues(issues)
        return
      }
      setShowCompleteStepModal(true)
      return
    }

    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({
      type: 'SET_DEMO_VIEW',
      mode: 'advisor',
    })
  }

  const handleConfirmCompleteAccountStep = () => {
    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-documents' })
    setShowCompleteStepModal(false)
  }

  const handleConfirmSubmit = () => {
    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })
    setShowConfirmModal(false)
  }

  const hideNextInAdvisorAfterSubmit =
    isAdvisorView && child.status === 'awaiting_review' && !advisorFormsEditable

  if (isAdvisorView || isAmlView || isHoKycView) {
    return (
      <>
        <footer
          ref={footerRef}
          className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border"
        >
          <div className="max-w-[52.5rem] mx-auto w-full flex items-center justify-between">
            <div>
              {!isFirst && !hideNavForCompletedNetx360Step && (
                <Button variant="outline" onClick={() => dispatch({ type: 'CHILD_GO_BACK' })}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
            {advisorResubmitEligible && isLast ? (
              <Button onClick={handleResubmit}>
                <RotateCcw className="h-4 w-4" />
                Resubmit for Review
              </Button>
            ) : child.status === 'complete' ? (
              <div className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  Completed at{' '}
                  {(() => {
                    const rs = getChildReviewState(state, child.id)
                    const dec = getChildReviewDecision(state, child.id)
                    if (child.childType === 'account-opening' && ctx.parentTask?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) {
                      return (annuityOwnersTaskData?.submittedToNetX360At as string | undefined) ?? state.submittedAt ?? 'N/A'
                    }
                    if (isKyc) return rs?.hoKycReview?.decidedAt ?? state.submittedAt ?? 'N/A'
                    return rs?.principalReview?.decidedAt ?? dec?.decidedAt ?? state.submittedAt ?? 'N/A'
                  })()}
                </span>
              </div>
            ) : child.status === 'awaiting_review' ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Submitted for {isKyc ? 'document review' : 'home office review'} at{' '}
                  {state.submittedAt ?? 'N/A'}
                </span>
              </div>
            ) : isLast && (child.status === 'in_progress' || child.status === 'not_started') ? (
              child.childType === 'account-opening' &&
              !hasAccountOpeningChildBeenSubmittedForReview(state, child.id) ? (
                <Button onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleDone}>
                  Submit for Review
                </Button>
              )
            ) : null}
            {!isLast && !hideNextInAdvisorAfterSubmit && !hideNavForCompletedNetx360Step && !hideNextForCompletedAnnuityOwners && (
              <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            </div>
          </div>
        </footer>

        {showResubmitModal && (
          <SubmitConfirmModal
            childName={child.name}
            onConfirm={handleConfirmResubmit}
            onCancel={() => setShowResubmitModal(false)}
            variant="submit"
          />
        )}
        {showConfirmModal && (
          <SubmitConfirmModal
            childName={child.name}
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowConfirmModal(false)}
            variant="submit"
          />
        )}
        {showCompleteStepModal && (
          <SubmitConfirmModal
            childName={child.name}
            onConfirm={handleConfirmCompleteAccountStep}
            onCancel={() => setShowCompleteStepModal(false)}
            variant="complete-step"
          />
        )}
        {submissionIssues && submissionIssues.length > 0 && (
          <SubmissionBlockedModal
            issues={submissionIssues}
            onAcknowledge={() => setSubmissionIssues(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <footer
        ref={footerRef}
        className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border"
      >
        <div className="max-w-[52.5rem] mx-auto w-full flex items-center justify-between">
          <div>
            {!isFirst && (
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'CHILD_GO_BACK' })}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLast ? (
              child.status === 'complete' ? (
                <div className="flex items-center gap-1.5 text-sm text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    Completed at{' '}
                    {isKyc
                      ? getChildReviewState(state, child.id)?.hoKycReview?.decidedAt ??
                        state.submittedAt ??
                        'N/A'
                      : getChildReviewState(state, child.id)?.principalReview?.decidedAt ??
                        getChildReviewDecision(state, child.id)?.decidedAt ??
                        state.submittedAt ??
                        'N/A'}
                  </span>
                </div>
              ) : (
                <Button onClick={handleDone}>
                  Submit for Review
                </Button>
              )
            ) : (
              <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>

      {showConfirmModal && (
        <SubmitConfirmModal
          childName={child.name}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmModal(false)}
          variant="submit"
        />
      )}
      {showCompleteStepModal && (
        <SubmitConfirmModal
          childName={child.name}
          onConfirm={handleConfirmCompleteAccountStep}
          onCancel={() => setShowCompleteStepModal(false)}
          variant="complete-step"
        />
      )}
      {submissionIssues && submissionIssues.length > 0 && (
        <SubmissionBlockedModal
          issues={submissionIssues}
          onAcknowledge={() => setSubmissionIssues(null)}
        />
      )}
    </>
  )
}
