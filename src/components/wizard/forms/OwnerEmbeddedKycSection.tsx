import type { RelatedParty } from '@/types/workflow'
import { useWorkflow } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  OWNER_KYC_REQUIRED_FIELD_LABELS,
  getMissingOwnerKycFields,
  getOwnerReviewState,
} from '@/utils/ownerKycReview'
import { getKycStatusBadge } from '@/utils/kycStatus'
import { KycStatusPill } from '@/components/wizard/verification/KycStatusPill'

type OwnerEmbeddedKycSectionProps = {
  accountChildId: string
  party: RelatedParty
}

export function OwnerEmbeddedKycSection({ accountChildId, party }: OwnerEmbeddedKycSectionProps) {
  const { state } = useWorkflow()
  const ownerReview = getOwnerReviewState(state, accountChildId, party.id)
  const isAdvisor = (state.demoViewMode ?? 'advisor') === 'advisor'

  if (party.type === 'related_organization') {
    return (
      <p className="text-xs text-muted-foreground mt-2 pl-1">
        Entity owners use firm-level verification; per-person KYC applies to trustees and beneficial owners linked on the trust profile.
      </p>
    )
  }

  const missingFields = getMissingOwnerKycFields(party)
  const reusedFromPrior = Boolean(ownerReview?.reusableVerifiedKyc) && !ownerReview?.autoTriggeredAt
  const badge = getKycStatusBadge(ownerReview, party)

  return (
    <div className="mt-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3 space-y-2">
      {/* One synthesized KYC chip — AML and CIP move to the side-sheet detail surface for reviewers. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            KYC status
          </span>
          <KycStatusPill badge={badge} />
        </div>
        {reusedFromPrior && (
          <span className="text-[11px] text-muted-foreground">Reused from prior verification</span>
        )}
      </div>
      {badge.hint && (
        <p className="text-[11px] text-muted-foreground">{badge.hint}</p>
      )}

      {missingFields.length > 0 && (
        <div className="rounded-md border border-amber-300/70 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Missing required fields for KYC
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200/80">
            {missingFields.map((f) => OWNER_KYC_REQUIRED_FIELD_LABELS[f]).join(', ')}
          </p>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-200/70">
            Owner verification runs once these fields are complete and the forms package is sent.
          </p>
        </div>
      )}

      {missingFields.length === 0 && !ownerReview?.autoTriggeredAt && !reusedFromPrior && (
        <p className="text-xs text-muted-foreground">
          Owner verification will run when the forms package is sent to the client.
        </p>
      )}

      {ownerReview?.amlReview?.status === 'info_requested' && isAdvisor && (
        <Badge variant="outline" className={cn('text-xs', 'border-amber-300 text-amber-800')}>
          Additional information requested — update owner details or documents
        </Badge>
      )}
      {ownerReview?.hoKycReview?.status === 'changes_requested' && isAdvisor && (
        <Badge variant="outline" className={cn('text-xs', 'border-amber-300 text-amber-800')}>
          Home office requested changes — review CIP feedback and update
        </Badge>
      )}
    </div>
  )
}
