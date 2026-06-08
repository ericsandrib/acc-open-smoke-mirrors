import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import type { KycCipBlock, KycVendorDecision, PartyKycResult } from '@/types/kycResult'
import { getKycStatusBadge } from '@/utils/kycStatus'
import { amlCardStatus, cipCardStatus } from '@/utils/kycPassFail'
import {
  addressMatchLabel,
  amlCompactDetail,
  amlCompactStatus,
  amlDrawerRiskIndicators,
  dobMatchLabel,
  formatDobMatchLevel,
  formatFoundSsnCount,
  formatInstantIdIndex,
  formatRedFlagsReport,
  hasCipAddressFlags,
  identityVerificationLabel,
  ssnIdentityVerificationLabel,
} from '@/utils/kycInstantIdDisplay'
import { OverallKycSummary } from '@/components/wizard/verification/OverallKycSummary'
import { RISK_INDICATOR_CARD_CLASS } from '@/components/wizard/verification/verificationCardStyles'
import { VerificationSubsection } from '@/components/wizard/verification/VerificationSubsection'
import { VerificationKycStatusBadge } from '@/components/wizard/verification/VerificationKycStatusBadge'

function formatTimestamp(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function DetailRow({
  label,
  value,
  valueClassName,
  note,
}: {
  label: string
  value?: ReactNode
  valueClassName?: string
  note?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[8rem]">
      <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">{label}</span>
      <span className={cn('text-[14px] leading-[20px] text-foreground', valueClassName)}>
        {value ?? '—'}
      </span>
      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
    </div>
  )
}

function DecisionValue({ decision }: { decision: KycVendorDecision }) {
  const className =
    decision === 'GREEN'
      ? 'text-green-700 dark:text-green-300 font-medium'
      : decision === 'YELLOW'
        ? 'text-amber-800 dark:text-amber-300 font-medium'
        : 'text-red-700 dark:text-red-300 font-medium'
  return <span className={className}>{decision}</span>
}

function CipStatusCardFields({ cip, party }: { cip: KycCipBlock; party: RelatedParty }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DetailRow label="Identity verification" value={identityVerificationLabel(cip)} />
      <DetailRow label="Address match" value={addressMatchLabel(cip, party)} />
      <DetailRow label="DOB match" value={dobMatchLabel(cip)} />
      <DetailRow
        label="Name / Address / SSN score"
        value={String(cip.verified.name_address_ssn_summary)}
      />
      <DetailRow
        label="InstantID Index"
        value={formatInstantIdIndex(cip.verified.comprehensive_verification_index)}
      />
      <DetailRow
        label="DOB match level"
        value={formatDobMatchLevel(cip.verified.dob_match_level)}
      />
    </div>
  )
}

function RiskIndicatorCard({ code, description }: { code: string; description: string }) {
  return (
    <div className={RISK_INDICATOR_CARD_CLASS}>
      <p className="text-sm font-semibold text-foreground">Risk code {code}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  )
}

function AmlCipSummaryCardFields({ cip, party }: { cip: KycCipBlock; party: RelatedParty }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DetailRow label="Identity verification" value={ssnIdentityVerificationLabel(cip)} />
      <DetailRow label="Address match" value={addressMatchLabel(cip, party)} />
      <DetailRow label="DOB match" value={dobMatchLabel(cip)} />
      <DetailRow
        label="InstantID Index"
        value={formatInstantIdIndex(cip.verified.comprehensive_verification_index)}
      />
      <DetailRow
        label="Name / Address / SSN score"
        value={String(cip.verified.name_address_ssn_summary)}
      />
      <DetailRow
        label="DOB match level"
        value={formatDobMatchLevel(cip.verified.dob_match_level)}
      />
    </div>
  )
}

function AmlCipSummarySection({ kyc, party }: { kyc: PartyKycResult; party: RelatedParty }) {
  const { cip } = kyc
  return (
    <VerificationSubsection label="CIP" status={cipCardStatus(cip)}>
      <AmlCipSummaryCardFields cip={cip} party={party} />
    </VerificationSubsection>
  )
}

function AmlCompactSummaryRow({ kyc }: { kyc: PartyKycResult }) {
  const status = amlCompactStatus(kyc)
  const detail = amlCompactDetail(kyc)

  return (
    <section className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">AML</span>
        <VerificationKycStatusBadge outcome={status} size="subsection" />
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{detail}</p>
    </section>
  )
}

function VerificationReRunAction({
  subdued,
  onClick,
}: {
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
          ? 'px-0 py-1 text-muted-foreground/65 hover:text-muted-foreground'
          : 'px-0 py-1 text-muted-foreground hover:text-foreground/75 hover:bg-muted/30',
      )}
    >
      <RefreshCw className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      Re-run verification
    </button>
  )
}

function CipDrawerBody({ kyc, party }: { kyc: PartyKycResult; party: RelatedParty }) {
  const { cip } = kyc
  const subjectName = `${party.firstName ?? ''} ${party.lastName ?? ''}`.trim()
  const reversePhoneMismatch =
    cip.reverse_phone?.name &&
    subjectName &&
    cip.reverse_phone.name.toLowerCase() !== subjectName.toLowerCase()
  const showRiskSection = cip.risk_indicators.length > 0
  const showAddressFlags = hasCipAddressFlags(cip)

  return (
    <>
      <VerificationSubsection label="CIP" status={cipCardStatus(cip)}>
        <CipStatusCardFields cip={cip} party={party} />
      </VerificationSubsection>

      <Separator className="!my-5" />
      <AmlCompactSummaryRow kyc={kyc} />

      <Separator className="!my-5" />

      <section className="space-y-2">
        <SectionHeader>Verified output</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailRow label="Verified name" value={cip.verified.name} />
          <DetailRow label="Verified address" value={cip.verified.address} />
          <DetailRow label="SSN found for LexID" value={cip.verified.ssn_matched ? 'Yes' : 'No'} />
          <DetailRow label="DOB verified" value={cip.verified.dob_verified ? 'Yes' : 'No'} />
          <DetailRow
            label="Red flags report"
            value={cip.flags ? formatRedFlagsReport(cip.flags) : '—'}
          />
          <DetailRow
            label="Passport validated"
            value={cip.flags?.passport_validated ? 'Yes' : 'No'}
          />
          <DetailRow
            label="Found SSN count"
            value={formatFoundSsnCount(cip.flags?.found_ssn_count ?? 0)}
          />
        </div>
      </section>

      {cip.ssn_info ? (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>SSN info</SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <DetailRow label="Valid" value={cip.ssn_info.valid} />
              <DetailRow label="Issued location" value={cip.ssn_info.issued_location} />
              <DetailRow
                label="Issued date range"
                value={`${cip.ssn_info.issued_start_date} → ${cip.ssn_info.issued_end_date}`}
              />
            </div>
          </section>
        </>
      ) : null}

      {showRiskSection ? (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>Risk indicators</SectionHeader>
            <div className="space-y-2">
              {cip.risk_indicators.map((r) => (
                <RiskIndicatorCard key={r.code} code={r.code} description={r.description} />
              ))}
            </div>
            {cip.followup_actions.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommended follow-up
                </p>
                {cip.followup_actions.map((a) => (
                  <p key={a.code} className="text-xs">
                    <span className="font-semibold text-foreground">{a.code}:</span>{' '}
                    <span className="text-muted-foreground">{a.description}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {showAddressFlags ? (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>Address flags</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              {cip.flags?.address_po_box ? (
                <DetailRow label="PO box indicator" value="Yes" />
              ) : null}
              {cip.flags?.address_cmra ? (
                <DetailRow label="CMRA" value="Yes" />
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {cip.reverse_phone ? (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>Phone verification</SectionHeader>
            <div className="grid grid-cols-1 gap-3">
              {cip.phone_of_name_address ? (
                <DetailRow label="Phone of name / address" value={cip.phone_of_name_address} />
              ) : null}
              <DetailRow
                label="Reverse phone name"
                value={cip.reverse_phone.name}
                valueClassName={reversePhoneMismatch ? 'text-amber-800 dark:text-amber-300' : undefined}
                note={reversePhoneMismatch ? 'Does not match subject name' : undefined}
              />
              <DetailRow label="Reverse phone address" value={cip.reverse_phone.address} />
            </div>
          </section>
        </>
      ) : null}

      {cip.chronology_histories.length > 0 && (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>Address history</SectionHeader>
            <div className="space-y-2">
              {cip.chronology_histories.map((h, i) => (
                <div
                  key={`${h.address}-${i}`}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{h.address}</p>
                    {(h.date_first_seen || h.date_last_seen) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {h.date_first_seen ?? '—'} → {h.date_last_seen ?? '—'}
                      </p>
                    )}
                  </div>
                  {h.is_best_address ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      Best address
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}

function AmlDrawerBody({ kyc, party }: { kyc: PartyKycResult; party: RelatedParty }) {
  const { aml } = kyc
  const hits = aml.watchlist_hits ?? []
  const ofacCount = hits.filter((h) => h.table.toLowerCase().includes('ofac')).length
  const otherCount = hits.length - ofacCount
  const amlRiskIndicators = amlDrawerRiskIndicators(kyc)

  return (
    <>
      <VerificationSubsection label="AML" status={amlCardStatus(kyc)}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <DetailRow label="OFAC matches" value={String(ofacCount)} />
          <DetailRow label="PEP / watchlist hits" value={String(otherCount)} />
          <DetailRow label="Last screening" value={formatTimestamp(aml.last_run_date)} />
        </div>
        {hits.length === 0 && aml.last_run_date ? (
          <p className="text-xs text-muted-foreground">No matches identified during screening</p>
        ) : null}
      </VerificationSubsection>

      {hits.length > 0 && (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>Watchlist matches</SectionHeader>
            <div className="space-y-2">
              {hits.map((h) => (
                <div key={`${h.table}-${h.sequence}`} className="rounded-md border border-border px-3 py-2.5 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{h.table}</p>
                  <DetailRow label="Record number" value={h.record_number} />
                  <DetailRow label="Matched name" value={h.matched_name} />
                  <DetailRow label="Matched address" value={h.matched_address} />
                  <DetailRow label="Country" value={h.country} />
                  {h.entity_name ? <DetailRow label="Entity name" value={h.entity_name} /> : null}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {amlRiskIndicators.length > 0 ? (
        <>
          <Separator className="!my-5" />
          <section className="space-y-2">
            <SectionHeader>Risk indicators</SectionHeader>
            <div className="space-y-2">
              {amlRiskIndicators.map((r) => (
                <RiskIndicatorCard key={r.code} code={r.code} description={r.description} />
              ))}
            </div>
          </section>
        </>
      ) : null}

      <Separator className="!my-5" />
      <AmlCipSummarySection kyc={kyc} party={party} />
    </>
  )
}

function MetadataSection({
  kyc,
  owner,
}: {
  kyc: PartyKycResult
  owner?: OwnerKycReviewState
}) {
  const lastRun = owner?.kycVerificationLastCheckedAt ?? kyc.last_run_date
  return (
    <section className="space-y-2">
      <SectionHeader>Verification metadata</SectionHeader>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <DetailRow label="Provider" value="LexisNexis InstantID" />
        <DetailRow label="Last run" value={formatTimestamp(lastRun)} />
        <DetailRow label="Run type" value={owner?.runType ?? 'Automated'} />
        <DetailRow label="Trigger source" value={owner?.triggerSource ?? 'Forms package sent to client'} />
        <DetailRow label="Vendor order ID" value={kyc.cip.vendor_order_id} />
        <DetailRow
          label="Vendor decision"
          value={<DecisionValue decision={kyc.cip.decision} />}
        />
        <DetailRow label="Last re-run by" value={owner?.lastReRunBy} />
        <DetailRow label="Re-run reason" value={owner?.reRunReason} />
      </div>
    </section>
  )
}

export type KycDrawerTaskType = 'CIP' | 'AML'

export function KycInstantIdDrawer({
  party,
  owner,
  taskType,
  onReRun,
}: {
  party: RelatedParty
  owner?: OwnerKycReviewState
  taskType: KycDrawerTaskType
  onReRun?: (partyId: string) => void
}) {
  const kyc = party.kyc
  if (!kyc) return null

  const badge = getKycStatusBadge(owner, party)
  const showReRun = taskType === 'CIP' && Boolean(onReRun)

  return (
    <div className="space-y-4">
      <OverallKycSummary kyc={kyc} owner={owner} party={party} />

      <Separator className="!my-5" />

      {taskType === 'CIP' ? (
        <CipDrawerBody kyc={kyc} party={party} />
      ) : (
        <AmlDrawerBody kyc={kyc} party={party} />
      )}

      <Separator className="!my-5" />
      <MetadataSection kyc={kyc} owner={owner} />

      {showReRun ? (
        <>
          <Separator className="!my-5" />
          <div className="pt-1 pb-0.5">
            <VerificationReRunAction
              subdued={badge.status === 'pass'}
              onClick={() => onReRun!(party.id)}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
