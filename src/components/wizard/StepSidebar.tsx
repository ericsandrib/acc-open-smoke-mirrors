import { useEffect, useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import type { TaskStatus, Task, WorkflowState } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { isOpenAccountsFormKey } from '@/utils/openAccountsTaskContext'
import { taskSections } from './formRegistry'
import { Circle, Loader, CheckCircle2, Ban, Clock, XCircle, Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const DEFAULT_TASK_SECTIONS = [{ id: '__top__', label: 'Overview' }] as const

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

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const activeSections = useMemo(
    () => (activeTask ? taskSections[activeTask.formKey] ?? DEFAULT_TASK_SECTIONS : DEFAULT_TASK_SECTIONS),
    [activeTask],
  )

  useEffect(() => {
    setActiveSectionId(activeSections[0]?.id ?? null)
  }, [state.activeTaskId, activeSections])

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto">
        <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {state.journeyName ?? 'Client Onboarding'}
          </h2>
        </div>
        {state.actions
          .filter((action) => action.id !== 'kyc')
          .sort((a, b) => a.order - b.order)
          .map((action) => {
            const actionTasks = state.tasks
              .filter((t) => t.actionId === action.id && t.formKey !== 'kyc' && t.id !== 'kyc-review')
              .sort((a, b) => a.order - b.order)

            return (
              <div key={action.id} className="mb-5">
                <div className="mb-1.5 px-3">
                  <h3 className="text-[12px] font-medium tracking-wide uppercase text-muted-foreground/70">
                    {action.title}
                  </h3>
                </div>
                <ul className="space-y-1">
                  {actionTasks.map((task) => {
                    const progress = getTaskFieldProgress(state, task)
                    const pct = progress.total > 0 ? progress.filled / progress.total : 0
                    const isActiveTask =
                      state.activeTaskId === task.id ||
                      (task.children?.some((c) => {
                        if (c.id === state.activeTaskId) return true
                        const parsed = parseChildSubTaskId(state.activeTaskId)
                        return parsed ? c.id === parsed.childId : false
                      }) ?? false)
                    const sections = taskSections[task.formKey] ?? DEFAULT_TASK_SECTIONS
                    return (
                      <li key={task.id}>
                        <button
                          onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: task.id })}
                          aria-current={isActiveTask ? 'page' : undefined}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center justify-between gap-2 transition-colors border border-transparent',
                            isActiveTask
                              ? 'bg-accent/60 text-foreground border-border'
                              : 'hover:bg-muted/50 text-foreground'
                          )}
                        >
                          <span
                            className={cn(
                              'truncate min-w-0',
                              isActiveTask ? 'font-semibold border-l-2 border-foreground/50 pl-2 -ml-2' : '',
                            )}
                          >
                            {getTaskNavLabel(task.title)}
                          </span>
                          <TaskProgressIndicator
                            progress={pct}
                          />
                        </button>
                        {isActiveTask && sections.length > 0 ? (
                          <ul className="mt-1.5 ml-4 space-y-1.5 border-l border-border/80 pl-2.5">
                            {sections.map((section) => (
                              <li key={section.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (state.activeTaskId !== task.id) {
                                      dispatch({ type: 'SET_ACTIVE_TASK', taskId: task.id })
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
                                  {getTaskNavLabel(section.label)}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
      </nav>
    </TooltipProvider>
  )
}
