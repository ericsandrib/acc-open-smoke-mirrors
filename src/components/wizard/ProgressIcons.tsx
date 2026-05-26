import { CircleAlert, LoaderCircle } from 'lucide-react'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'

/**
 * Right-side progress icon for pizza-tracker tasks. Maps the existing
 * `getTaskFieldProgress` output (filled/total) plus task `edited`/`status`
 * onto the discrete variants from the Figma "Progress icons" component set
 * (`Working File -> Child Actions (Bianca)`, node 845:33961).
 */
export type ProgressIconVariant =
  | 'to-start'
  | 'ambiguous'
  | '25'
  | '33'
  | '50'
  | '66'
  | '75'
  | 'done'
  | 'canceled'

const PCT_BY_VARIANT: Record<'25' | '33' | '50' | '66' | '75', number> = {
  '25': 0.25,
  '33': 0.33,
  '50': 0.5,
  '66': 0.66,
  '75': 0.75,
}

const RING_RADIUS = 6.665
const RING_STROKE = 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
/** Primary dark — in-progress and complete task status icons. */
const PROGRESS_ICON_COLOR = 'text-primary'
const NOT_STARTED_ICON_COLOR = 'text-muted-foreground'

function PercentArc({ pct }: { pct: number }) {
  const filled = Math.max(0, Math.min(1, pct)) * RING_CIRCUMFERENCE
  return (
    <>
      <circle
        cx="8"
        cy="8"
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx="8"
        cy="8"
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={RING_STROKE}
        strokeDasharray={`${filled} ${RING_CIRCUMFERENCE}`}
        transform="rotate(-90 8 8)"
        strokeLinecap="butt"
      />
    </>
  )
}

/** Journey header progress ring — success green, distinct from row-level task icons. */
const JOURNEY_PROGRESS_COLOR = 'text-text-success-primary'

/** Journey-level progress indicator (sidebar header). Sized to match the task status icons below. */
export function JourneyProgressRing({
  pct: _pct,
  className,
}: {
  pct: number
  className?: string
}) {
  return (
    <LoaderCircle
      className={cn('h-4 w-4 shrink-0', JOURNEY_PROGRESS_COLOR, className)}
      aria-hidden
    />
  )
}

export function ProgressIcon({
  variant,
  className,
}: {
  variant: ProgressIconVariant
  className?: string
}) {
  if (variant === 'canceled') {
    return <CircleAlert className={cn('h-4 w-4 text-destructive', className)} aria-hidden />
  }

  if (variant === 'done') {
    return (
      <svg viewBox="0 0 16 16" className={cn('h-4 w-4', PROGRESS_ICON_COLOR, className)} aria-hidden>
        <path
          d="M3 8.25 L6.5 11.75 L13 4.25"
          stroke="currentColor"
          strokeWidth="1.15"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (variant === 'to-start') {
    return (
      <svg
        viewBox="0 0 16 16"
        className={cn('h-4 w-4', NOT_STARTED_ICON_COLOR, className)}
        aria-hidden
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="2 1.7"
        />
      </svg>
    )
  }

  if (variant === 'ambiguous') {
    return (
      <svg
        viewBox="0 0 16 16"
        className={cn('h-4 w-4', PROGRESS_ICON_COLOR, className)}
        aria-hidden
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-4 w-4', PROGRESS_ICON_COLOR, className)}
      aria-hidden
    >
      <PercentArc pct={PCT_BY_VARIANT[variant]} />
    </svg>
  )
}

/**
 * Choose a Figma variant from the runtime task signals. Snap continuous
 * percentages to the nearest discrete checkpoint defined in the icon set.
 */
export function pickVariant({
  pct,
  total,
  edited,
  status,
}: {
  pct: number
  total: number
  edited: boolean
  status: TaskStatus
}): ProgressIconVariant {
  if (status === 'canceled') return 'canceled'
  if (total === 0) return 'ambiguous'
  if (pct >= 1) return 'done'
  if (pct === 0) return edited ? '25' : 'to-start'
  if (pct < 0.3) return '25'
  if (pct < 0.42) return '33'
  if (pct < 0.58) return '50'
  if (pct < 0.7) return '66'
  return '75'
}
