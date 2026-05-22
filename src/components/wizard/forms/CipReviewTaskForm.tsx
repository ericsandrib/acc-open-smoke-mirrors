import { useMemo, useState } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Pencil,
  RefreshCw,
  Users,
} from 'lucide-react'
import {
  getAccountWorkflowPhase,
  getOpenSharedRemediationForParty,
  getOwnerReviewState,
  getRelatedAccountsForParty,
} from '@/utils/ownerKycReview'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { getChildSubTaskIds } from '@/utils/childTaskRegistry'
import { cn } from '@/lib/utils'
import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import { VerificationHistoryPanel } from '@/components/wizard/verification/VerificationHistoryPanel'
import { VerificationSubjectDetailSheet } from '@/components/wizard/verification/VerificationSubjectDetailSheet'
import { VerificationSubjectList } from '@/components/wizard/verification/VerificationSubjectList'
import { VerificationSubjectRow } from '@/components/wizard/verification/VerificationSubjectRow'
import {
  countSubjectsNeedingAttention,
  getVerificationSubjectTypeLabel,
  sortPartiesByVerificationPriority,
} from '@/utils/ownerVerificationSubjectUx'
import { getKycStatusBadge } from '@/utils/kycStatus'

function StatusBadge({ status }: { status?: string }) {
  const text =
    status === 'approved'
      ? 'Approved'
      : status === 'changes_requested'
        ? 'Changes requested'
        : 'Pending review'
  const tone =
    status === 'approved'
      ? 'border-green-300 text-green-800 bg-green-50'
      : status === 'changes_requested'
        ? 'border-amber-300 text-amber-800 bg-amber-50'
        : 'border-border text-muted-foreground'
  return (
    <Badge variant="outline" className={tone}>
      {text}
    </Badge>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[8rem]">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground">{value ?? '—'}</span>
    </div>
  )
}

function formatTimestamp(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function inferFieldHintFromOwner(owner: OwnerKycReviewState | undefined): string | undefined {
  const cip = owner?.cipStatus
  if (!cip) return undefined
  if (cip.addressMatch === 'fail') return 'address'
  if (cip.dobMatch === 'fail') return 'dob'
  if (cip.idVerification === 'fail') return 'tax-id'
  const mismatches = owner?.cipPayloadDemo?.mismatches ?? []
  if (mismatches.some((m) => /address/i.test(m))) return 'address'
  if (mismatches.some((m) => /dob|birth/i.test(m))) return 'dob'
  if (mismatches.some((m) => /ssn|tin|tax/i.test(m))) return 'tax-id'
  return undefined
}

function OwnerCipDetails({
  accountChildId,
  party,
  owner,
  canEditFields,
  onReRun,
  onNavigateDocuments,
  onEditFields,
}: {
  accountChildId: string
  party: RelatedParty
  owner?: OwnerKycReviewState
  canEditFields: boolean
  onReRun: (partyId: string) => void
  onNavigateDocuments: () => void
  onEditFields: (partyId: string, fieldHint?: string) => void
}) {
  const { state } = useWorkflow()
  const cip = owner?.cipStatus
  const payload = owner?.cipPayloadDemo
  const hoStatus = owner?.hoKycReview?.status

  const idLabel = cip?.idVerification === 'pass' ? 'Pass' : cip?.idVerification === 'fail' ? 'Fail' : 'Pending'
  const addrLabel =
    cip?.addressMatch === 'pass' ? 'Match' : cip?.addressMatch === 'fail' ? 'Mismatch' : 'Pending'
  const dobLabel = cip?.dobMatch === 'pass' ? 'Match' : cip?.dobMatch === 'fail' ? 'Mismatch' : 'Pending'

  const relatedAccounts = getRelatedAccountsForParty(state, party.id, accountChildId)
  const sharedRemediation = getOpenSharedRemediationForParty(state, party.id)
  const hasRelatedAccountIssue =
    Boolean(sharedRemediation) || relatedAccounts.some((r) => r.hasOpenRemediation)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCheck2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium text-foreground">CIP verification details</p>
        </div>
        <StatusBadge status={hoStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DetailRow label="Identity verification" value={idLabel} />
        <DetailRow label="Address match" value={addrLabel} />
        <DetailRow label="DOB match" value={dobLabel} />
      </div>

      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <DetailRow label="Provider" value={owner?.provider ?? payload?.identityProvider} />
        <DetailRow label="Last run" value={formatTimestamp(owner?.kycVerificationLastCheckedAt)} />
        <DetailRow label="Run type" value={owner?.runType} />
        <DetailRow label="Trigger source" value={owner?.triggerSource} />
        <DetailRow label="Last re-run by" value={owner?.lastReRunBy} />
        <DetailRow label="Re-run reason" value={owner?.reRunReason} />
      </div>

      {payload?.mismatches?.length ? (
        <div className="rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-sm text-red-800">
          <p className="font-medium">Identity mismatches</p>
          <ul className="list-disc pl-4">
            {payload.mismatches.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {owner?.hoKycReview?.comments && (
        <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-800">
          <p className="font-medium">Reviewer notes</p>
          <p>{owner.hoKycReview.comments}</p>
        </div>
      )}

      <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Linked supporting documents
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={onNavigateDocuments}>
            View in Documents <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Documents linked to this owner are stored once and reused across related accounts.
        </p>
      </div>

      {(relatedAccounts.length > 0 || sharedRemediation) && (
        <div
          className={cn(
            'rounded-md border px-3 py-2 space-y-1',
            hasRelatedAccountIssue
              ? 'border-amber-300/60 bg-amber-50/40'
              : 'border-border/70 bg-muted/20',
          )}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Users className="h-3.5 w-3.5 text-muted-foreground" /> Related accounts for {party.name}
          </div>
          {relatedAccounts.length > 0 ? (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {relatedAccounts.map((r) => (
                <li key={r.accountChildId}>
                  {r.name}
                  {r.accountNumber ? ` · #${r.accountNumber}` : ''}
                  {r.hasOpenRemediation ? (
                    <span className="font-medium text-amber-800"> · open remediation</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Only this account.</p>
          )}
          {sharedRemediation && (
            <p className="text-xs text-amber-800">
              <span className="font-medium">Shared verification issue:</span> {sharedRemediation}
            </p>
          )}
        </div>
      )}

      <VerificationHistoryPanel owner={owner} />

      <Separator />
      <div className="flex flex-wrap gap-2">
        {canEditFields && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => onEditFields(party.id, inferFieldHintFromOwner(owner))}
          >
            <Pencil className="h-3 w-3" /> Edit owner fields
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => onReRun(party.id)}
        >
          <RefreshCw className="h-3 w-3" /> Re-run verification
        </Button>
      </div>
    </>
  )
}

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
          <OwnerCipDetails
            accountChildId={accountChildId}
            party={selectedParty}
            owner={ownerForParty(selectedParty.id)}
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
