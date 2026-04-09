import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check, Pencil } from 'lucide-react'
import type { TaskStatus } from '@/types/workflow'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'

function getActiveTaskStatus(state: ReturnType<typeof useWorkflow>['state']): TaskStatus {
  // Check parent tasks
  const parentTask = state.tasks.find((t) => t.id === state.activeTaskId)
  if (parentTask) return parentTask.status
  // Check child tasks
  for (const t of state.tasks) {
    const child = t.children?.find((c) => c.id === state.activeTaskId)
    if (child) return child.status
  }
  // Check child sub-task IDs
  const parsed = parseChildSubTaskId(state.activeTaskId)
  if (parsed) {
    for (const t of state.tasks) {
      const child = t.children?.find((c) => c.id === parsed.childId)
      if (child) return child.status
    }
  }
  return 'not_started'
}

export function WizardFooter() {
  const { state, dispatch } = useWorkflow()
  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1
  const activeStatus = getActiveTaskStatus(state)
  const isSubmitted = state.submittedTaskIds.includes(state.activeTaskId)

  return (
    <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border">
      <div>
        {!isFirst && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'GO_BACK' })}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSubmitted && activeStatus === 'in_progress' && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'REOPEN_TASK', taskId: state.activeTaskId })}
          >
            <Pencil className="h-4 w-4" />
            Edit
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

        {isLast ? (
          <Button
            onClick={() => dispatch({ type: 'CONFIRM_TASK', taskId: state.activeTaskId })}
            disabled={activeStatus === 'complete' || isSubmitted}
          >
            <Check className="h-4 w-4" />
            Complete
          </Button>
        ) : (
          <Button
            onClick={() => dispatch({ type: 'GO_NEXT' })}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </footer>
  )
}
