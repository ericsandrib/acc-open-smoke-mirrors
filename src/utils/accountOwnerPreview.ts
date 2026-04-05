import type { AccountOwnerIndividualProfile, RelatedParty } from '@/types/workflow'

export type PreviewLine = {
  label: string
  value: string
  /** Visually de-emphasize when value is missing or placeholder */
  missing?: boolean
}

export type AccountOwnerPreviewResult = {
  lines: PreviewLine[]
  /** Identity, address, contact — must be complete before downstream handoff */
  criticalGaps: string[]
  /** Suitability / profile — strongly recommended */
  recommendedGaps: string[]
}

function formatDob(iso?: string): string {
  if (!iso?.trim()) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Mask tax IDs for preview (last 4 digits when parseable). */
export function maskTaxIdForPreview(raw?: string): string {
  if (!raw?.trim()) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 4) return `••••${digits.slice(-4)}`
  return '•••••••'
}

function formatLegalAddress(ext?: AccountOwnerIndividualProfile): string {
  if (!ext) return ''
  const line1 = [ext.legalStreet, ext.legalApt].filter(Boolean).join(', ')
  const line2 = [ext.legalCity, ext.legalState, ext.legalZip].filter(Boolean).join(', ')
  const parts = [line1, line2, ext.legalCountry].filter(Boolean)
  return parts.join(' · ')
}

function hasCompleteLegalAddress(ext?: AccountOwnerIndividualProfile): boolean {
  if (!ext) return false
  return Boolean(
    ext.legalStreet?.trim() &&
      ext.legalCity?.trim() &&
      ext.legalState?.trim() &&
      ext.legalZip?.trim(),
  )
}

function contactLine(party: RelatedParty): PreviewLine {
  const bits = [party.email, party.phone].filter(Boolean)
  return {
    label: 'Contact',
    value: bits.length ? bits.join(' · ') : 'Not provided',
    missing: bits.length === 0,
  }
}

export function buildIndividualAccountOwnerPreview(party: RelatedParty): AccountOwnerPreviewResult {
  const ext = party.accountOwnerIndividual ?? {}
  const lines: PreviewLine[] = []

  lines.push({
    label: 'Date of birth',
    value: formatDob(party.dob) || 'Not provided',
    missing: !party.dob?.trim(),
  })

  lines.push({
    label: 'Tax ID (SSN / TIN)',
    value: party.taxId?.trim() ? maskTaxIdForPreview(party.taxId) : 'Not provided',
    missing: !party.taxId?.trim(),
  })

  const addr = formatLegalAddress(ext)
  lines.push({
    label: 'Legal address',
    value: addr || 'Not provided',
    missing: !hasCompleteLegalAddress(ext),
  })

  lines.push(contactLine(party))

  const empBits = [ext.employmentStatus, ext.employerName].filter(Boolean)
  lines.push({
    label: 'Employment',
    value: empBits.length ? empBits.join(' · ') : 'Not provided',
    missing: !ext.employmentStatus?.trim(),
  })

  const suitBits = [ext.annualIncomeRange, ext.riskTolerance, ext.investmentObjective].filter(Boolean)
  lines.push({
    label: 'Suitability snapshot',
    value: suitBits.length ? suitBits.join(' · ') : 'Not provided',
    missing: suitBits.length === 0,
  })

  const criticalGaps: string[] = []
  if (!party.dob?.trim()) criticalGaps.push('Date of birth')
  if (!party.taxId?.trim()) criticalGaps.push('Tax ID (SSN / TIN)')
  if (!hasCompleteLegalAddress(ext)) criticalGaps.push('Complete legal address (street, city, state, ZIP)')
  if (!party.email?.trim() && !party.phone?.trim()) criticalGaps.push('Email or phone number')

  const recommendedGaps: string[] = []
  if (!ext.employmentStatus?.trim()) recommendedGaps.push('Employment status')
  if (!ext.annualIncomeRange?.trim()) recommendedGaps.push('Annual income (range)')
  if (!ext.netWorthRange?.trim()) recommendedGaps.push('Net worth (range)')
  if (!ext.investmentObjective?.trim()) recommendedGaps.push('Investment objective')
  if (!ext.riskTolerance?.trim()) recommendedGaps.push('Risk tolerance')
  if (!ext.sourceOfFunds?.trim()) recommendedGaps.push('Source of funds / wealth')

  // KYC verified: no blocking or recommended callouts; lines should reflect profile data (see seed for complete demo).
  if (party.kycStatus === 'verified') {
    return {
      lines: lines.map((l) => ({ ...l, missing: false })),
      criticalGaps: [],
      recommendedGaps: [],
    }
  }

  return { lines, criticalGaps, recommendedGaps }
}

export function buildEntityAccountOwnerPreview(party: RelatedParty): AccountOwnerPreviewResult {
  const lines: PreviewLine[] = []

  lines.push({
    label: 'Entity type',
    value: party.entityType?.trim() || 'Not provided',
    missing: !party.entityType?.trim(),
  })

  lines.push({
    label: 'Tax ID / EIN',
    value: party.taxId?.trim() ? maskTaxIdForPreview(party.taxId) : 'Not provided',
    missing: !party.taxId?.trim(),
  })

  lines.push({
    label: 'Jurisdiction',
    value: party.jurisdiction?.trim() || 'Not provided',
    missing: !party.jurisdiction?.trim(),
  })

  lines.push({
    label: 'Authorized signatory',
    value: party.contactPerson?.trim() || 'Not provided',
    missing: !party.contactPerson?.trim(),
  })

  lines.push(contactLine(party))

  const criticalGaps: string[] = []
  if (!party.entityType?.trim()) criticalGaps.push('Entity type')
  if (!party.taxId?.trim()) criticalGaps.push('Tax ID / EIN')
  if (!party.jurisdiction?.trim()) criticalGaps.push('Jurisdiction')
  if (!party.email?.trim() && !party.phone?.trim()) criticalGaps.push('Email or phone number')

  const recommendedGaps: string[] = []
  if (!party.contactPerson?.trim()) recommendedGaps.push('Authorized signatory')

  return { lines, criticalGaps, recommendedGaps }
}

export function buildAccountOwnerPreview(party: RelatedParty): AccountOwnerPreviewResult {
  if (party.type === 'related_organization') {
    return buildEntityAccountOwnerPreview(party)
  }
  return buildIndividualAccountOwnerPreview(party)
}

function partyDirectoryLabel(party: RelatedParty): string {
  if (party.type === 'related_organization') return 'Legal entity'
  if (party.type === 'related_contact') {
    return party.relationship ? `Contact · ${party.relationship}` : 'Related contact'
  }
  return party.relationship ? `Household · ${party.relationship}` : 'Household member'
}

/**
 * Lightweight preview for beneficiaries / interested parties: identity context only.
 * KYC completion and full suitability are not implied for this role.
 */
export function buildDesignationPartyPreview(party: RelatedParty): AccountOwnerPreviewResult {
  if (party.type === 'related_organization') {
    const lines: PreviewLine[] = [
      { label: 'Legal name', value: (party.organizationName ?? party.name).trim() || '—', missing: false },
      {
        label: 'Tax ID / EIN',
        value: party.taxId?.trim() ? maskTaxIdForPreview(party.taxId) : '—',
        missing: false,
      },
      { ...contactLine(party), missing: false },
    ]
    return { lines, criticalGaps: [], recommendedGaps: [] }
  }

  const ext = party.accountOwnerIndividual ?? {}
  const lines: PreviewLine[] = [
    { label: 'In directory as', value: partyDirectoryLabel(party), missing: false },
  ]

  if (party.dob?.trim()) {
    lines.push({ label: 'Date of birth', value: formatDob(party.dob), missing: false })
  }

  lines.push({ ...contactLine(party), missing: false })

  const addr = formatLegalAddress(ext)
  if (addr) {
    lines.push({ label: 'Address on file', value: addr, missing: false })
  }

  return { lines, criticalGaps: [], recommendedGaps: [] }
}
