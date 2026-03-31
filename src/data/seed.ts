import type { Action, Task, RelatedParty, FinancialAccount } from '@/types/workflow'

export const actions: Action[] = [
  { id: 'collect-client-data', title: 'Collect Client Data', order: 1 },
  { id: 'kyc', title: 'KYC', order: 2 },
  { id: 'account-opening', title: 'Account Opening', order: 3 },
]

export const tasks: Task[] = [
  {
    id: 'client-info',
    title: 'Client Info',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Relationship Manager',
    formKey: 'client-info',
    order: 1,
  },
  {
    id: 'related-parties',
    title: 'Related Parties',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Relationship Manager',
    formKey: 'related-parties',
    order: 2,
  },
  {
    id: 'financial-accounts',
    title: 'Financial Accounts',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Relationship Manager',
    formKey: 'financial-accounts',
    order: 3,
  },
  {
    id: 'kyc-review',
    title: 'KYC Review',
    actionId: 'kyc',
    status: 'not_started',
    assignedTo: 'Compliance Officer',
    formKey: 'kyc',
    order: 1,
    children: [],
  },
  {
    id: 'placeholder-1',
    title: 'Account Setup',
    actionId: 'account-opening',
    status: 'not_started',
    assignedTo: 'Operations',
    formKey: 'placeholder-1',
    order: 1,
  },
  {
    id: 'placeholder-2',
    title: 'Final Review',
    actionId: 'account-opening',
    status: 'not_started',
    assignedTo: 'Operations',
    formKey: 'placeholder-2',
    order: 2,
  },
]

export const initialRelatedParties: RelatedParty[] = [
  { id: 'member-1', name: 'John Smith', type: 'household_member' },
  { id: 'member-2', name: 'Jane Smith', type: 'household_member', relationship: 'Spouse' },
  { id: 'member-3', name: 'Robert Smith', type: 'household_member', relationship: 'Child' },
]

export const initialFinancialAccounts: FinancialAccount[] = [
  { id: 'acct-1', accountName: 'Smith Family Trust', accountType: 'trust', custodian: 'Fidelity', estimatedValue: '2,500,000' },
  { id: 'acct-2', accountName: 'John IRA', accountType: 'ira', custodian: 'Charles Schwab', accountNumber: '****4521', estimatedValue: '850,000' },
]
