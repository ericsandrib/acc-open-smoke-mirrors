/** Number of digit characters in a tax ID / SSN string (non-digits ignored). */
export function taxIdDigitCount(raw: string): number {
  return raw.replace(/\D/g, '').length
}

/** When true, show obfuscated display with reveal toggle (only after full 9-digit entry). */
export function shouldMaskTaxIdInput(raw: string): boolean {
  return taxIdDigitCount(raw) >= 9
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

/** Formats raw input as SSN while typing: XXX-XX-XXXX. */
export function formatSsnInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_TAX_ID_DIGITS)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}
