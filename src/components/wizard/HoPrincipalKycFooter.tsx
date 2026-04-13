import { useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, ShieldAlert, Stamp } from 'lucide-react'

export function HoPrincipalKycFooter() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [showSignOff, setShowSignOff] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (!ctx) return null

  const { child } = ctx
  const reviewState = getChildReviewState(state, child.id)
  const amlReview = reviewState?.amlReview
  const hoKycReview = reviewState?.hoKycReview
  const principalKycReview = reviewState?.principalKycReview

  const amlCleared = amlReview?.status === 'cleared'
  const amlEscalated = amlReview?.status === 'escalated'
  const hoKycApproved = hoKycReview?.status === 'approved'
  const readyForSignoff = amlCleared && hoKycApproved
  const blocked = !readyForSignoff

  if (principalKycReview?.status === 'approved') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-green-700 font-medium">Principal Sign-Off Complete</span>
          <span className="text-muted-foreground ml-1">at {principalKycReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  if (principalKycReview?.status === 'rejected') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 font-medium">Principal Rejected</span>
          <span className="text-muted-foreground ml-1">at {principalKycReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  if (amlEscalated) {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
        <div className="flex items-center gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="text-red-700 font-medium">SAR Escalated — Sign-off blocked</span>
        </div>
      </footer>
    )
  }

  return (
    <>
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
        <div className="flex items-center gap-3">
          {blocked && (
            <span className="text-xs text-amber-600 font-medium mr-2">
              {!amlCleared ? 'AML must be cleared' : 'HO KYC must be approved'} before sign-off
            </span>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowReject(true)}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={blocked}
            onClick={() => setShowSignOff(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
        </div>
      </footer>

      {showSignOff && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSignOff(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-sm w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-indigo-50 p-2 shrink-0">
                <Stamp className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Principal Sign-Off</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm that <span className="font-medium text-foreground">{child.name}</span>'s
                  complete KYC package has been reviewed and meets all requirements. This is the final approval.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowSignOff(false)}>Cancel</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  dispatch({ type: 'PRINCIPAL_KYC_APPROVE' })
                  setShowSignOff(false)
                }}
              >
                Confirm Sign-Off
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReject(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-50 p-2 shrink-0">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Reject KYC Package</h3>
                <p className="text-sm text-muted-foreground">
                  Reject <span className="font-medium text-foreground">{child.name}</span>'s KYC
                  package and send it back for remediation.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Reason for Rejection</Label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe what needs to be corrected before the package can be signed off..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  dispatch({ type: 'PRINCIPAL_KYC_REJECT', reason: rejectReason.trim() || 'Incomplete package — please remediate.' })
                  setShowReject(false)
                  setRejectReason('')
                }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
