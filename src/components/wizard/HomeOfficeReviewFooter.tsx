import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react'
import { NigoDialog } from './NigoDialog'

export function HomeOfficeReviewFooter() {
  const { state, dispatch } = useWorkflow()
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showNigoModal, setShowNigoModal] = useState(false)

  const isDocView = state.demoViewMode === 'ho-documents'
  const isPrincipalView = state.demoViewMode === 'ho-principal'
  const reviewState = state.childReviewState
  const decision = state.childReviewDecision

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)

  const docReview = reviewState?.documentReview
  const principalReview = reviewState?.principalReview
  const amlReview = reviewState?.amlReview
  const amlBlocked = amlReview?.status === 'pending' || amlReview?.status === 'flagged'
  const amlEscalated = amlReview?.status === 'escalated'

  if (isDocView) {
    if (docReview?.status === 'igo') {
      return (
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">IGO — Passed to Principal Review</span>
            <span className="text-muted-foreground ml-1">at {docReview.decidedAt}</span>
          </div>
        </footer>
      )
    }

    if (docReview?.status === 'nigo') {
      return (
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">NIGO — Sent back to advisor</span>
            <span className="text-muted-foreground ml-1">at {docReview.decidedAt}</span>
          </div>
        </footer>
      )
    }

    if (amlEscalated) {
      return (
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span className="text-red-700 font-medium">SAR Escalated — Cannot approve</span>
          </div>
        </footer>
      )
    }

    return (
      <>
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowNigoModal(true)}
            >
              <XCircle className="h-4 w-4" />
              NIGO
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={amlBlocked}
              onClick={() => setShowApproveConfirm(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              IGO
            </Button>
          </div>
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
                  <h3 className="text-base font-semibold">Mark as In Good Order</h3>
                  <p className="text-sm text-muted-foreground">
                    All documents for <span className="font-medium text-foreground">{child?.name}</span> have been
                    verified. This will pass the submission to the Principal Review team.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    dispatch({ type: 'DOCUMENT_REVIEW_IGO' })
                    setShowApproveConfirm(false)
                  }}
                >
                  Confirm IGO
                </Button>
              </div>
            </div>
          </div>
        )}

        <NigoDialog
          open={showNigoModal}
          onClose={() => setShowNigoModal(false)}
          teamLabel="Document Review Team"
          onSubmit={(reason, feedback) => {
            dispatch({ type: 'DOCUMENT_REVIEW_NIGO', reason, feedback: feedback || undefined })
            setShowNigoModal(false)
          }}
        />
      </>
    )
  }

  if (isPrincipalView) {
    if (principalReview?.status === 'igo') {
      return (
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">Approved — Account cleared for processing</span>
            <span className="text-muted-foreground ml-1">at {principalReview.decidedAt}</span>
          </div>
        </footer>
      )
    }

    if (principalReview?.status === 'nigo') {
      return (
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">Rejected — Sent back to advisor</span>
            <span className="text-muted-foreground ml-1">at {principalReview.decidedAt}</span>
          </div>
        </footer>
      )
    }

    if (amlEscalated) {
      return (
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span className="text-red-700 font-medium">SAR Escalated — Cannot approve</span>
          </div>
        </footer>
      )
    }

    const docIgo = docReview?.status === 'igo'
    const amlCleared = amlReview?.status === 'cleared'
    const blocked = !docIgo || !amlCleared

    return (
      <>
        <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowNigoModal(true)}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={blocked}
              onClick={() => setShowApproveConfirm(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
          </div>
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
                    Are you sure you want to approve <span className="font-medium text-foreground">{child?.name}</span>?
                    This will finalize the account and clear it for processing at Pershing.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    dispatch({ type: 'PRINCIPAL_REVIEW_IGO' })
                    setShowApproveConfirm(false)
                  }}
                >
                  Confirm Approval
                </Button>
              </div>
            </div>
          </div>
        )}

        <NigoDialog
          open={showNigoModal}
          onClose={() => setShowNigoModal(false)}
          teamLabel="Principal Review Team"
          onSubmit={(reason, feedback) => {
            dispatch({ type: 'PRINCIPAL_REVIEW_NIGO', reason, feedback: feedback || undefined })
            setShowNigoModal(false)
          }}
        />
      </>
    )
  }

  if (decision) {
    const isApproved = decision.outcome === 'approved'
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
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
          <span className="text-muted-foreground ml-1">at {decision.decidedAt}</span>
        </div>
      </footer>
    )
  }

  return null
}
