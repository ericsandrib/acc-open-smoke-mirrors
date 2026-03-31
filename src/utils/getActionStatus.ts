import type { Task, TaskStatus } from '@/types/workflow'

export function getActionStatus(tasks: Task[], actionId: string): TaskStatus {
  const actionTasks = tasks.filter((t) => t.actionId === actionId)

  if (actionTasks.length === 0) return 'not_started'

  const allComplete = actionTasks.every((t) => t.status === 'complete')
  if (allComplete) return 'complete'

  const anyBlocked = actionTasks.some((t) => t.status === 'blocked')
  const anyInProgress = actionTasks.some((t) => t.status === 'in_progress' || t.status === 'complete')
  if (anyBlocked && !anyInProgress) return 'blocked'

  const anyStarted = actionTasks.some((t) => t.status !== 'not_started')
  if (anyStarted) return 'in_progress'

  return 'not_started'
}
