/** Strip a prior ` ...1234` suffix so account tails are not duplicated. */
function stripAccountTailSuffix(name: string): string {
  return name.replace(/\s+\.\.\.\d{4}$/, '').trim()
}

/** Canonical display name for a new account-opening child (registration label + account tail). */
export function accountOpeningChildNameWithAccountTail(
  baseName: string,
  accountNumber: string,
): string {
  const base = stripAccountTailSuffix(baseName.trim())
  const last4 = accountNumber.replace(/\D/g, '').slice(-4)
  return last4 ? `${base} ...${last4}` : base
}

/**
 * Same row label as the Open Accounts hub (`OpenAccountsForm`): child name plus masked
 * account tail when a custodian account number exists in workflow `taskData`.
 */
export function formatOpenAccountsChildRowLabel(
  childName: string,
  taskData?: Record<string, unknown> | null,
): string {
  const base = stripAccountTailSuffix(childName.trim())
  const accountNumber =
    typeof taskData?.accountNumber === 'string' && taskData.accountNumber.trim()
      ? taskData.accountNumber.trim()
      : undefined
  const acctDigits = (accountNumber ?? '').replace(/\D/g, '')
  const last4 = acctDigits.length ? acctDigits.slice(-4) : ''
  if (!last4) return base
  if (childName.trim().endsWith(`...${last4}`)) return childName.trim()
  return `${base} ...${last4}`
}
