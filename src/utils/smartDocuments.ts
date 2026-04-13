import type { WorkflowState } from '@/types/workflow'
import { getRegistrationDocumentsForType, partitionRegistrationDocumentsByFulfillment } from '@/utils/registrationDocuments'
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

function collectFeatureLineTypes(state: WorkflowState, accountChildId: string): string[] {
  const openAccounts = state.tasks.find((t) => t.formKey === 'open-accounts')
  const types: string[] = []
  for (const c of openAccounts?.children ?? []) {
    if (c.childType !== 'feature-service-line') continue
    const root = state.taskData[c.id] as Record<string, unknown> | undefined
    if ((root?.parentAccountChildId as string | undefined) !== accountChildId) continue
    const setup = state.taskData[`${c.id}-setup`] as Record<string, unknown> | undefined
    const t = (setup?.featureServiceType ?? root?.featureServiceType) as string | undefined
    if (t) types.push(t)
  }
  return types
}

/**
 * Demo rules engine: derives document buckets from account-opening task data.
 * In production this would call a shared rules service.
 */
export function computeSmartDocuments(state: WorkflowState, childId: string): SmartDocumentsState {
  const fundingLineOnly = childId.startsWith('funding-line-child-')
  const featureLineOnly = childId.startsWith('feature-service-line-child-')

  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const regType = childMeta?.registrationType as RegistrationType | undefined

  const accountOwnersId = `${childId}-account-owners`
  const fundingId = fundingLineOnly ? `${childId}-setup` : `${childId}-funding-transfers`

  const ownersData = (state.taskData[accountOwnersId] as Record<string, unknown> | undefined)?.owners as
    | unknown[]
    | undefined
  const ownerCount = Array.isArray(ownersData) ? ownersData.length : 0

  const fundingData = state.taskData[fundingId] as Record<string, unknown> | undefined
  const fundingSource = fundingData?.fundingSource as string | undefined

  const featureSetupId = featureLineOnly ? `${childId}-setup` : ''
  const featureSetupData = featureLineOnly
    ? (state.taskData[featureSetupId] as Record<string, unknown> | undefined)
    : undefined
  const featureTypeFromLine =
    (featureSetupData?.featureServiceType as string | undefined) ??
    (childMeta?.featureServiceType as string | undefined)

  const featureTypesFromChildren = !fundingLineOnly && !featureLineOnly ? collectFeatureLineTypes(state, childId) : []

  const requiredNow: SmartDocItem[] = []
  const mayBeRequiredLater: SmartDocItem[] = []
  const satisfied: SmartDocItem[] = []
  const triggered: SmartDocItem[] = []

  if (!fundingLineOnly && !featureLineOnly) {
    if (regType) {
      const regDocs = getRegistrationDocumentsForType(regType, { relatedParties: state.relatedParties })
      const { upload: uploadRegDocs, esign: esignRegDocs } = partitionRegistrationDocumentsByFulfillment(regDocs)
      for (const d of uploadRegDocs.slice(0, 4)) {
        requiredNow.push(
          doc(`reg-${d.id}`, d.label, 'account', `Account-level: registration type is ${regType}.`),
        )
      }
      if (esignRegDocs.length > 0) {
        requiredNow.push(
          doc(
            'reg-esign-package',
            'Firm & custodian forms (e-sign)',
            'account',
            `${esignRegDocs.length} form(s) generated from application data and sent in the signing envelope.`,
          ),
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
  }

  if (fundingLineOnly && fundingSource) {
    if (fundingSource === 'ach') {
      requiredNow.push(doc('bank-auth', 'ACH authorization', 'funding', 'Triggered by ACH movement type.'))
      triggered.push(doc('fund-trigger', 'Funding method addendum', 'funding', 'Generated when movement type was saved.'))
    } else if (fundingSource === 'fed_fund_wires') {
      requiredNow.push(
        doc('wire-ack', 'Wire instructions acknowledgment', 'funding', 'Triggered by Fed Fund Wires movement type.'),
      )
      triggered.push(doc('fund-trigger', 'Funding method addendum', 'funding', 'Generated when movement type was saved.'))
    } else if (fundingSource === 'bank_send_receive') {
      requiredNow.push(
        doc('bank-send-recv', 'Bank send / receive authorization', 'funding', 'Triggered by Bank Send and Receive movement type.'),
      )
    } else if (fundingSource === 'account_transfers') {
      mayBeRequiredLater.push(
        doc('acat', 'ACAT / transfer paperwork', 'funding', 'Needed when account transfer movement is in scope.'),
      )
    } else if (fundingSource === 'check_deposits' || fundingSource === 'check_withdrawals') {
      mayBeRequiredLater.push(
        doc('check-item', 'Check deposit / withdrawal documentation', 'funding', 'May apply when check movement is selected.'),
      )
    } else if (fundingSource === 'standing_periodic_instructions') {
      mayBeRequiredLater.push(
        doc('standing-setup', 'Standing or periodic instruction forms', 'funding', 'Often prerequisite for ACH and wires.'),
      )
    } else if (fundingSource === 'mutual_fund_periodic_orders') {
      mayBeRequiredLater.push(
        doc('mfp-order', 'Recurring mutual fund order documentation', 'funding', 'Scheduled MF asset movement.'),
      )
    } else if (fundingSource === 'journals') {
      mayBeRequiredLater.push(
        doc('journal-auth', 'Journal authorization / LOA', 'funding', 'May apply to journal movements between accounts.'),
      )
    }
  }

  if (featureLineOnly && featureTypeFromLine) {
    if (featureTypeFromLine === 'e_delivery') {
      requiredNow.push(
        doc('edeliver', 'eDelivery enrollment', 'feature', 'eDelivery feature workflow on this line.'),
      )
      triggered.push(doc('edel-trig', 'eDelivery addendum', 'feature', 'Triggered by eDelivery selection.'))
    }
    if (featureTypeFromLine === 'dividend_capital_gain_reinvestment') {
      requiredNow.push(
        doc(
          'div-reinvest',
          'Dividend & capital gains reinvestment instructions',
          'feature',
          'Reinvestment election on this workflow line.',
        ),
      )
    }
    if (featureTypeFromLine === 'lending_solutions') {
      mayBeRequiredLater.push(
        doc('lending', 'Lending disclosures', 'feature', 'May apply when lending solutions workflow is opened.'),
      )
    }
  }

  if (!fundingLineOnly && !featureLineOnly) {
    for (const ft of featureTypesFromChildren) {
      if (ft === 'e_delivery') {
        requiredNow.push(
          doc('edeliver-hub', 'eDelivery enrollment', 'feature', 'At least one eDelivery feature workflow on this account.'),
        )
        break
      }
    }
    for (const ft of featureTypesFromChildren) {
      if (ft === 'lending_solutions') {
        mayBeRequiredLater.push(
          doc('lending-hub', 'Lending disclosures', 'feature', 'Lending solutions workflow present on this account.'),
        )
        break
      }
    }
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
