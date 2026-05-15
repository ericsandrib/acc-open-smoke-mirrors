import type { ReactNode } from 'react'
import { Ban, Check, CircleDot } from 'lucide-react'
import type { JourneyStatus } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'

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

const completedAppearance: Appearance = {
  label: 'Completed',
  className: 'border-gray-200 bg-gray-100 text-gray-800',
  icon: <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />,
}

const draftAppearance: Appearance = {
  label: 'Draft',
  className: 'border-gray-200 bg-gray-50 text-gray-600',
  icon: <DraftRingIcon />,
}

const readyAppearance: Appearance = {
  label: 'Ready to Begin',
  className: 'border-green-200 bg-green-50 text-green-700',
  icon: <CircleDot className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />,
}

const inProgressAppearance: Appearance = {
  label: 'In Progress',
  className: 'border-green-200 bg-green-50 text-green-700',
  icon: <InProgressRingIcon />,
}

const declinedAppearance: Appearance = {
  label: 'Declined',
  className: 'border-red-200 bg-red-50 text-red-700',
  icon: <Ban className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />,
}

export const operationalStatusByKey: Record<OperationalStatusKey, Appearance> = {
  not_started: readyAppearance,
  in_progress: inProgressAppearance,
  complete: completedAppearance,
  blocked: declinedAppearance,
  canceled: declinedAppearance,
  cancelled: declinedAppearance,
  awaiting_review: inProgressAppearance,
  rejected: declinedAppearance,
}

export type OperationalPillVariant = 'draft' | 'completed' | 'ready' | 'inProgress' | 'declined'

const variantAppearance: Record<OperationalPillVariant, Appearance> = {
  draft: draftAppearance,
  completed: completedAppearance,
  ready: readyAppearance,
  inProgress: inProgressAppearance,
  declined: declinedAppearance,
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
