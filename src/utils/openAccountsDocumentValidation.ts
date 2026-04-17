import type { ChildTask, WorkflowState } from '@/types/workflow'
import type { EsignEnvelope } from '@/types/esignEnvelope'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import { getAccountOpeningChildSubmissionIssues } from '@/utils/accountOpeningChildProgress'
import { getEnvelopeDisplayName } from '@/utils/deriveEnvelopeDisplayName'
import {
  getRegistrationDocuments,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
  sortUploadDocumentsForOpenAccounts,
} from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { getEsignEnvelopeStatus } from '@/utils/esignEnvelopeStatus'

type OwnerSlot = { partyId?: string; type: string }

/**
 * Registration types that drive Required Documents / validation. Only includes an account once it has at least
 * one owner slot assigned to a party—so a newly added trust (registration type set) does not show uploads until
 * the advisor picks account owner(s).
 */
export function getRegistrationTypesForOpenAccountsUploadSection(
  accountOpeningChildren: ChildTask[],
  taskData: WorkflowState['taskData'],
): RegistrationType[] {
  const types: RegistrationType[] = []
  for (const c of accountOpeningChildren) {
    const rt = (taskData[c.id] as Record<string, unknown> | undefined)?.registrationType as
      | RegistrationType
      | undefined
    if (!rt) continue
    const ownerData = taskData[`${c.id}-account-owners`] as Record<string, unknown> | undefined
    const owners = (ownerData?.owners as OwnerSlot[] | undefined) ?? []
    const hasAssignedOwner = owners.some((o) => o.type === 'existing' && o.partyId)
    if (!hasAssignedOwner) continue
    types.push(rt)
  }
  return types
}

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
}

/**
 * Upload rows whose document type has a specification dropdown (subtype) but none is selected.
 * Returns human-readable issue strings (one per document category with gaps).
 */
export function getOpenAccountsMissingDocumentSpecificationIssues(
  state: WorkflowState,
): string[] {
  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  if (!openAccountsTask) return []

  const accountOpeningChildren = (openAccountsTask.children ?? []).filter(
    (c) => c.childType === 'account-opening',
  )

  const childRegistrationTypes = getRegistrationTypesForOpenAccountsUploadSection(
    accountOpeningChildren,
    state.taskData,
  )

  const { upload } = partitionRegistrationDocumentsByFulfillment(
    getRegistrationDocuments(childRegistrationTypes, state.relatedParties),
  )
  const uploadDocs = sortUploadDocumentsForOpenAccounts(upload)

  const taskData = (state.taskData['open-accounts'] as Record<string, unknown> | undefined) ?? {}
  const issues: string[] = []

  for (const doc of uploadDocs) {
    if (getDocSubTypes(doc.id).length === 0) continue

    const instances = (taskData[`doc-instances-${doc.id}`] as DocInstance[] | undefined) ?? []
    const missing = instances.filter((i) => !i.subType?.trim()).length
    if (missing > 0) {
      issues.push(
        `${doc.label}: ${missing} upload row${missing === 1 ? '' : 's'} still need a document type (specification).`,
      )
    }
  }

  return issues
}

/**
 * All reasons the Open Accounts task cannot be marked complete. Used by the wizard footer confirmation modal.
 */
export function getOpenAccountsCompletionBlockers(state: WorkflowState): string[] {
  const blockers: string[] = []

  blockers.push(...getOpenAccountsMissingDocumentSpecificationIssues(state))

  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const accountOpeningChildren =
    openAccountsTask?.children?.filter((c) => c.childType === 'account-opening') ?? []

  for (const c of accountOpeningChildren) {
    const { names } = getAccountOwnersMissingKyc(state, c.id)
    if (names.length > 0) {
      blockers.push(
        `${c.name}: KYC is not complete for — ${names.join(', ')}`,
      )
    }
  }

  const openData = (state.taskData['open-accounts'] as Record<string, unknown> | undefined) ?? {}
  const envelopes = (openData.esignEnvelopes as EsignEnvelope[] | undefined) ?? []

  if (envelopes.length === 0) {
    blockers.push('Create at least one eSign envelope.')
  } else {
    const hasCompletedEnvelope = envelopes.some((env) => getEsignEnvelopeStatus(env) === 'completed')
    if (!hasCompletedEnvelope) {
      const names = envelopes.map((env) => getEnvelopeDisplayName(env)).join(', ')
      blockers.push(
        `eSign required: at least one envelope must be Completed. Current envelope(s): ${names}.`,
      )
    }
  }

  return blockers
}

/**
 * Readiness checks for submitting all account-opening child workflows for review from Open Accounts.
 */
export function getOpenAccountsSubmitForReviewBlockers(state: WorkflowState): string[] {
  const blockers: string[] = []
  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const accountOpeningChildren =
    openAccountsTask?.children?.filter((c) => c.childType === 'account-opening') ?? []

  if (accountOpeningChildren.length === 0) {
    return ['Add at least one account in Accounts to be Opened before submitting for review.']
  }

  blockers.push(...getOpenAccountsMissingDocumentSpecificationIssues(state))

  for (const child of accountOpeningChildren) {
    const childIssues = getAccountOpeningChildSubmissionIssues(state, child.id)
    for (const issue of childIssues) {
      blockers.push(`${child.name}: ${issue}`)
    }
  }

  const openData = (state.taskData['open-accounts'] as Record<string, unknown> | undefined) ?? {}
  const envelopes = (openData.esignEnvelopes as EsignEnvelope[] | undefined) ?? []
  const sentEnvelopes = envelopes.filter((env) => env.sentToClient === true)

  if (envelopes.length === 0) {
    blockers.push('Create at least one eSign envelope.')
    return blockers
  }
  if (sentEnvelopes.length === 0) {
    blockers.push('Send at least one eSign envelope to the client before submitting for review.')
    return blockers
  }

  const accountNameById = new Map(accountOpeningChildren.map((c) => [c.id, c.name]))
  const coveredAccountIds = new Set<string>()
  for (const env of sentEnvelopes) {
    for (const row of env.formSelections) {
      if (row.included) coveredAccountIds.add(row.accountChildId)
    }
  }

  const uncovered = accountOpeningChildren.filter((c) => !coveredAccountIds.has(c.id))
  for (const c of uncovered) {
    blockers.push(`${c.name}: forms have not been sent to client in any envelope.`)
  }

  // Also surface envelope-level gaps for debugging routing.
  for (const env of sentEnvelopes) {
    const includedRows = env.formSelections.filter((r) => r.included)
    if (includedRows.length === 0) {
      blockers.push(`${getEnvelopeDisplayName(env)}: sent but no account forms are included.`)
      continue
    }
    const unknownAccountIds = new Set(
      includedRows.map((r) => r.accountChildId).filter((id) => !accountNameById.has(id)),
    )
    if (unknownAccountIds.size > 0) {
      blockers.push(
        `${getEnvelopeDisplayName(env)}: contains form selections for accounts not found in this submission.`,
      )
    }
  }

  return blockers
}
