import { useEffect, useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import type { Action, TaskStatus, Task, WorkflowState } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import {
  isOpenAccountsFormKey,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { taskSections } from '@/components/wizard/formRegistry'
import { useTheme } from '@/stores/themeStore'
import {
  useCombinedSectionFocus,
  useOpenAccountsVariant,
} from '@/components/wizard/openAccountsVariantContext'
import { combinedOpenAccountsSections } from '@/components/wizard/combinedOpenAccountsSections'
import { ChevronRight } from 'lucide-react'
import { Circle, Loader, CheckCircle2, Ban, Clock, XCircle, Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'text-text-tertiary',
  in_progress: 'text-text-category1-primary',
  complete: 'text-text-success-primary',
  canceled: 'text-text-tertiary',
  blocked: 'text-text-danger-primary',
  awaiting_review: 'text-text-warning-primary',
  rejected: 'text-text-danger-primary',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  canceled: 'Canceled',
  blocked: 'Blocked',
  awaiting_review: 'Awaiting Review',
  rejected: 'Rejected',
}

const StatusIcon: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  in_progress: Loader,
  complete: CheckCircle2,
  canceled: XCircle,
  blocked: Ban,
  awaiting_review: Clock,
  rejected: XCircle,
}

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const Icon = StatusIcon[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('shrink-0 flex items-center', statusColors[status])}>
          <Icon className={cn('h-3.5 w-3.5', className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{statusLabels[status]}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function getTaskFieldProgress(state: WorkflowState, task: Task): { filled: number; total: number } {
  switch (task.formKey) {
    case 'related-parties': {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const total = members.length * 2
      let filled = 0
      for (const m of members) {
        if (m.email?.trim()) filled++
        if (m.phone?.trim()) filled++
      }
      return { filled, total }
    }
    case 'existing-accounts':
      return {
        filled: state.financialAccounts.length > 0 ? 1 : 0,
        total: 1,
      }
    case 'kyc': {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const needsKyc = members.filter((m) => m.kycStatus !== 'verified')
      const children = task.children ?? []
      const total = Math.max(needsKyc.length, 1)
      const filled = Math.min(
        children.filter((c) => c.status === 'complete').length,
        total,
      )
      return { filled, total }
    }
    case 'open-accounts': {
      const accountChildren = (task.children ?? []).filter((c) => c.childType === 'account-opening')
      const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
      const kycChildren = (kycTask?.children ?? []).filter((c) => c.childType === 'kyc')
      const taskData = (state.taskData[task.id] as Record<string, unknown> | undefined) ?? {}
      const envelopes = Array.isArray(taskData.esignEnvelopes) ? taskData.esignEnvelopes : []

      let filled = 0
      if (accountChildren.length > 0) filled++
      if (kycChildren.length > 0) filled++
      if (envelopes.length > 0) filled++

      return { filled, total: 3 }
    }
    case 'open-accounts-with-annuity': {
      const accountChildren = (task.children ?? []).filter((c) => c.childType === 'account-opening')
      return {
        filled: accountChildren.length > 0 ? 1 : 0,
        total: 1,
      }
    }
    default:
      if (isOpenAccountsFormKey(task.formKey)) return { filled: 0, total: 1 }
      return { filled: 0, total: 0 }
  }
}

function getTaskNavLabel(label: string): string {
  if (label === 'Accounts to Be Opened') return 'Accounts'
  return label
}

const PROGRESS_RING_RADIUS = 6
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS
const PROGRESS_STROKE_WIDTH = 5
const DEFAULT_TASK_SECTIONS = [{ id: '__top__', label: 'Overview' }] as const

function TaskProgressIndicator({
  progress,
}: {
  progress: number
}) {
  const rawPct = Math.round(progress * 100)
  const displayPct = Math.max(0, Math.min(100, rawPct))
  const ringProgress = displayPct / 100
  const filled = ringProgress * PROGRESS_RING_CIRCUMFERENCE
  const isComplete = displayPct >= 100
  const progressText = isComplete
    ? 'Complete'
    : displayPct === 0
      ? 'Not started'
      : `${displayPct}% complete`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0 inline-flex items-center justify-center h-4 w-4" role="img" aria-label={progressText}>
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
                r={PROGRESS_RING_RADIUS}
                fill="none"
                strokeWidth={PROGRESS_STROKE_WIDTH}
                stroke="var(--color-border-secondary)"
              />
              {ringProgress > 0 ? (
                <circle
                  cx="10"
                  cy="10"
                  r={PROGRESS_RING_RADIUS}
                  fill="none"
                  strokeWidth={PROGRESS_STROKE_WIDTH}
                  stroke="var(--color-fill-category1-primary)"
                  strokeDasharray={`${filled} ${PROGRESS_RING_CIRCUMFERENCE}`}
                  strokeLinecap="round"
                  transform="rotate(-90 10 10)"
                />
              ) : null}
            </svg>
          )}
          <span className="sr-only">{progressText}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{progressText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

type DisplayTaskNode = {
  /** Task id used to look up state.activeTaskId / dispatch SET_ACTIVE_TASK. */
  id: string
  label: string
  /** Underlying task ids that this display node represents (1:1 in default/v1, both in v2). */
  underlyingTaskIds: string[]
}

type DisplayActionNode = {
  id: string
  title: string
  tasks: DisplayTaskNode[]
}

/**
 * Build the action/task display structure honoring the demo Account Opening variant.
 *
 * - In a non-split journey (no `account-opening-annuity` action) the structure is unchanged.
 * - In v1 split: merge the two account-opening actions into a single "Account Opening" group,
 *   and rename each open-accounts task to clarify the annuity vs. no-annuity flow.
 * - In v2 split: collapse the two open-accounts tasks into a single virtual "Open Accounts"
 *   task; clicks set the active task to the no-annuity underlying task (the combined-form
 *   wrapper renders both flows in accordions).
 */
function buildDisplayActions(state: WorkflowState, variant: 'v1' | 'v2'): DisplayActionNode[] {
  const visibleActions = state.actions
    .filter((a) => a.id !== 'kyc')
    .sort((a, b) => a.order - b.order)
  const visibleTasks = (action: Action) =>
    state.tasks
      .filter((t) => t.actionId === action.id && t.formKey !== 'kyc' && t.id !== 'kyc-review')
      .sort((a, b) => a.order - b.order)

  const noAnnuityAction = visibleActions.find((a) => a.id === 'account-opening')
  const withAnnuityAction = visibleActions.find((a) => a.id === 'account-opening-annuity')
  const isSplit = !!(noAnnuityAction && withAnnuityAction)

  if (!isSplit) {
    return visibleActions.map((action) => ({
      id: action.id,
      title: action.title,
      tasks: visibleTasks(action).map((t) => ({
        id: t.id,
        label: t.title,
        underlyingTaskIds: [t.id],
      })),
    }))
  }

  const otherActions = visibleActions.filter(
    (a) => a.id !== 'account-opening' && a.id !== 'account-opening-annuity',
  )

  const noAnnuityTasks = visibleTasks(noAnnuityAction)
  const withAnnuityTasks = visibleTasks(withAnnuityAction)

  const accountOpeningGroup: DisplayActionNode = {
    id: 'account-opening',
    title: 'Account Opening',
    tasks: [],
  }

  if (variant === 'v1') {
    for (const t of noAnnuityTasks) {
      accountOpeningGroup.tasks.push({
        id: t.id,
        label: 'Standard Accounts',
        underlyingTaskIds: [t.id],
      })
    }
    for (const t of withAnnuityTasks) {
      accountOpeningGroup.tasks.push({
        id: t.id,
        label: 'Annuity Accounts',
        underlyingTaskIds: [t.id],
      })
    }
  } else {
    const noAnnuity = noAnnuityTasks[0]
    const withAnnuity = withAnnuityTasks[0]
    if (noAnnuity || withAnnuity) {
      const underlying: string[] = []
      if (noAnnuity) underlying.push(noAnnuity.id)
      if (withAnnuity) underlying.push(withAnnuity.id)
      accountOpeningGroup.tasks.push({
        id: noAnnuity?.id ?? withAnnuity!.id,
        label: 'Open Accounts',
        underlyingTaskIds: underlying,
      })
    }
  }

  const result: DisplayActionNode[] = []
  let inserted = false
  for (const action of otherActions) {
    if (
      !inserted &&
      action.order > Math.min(noAnnuityAction.order, withAnnuityAction.order)
    ) {
      result.push(accountOpeningGroup)
      inserted = true
    }
    result.push({
      id: action.id,
      title: action.title,
      tasks: visibleTasks(action).map((t) => ({
        id: t.id,
        label: t.title,
        underlyingTaskIds: [t.id],
      })),
    })
  }
  if (!inserted) result.push(accountOpeningGroup)
  return result
}

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()
  const { taskSectionNavStyle } = useTheme()
  const variant = useOpenAccountsVariant()
  const { requestFocus } = useCombinedSectionFocus()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  const activeTopLevelTask = useMemo(
    () => state.tasks.find((t) => t.id === state.activeTaskId),
    [state.tasks, state.activeTaskId],
  )
  const isV2CombinedActive =
    variant === 'v2' &&
    !!activeTopLevelTask &&
    (activeTopLevelTask.formKey === OPEN_ACCOUNTS_FORM_KEY ||
      activeTopLevelTask.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  const activeSections = useMemo(
    () => (activeTopLevelTask ? taskSections[activeTopLevelTask.formKey] ?? DEFAULT_TASK_SECTIONS : DEFAULT_TASK_SECTIONS),
    [activeTopLevelTask],
  )

  useEffect(() => {
    setActiveSectionId(activeSections[0]?.id ?? null)
  }, [state.activeTaskId, activeSections])

  const displayActions = useMemo(
    () => buildDisplayActions(state, variant),
    [state, variant],
  )

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-64 border-r border-border bg-white p-2 overflow-y-auto">
        <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {state.journeyName ?? 'Client Onboarding'}
          </h2>
        </div>
        {displayActions.map((action) => (
          <div key={action.id} className="mb-5">
            <div className="mb-1.5 px-3">
              <h3 className="text-[12px] font-medium tracking-wide uppercase text-muted-foreground/70">
                {action.title}
              </h3>
            </div>
            <ul className="space-y-1">
              {action.tasks.map((displayTask) => {
                const underlyingTasks = displayTask.underlyingTaskIds
                  .map((id) => state.tasks.find((t) => t.id === id))
                  .filter((t): t is Task => Boolean(t))
                const progressTotals = underlyingTasks
                  .map((t) => getTaskFieldProgress(state, t))
                  .reduce(
                    (acc, p) => ({ filled: acc.filled + p.filled, total: acc.total + p.total }),
                    { filled: 0, total: 0 },
                  )
                const pct =
                  progressTotals.total > 0 ? progressTotals.filled / progressTotals.total : 0
                const isActiveTask =
                  underlyingTasks.some((t) => state.activeTaskId === t.id) ||
                  underlyingTasks.some((t) =>
                    (t.children ?? []).some((c) => {
                      if (c.id === state.activeTaskId) return true
                      const parsed = parseChildSubTaskId(state.activeTaskId)
                      return parsed ? c.id === parsed.childId : false
                    }),
                  )
                const sections = (() => {
                  const formKey = underlyingTasks[0]?.formKey
                  if (!formKey) return DEFAULT_TASK_SECTIONS
                  return taskSections[formKey] ?? DEFAULT_TASK_SECTIONS
                })()
                return (
                  <li key={displayTask.id}>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: displayTask.id })}
                      aria-current={isActiveTask ? 'page' : undefined}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center justify-between gap-2 transition-colors',
                        isActiveTask
                          ? 'bg-accent/60 text-foreground'
                          : 'hover:bg-muted/50 text-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'truncate min-w-0',
                          isActiveTask ? 'font-semibold' : '',
                        )}
                      >
                        {getTaskNavLabel(displayTask.label)}
                      </span>
                      <TaskProgressIndicator progress={pct} />
                    </button>
                    {taskSectionNavStyle === 'nested' && isActiveTask && isV2CombinedActive ? (
                      <ul className="mt-1.5 ml-4 space-y-2 border-l border-border/80 pl-2.5">
                        {combinedOpenAccountsSections.map((group) => (
                          <li key={group.key} className="space-y-1">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                              <ChevronRight className="h-3 w-3" />
                              <span className="truncate">{group.label}</span>
                            </div>
                            <ul className="ml-3 space-y-1 border-l border-border/60 pl-2.5">
                              {group.sections.map((section) => {
                                const compositeId = `${group.key}::${section.id}`
                                return (
                                  <li key={compositeId}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveSectionId(compositeId)
                                        requestFocus(group.key, section.id)
                                      }}
                                      aria-current={activeSectionId === compositeId ? 'page' : undefined}
                                      className={cn(
                                        'w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors',
                                        activeSectionId === compositeId
                                          ? 'bg-muted text-foreground font-semibold'
                                          : 'cursor-pointer text-foreground/85 hover:text-foreground hover:bg-muted/60',
                                      )}
                                    >
                                      {section.label}
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    ) : taskSectionNavStyle === 'nested' && isActiveTask && sections.length > 0 ? (
                      <ul className="mt-1.5 ml-4 space-y-1.5 border-l border-border/80 pl-2.5">
                        {sections.map((section) => {
                          const hasChildren = !!section.children?.length
                          if (hasChildren) {
                            return (
                              <li key={section.id} className="space-y-1">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                                  <ChevronRight className="h-3 w-3" />
                                  <span className="truncate">{section.label}</span>
                                </div>
                                <ul className="ml-3 space-y-1 border-l border-border/60 pl-2.5">
                                  {section.children!.map((child) => (
                                    <li key={child.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveSectionId(child.id)
                                          dispatch({ type: 'FOCUS_PARENT_TASK_SECTION', sectionId: child.id })
                                        }}
                                        aria-current={activeSectionId === child.id ? 'page' : undefined}
                                        className={cn(
                                          'w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors',
                                          activeSectionId === child.id
                                            ? 'bg-muted text-foreground font-semibold'
                                            : 'cursor-pointer text-foreground/85 hover:text-foreground hover:bg-muted/60',
                                        )}
                                      >
                                        {child.label}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            )
                          }
                          return (
                            <li key={section.id}>
                              <button
                                type="button"
                                onClick={() => {
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
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  )
}
