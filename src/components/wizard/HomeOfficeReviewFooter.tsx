import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { ReviewRejectionDialog } from './ReviewRejectionDialog'

export function HomeOfficeReviewFooter() {
  const { state, dispatch } = useWorkflow()
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1

  return (
    <>
      <footer className="border-t border-border bg-background px-6 py-3 grid grid-cols-3 items-center shrink-0">
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'GO_BACK' })}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
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
          <Button
            onClick={() => dispatch({ type: 'GO_NEXT' })}
            disabled={isLast}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
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
                <h3 className="text-base font-semibold">Confirm Acceptance</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to accept this submission? This will mark all tasks as complete and finalize the account opening process.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowAcceptConfirm(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  dispatch({ type: 'ACCEPT_REVIEW' })
                  setShowAcceptConfirm(false)
                }}
              >
                Confirm Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReviewRejectionDialog
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
      />
    </>
  )
}
