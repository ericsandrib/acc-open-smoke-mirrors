import type { RelatedParty } from '@/types/workflow'
import { getRegistrationDocumentsForType, partitionRegistrationDocumentsByFulfillment } from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import type { EnvelopeFormSelection } from '@/types/esignEnvelope'

/**
 * Builds one row per generated firm/custodian e-sign form for each open-account child.
 * UI groups rows by `accountChildId` so every account line stays separate even if numbers match or are unset.
 */
export function buildRequiredEsignFormRows(
  accountOpeningChildren: { id: string; name: string }[],
  taskData: Record<string, unknown>,
  relatedParties?: RelatedParty[],
): EnvelopeFormSelection[] {
  const rows: EnvelopeFormSelection[] = []
  const docOpts = relatedParties ? { relatedParties } : undefined

  for (const child of accountOpeningChildren) {
    const meta = taskData[child.id] as Record<string, unknown> | undefined
    const rt = meta?.registrationType as RegistrationType | undefined
    if (!rt) continue

    const { esign } = partitionRegistrationDocumentsByFulfillment(
      getRegistrationDocumentsForType(rt, docOpts),
    )
    const acct = String(meta?.accountNumber ?? '').trim()
    const short = String(meta?.shortName ?? '').trim()
    const accountNumberLabel = acct || short || 'Not assigned'

    for (const doc of esign) {
      rows.push({
        formId: `${child.id}::${doc.id}`,
        label: doc.label,
        accountChildId: child.id,
        accountOpeningName: child.name,
        accountNumberLabel,
        required: true,
        included: true,
      })
    }
  }

  return rows
}

/** Groups form rows by open-account child (one card per account in the envelope UI). */
export function groupFormSelectionsByAccountChild(
  rows: EnvelopeFormSelection[],
): Map<string, EnvelopeFormSelection[]> {
  const map = new Map<string, EnvelopeFormSelection[]>()
  for (const r of rows) {
    const key = r.accountChildId
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return map
}

