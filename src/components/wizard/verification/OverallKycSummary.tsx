import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import type { PartyKycResult } from '@/types/kycResult'
import { VerificationKycStatusBadge } from '@/components/wizard/verification/VerificationKycStatusBadge'
import {
  overallKycCardStatus,
  overallKycPassFailFromOwner,
  type VerificationCardStatus,
} from '@/utils/kycPassFail'

function supportingCopy(status: VerificationCardStatus): string {
  if (status === 'Pass') return 'All verification checks passed.'
  if (status === 'Fail') return 'One or more verification checks require review.'
  if (status === 'Expired') return 'One or more verification results have expired.'
  if (status === 'Error') return 'Verification could not be completed.'
  return 'Verification is in progress or needs to be re-run.'
}

export function OverallKycSummary({
  kyc,
  owner,
  party,
}: {
  kyc?: PartyKycResult
  owner?: OwnerKycReviewState
  party?: RelatedParty
}) {
  const status = kyc
    ? overallKycCardStatus(kyc)
    : (overallKycPassFailFromOwner(owner, party) as VerificationCardStatus)

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Overall KYC</span>
        <VerificationKycStatusBadge outcome={status} size="overall" />
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{supportingCopy(status)}</p>
    </section>
  )
}
