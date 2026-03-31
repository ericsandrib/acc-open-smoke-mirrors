import { useWorkflow } from '@/stores/workflowStore'

export function DetailSidebar() {
  const { state } = useWorkflow()

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const activeChild = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  const title = activeTask?.title ?? activeChild?.name ?? ''
  const assignedTo = activeTask?.assignedTo ?? ''

  return (
    <aside className="w-64 border-l border-border bg-sidebar-background p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Details
      </h3>
      {activeTask && (
        <div className="space-y-3">
          <div>
            <span className="text-muted-foreground">Task</span>
            <p className="font-medium text-foreground">{title}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Owner</span>
            <p className="font-medium text-foreground">{assignedTo}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium text-foreground capitalize">
              {activeTask.status.replace('_', ' ')}
            </p>
          </div>
        </div>
      )}
      {!activeTask && activeChild && (
        <div className="space-y-3">
          <div>
            <span className="text-muted-foreground">KYC Review</span>
            <p className="font-medium text-foreground">{activeChild.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium text-foreground capitalize">
              {activeChild.status.replace('_', ' ')}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
