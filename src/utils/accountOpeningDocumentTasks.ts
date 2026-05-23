import type { WorkflowState } from '@/types/workflow'

export const ACCOUNT_OPENING_FORMS_PACKAGE_SUFFIX = 'forms-package'
export const ACCOUNT_OPENING_SUPPORTING_DOCUMENTS_SUFFIX = 'supporting-documents'
/** @deprecated Split into forms-package + supporting-documents; kept for persisted sub-task ids. */
export const LEGACY_ACCOUNT_OPENING_DOCUMENTS_SUFFIX = 'documents-review'

export function accountOpeningFormsPackageTaskId(accountChildId: string): string {
  return `${accountChildId}-${ACCOUNT_OPENING_FORMS_PACKAGE_SUFFIX}`
}

export function accountOpeningSupportingDocumentsTaskId(accountChildId: string): string {
  return `${accountChildId}-${ACCOUNT_OPENING_SUPPORTING_DOCUMENTS_SUFFIX}`
}

export function legacyAccountOpeningDocumentsTaskId(accountChildId: string): string {
  return `${accountChildId}-${LEGACY_ACCOUNT_OPENING_DOCUMENTS_SUFFIX}`
}

/** Prefer dedicated forms-package task data; fall back to legacy combined Documents step. */
export function resolveAccountOpeningFormsPackageTaskId(
  state: WorkflowState,
  accountChildId: string,
): string {
  const formsId = accountOpeningFormsPackageTaskId(accountChildId)
  const legacyId = legacyAccountOpeningDocumentsTaskId(accountChildId)
  const formsData = state.taskData[formsId]
  const legacyData = state.taskData[legacyId]
  if (formsData && Object.keys(formsData).length > 0) return formsId
  if (legacyData && Object.keys(legacyData).length > 0) return legacyId
  return formsId
}

/** Merge task data from split (or legacy combined) document sub-steps for HO summary panels. */
export function mergeAccountOpeningDocumentSubTaskData(
  subTaskData: Array<{ suffix: string; data: Record<string, unknown> }>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const step of subTaskData) {
    if (
      step.suffix === ACCOUNT_OPENING_FORMS_PACKAGE_SUFFIX ||
      step.suffix === ACCOUNT_OPENING_SUPPORTING_DOCUMENTS_SUFFIX ||
      step.suffix === LEGACY_ACCOUNT_OPENING_DOCUMENTS_SUFFIX
    ) {
      Object.assign(merged, step.data)
    }
  }
  return merged
}
