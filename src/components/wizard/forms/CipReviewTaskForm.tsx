import { useMemo, useState } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getOwnerReviewState } from '@/utils/ownerKycReview'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { VerificationDetailsPanel } from '@/components/wizard/verification/VerificationDetailsPanel'
import { VerificationSubjectDetailSheet } from '@/components/wizard/verification/VerificationSubjectDetailSheet'
import { VerificationSubjectList } from '@/components/wizard/verification/VerificationSubjectList'
import { VerificationSubjectRow } from '@/components/wizard/verification/VerificationSubjectRow'
import {
  getVerificationSubjectTypeLabel,
  sortPartiesByVerificationPriority,
} from '@/utils/ownerVerificationSubjectUx'
import { getKycStatusBadge } from '@/utils/kycStatus'

function ReRunDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setReason('')
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Re-run CIP verification</DialogTitle>
          <DialogDescription>
            Capture a reason for re-running CIP. The reason is recorded on the owner's review history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-sm">Reason</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Updated address after document remediation."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[88px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(reason.trim() || 'Re-run requested')
              setReason('')
            }}
          >
            Re-run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CipReviewTaskForm() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [reRunPartyId, setReRunPartyId] = useState<string | null>(null)

  if (!ctx || ctx.child.childType !== 'account-opening') return null

  const accountChildId = ctx.child.id
  const parties = getAccountPartiesRequiringKyc(state, accountChildId)

  const ownerForParty = (partyId: string) => getOwnerReviewState(state, accountChildId, partyId)

  const sortedParties = useMemo(
    () => sortPartiesByVerificationPriority(parties, ownerForParty),
    [parties, state.childReviewsByChildId, accountChildId],
  )

  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const selectedParty = selectedPartyId
    ? sortedParties.find((p) => p.id === selectedPartyId) ?? null
    : null

  return (
    <div className="space-y-5">
      {parties.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No natural-person owners require CIP verification for this account.
        </p>
      )}

      {parties.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Participants</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a participant to review CIP verification details.
            </p>
          </div>

          <VerificationSubjectList>
            {sortedParties.map((party) => (
              <VerificationSubjectRow
                key={party.id}
                name={party.name}
                subjectTypeLabel={getVerificationSubjectTypeLabel(party, state, accountChildId)}
                badge={getKycStatusBadge(ownerForParty(party.id), party)}
                onClick={() => setSelectedPartyId(party.id)}
              />
            ))}
          </VerificationSubjectList>
        </div>
      )}

      <VerificationSubjectDetailSheet
        open={selectedParty != null}
        onOpenChange={(open) => {
          if (!open) setSelectedPartyId(null)
        }}
        title={selectedParty?.name ?? 'Verification details'}
        description={
          selectedParty
            ? getVerificationSubjectTypeLabel(selectedParty, state, accountChildId)
            : undefined
        }
      >
        {selectedParty ? (
          <VerificationDetailsPanel
            accountChildId={accountChildId}
            party={selectedParty}
            owner={ownerForParty(selectedParty.id)}
            focus="cip"
            onReRun={(partyId) => setReRunPartyId(partyId)}
          />
        ) : null}
      </VerificationSubjectDetailSheet>

      <ReRunDialog
        open={reRunPartyId != null}
        onClose={() => setReRunPartyId(null)}
        onConfirm={(reason) => {
          if (reRunPartyId) {
            dispatch({
              type: 'AUTO_RUN_OWNER_KYC',
              accountChildId,
              partyId: reRunPartyId,
              reRunReason: reason,
              runBy: state.demoViewMode ?? 'reviewer',
            })
          }
          setReRunPartyId(null)
        }}
      />
    </div>
  )
}
