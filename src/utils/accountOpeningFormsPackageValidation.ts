import type { WorkflowState } from '@/types/workflow'
import { findParentTaskForChild } from '@/utils/openAccountsTaskContext'
import { resolveAccountOpeningFormsPackageTaskId } from '@/utils/accountOpeningDocumentTasks'
import {
  getRegistrationDocumentsForType,
  type RegistrationType,
} from '@/utils/registrationDocuments'
import { parseWetSignedFirmUploads } from '@/utils/wetSignedFirmUploads'

export const ESIGN_DOWNLOADED_FORM_IDS_KEY = 'esignDownloadedFormIds'

type ExecutedEsignForm = {
  formId?: string
  label?: string
}

function requiredFirmCustodianFormIds(
  state: WorkflowState,
  accountChildId: string,
  registrationType: RegistrationType,
): Array<{ id: string; label: string }> {
  return getRegistrationDocumentsForType(registrationType, {
    relatedParties: state.relatedParties,
  })
    .filter((doc) => doc.fulfillment === 'esign')
    .map((doc) => ({ id: doc.id, label: doc.label }))
}

function buildAccountFormKey(accountChildId: string, documentId: string): string {
  return `${accountChildId}::${documentId}`
}

/**
 * Validates that every registration-required firm/custodian form is satisfied in the
 * Forms Package step via completed eSign copies (downloaded in the UI) or wet-signed uploads.
 */
export function getAccountOpeningFormsPackageSubmissionIssues(
  state: WorkflowState,
  accountChildId: string,
): string[] {
  const childMeta = (state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}
  const registrationType = childMeta.registrationType as RegistrationType | undefined
  if (!registrationType) {
    return ['Forms Package: assign a registration type on Account & owners before submitting.']
  }

  const requiredForms = requiredFirmCustodianFormIds(state, accountChildId, registrationType)
  if (requiredForms.length === 0) return []

  const docsTaskId = resolveAccountOpeningFormsPackageTaskId(state, accountChildId)
  const docsData = (state.taskData[docsTaskId] as Record<string, unknown> | undefined) ?? {}
  const executedForms = (docsData.esignExecutedForms as ExecutedEsignForm[] | undefined) ?? []
  const executedFormIds = new Set(
    executedForms.map((row) => row.formId).filter((id): id is string => Boolean(id)),
  )
  const downloadedFormIds = new Set(
    ((docsData[ESIGN_DOWNLOADED_FORM_IDS_KEY] as string[] | undefined) ?? []).filter(Boolean),
  )

  const parentTask = findParentTaskForChild(state, accountChildId)
  const openAccountsData = parentTask
    ? ((state.taskData[parentTask.id] as Record<string, unknown> | undefined) ?? {})
    : {}
  const wetUploads = parseWetSignedFirmUploads(openAccountsData).filter(
    (upload) =>
      (!upload.accountChildId || upload.accountChildId === accountChildId) &&
      upload.documentTypeId.trim().length > 0 &&
      upload.fileName.trim().length > 0,
  )
  const wetUploadDocIds = new Set(wetUploads.map((upload) => upload.documentTypeId))

  const missingEsignOrUpload: string[] = []
  const missingDownload: string[] = []

  for (const form of requiredForms) {
    const formKey = buildAccountFormKey(accountChildId, form.id)
    if (wetUploadDocIds.has(form.id)) continue

    const hasExecuted = executedFormIds.has(formKey)
    const hasDownloaded = downloadedFormIds.has(formKey)

    if (!hasExecuted) {
      missingEsignOrUpload.push(form.label)
      continue
    }
    if (!hasDownloaded) {
      missingDownload.push(form.label)
    }
  }

  const issues: string[] = []

  if (missingEsignOrUpload.length > 0) {
    issues.push(
      `Forms Package: send and complete eSign, or upload signed copies for — ${missingEsignOrUpload.join(', ')}.`,
    )
  }

  if (missingDownload.length > 0) {
    issues.push(
      `Forms Package: download each executed eSign PDF from the Forms Package step for — ${missingDownload.join(', ')}.`,
    )
  }

  return issues
}
