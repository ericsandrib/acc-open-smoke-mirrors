import type { Task, WorkflowState } from '@/types/workflow'

export type PizzaTrackerDueMeta = {
  dateLabel: string
  dueAt?: string
}

export function formatDueTooltip(dateLabel: string, dueAt?: string): string {
  if (dueAt) {
    const d = new Date(dueAt)
    if (!Number.isNaN(d.getTime())) {
      return `Due ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    }
  }
  return dateLabel ? `Due ${dateLabel}` : ''
}

export function getJourneyDueMeta(state: WorkflowState): PizzaTrackerDueMeta {
  return {
    dateLabel: state.journeyDateLabel ?? '',
    dueAt: state.journeyDueAt,
  }
}

export function getTaskDueMeta(state: WorkflowState, task: Task): PizzaTrackerDueMeta {
  const journeyDue = state.journeyDueAt ? new Date(state.journeyDueAt) : null
  if (!journeyDue || Number.isNaN(journeyDue.getTime())) {
    return { dateLabel: state.journeyDateLabel ?? '' }
  }

  const actionTasks = state.tasks
    .filter((t) => t.actionId === task.actionId)
    .sort((a, b) => a.order - b.order)
  const idx = actionTasks.findIndex((t) => t.id === task.id)
  const offsetDays = Math.max(0, (actionTasks.length - 1 - idx) * 3)
  const taskDue = new Date(journeyDue)
  taskDue.setDate(taskDue.getDate() - offsetDays)

  return {
    dateLabel: taskDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    dueAt: taskDue.toISOString(),
  }
}

export function getAggregatedTaskDueMeta(state: WorkflowState, tasks: Task[]): PizzaTrackerDueMeta {
  if (tasks.length === 0) return getJourneyDueMeta(state)
  if (tasks.length === 1) return getTaskDueMeta(state, tasks[0])

  const metas = tasks.map((t) => getTaskDueMeta(state, t))
  const withDates = metas.filter((m) => m.dueAt)
  if (withDates.length === 0) return metas[0] ?? getJourneyDueMeta(state)

  return [...withDates].sort(
    (a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
  )[0]
}

export function getChildSubTaskDueMeta(
  state: WorkflowState,
  subTaskIndex: number,
  totalSubTasks: number,
): PizzaTrackerDueMeta {
  const journeyDue = state.journeyDueAt ? new Date(state.journeyDueAt) : null
  if (!journeyDue || Number.isNaN(journeyDue.getTime())) {
    return { dateLabel: state.journeyDateLabel ?? '' }
  }

  const offsetDays = Math.max(0, (totalSubTasks - 1 - subTaskIndex) * 2)
  const due = new Date(journeyDue)
  due.setDate(due.getDate() - offsetDays)

  return {
    dateLabel: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    dueAt: due.toISOString(),
  }
}

export function getUniqueAssigneeNames(tasks: Task[], fallback?: string): string[] {
  const fromTasks = tasks.map((t) => t.assignedTo?.trim()).filter(Boolean) as string[]
  const nonUnassigned = fromTasks.filter((l) => l !== 'Unassigned')
  const unique = [...new Set(nonUnassigned)]
  if (unique.length > 0) return unique
  const fb = fallback?.trim()
  if (fb && fb !== 'Unassigned') return [fb]
  return []
}

export function resolveAggregatedAssignee(tasks: Task[], fallback?: string): string {
  const unique = getUniqueAssigneeNames(tasks, fallback)
  if (unique.length === 1) return unique[0]
  if (unique.length > 1) return unique[0]
  return fallback?.trim() || 'Unassigned'
}

export function getActionTasks(state: WorkflowState, actionId: string): Task[] {
  return state.tasks.filter((t) => t.actionId === actionId).sort((a, b) => a.order - b.order)
}
