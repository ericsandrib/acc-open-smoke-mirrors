import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AssigneeContactHover } from '@/components/wizard/AssigneeContactHover'
import { JourneyProgressRing } from '@/components/wizard/ProgressIcons'
import { useWorkflow } from '@/stores/workflowStore'
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
}) {
  const { state } = useWorkflow()
  const navigate = useNavigate()
  const dateLabel =
    typeof metaDateLabel === 'string' && metaDateLabel.trim().length > 0
      ? metaDateLabel.trim()
      : state.journeyDateLabel
  const assigneeLabel =
    typeof metaAssigneeLabel === 'string' && metaAssigneeLabel.trim().length > 0
      ? metaAssigneeLabel.trim()
      : state.assignedTo

  const dueDateTooltip = useMemo(() => {
    if (!dateLabel) return ''
    if (state.journeyDueAt) {
      const d = new Date(state.journeyDueAt)
      if (!Number.isNaN(d.getTime())) {
        return `Due ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      }
    }
    return `Due ${dateLabel}`
  }, [dateLabel, state.journeyDueAt])

  const journeyProgressRounded =
    typeof metaProgressPct === 'number' && Number.isFinite(metaProgressPct)
      ? Math.round(metaProgressPct)
      : null

  const chevronHandler = onWorkflowBreadcrumbChevronClick ?? (() => navigate(-1))
  const showWorkflowCrumbs = Array.isArray(workflowBreadcrumbs) && workflowBreadcrumbs.length > 0

  return (
    <div>
      <div className="flex items-center px-2.5 pt-5 pb-5">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground hover:no-underline"
          onClick={onExitWorkflow}
        >
          Exit workflow
        </Button>
      </div>

      <div className="flex h-10 items-center justify-between px-2.5">
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
      </div>

      <div className="flex min-h-[3.25rem] items-center gap-2 border-b border-border px-2.5 py-2">
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {state.journeyName ?? 'Client Onboarding'}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{journeySubtitle}</p>
        </div>
        {dateLabel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 cursor-default rounded-sm px-0.5 text-xs font-medium tabular-nums text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={dueDateTooltip}
              >
                {dateLabel}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{dueDateTooltip}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        <AssigneeContactHover assigneeLabel={assigneeLabel} />
        {journeyProgressRounded != null ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex shrink-0 items-center justify-center"
                role="img"
                aria-label={`${journeyProgressRounded}% Complete`}
              >
                <JourneyProgressRing pct={metaProgressPct ?? 0} />
                <span className="sr-only">{journeyProgressRounded}% Complete</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="end">
              <p>{journeyProgressRounded}% Complete</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {showWorkflowCrumbs ? (
        <div className="flex min-h-9 items-center gap-1 px-2 py-2">
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
