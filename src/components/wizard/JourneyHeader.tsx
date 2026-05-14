import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AssigneeContactHover } from '@/components/wizard/AssigneeContactHover'
import { JourneyProgressRing } from '@/components/wizard/ProgressIcons'
import { useWorkflow } from '@/stores/workflowStore'

/**
 * Top-of-sidebar header that establishes the active journey:
 * back button → 36×36 featured journey icon → journey title.
 *
 * Shared between the journey-level StepSidebar and the sub-action
 * ChildActionSidebar so the journey identity persists when drilling in.
 */
export function JourneyHeader({
  backLabel,
  onBack,
  onChevronBack,
  breadcrumbItems,
  showChevron = true,
  onIconClick,
  iconTooltip,
  metaDateLabel,
  metaAssigneeLabel,
  metaProgressPct,
}: {
  backLabel?: string
  onBack?: () => void
  onChevronBack?: () => void
  breadcrumbItems?: Array<{ label: string; onClick?: () => void }>
  showChevron?: boolean
  onIconClick?: () => void
  iconTooltip?: string
  metaDateLabel?: string
  metaAssigneeLabel?: string
  /** 0–100: average pizza-tracker completion across sidebar-visible tasks. */
  metaProgressPct?: number
} = {}) {
  const { state } = useWorkflow()
  const navigate = useNavigate()
  const showsBreadcrumbBack = typeof backLabel === 'string' && backLabel.trim().length > 0
  const hasBreadcrumbItems = Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0
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

  return (
    <div>
      <div className="flex h-14 items-center px-2">
        {hasBreadcrumbItems ? (
          <div className="flex h-8 items-center gap-1 text-xs text-muted-foreground min-w-0">
            {showChevron ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={onChevronBack ?? (() => navigate(-1))}
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            {breadcrumbItems.map((item, idx) => (
              <div key={`${item.label}-${idx}`} className="flex items-center min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={item.onClick}
                >
                  <span className="truncate">{item.label}</span>
                </Button>
                {idx < breadcrumbItems.length - 1 ? (
                  <span className="mx-0.5 shrink-0 text-muted-foreground/70" aria-hidden>
                    /
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : showsBreadcrumbBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-1.5 text-xs text-muted-foreground"
            onClick={onBack ?? (() => navigate(-1))}
            aria-label={`Back to ${backLabel}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="truncate">{backLabel}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground"
            onClick={onBack ?? (() => navigate(-1))}
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
      <div className="flex h-14 items-center px-3">
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
      <div className="flex h-14 items-center gap-2 px-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {state.journeyName ?? 'Client Onboarding'}
          </h2>
          <p className="truncate text-xs text-muted-foreground">Onboarding</p>
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
    </div>
  )
}
