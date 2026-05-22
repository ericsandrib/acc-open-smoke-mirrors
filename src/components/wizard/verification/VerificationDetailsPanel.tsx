import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ExternalLink,
  FileText,
  Pencil,
  RefreshCw,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import {
  getRelatedAccountsForParty,
  getOpenSharedRemediationForParty,
} from '@/utils/ownerKycReview'
import { isMeaningfulReviewerMessage } from '@/utils/reviewerStageMessages'
import { getKycStatusBadge } from '@/utils/kycStatus'
import { KycStatusPill } from '@/components/wizard/verification/KycStatusPill'
import { VerificationHistoryPanel } from '@/components/wizard/verification/VerificationHistoryPanel'

function formatTimestamp(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Derive a deep-link field hint from the current CIP payload so "Edit owner fields"
 * scroll-highlights the right section on Account & Owners.
 */
function inferFieldHint(owner?: OwnerKycReviewState): string | undefined {
  const cip = owner?.cipStatus
  if (cip?.addressMatch === 'fail') return 'address'
  if (cip?.dobMatch === 'fail') return 'dob'
  if (cip?.idVerification === 'fail') return 'tax-id'
  const mismatches = owner?.cipPayloadDemo?.mismatches ?? []
  if (mismatches.some((m) => /address/i.test(m))) return 'address'
  if (mismatches.some((m) => /dob|birth/i.test(m))) return 'dob'
  if (mismatches.some((m) => /ssn|tin|tax/i.test(m))) return 'tax-id'
  return undefined
}

function categorizeWatchlistHit(hit: string): 'Sanctions' | 'PEP' | 'Adverse media' | 'Other' {
  const h = hit.toLowerCase()
  if (h.includes('ofac') || h.includes('sanction')) return 'Sanctions'
  if (h.includes('pep')) return 'PEP'
  if (h.includes('adverse') || h.includes('media')) return 'Adverse media'
  return 'Other'
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[8rem]">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xs text-foreground">{value ?? '—'}</span>
    </div>
  )
}

function AmlStatusLabel({ status }: { status?: string }) {
  if (status === 'cleared') return <span className="text-green-700 dark:text-green-300">Clear</span>
  if (status === 'flagged') return <span className="text-red-700 dark:text-red-300">Flagged</span>
  if (status === 'escalated') return <span className="text-red-700 dark:text-red-300">Escalated</span>
  if (status === 'info_requested') return <span className="text-amber-800 dark:text-amber-300">Information requested</span>
  return <span className="text-muted-foreground">Pending review</span>
}

function CipStatusLabel({ ho, overall }: { ho?: string; overall?: string }) {
  if (ho === 'approved') return <span className="text-green-700 dark:text-green-300">Verified</span>
  if (ho === 'changes_requested') return <span className="text-amber-800 dark:text-amber-300">Additional documents required</span>
  if (overall === 'fail') return <span className="text-red-700 dark:text-red-300">Failed</span>
  if (overall === 'pass') return <span className="text-green-700 dark:text-green-300">Verified</span>
  return <span className="text-muted-foreground">Pending review</span>
}

export type VerificationDetailsFocus = 'aml' | 'cip'

export function VerificationDetailsPanel({
  accountChildId,
  party,
  owner,
  focus,
  canEditFields,
  onReRun,
  onNavigateDocuments,
  onEditFields,
}: {
  accountChildId: string
  party: RelatedParty
  owner?: OwnerKycReviewState
  /** Which review task opened this panel — controls re-run label and edit affordance only. */
  focus: VerificationDetailsFocus
  canEditFields?: boolean
  onReRun: (partyId: string) => void
  onNavigateDocuments: () => void
  onEditFields?: (partyId: string, fieldHint?: string) => void
}) {
  const { state } = useWorkflow()
  const badge = getKycStatusBadge(owner, party)

  const amlStatus = owner?.amlReview?.status
  const amlPayload = owner?.amlPayloadDemo
  const amlFindings = owner?.amlReview?.findings
  const amlApprovalReason = owner?.amlReview?.approvalReason
  const amlInfoComments = owner?.amlReview?.infoRequestComments
  const watchlistHits = amlPayload?.watchlistHits ?? []
  const watchlistByCategory = watchlistHits.reduce<Record<string, string[]>>((acc, h) => {
    const c = categorizeWatchlistHit(h)
    acc[c] = acc[c] ?? []
    acc[c].push(h)
    return acc
  }, {})

  const cip = owner?.cipStatus
  const cipPayload = owner?.cipPayloadDemo
  const hoStatus = owner?.hoKycReview?.status
  const hoComments = owner?.hoKycReview?.comments
  const idLabel = cip?.idVerification === 'pass' ? 'Pass' : cip?.idVerification === 'fail' ? 'Fail' : 'Pending'
  const addrLabel = cip?.addressMatch === 'pass' ? 'Match' : cip?.addressMatch === 'fail' ? 'Mismatch' : 'Pending'
  const dobLabel = cip?.dobMatch === 'pass' ? 'Match' : cip?.dobMatch === 'fail' ? 'Mismatch' : 'Pending'

  const relatedAccounts = getRelatedAccountsForParty(state, party.id, accountChildId)
  const sharedRemediation = getOpenSharedRemediationForParty(state, party.id)
  const hasRelatedAccountIssue =
    Boolean(sharedRemediation) || relatedAccounts.some((r) => r.hasOpenRemediation)

  const reRunLabel = focus === 'aml' ? 'Re-run screening' : 'Re-run verification'

  return (
    <div className="space-y-4">
      {/* 1. KYC Status (primary) */}
      <section className="rounded-lg border border-border/70 bg-card px-3 py-3 space-y-2">
        <SectionHeader>KYC status</SectionHeader>
        <div className="flex items-center justify-between gap-2">
          <KycStatusPill badge={badge} className="text-sm" />
          {badge.hint && (
            <span className="text-xs text-muted-foreground text-right">{badge.hint}</span>
          )}
        </div>
      </section>

      {/* 2. AML Status */}
      <section className="space-y-1">
        <SectionHeader>AML status</SectionHeader>
        <p className="text-sm">
          <AmlStatusLabel status={amlStatus} />
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <DetailRow label="OFAC matches" value={String(amlPayload?.ofacMatches ?? 0)} />
          <DetailRow label="PEP / watchlist hits" value={String(watchlistHits.length)} />
          <DetailRow label="Last screening" value={formatTimestamp(owner?.kycVerificationLastCheckedAt)} />
        </div>
        {watchlistHits.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 pt-1">
            {Object.entries(watchlistByCategory).map(([cat, list]) => (
              <li key={cat}>
                <span className="font-medium text-foreground">{cat}:</span> {list.join('; ')}
              </li>
            ))}
          </ul>
        )}
        {isMeaningfulReviewerMessage(amlFindings) && (
          <p className="text-xs text-red-800 dark:text-red-300 pt-1">
            <span className="font-medium">Findings:</span> {amlFindings}
          </p>
        )}
        {isMeaningfulReviewerMessage(amlApprovalReason) && (
          <p className="text-xs text-muted-foreground pt-1">
            <span className="font-medium text-foreground">Approval note:</span> {amlApprovalReason}
          </p>
        )}
        {isMeaningfulReviewerMessage(amlInfoComments) && (
          <p className="text-xs text-amber-800 dark:text-amber-300 pt-1">
            <span className="font-medium">Information requested:</span> {amlInfoComments}
          </p>
        )}
      </section>

      <Separator />

      {/* 3. CIP Status */}
      <section className="space-y-1">
        <SectionHeader>CIP status</SectionHeader>
        <p className="text-sm">
          <CipStatusLabel ho={hoStatus} overall={cip?.overallStatus} />
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <DetailRow label="Identity verification" value={idLabel} />
          <DetailRow label="Address match" value={addrLabel} />
          <DetailRow label="DOB match" value={dobLabel} />
        </div>
        {cipPayload?.mismatches && cipPayload.mismatches.length > 0 && (
          <ul className="text-xs text-red-800 dark:text-red-300 list-disc pl-4 pt-1">
            {cipPayload.mismatches.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        {isMeaningfulReviewerMessage(hoComments) && (
          <p className="text-xs text-amber-800 dark:text-amber-300 pt-1">
            <span className="font-medium">Reviewer note:</span> {hoComments}
          </p>
        )}
      </section>

      {/* 4. Failure Reason (only when KYC = fail) */}
      {badge.status === 'fail' && badge.hint && (
        <section className="rounded-md border border-red-300/60 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20 px-3 py-2 space-y-0.5">
          <SectionHeader>Failure reason</SectionHeader>
          <p className="text-sm text-red-800 dark:text-red-300">{badge.hint}</p>
        </section>
      )}

      <Separator />

      {/* 5. Verification metadata */}
      <section className="space-y-1">
        <SectionHeader>Verification metadata</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <DetailRow label="Provider" value={owner?.provider ?? cipPayload?.identityProvider} />
          <DetailRow label="Last run" value={formatTimestamp(owner?.kycVerificationLastCheckedAt)} />
          <DetailRow label="Run type" value={owner?.runType} />
          <DetailRow label="Trigger source" value={owner?.triggerSource} />
          <DetailRow label="Last re-run by" value={owner?.lastReRunBy} />
          <DetailRow label="Re-run reason" value={owner?.reRunReason} />
        </div>
      </section>

      {/* 6. Linked supporting documents */}
      <section className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Linked supporting documents
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={onNavigateDocuments}
          >
            View in Documents <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Documents linked to this owner are stored once and reused across related accounts.
        </p>
      </section>

      {/* Related accounts — context for shared remediation across the household. */}
      {(relatedAccounts.length > 0 || sharedRemediation) && (
        <section
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
        </section>
      )}

      {/* 7. Verification history */}
      <VerificationHistoryPanel owner={owner} />

      <Separator />
      <div className="flex flex-wrap gap-2">
        {canEditFields && onEditFields && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => onEditFields(party.id, inferFieldHint(owner))}
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
          <RefreshCw className="h-3 w-3" /> {reRunLabel}
        </Button>
      </div>
    </div>
  )
}
