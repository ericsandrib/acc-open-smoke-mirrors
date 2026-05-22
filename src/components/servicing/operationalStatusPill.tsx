import type { ReactNode } from 'react'
import { Ban, Check, CircleDot } from 'lucide-react'
import type { JourneyStatus } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { getStatusSemanticClasses } from '@/utils/statusSemanticColors'

/** Shared pill chrome for journey / task / servicing table status badges. */
const pillBase =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap'

const RING_R = 6
const RING_C = 2 * Math.PI * RING_R
/** ~¾ ring from 12 o’clock — matches production “In Progress” badge (not a ¼ arc at the bottom). */
const IN_PROGRESS_ARC = RING_C * 0.75

export function InProgressRingIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r={RING_R}
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity={0.28}
      />
      <circle
        cx="8"
        cy="8"
        r={RING_R}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${IN_PROGRESS_ARC} ${RING_C - IN_PROGRESS_ARC}`}
        transform="rotate(-90 8 8)"
      />
    </svg>
  )
}

/** Matches dashboard “Draft” badge — dashed ring. */
export function DraftRingIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r={RING_R}
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="28"
        strokeDashoffset="20"
      />
    </svg>
  )
}

export type OperationalStatusKey = TaskStatus | JourneyStatus

type Appearance = {
  label: string
  className: string
  icon: ReactNode
}

// All pill styling resolves through the shared semantic palette
// (src/utils/statusSemanticColors.ts) so badges + widget icon colors stay in lockstep.

const completedAppearance: Appearance = {
  label: 'Completed',
  className: getStatusSemanticClasses('complete').pill,
  icon: <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />,
}

const draftAppearance: Appearance = {
  label: 'Draft',
  className: getStatusSemanticClasses('draft').pill,
  icon: <DraftRingIcon />,
}

const readyAppearance: Appearance = {
  label: 'Ready to Begin',
  className: getStatusSemanticClasses('not_started').pill,
  icon: <CircleDot className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />,
}

const inProgressAppearance: Appearance = {
  label: 'In Progress',
  className: getStatusSemanticClasses('in_progress').pill,
  icon: <InProgressRingIcon />,
}

const blockedAppearance: Appearance = {
  label: 'Blocked',
  className: getStatusSemanticClasses('blocked').pill,
  icon: <Ban className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />,
}

const rejectedAppearance: Appearance = {
  label: 'Rejected',
  className: getStatusSemanticClasses('rejected').pill,
  icon: <Ban className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />,
}

const canceledAppearance: Appearance = {
  label: 'Canceled',
  className: getStatusSemanticClasses('canceled').pill,
  icon: <Ban className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />,
}

export const operationalStatusByKey: Record<OperationalStatusKey, Appearance> = {
  not_started: readyAppearance,
  in_progress: inProgressAppearance,
  complete: completedAppearance,
  blocked: blockedAppearance,
  canceled: canceledAppearance,
  cancelled: canceledAppearance,
  awaiting_review: inProgressAppearance,
  rejected: rejectedAppearance,
}

export type OperationalPillVariant = 'draft' | 'completed' | 'ready' | 'inProgress' | 'declined'

const variantAppearance: Record<OperationalPillVariant, Appearance> = {
  draft: draftAppearance,
  completed: completedAppearance,
  ready: readyAppearance,
  inProgress: inProgressAppearance,
  // Legacy 'declined' variant — treat as rejected (danger) for backward compat.
  declined: rejectedAppearance,
}

export function OperationalStatusPill({
  status,
  variant,
  label,
  className,
  title,
  showIcon = true,
}: {
  status?: OperationalStatusKey
  variant?: OperationalPillVariant
  /** Override label (e.g. reviewer pipeline copy); uses `className` when provided. */
  label?: string
  className?: string
  title?: string
  showIcon?: boolean
}) {
  const resolved =
    (variant ? variantAppearance[variant] : undefined) ??
    (status ? operationalStatusByKey[status] : undefined)
  const text = label ?? resolved?.label ?? 'Ready to Begin'
  const styles = className ?? resolved?.className ?? readyAppearance.className
  const icon = resolved?.icon

  return (
    <span title={title} className={cn(pillBase, styles)}>
      {showIcon && icon}
      {text}
    </span>
  )
}
