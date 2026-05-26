import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProgressIcon, pickVariant } from '@/components/wizard/ProgressIcons'
import { PIZZA_TRACKER_META_ICON_CLASS } from '@/components/wizard/PizzaTrackerRowMeta'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/workflow'

export function PizzaTrackerProgressIndicator({
  pct,
  total,
  edited,
  status,
}: {
  pct: number
  total: number
  edited: boolean
  status: TaskStatus
}) {
  const variant = pickVariant({ pct, total, edited, status })
  const displayPct = Math.max(0, Math.min(100, Math.round(pct * 100)))
  const tooltipText =
    variant === 'canceled'
      ? 'Canceled'
      : variant === 'done'
        ? edited
          ? 'Pending Release · Edited'
          : 'Pending Release'
        : variant === 'ambiguous'
          ? 'No progress to report'
          : displayPct === 0
            ? edited
              ? 'Not Started · Edited'
              : 'Not Started'
            : edited
              ? `${displayPct}% complete · Edited`
              : `${displayPct}% complete`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center text-muted-foreground/85',
            PIZZA_TRACKER_META_ICON_CLASS,
          )}
          role="img"
          aria-label={tooltipText}
        >
          <ProgressIcon variant={variant} className={PIZZA_TRACKER_META_ICON_CLASS} />
          <span className="sr-only">{tooltipText}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}
