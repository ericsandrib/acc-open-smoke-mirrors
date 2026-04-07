import type { EsignEnvelope } from '@/types/esignEnvelope'

/**
 * Builds a default title when the advisor leaves the envelope name blank.
 * Prioritizes signer names, then distinct account lines from generated forms, then date.
 */
export function deriveDefaultEnvelopeName(e: EsignEnvelope): string {
  const signerNames = e.signers.map((s) => s.name.trim()).filter(Boolean)

  const byChild = new Map<string, string>()
  for (const r of e.formSelections) {
    if (byChild.has(r.accountChildId)) continue
    const line =
      r.accountOpeningName?.trim() ||
      r.accountNumberLabel?.trim() ||
      'Account'
    byChild.set(r.accountChildId, line)
  }
  const accounts = [...byChild.values()]

  const d = new Date(e.createdAt)
  const dateStr = Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const signerPart =
    signerNames.length === 0
      ? null
      : signerNames.length === 1
        ? signerNames[0]!
        : signerNames.length === 2
          ? `${signerNames[0]} & ${signerNames[1]}`
          : `${signerNames[0]} +${signerNames.length - 1} signers`

  const accountPart =
    accounts.length === 0
      ? null
      : accounts.length === 1
        ? accounts[0]!
        : accounts.length === 2
          ? `${accounts[0]}; ${accounts[1]}`
          : `${accounts.length} accounts`

  const parts = [signerPart, accountPart, dateStr].filter(Boolean) as string[]
  if (parts.length > 0) return parts.join(' — ')
  return `Signing package${dateStr ? ` — ${dateStr}` : ''}`
}

/** Display title: custom name if set, otherwise a default from signers and accounts. */
export function getEnvelopeDisplayName(e: EsignEnvelope): string {
  const t = e.name.trim()
  if (t) return t
  return deriveDefaultEnvelopeName(e)
}
