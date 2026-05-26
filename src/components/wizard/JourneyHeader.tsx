import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PizzaTrackerHeaderMenu } from '@/components/wizard/PizzaTrackerHeaderMenu'
import { PizzaTrackerRowMeta, PIZZA_TRACKER_META_HEADER_PADDING, PIZZA_TRACKER_META_ICON_CLASS } from '@/components/wizard/PizzaTrackerRowMeta'
import { PizzaTrackerTaskNameTooltip } from '@/components/wizard/PizzaTrackerTaskNameTooltip'
import { JourneyProgressRing } from '@/components/wizard/ProgressIcons'
import { usePizzaTrackerDisplayPrefs } from '@/components/wizard/usePizzaTrackerDisplayPrefs'
import { useWorkflow } from '@/stores/workflowStore'
import { getJourneyDueMeta } from '@/utils/pizzaTrackerMeta'
import { cn } from '@/lib/utils'

export type WorkflowBreadcrumbItem = {
  label: string
  onClick?: () => void
}

/**
 * Top-of-sidebar journey identity: exit control, featured icon, title row,
 * then optional workflow breadcrumb (parent step only; current child is shown in the title area).
 *
 * Shared between {@link StepSidebar} and {@link ChildActionSidebar}.
 */
export function JourneyHeader({
  onExitWorkflow,
  workflowBreadcrumbs,
  onWorkflowBreadcrumbChevronClick,
  journeySubtitle = 'Onboarding',
  onIconClick,
  iconTooltip,
  metaDateLabel,
  metaAssigneeLabel,
  metaProgressPct,
  onAssignJourney,
}: {
  onExitWorkflow: () => void
  /** Parent step link(s) under the journey title when drilled into a child (not the current child). */
  workflowBreadcrumbs?: WorkflowBreadcrumbItem[]
  /** Leading chevron in the breadcrumb strip (e.g. back to parent or browser back). */
  onWorkflowBreadcrumbChevronClick?: () => void
  journeySubtitle?: string
  onIconClick?: () => void
  iconTooltip?: string
  metaDateLabel?: string
  metaAssigneeLabel?: string
  /** 0–100: average pizza-tracker completion across sidebar-visible tasks. */
  metaProgressPct?: number
  onAssignJourney?: (assignee: string) => void | (() => void)
}) {
  const { state } = useWorkflow()
  const navigate = useNavigate()
  const { prefs, setShowDueDate, setShowAssignee } = usePizzaTrackerDisplayPrefs()
  const journeyDueMeta = getJourneyDueMeta(state)
  const dateLabel =
    typeof metaDateLabel === 'string' && metaDateLabel.trim().length > 0
      ? metaDateLabel.trim()
      : journeyDueMeta.dateLabel
  const dueAt =
    typeof metaDateLabel === 'string' && metaDateLabel.trim().length > 0
      ? state.journeyDueAt
      : journeyDueMeta.dueAt
  const assigneeLabel =
    typeof metaAssigneeLabel === 'string' && metaAssigneeLabel.trim().length > 0
      ? metaAssigneeLabel.trim()
      : state.assignedTo

  const journeyProgressRounded =
    typeof metaProgressPct === 'number' && Number.isFinite(metaProgressPct)
      ? Math.round(metaProgressPct)
      : null

  const chevronHandler = onWorkflowBreadcrumbChevronClick ?? (() => navigate(-1))
  const showWorkflowCrumbs = Array.isArray(workflowBreadcrumbs) && workflowBreadcrumbs.length > 0

  return (
    <div>
      <div className="flex items-center px-3 pt-5 pb-5">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground hover:no-underline"
          onClick={onExitWorkflow}
        >
          Exit workflow
        </Button>
      </div>

      <div className="flex h-10 items-center justify-between px-3">
        {onIconClick ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-md bg-[var(--bg-tertiary)] text-muted-foreground hover:bg-[var(--bg-tertiary)]"
                onClick={onIconClick}
                aria-label={iconTooltip ?? 'Onboarding'}
              >
                <Briefcase className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{iconTooltip ?? 'Onboarding'}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-muted-foreground"
            aria-hidden
          >
            <Briefcase className="h-4 w-4" />
          </span>
        )}
        <PizzaTrackerHeaderMenu
          showDueDate={prefs.showDueDate}
          showAssignee={prefs.showAssignee}
          onShowDueDateChange={setShowDueDate}
          onShowAssigneeChange={setShowAssignee}
        />
      </div>

      <div
        className={cn(
          'flex min-h-[3.25rem] items-center gap-2 border-b border-border py-2 pl-3',
          PIZZA_TRACKER_META_HEADER_PADDING,
        )}
      >
        <div className="flex-1 min-w-0">
          <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
            <PizzaTrackerTaskNameTooltip
              label={state.journeyName ?? 'Client Onboarding'}
              className="block truncate"
            />
          </h2>
          <p className="truncate text-xs text-muted-foreground">{journeySubtitle}</p>
        </div>
        <PizzaTrackerRowMeta
          showDueDateColumn={prefs.showDueDate}
          showAssigneeColumn={prefs.showAssignee}
          dateLabel={dateLabel}
          dueAt={dueAt}
          assigneeLabel={assigneeLabel}
          onAssign={onAssignJourney}
          trailing={
            journeyProgressRounded != null ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex shrink-0 items-center justify-center"
                    role="img"
                    aria-label={`${journeyProgressRounded}% Complete`}
                  >
                    <JourneyProgressRing pct={metaProgressPct ?? 0} className={PIZZA_TRACKER_META_ICON_CLASS} />
                    <span className="sr-only">{journeyProgressRounded}% Complete</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="end">
                  <p>{journeyProgressRounded}% Complete</p>
                </TooltipContent>
              </Tooltip>
            ) : null
          }
        />
      </div>

      {showWorkflowCrumbs ? (
        <div className="flex min-h-9 items-center gap-1 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={chevronHandler}
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-1 overflow-x-auto text-xs text-muted-foreground">
            {workflowBreadcrumbs!.map((item, idx) => (
              <span key={`${idx}-${item.label}`} className="flex shrink-0 items-center gap-x-1">
                {idx > 0 ? (
                  <span className="shrink-0 text-muted-foreground/70" aria-hidden>
                    /
                  </span>
                ) : null}
                {item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      'max-w-[10rem] truncate text-left font-medium text-muted-foreground',
                      'hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="max-w-[11rem] truncate font-medium text-foreground/85">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
