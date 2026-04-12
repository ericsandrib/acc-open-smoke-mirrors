import { useWorkflow } from '@/stores/workflowStore'
import type { TaskStatus, Task, WorkflowState } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { Circle, Loader, CheckCircle2, Ban, Clock, XCircle } from 'lucide-react'
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
  blocked: 'text-text-danger-primary',
  awaiting_review: 'text-text-warning-primary',
  rejected: 'text-text-danger-primary',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
  awaiting_review: 'Awaiting Review',
  rejected: 'Rejected',
}

const StatusIcon: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  in_progress: Loader,
  complete: CheckCircle2,
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
      const children = (task.children ?? []).filter(
        (c) => c.childType === 'account-opening',
      )
      if (children.length === 0) return { filled: 0, total: 1 }
      return {
        filled: children.filter((c) => c.status === 'complete').length,
        total: children.length,
      }
    }
    case 'placeholder-2': {
      const data = state.taskData['placeholder-2'] ?? {}
      const total = 3
      let filled = 0
      if (data.termsAccepted) filled++
      if (data.regulatoryAccepted) filled++
      if (data.dataConsent) filled++
      return { filled, total }
    }
    default:
      return { filled: 0, total: 0 }
  }
}

const DONUT_R = 7
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R

function DonutProgress({ progress, edited }: { progress: number; edited: boolean }) {
  const rawPct = Math.round(progress * 100)
  const displayProgress =
    edited && rawPct === 0 ? 0.05 : Math.min(1, Math.max(0, progress))
  const displayPct = Math.round(displayProgress * 100)
  const filled = displayProgress * DONUT_CIRCUMFERENCE
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0 flex items-center justify-center h-3.5 w-3.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r={DONUT_R}
              fill="none"
              strokeWidth="3"
              stroke="var(--color-border-secondary)"
            />
            {displayProgress > 0 && (
              <circle
                cx="10"
                cy="10"
                r={DONUT_R}
                fill="none"
                strokeWidth="3"
                stroke="var(--color-fill-category1-primary)"
                strokeDasharray={`${filled} ${DONUT_CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform="rotate(-90 10 10)"
              />
            )}
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>
          {displayPct}% complete{edited ? ' · Edited' : ''}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()

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
              <div key={action.id} className="mb-6">
                <div className="mb-2 px-3">
                  <h3 className="text-xs font-semibold text-muted-foreground">
                    {action.title}
                  </h3>
                </div>
                <ul className="space-y-1">
                  {actionTasks.map((task) => {
                    const progress = getTaskFieldProgress(state, task)
                    const pct = progress.total > 0 ? progress.filled / progress.total : 0
                    return (
                      <li key={task.id}>
                        <button
                          onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: task.id })}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors',
                            state.activeTaskId === task.id ||
                            (task.children?.some((c) => {
                              if (c.id === state.activeTaskId) return true
                              const parsed = parseChildSubTaskId(state.activeTaskId)
                              return parsed ? c.id === parsed.childId : false
                            }) ?? false)
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <span className="truncate min-w-0">{task.title}</span>
                          <DonutProgress progress={pct} edited={!!task.edited} />
                        </button>
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
