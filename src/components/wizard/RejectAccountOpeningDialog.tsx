import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ComplianceModalShell } from '@/components/wizard/ComplianceModalShell'

export const ACCOUNT_OPENING_REJECTION_REASONS = [
  { value: 'sanctions-watchlist-match', label: 'Sanctions / watchlist match' },
  { value: 'unable-to-verify-identity', label: 'Unable to verify identity' },
  { value: 'fraud-concern', label: 'Fraud concern' },
  { value: 'compliance-risk', label: 'Compliance risk' },
  { value: 'restricted-account-type', label: 'Restricted account type' },
  { value: 'policy-violation', label: 'Policy violation' },
  { value: 'other', label: 'Other' },
] as const

interface RejectAccountOpeningDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: { reasonCode: string; reasonLabel: string; reviewerNotes?: string }) => void
}

export function RejectAccountOpeningDialog({
  open,
  onCancel,
  onConfirm,
}: RejectAccountOpeningDialogProps) {
  const [reasonCode, setReasonCode] = useState('')
  const [reviewerNotes, setReviewerNotes] = useState('')

  useEffect(() => {
    if (open) {
      setReasonCode('')
      setReviewerNotes('')
    }
  }, [open])

  const notesTrimmed = reviewerNotes.trim()
  const notesRequired = reasonCode === 'other'
  const confirmDisabled = !reasonCode || (notesRequired && !notesTrimmed)

  const handleConfirm = () => {
    if (confirmDisabled) return
    const reasonLabel =
      ACCOUNT_OPENING_REJECTION_REASONS.find((r) => r.value === reasonCode)?.label ?? reasonCode
    onConfirm({
      reasonCode,
      reasonLabel,
      reviewerNotes: notesTrimmed || undefined,
    })
  }

  return (
    <ComplianceModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      tone="destructive"
      icon={<ShieldAlert className="h-5 w-5 text-red-700" />}
      title="Reject Account Opening"
      description="Reject this account opening due to compliance findings. The advisor will be notified and onboarding will be closed."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={confirmDisabled}>
            Reject Account Opening
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <Label className="text-sm">Rejection reason</Label>
        <Select value={reasonCode} onValueChange={setReasonCode}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent className="z-[70]">
            {ACCOUNT_OPENING_REJECTION_REASONS.map((reason) => (
              <SelectItem key={reason.value} value={reason.value}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Reviewer notes</Label>
        <textarea
          value={reviewerNotes}
          onChange={(e) => setReviewerNotes(e.target.value)}
          placeholder="Provide additional compliance context or review notes"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[88px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {notesRequired && !notesTrimmed ? (
          <p className="text-xs text-destructive">
            Reviewer notes are required when selecting Other.
          </p>
        ) : null}
      </div>
    </ComplianceModalShell>
  )
}
