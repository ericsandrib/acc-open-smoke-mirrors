import type { ChildTask, Task, WorkflowState } from '@/types/workflow'

/** Standard Open Accounts step. */
export const OPEN_ACCOUNTS_FORM_KEY = 'open-accounts' as const

/**
 * Sentinel value retained for back-compat with `formKey === ...` comparisons
 * across the wizard. The annuity split-path is removed in this fork; this
 * sentinel never matches any real form key, so all annuity branches evaluate
 * to `false` without requiring rewrites of every consumer.
 */
export const OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY = '__annuity_path_disabled__' as const

const OPEN_ACCOUNTS_FORM_KEYS: readonly string[] = [OPEN_ACCOUNTS_FORM_KEY]

export function isOpenAccountsFormKey(formKey: string | undefined): boolean {
  if (!formKey) return false
  return OPEN_ACCOUNTS_FORM_KEYS.includes(formKey)
}

export function isOpenAccountsTask(t: Task | undefined): boolean {
  return isOpenAccountsFormKey(t?.formKey)
}

/**
 * Annuity split path is removed from this fork — keep this helper as a stable
 * `false` so call sites that still reference it compile while we strip them
 * one file at a time. Once all call sites are gone, this can be deleted.
 */
export function isAnnuityExternalPlatformOpenAccountsTask(_task: Task | undefined): boolean {
  return false
}

export function getAllOpenAccountsTasks(state: WorkflowState): Task[] {
  return state.tasks.filter((t) => isOpenAccountsTask(t))
}

export function findParentTaskForChild(
  state: WorkflowState,
  childId: string | undefined,
): Task | undefined {
  if (!childId) return undefined
  return state.tasks.find((t) => t.children?.some((c) => c.id === childId))
}

/**
 * The open-accounts parent for the current UI: parent of the active child, or the active task
 * when it is an Open Accounts step.
 */
export function getRelevantOpenAccountsTask(state: WorkflowState): Task | undefined {
  if (state.activeChildActionId) {
    return findParentTaskForChild(state, state.activeChildActionId)
  }
  const active = state.tasks.find((t) => t.id === state.activeTaskId)
  if (active && isOpenAccountsTask(active)) return active
  return undefined
}

export function getAllAccountOpeningChildren(state: WorkflowState): ChildTask[] {
  return getAllOpenAccountsTasks(state).flatMap((t) =>
    (t.children ?? []).filter((c) => c.childType === 'account-opening'),
  )
}

export function getOpenAccountsTaskData(
  state: WorkflowState,
  openAccountsTaskId: string,
): Record<string, unknown> {
  return (state.taskData[openAccountsTaskId] as Record<string, unknown> | undefined) ?? {}
}
