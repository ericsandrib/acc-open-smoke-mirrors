import type { WorkflowState } from '@/types/workflow'
import { getRegistrationDocumentsForType } from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'

export type SmartDocItem = {
  id: string
  label: string
  bucket: 'account' | 'owner' | 'funding' | 'feature'
  why: string
}

export type SmartDocumentsState = {
  requiredNow: SmartDocItem[]
  mayBeRequiredLater: SmartDocItem[]
  satisfied: SmartDocItem[]
  triggeredByRecentChanges: SmartDocItem[]
  counts: {
    requiredNow: number
    missing: number
    satisfied: number
    mayBeRequiredLater: number
  }
}

function doc(
  id: string,
  label: string,
  bucket: SmartDocItem['bucket'],
  why: string,
): SmartDocItem {
  return { id, label, bucket, why }
}

/**
 * Demo rules engine: derives document buckets from account-opening task data.
 * In production this would call a shared rules service.
 */
export function computeSmartDocuments(state: WorkflowState, childId: string): SmartDocumentsState {
  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const regType = childMeta?.registrationType as RegistrationType | undefined

  const accountOwnersId = `${childId}-account-owners`
  const fundingId = `${childId}-funding-transfers`
  const featuresId = `${childId}-features-services`

  const ownersData = (state.taskData[accountOwnersId] as Record<string, unknown> | undefined)?.owners as
    | unknown[]
    | undefined
  const ownerCount = Array.isArray(ownersData) ? ownersData.length : 0

  const fundingData = state.taskData[fundingId] as Record<string, unknown> | undefined
  const fundingSource = fundingData?.fundingSource as string | undefined

  const featuresData = state.taskData[featuresId] as Record<string, unknown> | undefined
  const margin = featuresData?.marginRequested as boolean | undefined
  const options = featuresData?.optionsRequested as boolean | undefined

  const requiredNow: SmartDocItem[] = []
  const mayBeRequiredLater: SmartDocItem[] = []
  const satisfied: SmartDocItem[] = []
  const triggered: SmartDocItem[] = []

  if (regType) {
    const regDocs = getRegistrationDocumentsForType(regType)
    for (const d of regDocs.slice(0, 4)) {
      requiredNow.push(
        doc(`reg-${d.id}`, d.label, 'account', `Account-level: registration type is ${regType}.`),
      )
    }
  } else {
    mayBeRequiredLater.push(
      doc('reg-pending', 'Registration package', 'account', 'Shown once registration type is set on the account.'),
    )
  }

  if (ownerCount > 0) {
    requiredNow.push(
      doc('owner-kyc', 'Owner identity & eligibility attestations', 'owner', 'Owner-level: each named participant must attest.'),
    )
    satisfied.push(
      doc('owner-ack', 'Account owner acknowledgment (preview)', 'owner', 'Satisfied when owner profile is linked.'),
    )
  } else {
    mayBeRequiredLater.push(
      doc('owners-later', 'Owner-specific disclosures', 'owner', 'Added when owners are assigned in Task 1.'),
    )
  }

  if (fundingSource === 'ach' || fundingSource === 'wire') {
    requiredNow.push(
      doc(
        'bank-auth',
        fundingSource === 'ach' ? 'ACH authorization' : 'Wire instructions acknowledgment',
        'funding',
        `Triggered by ${fundingSource?.toUpperCase()} funding selection.`,
      ),
    )
    triggered.push(
      doc(
        'fund-trigger',
        'Funding method addendum',
        'funding',
        'Generated when funding method was saved.',
      ),
    )
  } else if (fundingSource === 'transfer') {
    mayBeRequiredLater.push(
      doc('acat', 'ACAT / transfer paperwork', 'funding', 'Needed if external transfer is selected.'),
    )
  }

  if (margin) {
    requiredNow.push(doc('margin', 'Margin agreement', 'feature', 'Margin election in Features & services.'))
    triggered.push(doc('margin-trig', 'Margin risk disclosure', 'feature', 'Triggered by margin selection.'))
  }
  if (options) {
    requiredNow.push(doc('opt', 'Options agreement & supplement', 'feature', 'Options election in Features & services.'))
  }

  const missing = Math.max(0, requiredNow.length - satisfied.length)

  return {
    requiredNow,
    mayBeRequiredLater,
    satisfied,
    triggeredByRecentChanges: triggered,
    counts: {
      requiredNow: requiredNow.length,
      missing,
      satisfied: satisfied.length,
      mayBeRequiredLater: mayBeRequiredLater.length,
    },
  }
}
