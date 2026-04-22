import type { ChildTask, WorkflowState } from '@/types/workflow'
import { mergeFeatureRequests } from '@/types/featureRequests'
import {
  alternativeStrategyProgressWeight,
  getAlternativeStrategyBlockingIssues,
} from '@/utils/alternativeStrategyValidation'
import {
  getRegistrationDocumentsForType,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
  getAssigneePartyIdsForClientUploadDoc,
} from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { getMaxAccountOwnersForRegistration } from '@/utils/registrationOwnerLimits'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'

type DocInstance = {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
}

function countStr(v: unknown): number {
  return typeof v === 'string' && v.trim() !== '' ? 1 : 0
}

function applySubmittedCap(
  state: WorkflowState,
  taskId: string,
  progress: { filled: number; total: number },
): { filled: number; total: number } {
  if (state.submittedTaskIds.includes(taskId)) {
    return { filled: progress.total, total: progress.total }
  }
  return progress
}

function findOpenAccountsTask(state: WorkflowState) {
  return state.tasks.find((t) => t.formKey === 'open-accounts')
}

function getFundingLinesForAccount(state: WorkflowState, accountChildId: string): ChildTask[] {
  const openAccountsTask = findOpenAccountsTask(state)
  if (!openAccountsTask?.children) return []
  return openAccountsTask.children.filter((c) => {
    if (c.childType !== 'funding-line') return false
    const pid = (state.taskData[c.id] as Record<string, unknown> | undefined)?.parentAccountChildId as
      | string
      | undefined
    return pid === accountChildId
  })
}

function getFeatureLinesForAccount(state: WorkflowState, accountChildId: string): ChildTask[] {
  const openAccountsTask = findOpenAccountsTask(state)
  if (!openAccountsTask?.children) return []
  return openAccountsTask.children.filter((c) => {
    if (c.childType !== 'feature-service-line') return false
    const pid = (state.taskData[c.id] as Record<string, unknown> | undefined)?.parentAccountChildId as
      | string
      | undefined
    return pid === accountChildId
  })
}

/** Field weights for a single funding-line setup form (dynamic by movement type). */
export function fundingLineSetupProgress(data: Record<string, unknown>): { filled: number; total: number } {
  const src = String(data.fundingSource ?? '').trim()
  let total = 4
  let filled = 0
  if (src) filled++
  filled += countStr(data.servicingModel)
  filled += countStr(data.sourceOfFundsWealth)
  filled += countStr(data.fundingAmount)

  if (src === 'ach' || src === 'bank_send_receive' || src === 'fed_fund_wires') {
    total += 3
    filled += countStr(data.bankName) + countStr(data.bankRouting) + countStr(data.bankAccountNumber)
  }
  if (src === 'account_transfers') {
    total += 2
    filled += countStr(data.deliveringFirm) + countStr(data.transferFromAccount)
  }
  if (src === 'check_deposits' || src === 'check_withdrawals') {
    total += 1
    filled += countStr(data.checkReference)
  }
  if (src === 'mutual_fund_periodic_orders') {
    total += 1
    filled += countStr(data.mutualFundPeriodicSchedule)
  }

  return { filled, total }
}

function featureLineSetupProgress(data: Record<string, unknown>): { filled: number; total: number } {
  const total = 4
  let filled = 0
  filled += countStr(data.featureServiceType)
  filled += countStr(data.featureWorkflowStatus)
  filled += countStr(data.featureEffectiveDate)
  filled += countStr(data.featureInternalRef)
  return { filled, total }
}

function slotSatisfied(
  docId: string,
  ownerId: string,
  needsSub: boolean,
  openAccountsData: Record<string, unknown>,
  localDocs: DocInstance[],
): boolean {
  const parentInstances = (openAccountsData[`doc-instances-${docId}`] as DocInstance[] | undefined) ?? []
  const fromParent = parentInstances.find((i) => i.assignedTo === ownerId)
  const fromLocal = localDocs.find((i) => i.docTypeId === docId && i.assignedTo === ownerId)
  const inst = fromParent ?? fromLocal
  if (!inst?.fileName?.trim()) return false
  if (needsSub && !String(inst.subType ?? '').trim()) return false
  return true
}

function progressAccountOwners(state: WorkflowState, accountChildId: string): { filled: number; total: number } {
  const taskId = `${accountChildId}-account-owners`
  const data = (state.taskData[taskId] as Record<string, unknown> | undefined) ?? {}
  const childMeta = state.taskData[accountChildId] as Record<string, unknown> | undefined
  const regType = childMeta?.registrationType as RegistrationType | undefined
  const maxOwners = getMaxAccountOwnersForRegistration(regType)

  const owners = (data.owners as { partyId?: string }[] | undefined) ?? []
  const ownerSlots = Math.min(Math.max(owners.length, 1), maxOwners)
  let ownerFilled = 0
  for (let i = 0; i < ownerSlots; i++) {
    if (owners[i]?.partyId) ownerFilled++
  }

  const supplementalKeys = [
    'retailInvestorIndicator',
    'initialFundsCode',
    'investmentObjectives',
    'riskFactor',
    'invLiquidityNeedsCode',
  ] as const
  let supFilled = 0
  for (const k of supplementalKeys) {
    supFilled += countStr(data[k])
  }

  const titleFilled = countStr(data.displayTitle)
  const fr = mergeFeatureRequests(childMeta?.featureRequests)
  const marginRequested = typeof fr.margin?.requested === 'boolean'
  const marginOk = marginRequested
  const optionsLevelOk = (fr.options?.requestedLevel ?? 0) >= 1
  const optionsRequested = typeof fr.options?.requested === 'boolean'
  const optionsOk = optionsRequested && (!fr.options?.requested || optionsLevelOk)
  const altW = alternativeStrategyProgressWeight(fr.alternativeStrategySelection)
  const featureFilled = (marginOk ? 1 : 0) + (optionsOk ? 1 : 0) + altW
  const featureTotal = 3

  const total = 1 + ownerSlots + supplementalKeys.length + featureTotal
  const filled = titleFilled + ownerFilled + supFilled + featureFilled

  return applySubmittedCap(state, taskId, { filled, total })
}

function mergedFundingLineSetupData(state: WorkflowState, lineId: string): Record<string, unknown> {
  const root = (state.taskData[lineId] as Record<string, unknown> | undefined) ?? {}
  const setup = (state.taskData[`${lineId}-setup`] as Record<string, unknown> | undefined) ?? {}
  return {
    ...root,
    ...setup,
    fundingSource: setup.fundingSource ?? root.fundingMethod,
  }
}

function mergedFeatureLineSetupData(state: WorkflowState, lineId: string): Record<string, unknown> {
  const root = (state.taskData[lineId] as Record<string, unknown> | undefined) ?? {}
  const setup = (state.taskData[`${lineId}-setup`] as Record<string, unknown> | undefined) ?? {}
  return {
    ...root,
    ...setup,
    featureServiceType: setup.featureServiceType ?? root.featureServiceType,
  }
}

function progressFundingHub(state: WorkflowState, accountChildId: string): { filled: number; total: number } {
  const taskId = `${accountChildId}-funding-transfers`
  const lines = getFundingLinesForAccount(state, accountChildId)
  if (lines.length === 0) {
    return applySubmittedCap(state, taskId, { filled: 0, total: 1 })
  }
  let filled = 0
  let total = 0
  for (const line of lines) {
    const p = fundingLineSetupProgress(mergedFundingLineSetupData(state, line.id))
    filled += p.filled
    total += p.total
  }
  return applySubmittedCap(state, taskId, { filled, total })
}

function progressFeaturesHub(state: WorkflowState, accountChildId: string): { filled: number; total: number } {
  const taskId = `${accountChildId}-features-services`
  const lines = getFeatureLinesForAccount(state, accountChildId)
  if (lines.length === 0) {
    return applySubmittedCap(state, taskId, { filled: 0, total: 1 })
  }
  let filled = 0
  let total = 0
  for (const line of lines) {
    const p = featureLineSetupProgress(mergedFeatureLineSetupData(state, line.id))
    filled += p.filled
    total += p.total
  }
  return applySubmittedCap(state, taskId, { filled, total })
}

function progressDocuments(state: WorkflowState, accountChildId: string): { filled: number; total: number } {
  const taskId = `${accountChildId}-documents-review`
  const docsData = (state.taskData[taskId] as Record<string, unknown> | undefined) ?? {}
  const childMeta = state.taskData[accountChildId] as Record<string, unknown> | undefined
  const registrationType = childMeta?.registrationType as RegistrationType | undefined
  const openAccountsData = (state.taskData['open-accounts'] as Record<string, unknown> | undefined) ?? {}
  const localDocs = (docsData['child-local-docs'] as DocInstance[] | undefined) ?? []

  const ownersTaskId = `${accountChildId}-account-owners`
  const owners =
    ((state.taskData[ownersTaskId] as Record<string, unknown> | undefined)?.owners as
      | { type?: string; partyId?: string }[]
      | undefined) ?? []
  const ownerIds = owners.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId!)

  if (!registrationType) {
    const notes = countStr(docsData.exceptionsNotes)
    return applySubmittedCap(state, taskId, { filled: notes, total: 1 })
  }

  const docs = getRegistrationDocumentsForType(registrationType, { relatedParties: state.relatedParties })
  const { upload } = partitionRegistrationDocumentsByFulfillment(docs)

  if (upload.length === 0) {
    const notes = countStr(docsData.exceptionsNotes)
    return applySubmittedCap(state, taskId, { filled: Math.min(1, notes), total: 1 })
  }

  if (ownerIds.length === 0) {
    return applySubmittedCap(state, taskId, { filled: 0, total: 1 })
  }

  let total = 0
  let filled = 0
  for (const doc of upload) {
    const needsSub = getDocSubTypes(doc.id).length > 0
    const assignees = getAssigneePartyIdsForClientUploadDoc(doc.id, state.relatedParties, ownerIds)
    for (const ownerId of assignees) {
      total += 1
      if (slotSatisfied(doc.id, ownerId, needsSub, openAccountsData, localDocs)) filled++
    }
  }

  return applySubmittedCap(state, taskId, { filled, total })
}

const ACCOUNT_OPENING_SUFFIXES = [
  'account-owners',
  'funding-transfers',
  'features-services',
  'documents-review',
] as const

export function getAccountOpeningSubTaskProgress(
  state: WorkflowState,
  accountChildId: string,
  suffix: string,
): { filled: number; total: number } {
  switch (suffix) {
    case 'account-owners':
      return progressAccountOwners(state, accountChildId)
    case 'funding-transfers':
      return progressFundingHub(state, accountChildId)
    case 'features-services':
      return progressFeaturesHub(state, accountChildId)
    case 'documents-review':
      return progressDocuments(state, accountChildId)
    default:
      return { filled: 0, total: 0 }
  }
}

export function getAccountOpeningAggregateProgress(
  state: WorkflowState,
  accountChildId: string,
): { filled: number; total: number } {
  let filled = 0
  let total = 0
  for (const suffix of ACCOUNT_OPENING_SUFFIXES) {
    const p = getAccountOpeningSubTaskProgress(state, accountChildId, suffix)
    filled += p.filled
    total += p.total
  }
  return { filled, total }
}

export function accountOpeningProgressRatio(
  state: WorkflowState,
  accountChildId: string,
  childStatus: string | undefined,
): number {
  if (childStatus === 'awaiting_review' || childStatus === 'complete') return 1
  const { filled, total } = getAccountOpeningAggregateProgress(state, accountChildId)
  if (total <= 0) return 0
  return Math.min(1, filled / total)
}

export function getAccountOpeningChildSubmissionIssues(
  state: WorkflowState,
  accountChildId: string,
): string[] {
  const issues: string[] = []

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === accountChildId && c.childType === 'account-opening')
  if (!child) {
    return ['Unable to validate this account. Please re-open the account workflow and try again.']
  }

  const ownersTaskId = `${accountChildId}-account-owners`
  const ownersData = (state.taskData[ownersTaskId] as Record<string, unknown> | undefined) ?? {}
  const owners = (ownersData.owners as { partyId?: string; type?: string }[] | undefined) ?? []

  const hasAssignedOwner = owners.some((o) => o.type === 'existing' && o.partyId)
  if (!hasAssignedOwner) {
    issues.push('Account & owners: add at least one account owner assigned to a person or entity.')
  }

  const childMeta = state.taskData[accountChildId] as Record<string, unknown> | undefined
  const fr = mergeFeatureRequests(childMeta?.featureRequests)
  for (const msg of getAlternativeStrategyBlockingIssues(fr.alternativeStrategySelection)) {
    issues.push(`Alternative strategy: ${msg}`)
  }

  const { names } = getAccountOwnersMissingKyc(state, accountChildId)
  if (names.length > 0) {
    issues.push(`KYC required: complete identity verification for ${names.join(', ')}.`)
  }

  const docsTaskId = `${accountChildId}-documents-review`
  const docsData = (state.taskData[docsTaskId] as Record<string, unknown> | undefined) ?? {}
  const executedEsignForms =
    (docsData.esignExecutedForms as
      | Array<{ id?: string; envelopeId?: string; formId?: string; label?: string; fileName?: string; executedAt?: string }>
      | undefined) ?? []
  if (executedEsignForms.length === 0) {
    issues.push('Documents: send and complete at least one eSign envelope so signed forms appear in this account.')
  }

  return issues
}

/**
 * `true` after the account-opening child has been submitted for home-office review at least once
 * (`SUBMIT_CHILD_FOR_REVIEW` seeds `childReviewsByChildId`).
 * First-time drafts have no entry — UX can still label both as "draft".
 */
export function hasAccountOpeningChildBeenSubmittedForReview(
  state: WorkflowState,
  accountChildId: string,
): boolean {
  return Boolean(state.childReviewsByChildId?.[accountChildId])
}
