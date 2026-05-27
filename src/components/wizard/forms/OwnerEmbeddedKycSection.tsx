import type { RelatedParty } from '@/types/workflow'
import { useWorkflow } from '@/stores/workflowStore'
import {
  OWNER_KYC_REQUIRED_FIELD_LABELS,
  getMissingOwnerKycFields,
  getOwnerReviewState,
} from '@/utils/ownerKycReview'
import { ownerRequiresAdditionalVerification } from '@/utils/kycStatus'
import { OwnerVerificationAdvisorBanner } from '@/components/wizard/verification/KycStatusToastChip'

type OwnerEmbeddedKycSectionProps = {
  accountChildId: string
  party: RelatedParty
}

export function OwnerEmbeddedKycSection({ accountChildId, party }: OwnerEmbeddedKycSectionProps) {
  const { state } = useWorkflow()
  const ownerReview = getOwnerReviewState(state, accountChildId, party.id)

  if (party.type === 'related_organization') {
    return (
      <p className="text-xs text-muted-foreground mt-2 pl-1">
        Entity owners use firm-level verification; trustees and beneficial owners linked on the trust
        profile may require additional documentation.
      </p>
    )
  }

  const missingFields = getMissingOwnerKycFields(party)
  const showBanner = ownerRequiresAdditionalVerification(ownerReview, party)

  if (!showBanner && missingFields.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {showBanner ? (
        <OwnerVerificationAdvisorBanner owner={ownerReview} party={party} />
      ) : null}
      {missingFields.length > 0 ? (
        <div className="rounded-md border border-amber-300/70 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Additional information needed
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200/80">
            {missingFields.map((f) => OWNER_KYC_REQUIRED_FIELD_LABELS[f]).join(', ')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
