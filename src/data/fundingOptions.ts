export const FUNDING_OPTIONS = [
  { value: 'ach', label: 'ACH' },
  { value: 'account_transfers', label: 'Account Transfers' },
  { value: 'bank_send_receive', label: 'Bank Send and Receive' },
  { value: 'check_deposits', label: 'Check Deposits' },
  { value: 'check_withdrawals', label: 'Check Withdrawals' },
  { value: 'fed_fund_wires', label: 'Fed Fund Wires' },
  { value: 'journals', label: 'Journals' },
  {
    value: 'standing_periodic_instructions',
    label: 'Standing and Periodic Instructions',
    description: 'Prerequisite setup for ACH and wires',
  },
  {
    value: 'mutual_fund_periodic_orders',
    label: 'Mutual Fund Periodic Order Instructions',
    description: 'Recurring investment instructions — asset movement by schedule',
  },
] as const

export type FundingMethodValue = (typeof FUNDING_OPTIONS)[number]['value']

export function getFundingOptionLabel(value: string): string {
  const found = FUNDING_OPTIONS.find((o) => o.value === value)
  return found?.label ?? value
}
