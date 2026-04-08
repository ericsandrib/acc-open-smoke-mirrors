import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react'

export function AmlReviewFooter() {
  const { state, dispatch } = useWorkflow()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showSarConfirm, setShowSarConfirm] = useState(false)
  const [findings, setFindings] = useState('')
  const [sarReason, setSarReason] = useState('')

  const reviewState = state.childReviewState
  const amlReview = reviewState?.amlReview

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)

  if (amlReview?.status === 'cleared') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-green-700 font-medium">Cleared — Ready for Home Office approval</span>
          <span className="text-muted-foreground ml-1">at {amlReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  if (amlReview?.status === 'flagged') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive font-medium">Flagged — Returned to advisor</span>
          <span className="text-muted-foreground ml-1">at {amlReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  if (amlReview?.status === 'escalated') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="text-red-700 font-medium">Rejected — AML Review</span>
          <span className="text-muted-foreground ml-1">at {amlReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  if (amlReview?.status === 'info_requested') {
    return (
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="text-red-700 font-medium">Rejected — AML Review</span>
          <span className="text-muted-foreground ml-1">at {amlReview.decidedAt}</span>
        </div>
      </footer>
    )
  }

  return (
    <>
      <footer className="border-t border-border bg-background px-6 py-3 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowFlagModal(true)}
          >
            <AlertTriangle className="h-4 w-4" />
            Flag
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowSarConfirm(true)}
          >
            <ShieldAlert className="h-4 w-4" />
            Escalate SAR
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setShowClearConfirm(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </footer>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowClearConfirm(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-sm w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-50 p-2 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Clear AML Review</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm that <span className="font-medium text-foreground">{child?.name}</span> has
                  passed all AML/sanctions screenings and can proceed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  dispatch({ type: 'AML_REVIEW_CLEAR' })
                  setShowClearConfirm(false)
                }}
              >
                Confirm Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFlagModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowFlagModal(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-50 p-2 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Flag for Further Review</h3>
                <p className="text-sm text-muted-foreground">
                  Flag <span className="font-medium text-foreground">{child?.name}</span> and return
                  to the advisor for corrections.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Rationale</Label>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Describe the AML concerns, potential matches, or reasons for flagging..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowFlagModal(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  dispatch({ type: 'AML_REVIEW_FLAG', findings: findings.trim() || undefined })
                  setShowFlagModal(false)
                  setFindings('')
                }}
              >
                Confirm Flag
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSarConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSarConfirm(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-50 p-2 shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Escalate SAR</h3>
                <p className="text-sm text-muted-foreground">
                  Escalate <span className="font-medium text-foreground">{child?.name}</span> for
                  Suspicious Activity Report (SAR) filing. This will mark the KYC as <span className="font-medium text-foreground">Rejected — AML Review</span>. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Rationale</Label>
              <textarea
                value={sarReason}
                onChange={(e) => setSarReason(e.target.value)}
                placeholder="Describe the reason for SAR escalation..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowSarConfirm(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  dispatch({ type: 'AML_ESCALATE_SAR', reason: sarReason.trim() || undefined })
                  setShowSarConfirm(false)
                  setSarReason('')
                }}
              >
                Confirm Escalation
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
