import type { AccountType } from '@/types/workflow'

export const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}
