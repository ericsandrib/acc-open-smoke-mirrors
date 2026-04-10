/** Number of digit characters in a tax ID / SSN string (non-digits ignored). */
export function taxIdDigitCount(raw: string): number {
  return raw.replace(/\D/g, '').length
}

/** When true, show obfuscated display with reveal toggle (more than 4 digits). */
export function shouldMaskTaxIdInput(raw: string): boolean {
  return taxIdDigitCount(raw) > 4
}

/**
 * Obfuscated display: bullets + last 4 digits (used when full value is hidden).
 * If there are 4 or fewer digits, returns the trimmed raw value unchanged.
 */
export function maskTaxIdSensitiveDisplay(raw: string): string {
  if (!raw?.trim()) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length <= 4) return raw.trim()
  return `••••${digits.slice(-4)}`
}

const MAX_TAX_ID_DIGITS = 9

/** US SSN / EIN: at most nine digit characters; extra digits are dropped, formatting preserved where possible. */
export function capTaxIdDigits(raw: string, maxDigits = MAX_TAX_ID_DIGITS): string {
  let taken = 0
  let out = ''
  for (const ch of raw) {
    if (/\d/.test(ch)) {
      if (taken < maxDigits) {
        out += ch
        taken++
      }
    } else {
      out += ch
    }
  }
  return out
}
