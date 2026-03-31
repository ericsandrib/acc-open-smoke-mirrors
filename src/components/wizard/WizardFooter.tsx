import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check, Pencil } from 'lucide-react'
import type { TaskStatus } from '@/types/workflow'

function getActiveTaskStatus(state: ReturnType<typeof useWorkflow>['state']): TaskStatus {
  // Check parent tasks
  const parentTask = state.tasks.find((t) => t.id === state.activeTaskId)
  if (parentTask) return parentTask.status
  // Check child tasks
  for (const t of state.tasks) {
    const child = t.children?.find((c) => c.id === state.activeTaskId)
    if (child) return child.status
  }
  return 'not_started'
}

export function WizardFooter() {
  const { state, dispatch } = useWorkflow()
  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1
  const activeStatus = getActiveTaskStatus(state)

  return (
    <footer className="border-t border-border bg-background px-6 py-3 flex justify-between items-center shrink-0">
      <Button
        variant="outline"
        onClick={() => dispatch({ type: 'GO_BACK' })}
        disabled={isFirst}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center gap-2">
        {activeStatus === 'in_progress' && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'CONFIRM_TASK', taskId: state.activeTaskId })}
          >
            <Check className="h-4 w-4" />
            Confirm
          </Button>
        )}
        {activeStatus === 'complete' && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'REOPEN_TASK', taskId: state.activeTaskId })}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        {activeStatus === 'blocked' && (
          <span className="text-sm text-muted-foreground">Assigned to compliance</span>
        )}

        <Button
          onClick={() => dispatch({ type: 'GO_NEXT' })}
          disabled={isLast}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </footer>
  )
}
