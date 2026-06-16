import type { ChildTask, Task, WorkflowState } from '@/types/workflow'
import { getVisibleChildSubTasks } from '@/utils/childTaskRegistry'

/** Standard Open Accounts step (non-annuity path: single journey or first branch of a split). */
export const OPEN_ACCOUNTS_FORM_KEY = 'open-accounts' as const

/** Split journey only: second branch uses a distinct form key for external KYC/eSign behavior. */
export const OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY = 'open-accounts-with-annuity' as const

/** v5/v6 sidebar: collapsible group for the in-app (no-annuity) open-accounts path. */
export const OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL = 'Account Opening' as const

/** v5/v6 sidebar + split journey headings: with-annuity / annuity-order branch. */
export const OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL = 'Account Opening + Annuity Order' as const

/** v5/v6 sidebar + open-accounts section: eSign forms package step (internal page key remains `envelopes`). */
export const OPEN_ACCOUNTS_NAV_FORMS_PACKAGE_LABEL = 'Forms Package' as const

const OPEN_ACCOUNTS_FORM_KEYS: readonly string[] = [
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
]

export function isOpenAccountsFormKey(formKey: string | undefined): boolean {
  if (!formKey) return false
  return OPEN_ACCOUNTS_FORM_KEYS.includes(formKey)
}

export function isOpenAccountsTask(t: Task | undefined): boolean {
  return isOpenAccountsFormKey(t?.formKey)
}

/** Annuity split path: KYC and eSign run outside this app (non-annuity path keeps in-app KYC and eSign). */
export function isAnnuityExternalPlatformOpenAccountsTask(task: Task | undefined): boolean {
  return task?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
}

export function getAllOpenAccountsTasks(state: WorkflowState): Task[] {
  return state.tasks.filter((t) => isOpenAccountsTask(t))
}

export function findParentTaskForChild(
  state: WorkflowState,
  childId: string | undefined,
): Task | undefined {
  if (!childId) return undefined
  const parents = state.tasks.filter((t) => t.children?.some((c) => c.id === childId))
  if (parents.length === 0) return undefined
  if (parents.length === 1) return parents[0]

  const child = parents
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === childId)
  const nonAnnuityParent = parents.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  const annuityParent = parents.find((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)

  /** Brokerage accounts belong on the non-annuity task even if a repair duplicated them. */
  if (child?.childType === 'account-opening' && nonAnnuityParent) {
    return nonAnnuityParent
  }
  if (annuityParent) return annuityParent
  return parents[0]
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

/** Account-opening child drilled in from the annuity-order parent task (not standard open-accounts). */
export function isAnnuityOrderAccountOpeningChild(
  state: WorkflowState,
  childOrId: ChildTask | string,
): boolean {
  const childId = typeof childOrId === 'string' ? childOrId : childOrId.id
  const child =
    typeof childOrId === 'string'
      ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === childId)
      : childOrId
  if (child?.childType !== 'account-opening') return false
  return findParentTaskForChild(state, childId)?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
}

/** Visible sub-tasks for a child workflow, including annuity-order account-opening restrictions. */
export function getVisibleSubTasksForChild(
  state: WorkflowState,
  child: ChildTask,
  demoViewMode: WorkflowState['demoViewMode'] = state.demoViewMode ?? 'advisor',
) {
  const parent = findParentTaskForChild(state, child.id)
  return getVisibleChildSubTasks(child.childType, demoViewMode, child.status, {
    accountWorkflowPhase:
      child.childType === 'account-opening'
        ? state.childReviewsByChildId?.[child.id]?.accountWorkflowPhase
        : undefined,
    parentOpenAccountsFormKey: parent?.formKey,
  })
}
