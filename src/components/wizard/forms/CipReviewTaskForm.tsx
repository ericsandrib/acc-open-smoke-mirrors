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
import { CheckCircle2 } from 'lucide-react'
import {
  getAccountWorkflowPhase,
  getOwnerReviewState,
} from '@/utils/ownerKycReview'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { getChildSubTaskIds } from '@/utils/childTaskRegistry'
import { VerificationDetailsPanel } from '@/components/wizard/verification/VerificationDetailsPanel'
import { VerificationSubjectDetailSheet } from '@/components/wizard/verification/VerificationSubjectDetailSheet'
import { VerificationSubjectList } from '@/components/wizard/verification/VerificationSubjectList'
import { VerificationSubjectRow } from '@/components/wizard/verification/VerificationSubjectRow'
import {
  countSubjectsNeedingAttention,
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
  const phase = getAccountWorkflowPhase(state, accountChildId)
  const isDocReviewTeam = state.demoViewMode === 'ho-documents' || state.demoViewMode === 'ho-kyc'
  const canEditFields = isDocReviewTeam && phase === 'document_review'

  const ownerForParty = (partyId: string) => getOwnerReviewState(state, accountChildId, partyId)

  const sortedParties = useMemo(
    () => sortPartiesByVerificationPriority(parties, ownerForParty),
    [parties, state.childReviewsByChildId, accountChildId],
  )

  const attentionCount = useMemo(
    () => countSubjectsNeedingAttention(sortedParties, ownerForParty),
    [sortedParties, state.childReviewsByChildId, accountChildId],
  )

  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const selectedParty = selectedPartyId
    ? sortedParties.find((p) => p.id === selectedPartyId) ?? null
    : null

  const childMeta = (state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}
  const accountName = ctx.child.name
  const registration = typeof childMeta.registrationType === 'string' ? childMeta.registrationType : undefined
  const accountNumber =
    typeof childMeta.accountNumber === 'string' && childMeta.accountNumber
      ? childMeta.accountNumber
      : typeof childMeta.shortName === 'string' && childMeta.shortName
        ? childMeta.shortName
        : undefined

  const allApproved =
    parties.length > 0 &&
    parties.every((p) => ownerForParty(p.id)?.hoKycReview?.status === 'approved')

  const navigateToDocuments = () => {
    const subIds = getChildSubTaskIds(accountChildId, 'account-opening')
    const idx = subIds.findIndex((id) => id.endsWith('-documents-review'))
    if (idx >= 0) dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })
  }

  const editOwnerFields = (partyId: string, fieldHint?: string) => {
    dispatch({ type: 'FOCUS_OWNER_FIELDS', accountChildId, partyId, fieldHint })
    const subIds = getChildSubTaskIds(accountChildId, 'account-opening')
    const ownersIdx = subIds.findIndex((id) => id.endsWith('-account-owners'))
    if (ownersIdx >= 0) dispatch({ type: 'SET_CHILD_SUB_TASK', index: ownersIdx })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">CIP Verification &amp; Review</h2>
        <p className="text-sm text-muted-foreground">
          Review verification subjects at a glance. Select a person to open CIP details, related accounts, and history. Disposition actions live in the Application Status card.
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">Account:</span> {accountName}
        </span>
        {registration && (
          <span>
            <span className="font-medium text-foreground">Registration:</span> {registration}
          </span>
        )}
        {accountNumber && (
          <span>
            <span className="font-medium text-foreground">Account #:</span> {accountNumber}
          </span>
        )}
        <span>
          <span className="font-medium text-foreground">Phase:</span> {phase}
        </span>
      </div>

      {allApproved && (
        <div className="rounded-md border border-green-300 bg-green-50/60 px-3 py-2 flex items-center gap-2 text-sm text-green-900">
          <CheckCircle2 className="h-4 w-4" />
          All owners auto-cleared — no manual CIP review required.
        </div>
      )}

      {parties.length === 0 && (
        <p className="text-sm text-muted-foreground">No natural-person owners require CIP review for this account.</p>
      )}

      {parties.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Verification subjects</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {attentionCount > 0
                ? `${attentionCount} of ${sortedParties.length} subject${sortedParties.length === 1 ? '' : 's'} need attention. Select a row for details.`
                : `${sortedParties.length} subject${sortedParties.length === 1 ? '' : 's'}. Select a row for CIP details and history.`}
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
            canEditFields={canEditFields}
            onReRun={(partyId) => setReRunPartyId(partyId)}
            onNavigateDocuments={navigateToDocuments}
            onEditFields={editOwnerFields}
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
