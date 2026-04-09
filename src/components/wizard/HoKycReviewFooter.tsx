import { useState } from 'react'
import { toast } from 'sonner'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react'

export function HoKycReviewFooter() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRequestChanges, setShowRequestChanges] = useState(false)
  const [comments, setComments] = useState('')

  if (!ctx) return null

  const { child } = ctx
  const reviewState = state.childReviewState
  const amlReview = reviewState?.amlReview
  const hoKycReview = reviewState?.hoKycReview

  const amlBlocked = amlReview?.status === 'pending' || amlReview?.status === 'flagged' || amlReview?.status === 'info_requested'
  const amlEscalated = amlReview?.status === 'escalated'

  if (hoKycReview?.status === 'approved') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-end shrink-0 box-border">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-green-700 font-medium">KYC Approved</span>
          <span className="text-muted-foreground ml-1">at {hoKycReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  if (amlEscalated) {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-end shrink-0 box-border">
        <div className="flex items-center gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="text-red-700 font-medium">SAR Escalated — Cannot approve</span>
        </div>
      </footer>
    )
  }

  return (
    <>
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-end shrink-0 box-border">
        <div className="flex items-center gap-3">
          {amlBlocked && (
            <span className="text-xs text-amber-600 font-medium mr-2">
              AML review must complete before approval
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => setShowRequestChanges(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Request Changes
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={amlBlocked}
            onClick={() => setShowApproveConfirm(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve KYC
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
                <h3 className="text-base font-semibold">Approve KYC</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm that <span className="font-medium text-foreground">{child.name}</span>'s
                  KYC verification is complete and all data has been reviewed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  dispatch({ type: 'HO_KYC_APPROVE' })
                  setShowApproveConfirm(false)
                }}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRequestChanges && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRequestChanges(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-50 p-2 shrink-0">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Request Changes</h3>
                <p className="text-sm text-muted-foreground">
                  Send <span className="font-medium text-foreground">{child.name}</span>'s
                  submission back to the advisor for corrections.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Comments for Advisor</Label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe what needs to be corrected or updated..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowRequestChanges(false)}>Cancel</Button>
              <Button
                variant="default"
                onClick={() => {
                  const feedback = comments.trim() || 'Please review and resubmit.'
                  dispatch({ type: 'HO_KYC_REQUEST_CHANGES', comments: feedback })
                  setShowRequestChanges(false)
                  setComments('')
                  toast('Home Office KYC Team returned feedback', {
                    description: feedback,
                    icon: <MessageSquare className="h-4 w-4 text-amber-600" />,
                    duration: 6000,
                  })
                }}
              >
                Send Back to Advisor
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
