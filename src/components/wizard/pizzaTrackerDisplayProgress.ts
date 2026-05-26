import { getTaskFieldProgress } from '@/utils/taskFieldProgress'
import type { Task, TaskStatus, WorkflowState } from '@/types/workflow'

export type PizzaTrackerRowProgress = {
  pct: number
  total: number
  edited: boolean
  status: TaskStatus
}

type DisplayTaskLike = {
  underlyingTaskIds: string[]
}

export function getDisplayTaskNodeProgress(
  state: WorkflowState,
  displayTask: DisplayTaskLike,
): PizzaTrackerRowProgress & { filled: number } {
  const underlyingTasks = displayTask.underlyingTaskIds
    .map((id) => state.tasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t))
  const progressTotals = underlyingTasks
    .map((t) => getTaskFieldProgress(state, t))
    .reduce(
      (acc, p) => ({ filled: acc.filled + p.filled, total: acc.total + p.total }),
      { filled: 0, total: 0 },
    )
  const pct = progressTotals.total > 0 ? progressTotals.filled / progressTotals.total : 0
  const edited = underlyingTasks.some((t) => !!t.edited)
  const status: TaskStatus =
    underlyingTasks.length > 0 && underlyingTasks.every((t) => t.status === 'canceled')
      ? 'canceled'
      : (underlyingTasks[0]?.status ?? 'not_started')

  return { ...progressTotals, pct, edited, status }
}

/** Average completion across sidebar-visible display rows (avoids double-counting shared tasks). */
export function computeDisplayTasksProgress(
  state: WorkflowState,
  displayTasks: ReadonlyArray<DisplayTaskLike>,
): PizzaTrackerRowProgress {
  if (displayTasks.length === 0) {
    return { pct: 0, total: 0, edited: false, status: 'not_started' }
  }

  const nodeProgress = displayTasks.map((dt) => getDisplayTaskNodeProgress(state, dt))
  const measurable = nodeProgress.filter((p) => p.total > 0)
  const pct =
    measurable.length > 0
      ? measurable.reduce((sum, p) => sum + p.pct, 0) / measurable.length
      : 0
  const edited = nodeProgress.some((p) => p.edited)

  const allUnderlying: Task[] = []
  for (const dt of displayTasks) {
    for (const id of dt.underlyingTaskIds) {
      const task = state.tasks.find((t) => t.id === id)
      if (task && !allUnderlying.some((t) => t.id === task.id)) allUnderlying.push(task)
    }
  }
  const status: TaskStatus =
    allUnderlying.length > 0 && allUnderlying.every((t) => t.status === 'canceled')
      ? 'canceled'
      : (allUnderlying[0]?.status ?? 'not_started')

  return { pct, total: measurable.length > 0 ? 1 : 0, edited, status }
}
