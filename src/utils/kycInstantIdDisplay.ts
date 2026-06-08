import type { KycCipBlock, PartyKycResult } from '@/types/kycResult'
import type { RelatedParty } from '@/types/workflow'
import type { SubsystemPassFail } from '@/utils/kycPassFail'

const INSTANT_ID_INDEX_LABELS: Record<number, string> = {
  0: 'Nothing verified',
  10: 'Critical elements not verified',
  20: 'Minimal verification',
  30: 'Several elements verified',
  40: 'Most elements verified',
  50: 'Fully verified',
}

const DOB_MATCH_LEVEL_LABELS: Record<number, string> = {
  0: 'No DOB found or submitted',
  1: 'No match',
  2: 'Day only',
  3: 'Month only',
  4: 'Day and month only',
  5: 'Day and year only',
  6: 'Year only',
  7: 'Month and year only',
  8: 'Full match',
}

export type AmlCompactStatus = SubsystemPassFail | 'Error'

export function formatInstantIdIndex(value: number): string {
  const label = INSTANT_ID_INDEX_LABELS[value]
  return label ? `${value} — ${label}` : String(value)
}

export function formatDobMatchLevel(value: number): string {
  const label = DOB_MATCH_LEVEL_LABELS[value]
  return label ? `${value} — ${label}` : String(value)
}

export function formatFoundSsnCount(count: number): string {
  return count === 1 ? '1 SSN on file' : `${count} SSNs on file`
}

export function formatRedFlagsReport(flags: KycCipBlock['flags']): string {
  if (!flags.red_flags) return 'None'
  if (flags.red_flags_detail?.trim()) return flags.red_flags_detail.trim()
  return 'Present — contact AML team'
}

function normalizeAddressForCompare(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function identityVerificationLabel(cip: KycCipBlock): string {
  if (cip.status === 'Pass') return 'Match'
  if (cip.status === 'Fail') return 'Mismatch'
  return 'Pending'
}

/** AML drawer CIP summary — identity from SSN match flag. */
export function ssnIdentityVerificationLabel(cip: KycCipBlock): string {
  return cip.verified.ssn_matched ? 'Match' : 'Mismatch'
}

const AML_DRAWER_RISK_CODES = new Set(['32', 'WL'])

export function amlDrawerRiskIndicators(kyc: PartyKycResult) {
  return (kyc.aml.risk_indicators ?? []).filter((r) => AML_DRAWER_RISK_CODES.has(r.code))
}

export function hasCipAddressFlags(cip: KycCipBlock): boolean {
  const flags = cip.flags
  if (!flags) return false
  return Boolean(flags.address_po_box) || Boolean(flags.address_cmra)
}

export function addressMatchLabel(cip: KycCipBlock, party: RelatedParty): string {
  const ext = party.accountOwnerIndividual
  if (!ext?.legalStreet?.trim()) {
    return identityVerificationLabel(cip)
  }

  const line1 = [ext.legalStreet, ext.legalApt].filter(Boolean).join(', ')
  const line2 = [ext.legalCity, ext.legalState, ext.legalZip].filter(Boolean).join(', ')
  const inputAddress = [line1, line2].filter(Boolean).join(', ')
  const verified = cip.verified.address?.trim()

  if (!verified) {
    return cip.status === 'Fail' ? 'Mismatch' : 'Pending'
  }

  const inputNorm = normalizeAddressForCompare(inputAddress)
  const verifiedNorm = normalizeAddressForCompare(verified)
  if (inputNorm === verifiedNorm) return 'Match'

  const streetNorm = normalizeAddressForCompare(ext.legalStreet ?? '')
  if (streetNorm && verifiedNorm.includes(streetNorm)) return 'Match'

  return 'Mismatch'
}

export function dobMatchLabel(cip: KycCipBlock): string {
  if (cip.verified.dob_verified) return 'Match'
  if (cip.status === 'Fail') return 'Mismatch'
  return 'Pending'
}

function amlWatchlistCounts(kyc: PartyKycResult): { ofacCount: number; pepCount: number } {
  const hits = kyc.aml.watchlist_hits ?? []
  const ofacCount = hits.filter((h) => h.table.toLowerCase().includes('ofac')).length
  return { ofacCount, pepCount: hits.length - ofacCount }
}

export function amlCompactStatus(kyc: PartyKycResult): AmlCompactStatus {
  const { aml } = kyc
  if (aml.status === 'Error') return 'Error'
  if (!aml.last_run_date) return 'Pending'

  const { ofacCount, pepCount } = amlWatchlistCounts(kyc)
  if (ofacCount > 0 || pepCount > 0 || aml.status === 'Fail') return 'Fail'
  return 'Pass'
}

export function amlCompactDetail(kyc: PartyKycResult): string {
  const status = amlCompactStatus(kyc)
  const { ofacCount, pepCount } = amlWatchlistCounts(kyc)

  if (status === 'Pass') return 'No watchlist matches identified'
  if (status === 'Fail') {
    const ofacPart = `${ofacCount} OFAC match`
    const pepPart = `${pepCount} PEP / watchlist hit`
    return `${ofacPart} · ${pepPart} · Assigned to AML team for review`
  }
  if (status === 'Pending') return 'Screening not yet run'
  return 'Screening could not be completed'
}
