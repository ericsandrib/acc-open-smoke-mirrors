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
  FileText,
  RefreshCw,
  ShieldAlert,
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
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status?: string }) {
  const text =
    status === 'cleared'
      ? 'Cleared'
      : status === 'flagged'
        ? 'Flagged'
        : status === 'escalated'
          ? 'Escalated'
          : status === 'info_requested'
            ? 'Information requested'
            : 'Pending review'
  const tone =
    status === 'cleared'
      ? 'border-green-300 text-green-800 bg-green-50'
      : status === 'flagged' || status === 'escalated'
        ? 'border-red-300 text-red-800 bg-red-50'
        : status === 'info_requested'
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

function categorizeHit(hit: string): 'Sanctions' | 'PEP' | 'Adverse media' | 'Other' {
  const h = hit.toLowerCase()
  if (h.includes('ofac') || h.includes('sanction')) return 'Sanctions'
  if (h.includes('pep')) return 'PEP'
  if (h.includes('adverse') || h.includes('media')) return 'Adverse media'
  return 'Other'
}


function CipSummaryContext({ owner }: { owner?: OwnerKycReviewState }) {
  const cip = owner?.cipStatus
  const status =
    owner?.hoKycReview?.status === 'approved'
      ? 'Approved'
      : owner?.hoKycReview?.status === 'changes_requested'
        ? 'Changes requested'
        : cip?.overallStatus === 'pass'
          ? 'Auto-cleared'
          : 'Pending review'
  const id =
    cip?.idVerification === 'pass'
      ? 'Pass'
      : cip?.idVerification === 'fail'
        ? 'Fail'
        : 'Pending'
  const addr =
    cip?.addressMatch === 'pass'
      ? 'Match'
      : cip?.addressMatch === 'fail'
        ? 'Mismatch'
        : 'Pending'
  const fraud =
    owner?.amlPayloadDemo?.watchlistHits?.some((h) => /fraud/i.test(h)) ? 'Possible' : 'None'

  return (
    <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        CIP summary context (read-only)
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
        <DetailRow label="CIP status" value={status} />
        <DetailRow label="Identity match" value={id} />
        <DetailRow label="Address match" value={addr} />
        <DetailRow label="Fraud indicators" value={fraud} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Full CIP adjudication remains with the Document Review team in CIP Verification &amp; Review.
      </p>
    </div>
  )
}

function OwnerAmlDetails({
  accountChildId,
  party,
  owner,
  onReRun,
  onNavigateDocuments,
}: {
  accountChildId: string
  party: RelatedParty
  owner?: OwnerKycReviewState
  onReRun: (partyId: string) => void
  onNavigateDocuments: () => void
}) {
  const { state } = useWorkflow()
  const payload = owner?.amlPayloadDemo
  const status = owner?.amlReview?.status
  const findings = owner?.amlReview?.findings
  const infoComments = owner?.amlReview?.infoRequestComments

  const hits = payload?.watchlistHits ?? []
  const hitsByCategory = hits.reduce<Record<string, string[]>>((acc, h) => {
    const c = categorizeHit(h)
    acc[c] = acc[c] ?? []
    acc[c].push(h)
    return acc
  }, {})

  const relatedAccounts = getRelatedAccountsForParty(state, party.id, accountChildId)
  const sharedRemediation = getOpenSharedRemediationForParty(state, party.id)
  const hasRelatedAccountIssue =
    Boolean(sharedRemediation) || relatedAccounts.some((r) => r.hasOpenRemediation)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium text-foreground">AML screening details</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <DetailRow label="OFAC matches" value={String(payload?.ofacMatches ?? 0)} />
        <DetailRow label="PEP / watchlist hits" value={String(hits.length)} />
        <DetailRow label="Last screening" value={formatTimestamp(owner?.kycVerificationLastCheckedAt)} />
      </div>

      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <DetailRow label="Provider" value={owner?.provider} />
        <DetailRow label="Run type" value={owner?.runType} />
        <DetailRow label="Trigger source" value={owner?.triggerSource} />
        <DetailRow label="Last re-run by" value={owner?.lastReRunBy} />
        <DetailRow label="Re-run reason" value={owner?.reRunReason} />
      </div>

      {hits.length > 0 && (
        <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Hit categorization</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {Object.entries(hitsByCategory).map(([cat, list]) => (
              <li key={cat}>
                <span className="font-medium text-foreground">{cat}:</span> {list.join('; ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {payload?.summary && (
        <p className="text-sm text-muted-foreground">{payload.summary}</p>
      )}

      {findings && (
        <div className="rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-sm text-red-800">
          <p className="font-medium">Findings</p>
          <p>{findings}</p>
        </div>
      )}
      {infoComments && (
        <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-800">
          <p className="font-medium">Information requested</p>
          <p>{infoComments}</p>
        </div>
      )}

      <CipSummaryContext owner={owner} />

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
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => onReRun(party.id)}
        >
          <RefreshCw className="h-3 w-3" /> Re-run screening
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
          <DialogTitle>Re-run AML screening</DialogTitle>
          <DialogDescription>
            Capture a reason for re-running AML. The reason is recorded on the owner's review history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-sm">Reason</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., 90-day re-screen, updated profile, escalation review."
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

export function AmlReviewTaskForm() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [reRunPartyId, setReRunPartyId] = useState<string | null>(null)
  if (!ctx || ctx.child.childType !== 'account-opening') return null

  const accountChildId = ctx.child.id
  const parties = getAccountPartiesRequiringKyc(state, accountChildId)
  const phase = getAccountWorkflowPhase(state, accountChildId)
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

  const allCleared =
    parties.length > 0 &&
    parties.every(
      (p) => getOwnerReviewState(state, accountChildId, p.id)?.amlReview?.status === 'cleared',
    )

  const navigateToDocuments = () => {
    const subIds = getChildSubTaskIds(accountChildId, 'account-opening')
    const idx = subIds.findIndex((id) => id.endsWith('-documents-review'))
    if (idx >= 0) dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">AML Screening &amp; Review</h2>
        <p className="text-sm text-muted-foreground">
          Review verification subjects at a glance. Select a person to open AML screening details, related accounts, and history. Disposition actions live in the Application Status card.
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/20 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><span className="font-medium text-foreground">Account:</span> {accountName}</span>
        {registration && <span><span className="font-medium text-foreground">Registration:</span> {registration}</span>}
        {accountNumber && <span><span className="font-medium text-foreground">Account #:</span> {accountNumber}</span>}
        <span><span className="font-medium text-foreground">Phase:</span> {phase}</span>
      </div>

      {allCleared && (
        <div className="rounded-md border border-green-300 bg-green-50/60 px-3 py-2 flex items-center gap-2 text-sm text-green-900">
          <CheckCircle2 className="h-4 w-4" />
          All owners auto-cleared — no manual AML review required.
        </div>
      )}

      {parties.length === 0 && (
        <p className="text-sm text-muted-foreground">No natural-person owners require AML screening for this account.</p>
      )}

      {parties.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Verification subjects</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {attentionCount > 0
                ? `${attentionCount} of ${sortedParties.length} subject${sortedParties.length === 1 ? '' : 's'} need attention. Select a row for details.`
                : `${sortedParties.length} subject${sortedParties.length === 1 ? '' : 's'}. Select a row for AML details and history.`}
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
          <OwnerAmlDetails
            accountChildId={accountChildId}
            party={selectedParty}
            owner={ownerForParty(selectedParty.id)}
            onReRun={(partyId) => setReRunPartyId(partyId)}
            onNavigateDocuments={navigateToDocuments}
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
