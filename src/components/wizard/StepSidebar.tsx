import { useWorkflow } from '@/stores/workflowStore'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { getActionStatus } from '@/utils/getActionStatus'
import { teamMembers } from '@/data/teamMembers'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { Circle, Loader, CheckCircle2, Ban, User } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'text-text-tertiary',
  in_progress: 'text-text-category1-primary',
  complete: 'text-text-success-primary',
  blocked: 'text-text-danger-primary',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
}

const StatusIcon: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  in_progress: Loader,
  complete: CheckCircle2,
  blocked: Ban,
}

function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
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

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto">
        <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {state.journeyName ?? 'Client Onboarding'}
          </h2>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={state.assignedTo ?? 'Unassigned'}
              onValueChange={(value) =>
                dispatch({ type: 'SET_JOURNEY_ASSIGNEE', assignee: value })
              }
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                {teamMembers.map((tm) => (
                  <SelectItem key={tm.id} value={tm.name}>
                    {tm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {state.actions
          .sort((a, b) => a.order - b.order)
          .map((action) => {
            const actionTasks = state.tasks
              .filter((t) => t.actionId === action.id)
              .sort((a, b) => a.order - b.order)

            return (
              <div key={action.id} className="mb-6">
                <div className="flex items-center justify-between mb-2 px-3">
                  <h3 className="text-xs font-semibold text-muted-foreground">
                    {action.title}
                  </h3>
                  <StatusBadge status={getActionStatus(state.tasks, action.id)} />
                </div>
                <ul className="space-y-1">
                  {actionTasks.map((task) => (
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
                        <span className="truncate">{task.title}</span>
                        <StatusBadge status={task.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
      </nav>
    </TooltipProvider>
  )
}
