/**
 * Same row label as the Open Accounts hub (`OpenAccountsForm`): child name plus masked
 * account tail when a custodian account number exists in workflow `taskData`.
 */
export function formatOpenAccountsChildRowLabel(
  childName: string,
  taskData?: Record<string, unknown> | null,
): string {
  const trimmed = childName.trim()
  const accountNumber =
    typeof taskData?.accountNumber === 'string' && taskData.accountNumber.trim()
      ? taskData.accountNumber.trim()
      : undefined
  const acctDigits = (accountNumber ?? '').replace(/\D/g, '')
  const last4 = acctDigits.length ? acctDigits.slice(-4) : ''
  return last4 ? `${trimmed} ...${last4}` : trimmed
}
