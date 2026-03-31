import { useWorkflow } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/workflow'
import { cn } from '@/lib/utils'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
}

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()

  return (
    <nav className="w-64 border-r border-border bg-sidebar-background p-4 overflow-y-auto">
      {state.actions
        .sort((a, b) => a.order - b.order)
        .map((action) => {
          const actionTasks = state.tasks
            .filter((t) => t.actionId === action.id)
            .sort((a, b) => a.order - b.order)

          return (
            <div key={action.id} className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {action.title}
              </h3>
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
                      <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', statusColors[task.status])} variant="secondary">
                        {statusLabels[task.status]}
                      </Badge>
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
                              <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', statusColors[child.status])} variant="secondary">
                                {statusLabels[child.status]}
                              </Badge>
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
  )
}
