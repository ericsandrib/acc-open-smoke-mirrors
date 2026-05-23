import { Separator } from '@/components/ui/separator'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import { isMeaningfulReviewerMessage } from '@/utils/reviewerStageMessages'
import {
  getAmlAutomatedClearDrawerCopy,
  getAmlDrawerSupportingCopy,
  getCipSubsystemSupportingCopy,
  getKycStatusBadge,
  isAutomatedAmlClearMessage,
} from '@/utils/kycStatus'
import { KycStatusPill } from '@/components/wizard/verification/KycStatusPill'

function CipSubsystemGuidance({ children }: { children: string }) {
  return <p className="text-xs text-muted-foreground leading-snug pt-1">{children}</p>
}
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

/** Tertiary utility control — always available on CIP drawer, quieter when verification passed. */
function VerificationReRunAction({
  label,
  subdued,
  onClick,
}: {
  label: string
  subdued: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md text-xs font-normal transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        subdued
          ? 'px-0 py-1 text-muted-foreground/65 hover:text-muted-foreground hover:bg-transparent'
          : 'px-0 py-1 text-muted-foreground hover:text-foreground/75 hover:bg-muted/30',
      )}
    >
      <RefreshCw className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      {label}
    </button>
  )
}

function CipStatusLabel({ ho, overall }: { ho?: string; overall?: string }) {
  if (ho === 'approved') return <span className="text-green-700 dark:text-green-300">Verified</span>
  if (ho === 'changes_requested') return <span className="text-amber-800 dark:text-amber-300">Additional Information Required</span>
  if (overall === 'fail') return <span className="text-red-700 dark:text-red-300">Failed</span>
  if (overall === 'pass') return <span className="text-green-700 dark:text-green-300">Verified</span>
  return <span className="text-muted-foreground">Pending review</span>
}

export type VerificationDetailsFocus = 'aml' | 'cip'

export function VerificationDetailsPanel({
  party,
  owner,
  focus,
  onReRun,
}: {
  accountChildId: string
  party: RelatedParty
  owner?: OwnerKycReviewState
  /** Which review task opened this panel — controls re-run label only. */
  focus: VerificationDetailsFocus
  onReRun?: (partyId: string) => void
}) {
  const badge = getKycStatusBadge(owner, party)
  const isCompactKycCard = badge.status === 'pass'
  const amlDrawerGuidance = getAmlDrawerSupportingCopy(owner)
  const cipGuidance = getCipSubsystemSupportingCopy(owner)
  const amlAutomatedClearCopy = getAmlAutomatedClearDrawerCopy(owner)

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
  const idLabel = cip?.idVerification === 'pass' ? 'Match' : cip?.idVerification === 'fail' ? 'Mismatch' : 'Pending'
  const addrLabel = cip?.addressMatch === 'pass' ? 'Match' : cip?.addressMatch === 'fail' ? 'Mismatch' : 'Pending'
  const dobLabel = cip?.dobMatch === 'pass' ? 'Match' : cip?.dobMatch === 'fail' ? 'Mismatch' : 'Pending'

  const reRunLabel = focus === 'aml' ? 'Re-run screening' : 'Re-run verification'
  const showReRunFooter = focus !== 'aml' && Boolean(onReRun)

  return (
    <div className="space-y-4">
      {/* 1. KYC status — label above badge (matches AML status layout) */}
      <section
        className={cn(
          'rounded-lg border border-border/70 bg-card',
          isCompactKycCard ? 'px-3 py-2' : 'px-3 py-3',
        )}
      >
        <div className={cn(isCompactKycCard ? 'space-y-0.5' : 'space-y-2')}>
          <SectionHeader>KYC status</SectionHeader>
          <KycStatusPill badge={badge} className={isCompactKycCard ? 'text-xs' : 'text-sm'} />
        </div>
      </section>

      {/* 2. AML status — outcome, then findings, then secondary guidance */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <SectionHeader>AML status</SectionHeader>
          <p className="text-sm leading-tight">
            <AmlStatusLabel status={amlStatus} />
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <DetailRow label="OFAC matches" value={String(amlPayload?.ofacMatches ?? 0)} />
            <DetailRow label="PEP / watchlist hits" value={String(watchlistHits.length)} />
            <DetailRow label="Last screening" value={formatTimestamp(owner?.kycVerificationLastCheckedAt)} />
          </div>
          {watchlistHits.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {Object.entries(watchlistByCategory).map(([cat, list]) => (
                <li key={cat}>
                  <span className="font-medium text-foreground">{cat}:</span> {list.join('; ')}
                </li>
              ))}
            </ul>
          )}
          {isMeaningfulReviewerMessage(amlFindings) && watchlistHits.length === 0 && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Findings:</span> {amlFindings}
            </p>
          )}
          {amlAutomatedClearCopy ? (
            <p className="text-xs text-muted-foreground">{amlAutomatedClearCopy}</p>
          ) : isMeaningfulReviewerMessage(amlApprovalReason) &&
            !isAutomatedAmlClearMessage(amlApprovalReason) ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Approval note:</span> {amlApprovalReason}
            </p>
          ) : null}
          {isMeaningfulReviewerMessage(amlInfoComments) && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Information requested:</span> {amlInfoComments}
            </p>
          )}
        </div>

        {amlDrawerGuidance ? (
          <p className="text-[11px] font-normal text-muted-foreground/80 leading-snug">
            {amlDrawerGuidance}
          </p>
        ) : null}
      </section>

      <Separator />

      {/* 3. CIP status — identity verification and CIP-specific guidance */}
      <section className="space-y-1">
        <SectionHeader>CIP status</SectionHeader>
        <p className="text-sm">
          <CipStatusLabel ho={hoStatus} overall={cip?.overallStatus} />
        </p>
        {cipGuidance ? <CipSubsystemGuidance>{cipGuidance}</CipSubsystemGuidance> : null}
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

      <Separator />

      {/* 4. Verification metadata */}
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

      {showReRunFooter ? (
        <>
          <Separator />
          <div className="pt-2 pb-0.5">
            <VerificationReRunAction
              label={reRunLabel}
              subdued={isCompactKycCard}
              onClick={() => onReRun!(party.id)}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
