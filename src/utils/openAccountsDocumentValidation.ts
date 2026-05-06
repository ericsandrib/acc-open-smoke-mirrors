import type { ChildTask, WorkflowState } from '@/types/workflow'
import type { EsignEnvelope } from '@/types/esignEnvelope'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import { getAccountOpeningChildSubmissionIssues } from '@/utils/accountOpeningChildProgress'
import { getEnvelopeDisplayName } from '@/utils/deriveEnvelopeDisplayName'
import { getOpenAccountsCoreSupportingDocumentSections, getDocSubTypes } from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { getEsignEnvelopeStatus } from '@/utils/esignEnvelopeStatus'
import { getAlternativeStrategyEsignSubmitBlockers } from '@/utils/alternativeStrategyValidation'
import { isAnnuityExternalPlatformOpenAccountsTask } from '@/utils/openAccountsTaskContext'
import {
  instanceSpecificationComplete,
  type SupportingDocumentStatus,
} from '@/utils/supportingDocuments'

type OwnerSlot = { partyId?: string; type: string }

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
  customSubTypeLabel?: string
  status?: SupportingDocumentStatus
}

/**
 * Registration types for accounts that have at least one owner slot assigned to a party (used by other flows such
 * as eSign envelope defaults). Open Accounts supporting uploads are not gated on this list.
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

/**
 * Upload rows where review explicitly requested a document but specification or file is still missing.
 * Suggested optional rows never block submission.
 */
export function getOpenAccountsMissingDocumentSpecificationIssues(
  state: WorkflowState,
  openAccountsTaskId: string,
): string[] {
  const openAccountsTask = state.tasks.find((t) => t.id === openAccountsTaskId)
  if (!openAccountsTask) return []

  const uploadDocs = getOpenAccountsCoreSupportingDocumentSections()

  const taskData = (state.taskData[openAccountsTaskId] as Record<string, unknown> | undefined) ?? {}
  const issues: string[] = []

  for (const doc of uploadDocs) {
    const subTypes = getDocSubTypes(doc.id)
    const instances = (taskData[`doc-instances-${doc.id}`] as DocInstance[] | undefined) ?? []
    const requested = instances.filter((i) => i.status === 'requested_by_review')
    if (requested.length === 0) continue

    const missingSpec = requested.filter(
      (i) => !instanceSpecificationComplete(i.subType, i.customSubTypeLabel, subTypes.length),
    ).length
    if (missingSpec > 0) {
      issues.push(
        `${doc.label}: ${missingSpec} row${missingSpec === 1 ? '' : 's'} requested during review still need a document type (or custom type name).`,
      )
    }

    const missingFile = requested.filter((i) => !i.fileName?.trim()).length
    if (missingFile > 0) {
      issues.push(
        `${doc.label}: ${missingFile} upload${missingFile === 1 ? '' : 's'} requested during review still need a file.`,
      )
    }
  }

  return issues
}

/**
 * All reasons the Open Accounts task cannot be marked complete. Used by the wizard footer confirmation modal.
 */
export function getOpenAccountsCompletionBlockers(
  state: WorkflowState,
  openAccountsTaskId: string,
): string[] {
  const blockers: string[] = []

  blockers.push(...getOpenAccountsMissingDocumentSpecificationIssues(state, openAccountsTaskId))

  const openAccountsTask = state.tasks.find((t) => t.id === openAccountsTaskId)
  const accountOpeningChildren =
    openAccountsTask?.children?.filter((c) => c.childType === 'account-opening') ?? []
  const externalAnnuityPlatform = isAnnuityExternalPlatformOpenAccountsTask(openAccountsTask)

  if (!externalAnnuityPlatform) {
    for (const c of accountOpeningChildren) {
      const { names } = getAccountOwnersMissingKyc(state, c.id)
      if (names.length > 0) {
        blockers.push(
          `${c.name}: KYC is not complete for — ${names.join(', ')}`,
        )
      }
    }
  }

  if (!externalAnnuityPlatform) {
    const openData = (state.taskData[openAccountsTaskId] as Record<string, unknown> | undefined) ?? {}
    const envelopes = (openData.esignEnvelopes as EsignEnvelope[] | undefined) ?? []

    if (envelopes.length === 0) {
      blockers.push('Create at least one eSign envelope.')
    } else {
      const hasCompletedEnvelope = envelopes.some((env) => getEsignEnvelopeStatus(env) === 'completed')
      if (!hasCompletedEnvelope) {
        const names = envelopes.map((env) => getEnvelopeDisplayName(env)).join(', ')
        blockers.push(
          `eSign needed to complete this task: at least one envelope must be Completed. Current envelope(s): ${names}.`,
        )
      }
    }
  }

  return blockers
}

/**
 * Readiness checks for submitting all account-opening child workflows for review from Open Accounts.
 */
export function getOpenAccountsSubmitForReviewBlockers(
  state: WorkflowState,
  openAccountsTaskId: string,
): string[] {
  const blockers: string[] = []
  const openAccountsTask = state.tasks.find((t) => t.id === openAccountsTaskId)
  const accountOpeningChildren =
    openAccountsTask?.children?.filter((c) => c.childType === 'account-opening') ?? []
  const externalAnnuityPlatform = isAnnuityExternalPlatformOpenAccountsTask(openAccountsTask)

  if (accountOpeningChildren.length === 0) {
    return ['Add at least one account in Accounts to Be Opened before submitting for review.']
  }

  blockers.push(...getOpenAccountsMissingDocumentSpecificationIssues(state, openAccountsTaskId))

  for (const child of accountOpeningChildren) {
    const childIssues = getAccountOpeningChildSubmissionIssues(state, child.id)
    for (const issue of childIssues) {
      blockers.push(`${child.name}: ${issue}`)
    }
  }

  if (externalAnnuityPlatform) {
    return blockers
  }

  const openData = (state.taskData[openAccountsTaskId] as Record<string, unknown> | undefined) ?? {}
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

  // Envelope-level checks scoped to accounts that still exist in this submission.
  for (const env of sentEnvelopes) {
    const includedRows = env.formSelections.filter((r) => r.included)
    const includedRowsForExistingAccounts = includedRows.filter((r) =>
      accountNameById.has(r.accountChildId),
    )
    if (includedRowsForExistingAccounts.length === 0) {
      blockers.push(`${getEnvelopeDisplayName(env)}: sent but no account forms are included.`)
      continue
    }
  }

  blockers.push(...getAlternativeStrategyEsignSubmitBlockers(state, accountOpeningChildren, sentEnvelopes))

  return blockers
}
