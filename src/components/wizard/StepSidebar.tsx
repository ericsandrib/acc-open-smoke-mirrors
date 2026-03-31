import { useWorkflow } from '@/stores/workflowStore'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { getActionStatus } from '@/utils/getActionStatus'
import { Circle, Loader, CheckCircle2, Ban } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  complete: 'text-green-500',
  blocked: 'text-red-500',
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
                          state.activeTaskId === task.id
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-muted text-foreground'
                        )}
                      >
                        <span className="truncate">{task.title}</span>
                        <StatusBadge status={task.status} />
                      </button>
                      {task.children && task.children.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {task.children.map((child) => (
                            <li key={child.id}>
                              <button
                                onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: child.id })}
                                className={cn(
                                  'w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 transition-colors',
                                  state.activeTaskId === child.id
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'hover:bg-muted text-foreground'
                                )}
                              >
                                <span className="truncate">{child.name}</span>
                                <StatusBadge status={child.status} className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
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
