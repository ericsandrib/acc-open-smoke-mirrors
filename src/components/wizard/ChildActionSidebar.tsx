import { useEffect, useMemo, useState } from 'react'
import { useWorkflow, useChildActionContext, useAdvisorResubmitEligible } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { taskSections } from './formRegistry'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { getAccountOpeningSubTaskProgress } from '@/utils/accountOpeningChildProgress'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildDisplayStatus } from '@/utils/childStatusDisplay'
import { Check } from 'lucide-react'

const DONUT_R = 7
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R
const DONUT_STROKE_WIDTH = 5
const DEFAULT_TASK_SECTIONS = [{ id: '__top__', label: 'Overview' }] as const
const BENEFICIARY_ENABLED_REGISTRATIONS = new Set(['TOD_IND', 'TOD_JT', 'IRA', 'ROTH_IRA'])

function SubTaskStatusBadge({
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
  const progress = Math.min(1, Math.max(0, filled / total))
  const edited = hasData
  const rawPct = Math.round(progress * 100)
  const displayProgress = edited && rawPct === 0 ? 0.05 : progress
  const displayPct = Math.round(displayProgress * 100)
  const stroke = displayProgress * DONUT_CIRCUMFERENCE
  const isComplete = progress >= 1
  const tooltip = isComplete
    ? 'Complete'
    : displayPct === 0
    ? 'Not started'
    : `${displayPct}% complete`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0 flex items-center justify-center h-4 w-4" role="img" aria-label={tooltip}>
          {isComplete ? (
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-500/50 bg-background text-blue-500"
              aria-hidden
            >
              <Check className="h-2.5 w-2.5" strokeWidth={1.8} />
            </span>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 20 20" aria-hidden>
              <circle
                cx="10"
                cy="10"
                r={DONUT_R}
                fill="none"
                strokeWidth={DONUT_STROKE_WIDTH}
                stroke="var(--color-border-secondary)"
              />
              {displayProgress > 0 && (
                <circle
                  cx="10"
                  cy="10"
                  r={DONUT_R}
                  fill="none"
                  strokeWidth={DONUT_STROKE_WIDTH}
                  stroke="var(--color-fill-category1-primary)"
                  strokeDasharray={`${stroke} ${DONUT_CIRCUMFERENCE}`}
                  strokeLinecap="round"
                  transform="rotate(-90 10 10)"
                />
              )}
            </svg>
          )}
          <span className="sr-only">{tooltip}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function useChildOverallStatus(childId: string): ChildDisplayStatus {
  const { state } = useWorkflow()

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === childId)

  return deriveChildDisplayStatus(child?.status ?? 'not_started', state.childReviewsByChildId?.[childId])
}

export function ChildActionSidebar() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  const overallStatus = useChildOverallStatus(ctx?.child.id ?? '')
  const statusCfg = childStatusConfig[overallStatus]
  const advisorResubmitEligible = useAdvisorResubmitEligible()

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

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto flex flex-col">
        <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {child.name}
          </h2>
        </div>

        <ul className="space-y-1">
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
                    'w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center justify-between gap-2 transition-colors border border-transparent',
                    idx === subTaskIndex
                      ? 'bg-accent/60 text-foreground border-border'
                      : 'hover:bg-muted/50 text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center gap-2 truncate',
                      idx === subTaskIndex ? 'font-semibold border-l-2 border-foreground/50 pl-2 -ml-2' : '',
                    )}
                  >
                    {showSubTaskNumbers && (
                      <span className="text-[11px] text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                    )}
                    {getSubTaskDisplayTitle(child.childType, subTask, viewMode)}
                  </span>
                  <SubTaskStatusBadge
                    subTaskId={subTaskId}
                    accountOpeningChildId={child.childType === 'account-opening' ? child.id : undefined}
                    subTaskSuffix={child.childType === 'account-opening' ? subTask.suffix : undefined}
                  />
                </button>
                {idx === subTaskIndex && sections.length > 0 ? (
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

        <div className="mt-auto min-h-14 border-t border-border px-3 py-3 flex items-center">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <Badge variant="outline" className={cn('text-xs', advisorResubmitEligible ? 'bg-amber-50 text-amber-700 border-amber-200' : statusCfg.className)}>
              {advisorResubmitEligible
                ? 'Action Required'
                : statusCfg.label}
            </Badge>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
