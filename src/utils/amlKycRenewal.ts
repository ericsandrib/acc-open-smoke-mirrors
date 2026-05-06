/** Calendar days AML screening is treated as valid after a successful AML review. */
export const AML_KYC_VALIDITY_DAYS = 90

function parseLocalDateOnly(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

function startOfLocalDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

/** First local calendar day the AML window is no longer valid (renewal due). */
export function getAmlExpiryDate(lastAmlRunAt: string): Date | null {
  const start = parseLocalDateOnly(lastAmlRunAt)
  if (!start) return null
  const expiry = new Date(start)
  expiry.setDate(expiry.getDate() + AML_KYC_VALIDITY_DAYS)
  return expiry
}

export type AmlRenewalSummary = {
  lastRunFormatted: string
  expiryFormatted: string
  daysRemaining: number
  isExpired: boolean
  isDueToday: boolean
}

export function getAmlRenewalSummary(
  lastAmlRunAt: string | undefined,
  referenceDate: Date = new Date(),
): AmlRenewalSummary | null {
  if (!lastAmlRunAt?.trim()) return null
  const last = parseLocalDateOnly(lastAmlRunAt)
  const expiry = getAmlExpiryDate(lastAmlRunAt)
  if (!last || !expiry) return null

  const ref = startOfLocalDay(referenceDate)
  const exp = startOfLocalDay(expiry)
  const daysRemaining = Math.round((exp - ref) / 86400000)
  const isExpired = daysRemaining < 0
  const isDueToday = daysRemaining === 0

  const dtf = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return {
    lastRunFormatted: dtf.format(last),
    expiryFormatted: dtf.format(expiry),
    daysRemaining,
    isExpired,
    isDueToday,
  }
}
