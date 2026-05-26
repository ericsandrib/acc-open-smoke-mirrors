import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const TASK_NAME_TOOLTIP_DELAY_MS = 500

export function PizzaTrackerTaskNameTooltip({
  label,
  tooltipLabel,
  className,
}: {
  label: string
  /** Full name when it differs from the truncated nav label. */
  tooltipLabel?: string
  className?: string
}) {
  const tip = (tooltipLabel ?? label).trim()
  if (!tip) {
    return <span className={cn('min-w-0 truncate', className)}>{label}</span>
  }

  return (
    <Tooltip delayDuration={TASK_NAME_TOOLTIP_DELAY_MS}>
      <TooltipTrigger asChild>
        <span className={cn('min-w-0 truncate', className)}>{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
