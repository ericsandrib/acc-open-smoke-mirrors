import type { ChildTask, WorkflowState } from '@/types/workflow'
import type { EsignEnvelope } from '@/types/esignEnvelope'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import { getEnvelopeDisplayName } from '@/utils/deriveEnvelopeDisplayName'
import {
  getRegistrationDocuments,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
  sortUploadDocumentsForOpenAccounts,
} from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'

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
    blockers.push('Create at least one eSign envelope and send it to the client for signature.')
  } else {
    for (const env of envelopes) {
      const name = getEnvelopeDisplayName(env)
      if (!env.sentToClient && !env.clientSignaturesComplete) {
        blockers.push(`${name}: mark the envelope as sent to the client and as signed by the client.`)
      } else if (!env.sentToClient) {
        blockers.push(`${name}: mark the envelope as sent to the client.`)
      } else if (!env.clientSignaturesComplete) {
        blockers.push(`${name}: mark the envelope as signed by the client.`)
      }
    }
  }

  return blockers
}
