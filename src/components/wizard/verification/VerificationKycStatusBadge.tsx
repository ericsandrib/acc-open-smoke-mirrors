import { cn } from '@/lib/utils'
import { getStatusSemanticClasses } from '@/utils/statusSemanticColors'
import type { VerificationCardStatus } from '@/utils/kycPassFail'

const PILL_BASE = 'inline-flex shrink-0 items-center rounded-full border font-medium'

function semanticForOutcome(outcome: VerificationCardStatus): string {
  if (outcome === 'Pass') return 'complete'
  if (outcome === 'Fail') return 'rejected'
  if (outcome === 'Error' || outcome === 'Expired') return 'clarification_required'
  return 'clarification_required'
}

export function VerificationKycStatusBadge({
  outcome,
  size = 'subsection',
  className,
}: {
  outcome: VerificationCardStatus
  size?: 'overall' | 'subsection'
  className?: string
}) {
  const classes = getStatusSemanticClasses(semanticForOutcome(outcome))
  const label = size === 'overall' ? outcome.toUpperCase() : outcome
  return (
    <span
      className={cn(
        PILL_BASE,
        classes.pill,
        size === 'overall'
          ? 'px-2.5 py-0.5 text-[11px] font-semibold tracking-wide'
          : 'px-2 py-0.5 text-[11px]',
        className,
      )}
    >
      {label}
    </span>
  )
}
