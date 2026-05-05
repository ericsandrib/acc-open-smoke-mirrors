import { useEffect, useMemo, useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { taskSections } from './formRegistry'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { getAccountOpeningSubTaskProgress } from '@/utils/accountOpeningChildProgress'
import type { LucideIcon } from 'lucide-react'
import { ChevronLeft, FileText, Clock, ShieldCheck, Wallet, ArrowDownToLine, Cog, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { getActiveStageLabel } from '@/components/wizard/ChildActionTimelineSheet'
import { useTheme } from '@/stores/themeStore'
import { JourneyHeader } from '@/components/wizard/JourneyHeader'
import { ProgressIcon, pickVariant } from '@/components/wizard/ProgressIcons'
import type { TaskStatus } from '@/types/workflow'

const DEFAULT_TASK_SECTIONS = [{ id: '__top__', label: 'Overview' }] as const
const BENEFICIARY_ENABLED_REGISTRATIONS = new Set(['TOD_IND', 'TOD_JT', 'IRA', 'ROTH_IRA'])

const CHILD_TYPE_ICONS: Record<string, LucideIcon> = {
  'account-opening': Wallet,
  kyc: ShieldCheck,
  'funding-line': ArrowDownToLine,
  'feature-service-line': Cog,
}

function getChildIcon(childType: string): LucideIcon {
  return CHILD_TYPE_ICONS[childType] ?? ListChecks
}

/**
 * Mirrors StepSidebar's TaskProgressIndicator so the sub-task pizza tracker
 * uses the same Figma icon set + tooltip copy as the parent journey.
 */
function SubTaskProgressIndicator({
  subTaskId,
  accountOpeningChildId,
  subTaskSuffix,
}: {
  subTaskId: string
  accountOpeningChildId?: string
  subTaskSuffix?: string
}) {
  const { state } = useWorkflow()
  const hasData = !!state.taskData[subTaskId] && Object.keys(state.taskData[subTaskId]).length > 0
  const isSubmitted = state.submittedTaskIds.includes(subTaskId)

  const accountChild =
    accountOpeningChildId &&
    state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === accountOpeningChildId)
  const lockedComplete =
    accountChild &&
    (accountChild.status === 'awaiting_review' || accountChild.status === 'complete')
  const isCanceled = accountChild?.status === 'canceled'

  let filled = 0
  let total = 1
  if (accountOpeningChildId && subTaskSuffix && !lockedComplete) {
    const progress = getAccountOpeningSubTaskProgress(state, accountOpeningChildId, subTaskSuffix)
    filled = progress.filled
    total = Math.max(progress.total, 1)
  } else if (lockedComplete) {
    filled = 1
  } else {
    filled = isSubmitted || hasData ? 1 : 0
  }
  const pct = Math.min(1, Math.max(0, filled / total))
  const edited = hasData
  const status: TaskStatus = isCanceled
    ? 'canceled'
    : pct >= 1
    ? 'complete'
    : 'in_progress'

  const variant = pickVariant({ pct, total, edited, status })
  const displayPct = Math.max(0, Math.min(100, Math.round(pct * 100)))
  const tooltipText =
    variant === 'canceled'
      ? 'Canceled'
      : variant === 'done'
      ? edited
        ? 'Complete · Edited'
        : 'Complete'
      : variant === 'ambiguous'
      ? 'No progress to report'
      : displayPct === 0
      ? edited
        ? 'Not started · Edited'
        : 'Not started'
      : edited
      ? `${displayPct}% complete · Edited`
      : `${displayPct}% complete`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="shrink-0 inline-flex items-center justify-center h-4 w-4"
          role="img"
          aria-label={tooltipText}
        >
          <ProgressIcon variant={variant} />
          <span className="sr-only">{tooltipText}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function ChildActionSidebar() {
  const { state, dispatch } = useWorkflow()
  const { taskSectionNavStyle } = useTheme()
  const ctx = useChildActionContext()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const { setCollapsed: setRightPanelCollapsed } = useWizardRightPanel()

  if (!ctx) return null

  const { child, config, subTaskIndex } = ctx
  /** Match top-level nav style: no numeric prefixes for drill-in child flows. */
  const showSubTaskNumbers =
    child.childType !== 'account-opening' &&
    child.childType !== 'kyc' &&
    child.childType !== 'funding-line' &&
    child.childType !== 'feature-service-line'
  const viewMode = state.demoViewMode
  const activeSubTask = config.subTasks[subTaskIndex]
  const activeSections = useMemo(
    () => (activeSubTask ? taskSections[activeSubTask.formKey] ?? DEFAULT_TASK_SECTIONS : DEFAULT_TASK_SECTIONS),
    [activeSubTask],
  )

  useEffect(() => {
    setActiveSectionId(activeSections[0]?.id ?? null)
  }, [subTaskIndex, activeSections])

  const parentTask = state.tasks.find((t) =>
    (t.children ?? []).some((c) => c.id === child.id),
  )
  const parentAction = parentTask
    ? state.actions.find((a) => a.id === parentTask.actionId)
    : undefined
  const breadcrumbLabel = parentAction?.title ?? parentTask?.title ?? 'Back'
  const ChildIcon = getChildIcon(child.childType)

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-[330px] border-r border-border bg-white overflow-y-auto flex flex-col">
        <JourneyHeader />
        <div className="flex h-9 items-center gap-1 px-2 border-b border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}
            aria-label={`Back to ${breadcrumbLabel}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="text-xs text-muted-foreground truncate">
            {breadcrumbLabel}
          </span>
        </div>
        <div className="mb-1.5 flex h-[26px] items-center gap-2 px-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-muted-foreground">
            <ChildIcon className="h-3 w-3" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-foreground truncate">
            {child.name}
          </h2>
        </div>

        <ul className="space-y-1 px-1">
          {config.subTasks.map((subTask, idx) => {
            const subTaskId = `${child.id}-${subTask.suffix}`
            const childMeta = state.taskData[child.id] as Record<string, unknown> | undefined
            const childRegType = (childMeta?.registrationType as string | undefined) ?? null
            const sections = (taskSections[subTask.formKey] ?? DEFAULT_TASK_SECTIONS).filter((section) => {
              if (subTask.formKey !== 'acct-child-account-owners') return true
              if (section.id !== 'acct-beneficiaries') return true
              return childRegType != null && BENEFICIARY_ENABLED_REGISTRATIONS.has(childRegType)
            })
            return (
              <li key={subTask.suffix}>
                <button
                  onClick={() => dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })}
                  aria-current={idx === subTaskIndex ? 'page' : undefined}
                  className={cn(
                    'w-full text-left pl-12 pr-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between gap-2 transition-colors',
                    idx === subTaskIndex
                      ? 'bg-accent/60 text-foreground'
                      : 'hover:bg-muted/50 text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center gap-2 truncate min-w-0',
                      idx === subTaskIndex ? 'font-semibold' : '',
                    )}
                  >
                    {showSubTaskNumbers && (
                      <span className="text-[11px] text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                    )}
                    {getSubTaskDisplayTitle(child.childType, subTask, viewMode)}
                  </span>
                  <SubTaskProgressIndicator
                    subTaskId={subTaskId}
                    accountOpeningChildId={child.childType === 'account-opening' ? child.id : undefined}
                    subTaskSuffix={child.childType === 'account-opening' ? subTask.suffix : undefined}
                  />
                </button>
                {taskSectionNavStyle === 'nested' && idx === subTaskIndex && sections.length > 0 ? (
                  <ul className="mt-1.5 ml-4 space-y-1.5 border-l border-border/80 pl-2.5">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (idx !== subTaskIndex) {
                              dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })
                            }
                            setActiveSectionId(section.id)
                            dispatch({ type: 'FOCUS_PARENT_TASK_SECTION', sectionId: section.id })
                          }}
                          aria-current={activeSectionId === section.id ? 'page' : undefined}
                          className={cn(
                            'w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors',
                            activeSectionId === section.id
                              ? 'bg-muted text-foreground font-semibold'
                              : 'cursor-pointer text-foreground/85 hover:text-foreground hover:bg-muted/60',
                          )}
                        >
                          {section.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>

        {(child.childType === 'account-opening' || child.childType === 'kyc') && (() => {
          const reviewState = getChildReviewState(state, child.id)
          const stageLabel = getActiveStageLabel(child.status, child.childType, reviewState ?? undefined)
          const description = stageLabel === 'Draft'
            ? 'Application is in progress. Complete all sections to submit.'
            : `Application is in ${stageLabel}. Check the activity timeline for details.`
          return (
            <div className="mt-auto p-2 border-t border-border">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Application Status</p>
                    <p className="text-base font-bold truncate">{stageLabel}</p>
                  </div>
                </div>
                <div className="border-t border-border p-4">
                  <p className="text-sm text-foreground leading-snug">{description}</p>
                </div>
                <div className="border-t border-border bg-black/5 dark:bg-white/5 px-3 flex items-center" style={{ minHeight: '64px' }}>
                  <button
                    type="button"
                    onClick={() => setRightPanelCollapsed(false)}
                    className="flex items-center gap-2 text-xs font-medium text-foreground/80 hover:text-foreground bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
                  >
                    Activity
                    <Clock className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </nav>
    </TooltipProvider>
  )
}
