import type { Dispatch } from 'react'
import { toast } from 'sonner'
import type { Task, WorkflowAction, WorkflowState } from '@/types/workflow'

export type AssigneeUndoFn = () => void

export function captureTaskAssignees(tasks: Task[]): Record<string, string> {
  return Object.fromEntries(tasks.map((t) => [t.id, t.assignedTo]))
}

export function captureJourneyAssigneeSnapshot(state: WorkflowState): {
  journeyAssignee: string
  taskAssignees: Record<string, string>
} {
  return {
    journeyAssignee: state.assignedTo ?? 'Unassigned',
    taskAssignees: captureTaskAssignees(state.tasks),
  }
}

export function restoreTaskAssignees(
  dispatch: Dispatch<WorkflowAction>,
  snapshot: Record<string, string>,
): AssigneeUndoFn {
  return () => {
    for (const [taskId, assignee] of Object.entries(snapshot)) {
      dispatch({ type: 'SET_TASKS_ASSIGNEE', taskIds: [taskId], assignee })
    }
  }
}

export function restoreJourneyAssigneeSnapshot(
  dispatch: Dispatch<WorkflowAction>,
  snapshot: ReturnType<typeof captureJourneyAssigneeSnapshot>,
): AssigneeUndoFn {
  return () => {
    dispatch({ type: 'RESTORE_ASSIGNEE_SNAPSHOT', ...snapshot })
  }
}

export function showAssigneeUpdatedToast(description: string, undo?: AssigneeUndoFn) {
  toast.success('Advisor updated', {
    description,
    duration: 5000,
    action: undo
      ? {
          label: 'Undo',
          onClick: () => {
            undo()
            toast.success('Assignment undone')
          },
        }
      : undefined,
  })
}
