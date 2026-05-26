import { useMemo, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AssigneeQuickAssignMenu } from '@/components/wizard/AssigneeQuickAssignMenu'
import { formatDueTooltip } from '@/utils/pizzaTrackerMeta'
import { cn } from '@/lib/utils'

/** Fixed slots so action / task rows share one vertical meta axis in the pizza tracker. */
const META_DATE_SLOT = 'w-11'
const META_ASSIGNEE_SLOT = 'w-5'
const META_TRAILING_SLOT = 'w-5'
/** Shared icon footprint for assignee + progress columns. */
const META_ROW_MIN_HEIGHT = 'min-h-5'
export const PIZZA_TRACKER_META_ICON_CLASS = 'h-5 w-5'

/** Extra row padding inside the scroll pane (pairs with scroll pane `pr-3`). */
export const PIZZA_TRACKER_META_ROW_PADDING = 'pr-1.5'
/** Full right inset from sidebar edge for header meta (scroll `pr-3` + row `pr-1.5`). */
export const PIZZA_TRACKER_META_HEADER_PADDING = 'pr-[1.125rem]'

export function PizzaTrackerDueDateLabel({
  dateLabel,
  dueAt,
}: {
  dateLabel: string
  dueAt?: string
}) {
  const tooltip = useMemo(() => formatDueTooltip(dateLabel, dueAt), [dateLabel, dueAt])
  if (!dateLabel.trim()) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="shrink-0 cursor-default rounded-sm px-0.5 text-xs font-medium tabular-nums text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={tooltip}
        >
          {dateLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function PizzaTrackerRowMeta({
  showDueDateColumn,
  showAssigneeColumn,
  reserveTrailingColumn = true,
  dateLabel,
  dueAt,
  assigneeLabel,
  assigneeCount,
  assigneeNames,
  onAssign,
  successDescription,
  assignScopeLabel = 'action',
  trailing,
}: {
  /** Reserve the due-date column (may be empty on action rows). */
  showDueDateColumn: boolean
  /** Reserve the assignee avatar column. */
  showAssigneeColumn: boolean
  /** Reserve the progress / status icon column when sibling rows show trailing icons. */
  reserveTrailingColumn?: boolean
  dateLabel?: string
  dueAt?: string
  assigneeLabel?: string
  /** When > 1, action row shows a count badge instead of a single avatar. */
  assigneeCount?: number
  assigneeNames?: string[]
  /** When set, avatar opens quick-assign search menu. */
  onAssign?: (assignee: string) => void | (() => void)
  successDescription?: (name: string) => string
  /** Wording for multi-assignee quick-assign menu (e.g. action vs journey). */
  assignScopeLabel?: 'action' | 'journey'
  trailing?: ReactNode
}) {
  const showTrailingColumn = reserveTrailingColumn || Boolean(trailing)
  if (!showDueDateColumn && !showAssigneeColumn && !showTrailingColumn) return null

  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', META_ROW_MIN_HEIGHT)}>
      {showDueDateColumn ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-end',
            dateLabel ? META_DATE_SLOT : 'w-0',
            META_ROW_MIN_HEIGHT,
          )}
        >
          {dateLabel ? <PizzaTrackerDueDateLabel dateLabel={dateLabel} dueAt={dueAt} /> : null}
        </div>
      ) : null}
      {showAssigneeColumn ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center',
            META_ASSIGNEE_SLOT,
            META_ROW_MIN_HEIGHT,
          )}
        >
          {onAssign ? (
            <AssigneeQuickAssignMenu
              assigneeLabel={assigneeLabel}
              assigneeCount={assigneeCount}
              assigneeNames={assigneeNames}
              selectedAssignee={
                assigneeCount != null && assigneeCount > 1 ? undefined : assigneeLabel
              }
              onAssign={onAssign}
              successDescription={successDescription}
              assignScopeLabel={assignScopeLabel}
              size="compact"
            />
          ) : null}
        </div>
      ) : null}
      {showTrailingColumn ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center',
            META_TRAILING_SLOT,
            META_ROW_MIN_HEIGHT,
          )}
        >
          {trailing}
        </div>
      ) : null}
    </div>
  )
}
