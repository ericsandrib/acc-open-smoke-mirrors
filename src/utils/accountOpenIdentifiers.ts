/**
 * Generate display identifiers when an account-opening child is created (before any subtask is opened).
 */
export function generateAccountOpenIdentifiers(childName: string, childId: string): {
  accountNumber: string
  shortName: string
} {
  const idPart = childId.replace(/[^0-9a-z]/gi, '').slice(-8).toUpperCase() || 'NEWACCT'
  // Numeric-looking account number (prototype) — include child id tail so rapid multi-spawn never collides
  const uniqTail = idPart.replace(/\D/g, '').slice(-4).padStart(4, '0')
  const accountNumber = `38${Date.now().toString().slice(-8)}${uniqTail.slice(-4)}`
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
