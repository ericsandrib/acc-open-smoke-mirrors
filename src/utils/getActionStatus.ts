import type { Task, TaskStatus } from '@/types/workflow'

export function getActionStatus(tasks: Task[], actionId: string): TaskStatus {
  const actionTasks = tasks
    .filter((t) => t.actionId === actionId)
    .sort((a, b) => a.order - b.order)

  if (actionTasks.length === 0) return 'not_started'

  const lastTask = actionTasks[actionTasks.length - 1]

  if (lastTask.status === 'complete') return 'complete'
  if (lastTask.status === 'blocked') return 'blocked'

  const anyStarted = actionTasks.some((t) => t.status !== 'not_started')
  if (anyStarted) return 'in_progress'

  return 'not_started'
}
