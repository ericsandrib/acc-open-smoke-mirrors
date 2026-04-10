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
