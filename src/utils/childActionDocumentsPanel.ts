import type { WorkflowState } from '@/types/workflow'
import { OPTIONAL_ESIGN_FORM_CATALOG } from '@/data/esignEnvelopeOptions'
import {
  getOpenAccountsCoreSupportingDocumentSections,
  getRegistrationDocumentsForType,
  partitionRegistrationDocumentsByFulfillment,
  type RegistrationType,
} from '@/utils/registrationDocuments'
import { resolveAccountOpeningFormsPackageTaskId } from '@/utils/accountOpeningDocumentTasks'
import { findParentTaskForChild } from '@/utils/openAccountsTaskContext'
import { buildSupportingDocumentPreviewKey } from '@/utils/journeySupportingDocuments'
import {
  buildWetSignedFirmUploadPreviewKey,
  parseWetSignedFirmUploads,
} from '@/utils/wetSignedFirmUploads'

export type ChildActionDocumentListRow = {
  rowKey: string
  label: string
  previewKey?: string
  fileName?: string
  formIdOrDocId?: string
  esignViewMode?: 'signed' | 'preview'
  contextLabel?: string
}

export type ChildActionDocumentSections = {
  supportingDocuments: ChildActionDocumentListRow[]
  formsPackage: ChildActionDocumentListRow[]
}

type ParentActionDocumentSections = ChildActionDocumentSections

type DocInstanceLike = {
  id?: string
  fileName?: string
}

type ExecutedEsignFormLike = {
  id: string
  formId: string
  label: string
  fileName?: string
}

/** Supporting-document uploads + executed forms package rows for the active account-opening child. */
export function collectChildActionDocumentSections(
  state: WorkflowState,
  childId: string,
): ChildActionDocumentSections {
  const supportingDocuments: ChildActionDocumentListRow[] = []
  const formsPackage: ChildActionDocumentListRow[] = []

  const child = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === childId)
  if (!child || child.childType !== 'account-opening') {
    return { supportingDocuments, formsPackage }
  }

  const openAccountsParent = findParentTaskForChild(state, childId)
  const openAccountsParentId = openAccountsParent?.id ?? 'open-accounts'
  const openAccountsData = (state.taskData[openAccountsParentId] as Record<string, unknown> | undefined) ?? {}
  const labelMap = new Map(
    getOpenAccountsCoreSupportingDocumentSections().map((doc) => [doc.id, doc.label]),
  )

  for (const key of Object.keys(openAccountsData)) {
    if (!key.startsWith('doc-instances-')) continue
    const docTypeId = key.slice('doc-instances-'.length)
    const requirementLabel = labelMap.get(docTypeId) ?? docTypeId
    const raw = openAccountsData[key]
    if (!Array.isArray(raw)) continue
    for (let i = 0; i < raw.length; i++) {
      const inst = raw[i] as DocInstanceLike
      const fileName = inst.fileName?.trim()
      if (!fileName || fileName.toLowerCase() === 'no file uploaded') continue
      const id = typeof inst.id === 'string' ? inst.id : `${key}-${i}`
      supportingDocuments.push({
        rowKey: `${key}::${id}`,
        label: requirementLabel,
        previewKey: buildSupportingDocumentPreviewKey(openAccountsParentId, key, id),
        fileName,
      })
    }
  }

  const formsTaskId = resolveAccountOpeningFormsPackageTaskId(state, childId)
  const formsData = (state.taskData[formsTaskId] as Record<string, unknown> | undefined) ?? {}
  const executed = (formsData.esignExecutedForms as ExecutedEsignFormLike[] | undefined) ?? []
  for (const doc of executed) {
    if (!doc.label?.trim()) continue
    formsPackage.push({
      rowKey: doc.id,
      label: doc.label.trim(),
      formIdOrDocId: doc.formId,
      esignViewMode: 'signed',
    })
  }

  const childMeta = (state.taskData[childId] as Record<string, unknown> | undefined) ?? {}
  const registrationType = childMeta.registrationType as RegistrationType | undefined
  const firmDocLabels = new Map<string, string>()
  if (registrationType) {
    const { esign } = partitionRegistrationDocumentsByFulfillment(
      getRegistrationDocumentsForType(registrationType, { relatedParties: state.relatedParties }),
    )
    for (const doc of esign) firmDocLabels.set(doc.id, doc.label)
  }
  for (const opt of OPTIONAL_ESIGN_FORM_CATALOG) {
    firmDocLabels.set(opt.id, opt.label)
  }

  const wetUploads = parseWetSignedFirmUploads(openAccountsData).filter((upload) => {
    const fileName = upload.fileName?.trim()
    if (!fileName) return false
    return !upload.accountChildId || upload.accountChildId === childId
  })
  for (const upload of wetUploads) {
    formsPackage.push({
      rowKey: `wet::${upload.id}`,
      label: firmDocLabels.get(upload.documentTypeId) ?? upload.documentTypeId,
      previewKey: buildWetSignedFirmUploadPreviewKey(openAccountsParentId, upload.id),
      fileName: upload.fileName.trim(),
    })
  }

  supportingDocuments.sort((a, b) => a.label.localeCompare(b.label) || a.fileName!.localeCompare(b.fileName!))
  formsPackage.sort((a, b) => a.label.localeCompare(b.label))

  return { supportingDocuments, formsPackage }
}

/**
 * Parent Open Accounts documents: aggregate all child-account uploads and forms package docs.
 */
export function collectParentActionDocumentSections(
  state: WorkflowState,
  parentTaskId: string,
): ParentActionDocumentSections {
  const parent = state.tasks.find((task) => task.id === parentTaskId)
  if (!parent) return { supportingDocuments: [], formsPackage: [] }

  const accountChildren = (parent.children ?? []).filter((child) => child.childType === 'account-opening')
  const supportingDocuments: ChildActionDocumentListRow[] = []
  const formsPackage: ChildActionDocumentListRow[] = []

  for (const child of accountChildren) {
    const childSections = collectChildActionDocumentSections(state, child.id)
    const contextLabel = child.name

    supportingDocuments.push(
      ...childSections.supportingDocuments.map((row) => ({
        ...row,
        rowKey: `${child.id}::supporting::${row.rowKey}`,
        contextLabel,
      })),
    )

    formsPackage.push(
      ...childSections.formsPackage.map((row) => ({
        ...row,
        rowKey: `${child.id}::forms::${row.rowKey}`,
        contextLabel,
      })),
    )
  }

  supportingDocuments.sort((a, b) => {
    const account = (a.contextLabel ?? '').localeCompare(b.contextLabel ?? '')
    if (account !== 0) return account
    return (a.fileName ?? a.label).localeCompare(b.fileName ?? b.label)
  })

  formsPackage.sort((a, b) => {
    const account = (a.contextLabel ?? '').localeCompare(b.contextLabel ?? '')
    if (account !== 0) return account
    return (a.fileName ?? a.label).localeCompare(b.fileName ?? b.label)
  })

  return { supportingDocuments, formsPackage }
}
