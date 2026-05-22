import { cn } from '@/lib/utils'
import { getStatusSemanticClasses } from '@/utils/statusSemanticColors'
import type { KycStatusBadge, KycStatusTone } from '@/utils/kycStatus'

/** Map the KYC tone to the spec-006 semantic palette key. */
function semanticForTone(tone: KycStatusTone): string {
  if (tone === 'success') return 'complete'
  if (tone === 'danger') return 'rejected'
  if (tone === 'warning') return 'escalation_hold'
  return 'draft' // neutral
}

const PILL_BASE =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap'

/**
 * Primary KYC disposition badge.
 *
 * Renders the four (+1 future) KYC states with the spec-006 semantic palette so
 * the same visual language applies across Account & Owners chips and the
 * verification subject rows in the AML / CIP review tasks.
 */
export function KycStatusPill({
  badge,
  className,
  showHint = false,
}: {
  badge: KycStatusBadge
  className?: string
  /** Append the short operational hint inline (e.g. "Fail · Address mismatch"). */
  showHint?: boolean
}) {
  const classes = getStatusSemanticClasses(semanticForTone(badge.tone))
  return (
    <span
      className={cn(PILL_BASE, classes.pill, className)}
      title={badge.hint}
      aria-label={badge.hint ? `${badge.label} — ${badge.hint}` : badge.label}
    >
      {badge.label}
      {showHint && badge.hint ? <span className="ml-1.5 font-normal opacity-80">· {badge.hint}</span> : null}
    </span>
  )
}
