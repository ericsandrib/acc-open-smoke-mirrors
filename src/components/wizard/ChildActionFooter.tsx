import { useState } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { ReviewRejectionDialog } from './ReviewRejectionDialog'

export function ChildActionFooter() {
  const { dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  if (!ctx) return null

  const { isFirst, isLast, child } = ctx
  const inReview = child.status === 'awaiting_review'
  const isAccountOpening = child.childType === 'account-opening'

  if (inReview) {
    return (
      <>
        <footer className="border-t border-border bg-background px-6 py-3 grid grid-cols-3 items-center shrink-0">
          <div className="flex justify-start">
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

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowAcceptConfirm(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept
            </Button>
          </div>

          <div className="flex justify-end">
            {!isLast && (
              <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </footer>

        {showAcceptConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAcceptConfirm(false)} />
            <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-sm w-full mx-4 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-50 p-2 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Approve Account Opening</h3>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to approve <span className="font-medium text-foreground">{child.name}</span>? This will finalize the account and move it to processing.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowAcceptConfirm(false)}>Cancel</Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    dispatch({ type: 'ACCEPT_CHILD_REVIEW' })
                    setShowAcceptConfirm(false)
                  }}
                >
                  Confirm Approval
                </Button>
              </div>
            </div>
          </div>
        )}

        <ReviewRejectionDialog
          open={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          variant="child"
        />
      </>
    )
  }

  const handleDone = () => {
    if (isAccountOpening) {
      dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    } else {
      dispatch({ type: 'EXIT_CHILD_ACTION' })
    }
  }

  return (
    <footer className="border-t border-border bg-background px-6 py-3 flex justify-between items-center shrink-0">
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
            Done
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </footer>
  )
}
