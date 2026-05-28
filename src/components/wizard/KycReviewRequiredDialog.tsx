import { useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ComplianceModalShell } from '@/components/wizard/ComplianceModalShell'
import { getAssigneeInitials } from '@/data/journeyAssigneeDirectory'
import {
  KYC_ACCEPTED_SUPPORTING_DOCUMENTS_GUIDE_URL,
  type FormsPackageImpactedParticipant,
} from '@/utils/formsPackageKycReview'

interface KycReviewRequiredDialogProps {
  open: boolean
  impactedParticipants: FormsPackageImpactedParticipant[]
  onCancel: () => void
  onConfirm: () => void
}

export function KycReviewRequiredDialog({
  open,
  impactedParticipants,
  onCancel,
  onConfirm,
}: KycReviewRequiredDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open])

  return (
    <ComplianceModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      headerVariant="plain"
      tone="warning"
      icon={<AlertTriangle className="h-5 w-5 text-amber-700" />}
      title="Send without supporting documents?"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!acknowledged}>
            Send Forms Package
          </Button>
        </>
      }
    >
      <p className="text-sm text-foreground leading-relaxed">
        The following clients may be subject to additional verification. Adding supporting documents will reduce the chance of downstream requests.
      </p>

      {impactedParticipants.length > 0 ? (
        <div className="rounded-md border border-border divide-y divide-border">
          {impactedParticipants.map((participant) => (
            <div key={participant.partyId} className="space-y-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  aria-hidden
                >
                  {getAssigneeInitials(participant.partyName)}
                </div>
                <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">{participant.partyName}</p>
              </div>
              <div className="space-y-2 pl-12">
                {participant.guidanceLines.map((line) => (
                  <p key={line} className="text-sm text-foreground leading-relaxed">
                    {line}
                  </p>
                ))}
                {participant.recommendedDocuments.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">Recommended supporting documents:</p>
                    <ul className="text-sm text-foreground list-disc pl-5 space-y-0.5">
                      {participant.recommendedDocuments.map((doc) => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {participant.showHomeOfficeNote ? (
                  <p className="mt-2 text-xs text-foreground">
                    Additional Home Office review may be required.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
        <a
          href={KYC_ACCEPTED_SUPPORTING_DOCUMENTS_GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-2"
        >
          Review accepted supporting documents
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        </a>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="kyc-review-ack"
          checked={acknowledged}
          onCheckedChange={(checked) => setAcknowledged(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="kyc-review-ack" className="text-sm font-normal leading-snug cursor-pointer">
          I understand additional supporting documents or review may be required before this account
          can be approved.
        </Label>
      </div>
    </ComplianceModalShell>
  )
}
