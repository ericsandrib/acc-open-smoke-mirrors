import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { ReviewRejectionDialog } from './ReviewRejectionDialog'

export function HomeOfficeReviewFooter() {
  const { state, dispatch } = useWorkflow()
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const decision = state.childReviewDecision

  if (decision) {
    const isApproved = decision.outcome === 'approved'
    return (
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Servicing Page
        </Button>
        <div className="flex items-center gap-2 text-sm">
          {isApproved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Approved</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">Rejected — sent back to advisor</span>
            </>
          )}
          <span className="text-muted-foreground ml-1">
            at {decision.decidedAt}
          </span>
        </div>
      </footer>
    )
  }

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)

  return (
    <>
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-center gap-3 shrink-0">
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
          onClick={() => setShowApproveConfirm(true)}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
      </footer>

      {showApproveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowApproveConfirm(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-sm w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-50 p-2 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Approve Account Opening</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to approve{' '}
                  <span className="font-medium text-foreground">{child?.name}</span>?
                  This will finalize the account and move it to processing.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  dispatch({ type: 'ACCEPT_CHILD_REVIEW' })
                  setShowApproveConfirm(false)
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
