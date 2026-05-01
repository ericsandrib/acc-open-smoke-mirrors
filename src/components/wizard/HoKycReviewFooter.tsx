import { useState } from 'react'
import { toast } from 'sonner'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react'

export function HoKycReviewFooter() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRequestInfo, setShowRequestInfo] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showEscalate, setShowEscalate] = useState(false)
  const [comments, setComments] = useState('')

  if (!ctx) return null

  const { child } = ctx
  const reviewState = getChildReviewState(state, child.id)
  const amlReview = reviewState?.amlReview
  const hoKycReview = reviewState?.hoKycReview
  const childMeta = (state.taskData[child.id] as Record<string, unknown> | undefined) ?? {}
  const subjectLabel = childMeta.kycSubjectType === 'entity' ? 'legal entity' : 'individual'

  const amlBlocked = amlReview?.status === 'pending' || amlReview?.status === 'flagged' || amlReview?.status === 'info_requested'
  const amlEscalated = amlReview?.status === 'escalated'

  if (hoKycReview?.status === 'approved') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex items-center justify-center shrink-0 box-border">
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
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setShowRequestInfo(true)}>
            <MessageSquare className="h-4 w-4" />
            Request Information
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setShowReject(true)}>
            Reject
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setShowEscalate(true)}>
            <ShieldAlert className="h-4 w-4" />
            Escalate
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={amlBlocked}
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
                <h3 className="text-base font-semibold">Approve KYC</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm that this <span className="font-medium text-foreground">{subjectLabel}</span> (
                  <span className="font-medium text-foreground">{child.name}</span>) has completed KYC verification
                  and all data has been reviewed.
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

      {showRequestInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRequestInfo(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-50 p-2 shrink-0">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Request Information</h3>
                <p className="text-sm text-muted-foreground">
                  Request additional details for this <span className="font-medium text-foreground">{subjectLabel}</span> (
                  <span className="font-medium text-foreground">{child.name}</span>) before final review.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Request details</Label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe what additional information is needed..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowRequestInfo(false)}>Cancel</Button>
              <Button
                variant="default"
                onClick={() => {
                  const feedback = comments.trim() || 'Please provide additional information.'
                  dispatch({ type: 'HO_KYC_REQUEST_CHANGES', comments: feedback })
                  setShowRequestInfo(false)
                  setComments('')
                  toast('Document Review requested information', {
                    description: feedback,
                    icon: <MessageSquare className="h-4 w-4 text-amber-600" />,
                    duration: 6000,
                  })
                }}
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReject(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Reject</h3>
              <p className="text-sm text-muted-foreground">Reject this submission and return it to advisor with rationale.</p>
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Describe the reason for rejection..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const feedback = comments.trim() || 'Rejected by Document Review.'
                  dispatch({ type: 'HO_KYC_REQUEST_CHANGES', comments: feedback })
                  setShowReject(false)
                  setComments('')
                }}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEscalate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEscalate(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Escalate</h3>
              <p className="text-sm text-muted-foreground">Escalate this case for suspicious activity handling.</p>
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Describe reason for escalation..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowEscalate(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  dispatch({ type: 'AML_ESCALATE_SAR', reason: comments.trim() || undefined })
                  setShowEscalate(false)
                  setComments('')
                }}
              >
                Confirm Escalate
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
