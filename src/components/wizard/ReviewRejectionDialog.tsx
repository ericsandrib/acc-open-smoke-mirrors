import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ShieldAlert } from 'lucide-react'
import { ReviewReasonMultiSelect } from '@/components/wizard/ReviewReasonMultiSelect'
import { getReasonLabels } from '@/utils/reviewReasonSelection'

const REJECTION_REASONS = [
  { value: 'incomplete-documentation', label: 'Incomplete Documentation' },
  { value: 'identity-verification-failed', label: 'Identity Verification Failed' },
  { value: 'inconsistent-information', label: 'Inconsistent Information' },
  { value: 'missing-signatures', label: 'Missing Signatures' },
  { value: 'regulatory-compliance', label: 'Regulatory Compliance Issue' },
  { value: 'duplicate-request', label: 'Duplicate Account Request' },
  { value: 'other', label: 'Other' },
]

interface ReviewRejectionDialogProps {
  open: boolean
  onClose: () => void
  variant?: 'main' | 'child'
}

export function ReviewRejectionDialog({ open, onClose, variant = 'main' }: ReviewRejectionDialogProps) {
  const { dispatch } = useWorkflow()
  const [reasons, setReasons] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')

  if (!open) return null

  const handleSubmit = () => {
    if (reasons.length === 0) return
    const label = getReasonLabels(REJECTION_REASONS, reasons)
    if (variant === 'child') {
      dispatch({ type: 'REJECT_CHILD_REVIEW', reason: label, feedback: feedback.trim() || undefined })
    } else {
      dispatch({ type: 'REJECT_REVIEW', reason: label, feedback: feedback.trim() || undefined })
    }
    setReasons([])
    setFeedback('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-lg border border-border bg-background p-6 shadow-lg space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-50 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Reject Submission</h3>
            <p className="text-sm text-muted-foreground">
              This will send the submission back to the agent for corrections. Please provide a reason for rejection.
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>Reason for Rejection</Label>
          <ReviewReasonMultiSelect
            options={REJECTION_REASONS}
            value={reasons}
            onChange={setReasons}
            placeholder="Select reasons..."
          />
        </div>

        <div className="space-y-2">
          <Label>Additional Feedback <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Provide additional context or instructions for the agent..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={reasons.length === 0}>
            Submit Rejection
          </Button>
        </div>
      </div>
    </div>
  )
}
