import { useWorkflow, useChildActionContext, useAdvisorUnlocked } from '@/stores/workflowStore'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Circle, Loader, CheckCircle2, Ban, Clock, XCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { resumeDrillInBackLabel } from '@/utils/childTaskRegistry'

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

function SubTaskStatusBadge({ subTaskId }: { subTaskId: string }) {
  const { state } = useWorkflow()
  const hasData = !!state.taskData[subTaskId] && Object.keys(state.taskData[subTaskId]).length > 0
  const isSubmitted = state.submittedTaskIds.includes(subTaskId)

  const status: TaskStatus = isSubmitted ? 'complete' : hasData ? 'in_progress' : 'not_started'
  const Icon = StatusIcon[status]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('shrink-0 flex items-center', statusColors[status])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{statusLabels[status]}</p>
      </TooltipContent>
    </Tooltip>
  )
}

import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildDisplayStatus } from '@/utils/childStatusDisplay'

function useChildOverallStatus(childId: string): ChildDisplayStatus {
  const { state } = useWorkflow()

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === childId)

  return deriveChildDisplayStatus(child?.status ?? 'not_started', state.childReviewState)
}

function backLabelForParent(formKey: string | undefined): string {
  switch (formKey) {
    case 'open-accounts':
      return 'Back to Open Accounts'
    case 'kyc':
    case 'kyc-review':
      return 'Back to KYC Review'
    default:
      return 'Back to task'
  }
}

export function ChildActionSidebar() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()

  const overallStatus = useChildOverallStatus(ctx?.child.id ?? '')
  const statusCfg = childStatusConfig[overallStatus]
  const advisorUnlocked = useAdvisorUnlocked()

  if (!ctx) return null

  const { child, config, subTaskIndex, parentTask } = ctx
  const viewMode = state.demoViewMode
  const isHoKycView = viewMode === 'ho-kyc'
  const isHoPrincipalKycView = viewMode === 'ho-principal-kyc'

  // Only collapse to one pseudo-step for KYC Home Office / Principal KYC modes. AML Team, HO
  // Document, and HO Principal account-opening views use the same numbered subtasks as Advisor
  // (e.g. Account & owners → Documents).
  const showSingleReviewStep =
    child.childType === 'kyc' && (isHoKycView || isHoPrincipalKycView)
  const singleReviewStepLabel = isHoKycView ? 'Home Office Review' : 'Principal Review'

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto flex flex-col">
        <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
          <button
            onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            {state.childActionResume
              ? resumeDrillInBackLabel(state.childActionResume.subTaskIndex)
              : backLabelForParent(parentTask?.formKey)}
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {child.name}
          </h2>
        </div>

        <ul className="space-y-1">
          {showSingleReviewStep ? (
            <li>
              <div className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 bg-accent text-accent-foreground font-medium">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">1.</span>
                  {singleReviewStepLabel}
                </span>
              </div>
            </li>
          ) : (
            config.subTasks.map((subTask, idx) => {
              const subTaskId = `${child.id}-${subTask.suffix}`
              return (
                <li key={subTask.suffix}>
                  <button
                    onClick={() => dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors',
                      idx === subTaskIndex
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                      {subTask.title}
                    </span>
                    <SubTaskStatusBadge subTaskId={subTaskId} />
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="mt-auto px-3 pt-4 pb-2 border-t border-border mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <Badge variant="outline" className={cn('text-xs', advisorUnlocked ? 'bg-amber-50 text-amber-700 border-amber-200' : statusCfg.className)}>
              {advisorUnlocked
                ? 'Action Required'
                : statusCfg.label}
            </Badge>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
