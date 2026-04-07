import type { EsignEnvelope } from '@/types/esignEnvelope'
import {
  OPTIONAL_ESIGN_FORM_CATALOG,
  PAPERWORK_DELIVERY_OPTIONS,
} from '@/data/esignEnvelopeOptions'
import { groupFormSelectionsByAccountChild } from '@/utils/buildEsignEnvelopeFormRows'
import { getEnvelopeDisplayName } from '@/utils/deriveEnvelopeDisplayName'

function deliveryLabel(v: EsignEnvelope['deliveryMethod']): string {
  return PAPERWORK_DELIVERY_OPTIONS.find((o) => o.value === v)?.label ?? v
}

export function buildEnvelopeManifestText(envelope: EsignEnvelope): string {
  const lines: string[] = []
  lines.push(`Envelope: ${getEnvelopeDisplayName(envelope)}`)
  lines.push(`Delivery: ${deliveryLabel(envelope.deliveryMethod)}`)
  if (envelope.templateId) lines.push(`Template: ${envelope.templateId}`)
  lines.push('')
  lines.push('— Forms by account —')
  const grouped = groupFormSelectionsByAccountChild(envelope.formSelections)
  for (const [, rows] of grouped) {
    const head = rows[0]
    lines.push(
      `Account: ${head?.accountOpeningName ?? 'Account'} — # ${head?.accountNumberLabel ?? '—'}`,
    )
    for (const r of rows) {
      lines.push(`  [${r.required ? 'Required' : 'Optional'}] ${r.label}`)
    }
    lines.push('')
  }
  if (envelope.optionalFormIdsIncluded.length > 0) {
    lines.push('— Optional add-on forms —')
    for (const id of envelope.optionalFormIdsIncluded) {
      const meta = OPTIONAL_ESIGN_FORM_CATALOG.find((o) => o.id === id)
      lines.push(`  • ${meta?.label ?? id}`)
    }
    lines.push('')
  }
  lines.push('— Signers —')
  const groupedForSigners = groupFormSelectionsByAccountChild(envelope.formSelections)
  const accountLabelById = new Map(
    Array.from(groupedForSigners.entries()).map(([accountChildId, rows]) => {
      const head = rows[0]
      return [accountChildId, head?.accountOpeningName ?? head?.accountNumberLabel ?? 'Account']
    }),
  )
  for (const s of envelope.signers) {
    const accountScope = (s.accountChildIds ?? []).map((id) => accountLabelById.get(id) ?? 'Account').join(', ')
    lines.push(
      `  • ${s.name} <${s.email || 'no email'}>${accountScope ? ` — signs for: ${accountScope}` : ''}`,
    )
  }
  lines.push('')
  lines.push('— Uploaded files —')
  if (envelope.uploadedFiles.length === 0) {
    lines.push('  (none)')
  } else {
    for (const f of envelope.uploadedFiles) {
      lines.push(
        `  • ${f.fileName}${f.manualFieldMapping ? ' — manual field & signature mapping' : ''}`,
      )
    }
  }
  return lines.join('\n')
}

export function downloadEnvelopeManifest(envelope: EsignEnvelope, filename?: string): void {
  const text = buildEnvelopeManifestText(envelope)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `envelope-${envelope.id.slice(0, 12)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
