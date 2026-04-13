import { useState } from 'react'
import { toast } from 'sonner'
import { useWorkflow, useChildActionContext, useAdvisorUnlocked } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, ShieldAlert, RotateCcw } from 'lucide-react'
import { getKycValidationErrors } from './forms/KycChildInfoForm'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'

function KycRequiredForOwnersModal({
  ownerNames,
  onAcknowledge,
}: {
  ownerNames: string[]
  onAcknowledge: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-block-title"
        className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 dark:bg-amber-950/50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-2 min-w-0">
            <h3 id="kyc-block-title" className="text-base font-semibold">
              Cannot submit for review yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Every account owner must complete KYC verification before this application can be submitted. Finish KYC under{' '}
              <span className="font-medium text-foreground">Collect Client Data</span> for each person listed below, then return here.
            </p>
            <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
              {ownerNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <Button type="button" onClick={onAcknowledge}>
            I understand
          </Button>
        </div>
      </div>
    </div>
  )
}

function SubmitConfirmModal({ childName, onConfirm, onCancel }: { childName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Submit for Review</h3>
            <p className="text-sm text-muted-foreground">
              You are about to submit <span className="font-medium text-foreground">{childName}</span> for
              compliance verification. Once submitted, the information will be locked and forwarded for review.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ChildActionFooter() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [kycBlockOwnerNames, setKycBlockOwnerNames] = useState<string[] | null>(null)
  const advisorUnlocked = useAdvisorUnlocked()

  if (!ctx) return null

  const { isFirst, isLast, child } = ctx
  const isKyc = child.childType === 'kyc'
  const isAdvisorView = state.demoViewMode === 'advisor'
  const isAmlView = state.demoViewMode === 'aml'
  const isHoKycView = state.demoViewMode === 'ho-kyc'
  const isHoPrincipalKycView = state.demoViewMode === 'ho-principal-kyc'

  const handleResubmit = () => {
    if (isKyc) {
      const infoTaskId = `${child.id}-info`
      const infoData = state.taskData[infoTaskId] ?? {}
      const errors = getKycValidationErrors(infoData)
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
      const { names } = getAccountOwnersMissingKyc(state, child.id)
      if (names.length > 0) {
        setKycBlockOwnerNames(names)
        return
      }
    }
    setShowResubmitModal(true)
  }

  const handleConfirmResubmit = () => {
    if (child.childType === 'account-opening') {
      const { names } = getAccountOwnersMissingKyc(state, child.id)
      if (names.length > 0) {
        setShowResubmitModal(false)
        setKycBlockOwnerNames(names)
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

  const hideNextInAdvisorAfterSubmit =
    isAdvisorView && child.status === 'awaiting_review' && !advisorUnlocked

  if (isAdvisorView || isAmlView || isHoKycView || isHoPrincipalKycView) {
    return (
      <>
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border">
          <div>
            {!isFirst && (
              <Button variant="outline" onClick={() => dispatch({ type: 'CHILD_GO_BACK' })}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {advisorUnlocked && isLast ? (
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
                    const rs = state.childReviewState
                    if (isKyc) return rs?.principalKycReview?.decidedAt ?? rs?.hoKycReview?.decidedAt ?? state.submittedAt ?? 'N/A'
                    return rs?.principalReview?.decidedAt ?? state.childReviewDecision?.decidedAt ?? state.submittedAt ?? 'N/A'
                  })()}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Submitted for {isKyc ? 'home office' : 'home office review'} at {state.submittedAt ?? 'N/A'}</span>
              </div>
            )}
            {!isLast && !hideNextInAdvisorAfterSubmit && (
              <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </footer>

        {showResubmitModal && (
          <SubmitConfirmModal
            childName={child.name}
            onConfirm={handleConfirmResubmit}
            onCancel={() => setShowResubmitModal(false)}
          />
        )}
        {kycBlockOwnerNames && kycBlockOwnerNames.length > 0 && (
          <KycRequiredForOwnersModal
            ownerNames={kycBlockOwnerNames}
            onAcknowledge={() => setKycBlockOwnerNames(null)}
          />
        )}
      </>
    )
  }

  const handleDone = () => {
    if (isKyc) {
      const infoTaskId = `${child.id}-info`
      const infoData = state.taskData[infoTaskId] ?? {}
      const errors = getKycValidationErrors(infoData)

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
      const { names } = getAccountOwnersMissingKyc(state, child.id)
      if (names.length > 0) {
        setKycBlockOwnerNames(names)
        return
      }
    }

    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({
      type: 'SET_DEMO_VIEW',
      mode: child.childType === 'account-opening' ? 'ho-documents' : 'advisor',
    })
  }

  const handleConfirmSubmit = () => {
    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })
    setShowConfirmModal(false)
  }

  return (
    <>
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border">
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
            <Button onClick={handleDone}>
              Submit for Review
            </Button>
          ) : (
            <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>

      {showConfirmModal && (
        <SubmitConfirmModal
          childName={child.name}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
      {kycBlockOwnerNames && kycBlockOwnerNames.length > 0 && (
        <KycRequiredForOwnersModal
          ownerNames={kycBlockOwnerNames}
          onAcknowledge={() => setKycBlockOwnerNames(null)}
        />
      )}
    </>
  )
}
