import type { WorkflowState } from '@/types/workflow'

/** Sub-steps with no required fields — visiting the page counts as complete for progress UI. */
const VISIT_ONLY_FORM_KEYS = new Set([
  'kyc-child-documents',
  'kyc-child-aml-subject-profile',
  'kyc-child-aml-documents',
  'kyc-child-aml-review',
  'acct-child-funding-transfers',
  'acct-child-features-services',
  'acct-child-forms-package',
  'acct-child-supporting-documents',
  'acct-child-documents-review',
  'acct-child-cip-review',
  'acct-child-aml-review',
])

export function subTaskCompletesOnVisit(formKey: string): boolean {
  return VISIT_ONLY_FORM_KEYS.has(formKey)
}

export function isChildSubTaskVisited(
  state: WorkflowState,
  childId: string,
  subTaskIndex: number,
): boolean {
  const hwm = state.childHighWaterMark?.[childId] ?? -1
  return subTaskIndex <= hwm
}

export function bumpChildHighWaterMark(
  state: WorkflowState,
  childId: string,
  subTaskIndex: number,
): WorkflowState['childHighWaterMark'] {
  const prev = state.childHighWaterMark ?? {}
  const cur = prev[childId] ?? -1
  if (subTaskIndex <= cur) return prev
  return { ...prev, [childId]: subTaskIndex }
}

export function getGenericChildSubTaskProgress(
  state: WorkflowState,
  opts: {
    subTaskId: string
    formKey: string
    childId: string
    subTaskIndex: number
  },
): { filled: number; total: number } {
  const { subTaskId, formKey, childId, subTaskIndex } = opts
  const total = 1
  if (state.submittedTaskIds.includes(subTaskId)) {
    return { filled: total, total }
  }

  const visited = isChildSubTaskVisited(state, childId, subTaskIndex)
  if (subTaskCompletesOnVisit(formKey) && visited) {
    return { filled: total, total }
  }

  const data = state.taskData[subTaskId]
  const hasData = !!data && Object.keys(data).length > 0
  if (hasData) {
    return { filled: total, total }
  }

  return { filled: 0, total }
}
