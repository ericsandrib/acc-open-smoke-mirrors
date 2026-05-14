import type { Task, WorkflowState } from '@/types/workflow'
import { OPEN_ACCOUNTS_FORM_KEY } from '@/utils/openAccountsTaskContext'

/** First Client Setup task (advisor journey entry). */
function firstCollectClientDataTask(tasks: readonly Task[]): Task | undefined {
  return tasks
    .filter((t) => t.actionId === 'collect-client-data' && t.formKey !== 'kyc' && t.id !== 'kyc-review')
    .sort((a, b) => a.order - b.order)[0]
}

/**
 * Reviewer demo: first Open Accounts step should be the in-app (non-annuity) path when both
 * split tasks exist — not {@link OPEN_ACCOUNTS_FORM_KEY} sorted only by `order` (annuity can be first).
 */
export function getReviewerOpenAccountsLandingTask(tasks: readonly Task[]): Task | undefined {
  const nonAnnuity = tasks
    .filter(
      (t) =>
        t.actionId === 'account-opening' &&
        t.formKey === OPEN_ACCOUNTS_FORM_KEY &&
        t.id !== 'kyc-review',
    )
    .sort((a, b) => a.order - b.order)[0]
  if (nonAnnuity) return nonAnnuity
  return tasks
    .filter((t) => t.actionId === 'account-opening' && t.formKey !== 'kyc' && t.id !== 'kyc-review')
    .sort((a, b) => {
      const aNon = a.formKey === OPEN_ACCOUNTS_FORM_KEY ? 0 : 1
      const bNon = b.formKey === OPEN_ACCOUNTS_FORM_KEY ? 0 : 1
      if (aNon !== bNon) return aNon - bNon
      return a.order - b.order
    })[0]
}

/** Top-level task id when opening the journey root from the advisor vs reviewer queue. */
export function getDefaultJourneyEntryTaskId(state: WorkflowState): string | undefined {
  const mode = state.demoViewMode ?? 'advisor'
  if (mode === 'advisor') {
    return firstCollectClientDataTask(state.tasks)?.id ?? state.flatTaskOrder[0]
  }
  return getReviewerOpenAccountsLandingTask(state.tasks)?.id ?? state.flatTaskOrder[0]
}

export function resolveJourneyEntryTaskIdAfterInit(
  tasks: readonly Task[],
  demoViewMode: WorkflowState['demoViewMode'] | undefined,
  fallbackTaskId: string,
): string {
  const mode = demoViewMode ?? 'advisor'
  if (mode === 'advisor') {
    return firstCollectClientDataTask(tasks)?.id ?? fallbackTaskId
  }
  return getReviewerOpenAccountsLandingTask(tasks)?.id ?? fallbackTaskId
}
