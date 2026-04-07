import { useState } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react'
import { ReviewRejectionDialog } from './ReviewRejectionDialog'

function AmlFlagModal({ childName, onConfirm, onCancel }: { childName: string; onConfirm: (flagged: boolean, notes: string) => void; onCancel: () => void }) {
  const [flagged, setFlagged] = useState(false)
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Submit for Home Office Review</h3>
            <p className="text-sm text-muted-foreground">
              You are about to submit <span className="font-medium text-foreground">{childName}</span> for
              Home Office review. Would you like to flag anything for AML review?
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="aml-flag"
              checked={flagged}
              onCheckedChange={(v) => setFlagged(v === true)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="aml-flag" className="text-sm font-medium cursor-pointer">
                Flag for AML Review
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Route this account to the AML team for OFAC watchlist and sanctions screening.
              </p>
            </div>
          </div>
          {flagged && (
            <div className="space-y-1.5 pl-7">
              <Label className="text-xs">Notes for AML Team <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe any concerns or context for the AML team..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(flagged, notes.trim())}>
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
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showAmlModal, setShowAmlModal] = useState(false)

  if (!ctx) return null

  const { isFirst, isLast, child } = ctx
  const inReview = child.status === 'awaiting_review'
  const isAccountOpening = child.childType === 'account-opening'
  const isAdvisorView = state.demoViewMode === 'advisor'

  if (isAdvisorView) {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 flex justify-between items-center shrink-0">
        <div>
          {!isFirst && (
            <Button variant="outline" onClick={() => dispatch({ type: 'CHILD_GO_BACK' })}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Submitted for home office review at {state.submittedAt ?? 'N/A'}</span>
          </div>
          {!isLast && (
            <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    )
  }

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
      setShowAmlModal(true)
    } else {
      dispatch({ type: 'EXIT_CHILD_ACTION' })
    }
  }

  const handleAmlConfirm = (flagged: boolean, notes: string) => {
    if (flagged) {
      dispatch({ type: 'SET_AML_FLAG', flagged: true, notes: notes || undefined })
    }
    dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
    dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })
    setShowAmlModal(false)
  }

  return (
    <>
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

      {showAmlModal && (
        <AmlFlagModal
          childName={child.name}
          onConfirm={handleAmlConfirm}
          onCancel={() => setShowAmlModal(false)}
        />
      )}
    </>
  )
}
