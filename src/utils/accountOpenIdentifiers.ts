/**
 * Generate display identifiers when an account-opening child is created (before any subtask is opened).
 */
export function generateAccountOpenIdentifiers(childName: string, childId: string): {
  accountNumber: string
  shortName: string
} {
  const idPart = childId.replace(/[^0-9a-z]/gi, '').slice(-8).toUpperCase() || 'NEWACCT'
  /** Stable 10 digits derived from child id so Open Accounts, servicing seed, and tables stay aligned. */
  const digitPool = (childId.replace(/\D/g, '') + idPart.replace(/\D/g, '') + '9876543210').replace(/\D/g, '')
  const accountNumber = digitPool.padEnd(10, '0').slice(-10).padStart(10, '0')
  const words = childName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const acronym =
    words.length >= 2
      ? words
          .slice(0, 4)
          .map((w) => w[0]!.toUpperCase())
          .join('')
      : (words[0]?.slice(0, 6).toUpperCase() ?? 'ACCT')
  const shortName = `${acronym}-${idPart.slice(0, 5)}`
  return { accountNumber, shortName }
}
