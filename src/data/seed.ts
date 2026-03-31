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
    assignedTo: 'Unassigned',
    formKey: 'client-info',
    order: 1,
  },
  {
    id: 'related-parties',
    title: 'Related Parties',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'related-parties',
    order: 2,
  },
  {
    id: 'financial-accounts',
    title: 'Financial Accounts',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'financial-accounts',
    order: 3,
  },
  {
    id: 'kyc-review',
    title: 'KYC Review',
    actionId: 'kyc',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'kyc',
    order: 1,
    children: [],
  },
  {
    id: 'placeholder-1',
    title: 'Account Setup',
    actionId: 'account-opening',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'placeholder-1',
    order: 1,
  },
  {
    id: 'placeholder-2',
    title: 'Final Review',
    actionId: 'account-opening',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'placeholder-2',
    order: 2,
  },
]

export const initialRelatedParties: RelatedParty[] = [
  { id: 'member-1', name: 'John Smith', firstName: 'John', lastName: 'Smith', type: 'household_member', role: 'Client', isPrimary: true, email: 'john.smith@example.com', phone: '+1 (555) 123-4567', dob: '1975-03-15', kycStatus: 'verified' },
  { id: 'member-2', name: 'Jane Smith', firstName: 'Jane', lastName: 'Smith', type: 'household_member', relationship: 'Spouse', role: 'Spouse', email: 'jane.smith@example.com', phone: '+1 (555) 123-4568', dob: '1977-08-22', kycStatus: 'needs_kyc' },
  { id: 'member-3', name: 'Robert Smith', firstName: 'Robert', lastName: 'Smith', type: 'household_member', relationship: 'Child', role: 'Dependent', dob: '2005-01-10', kycStatus: 'needs_kyc' },
  { id: 'contact-1', name: 'Margaret Smith', firstName: 'Margaret', lastName: 'Smith', type: 'related_contact', relationship: 'Parent', relationshipCategory: 'Family', dob: '1948-06-15' },
  { id: 'contact-2', name: 'David Chen', firstName: 'David', lastName: 'Chen', type: 'related_contact', relationship: 'Attorney', relationshipCategory: 'Professional', email: 'dchen@lawfirm.com', phone: '+1 (555) 987-6543' },
  { id: 'org-1', name: 'Smith Family Trust LLC', organizationName: 'Smith Family Trust LLC', type: 'related_organization', role: 'Trust', relationshipCategory: 'Legal' },
]

export const initialFinancialAccounts: FinancialAccount[] = [
  { id: 'acct-1', accountName: 'Smith Family Trust', accountType: 'trust', custodian: 'Fidelity', estimatedValue: '2,500,000' },
  { id: 'acct-2', accountName: 'John IRA', accountType: 'ira', custodian: 'Charles Schwab', accountNumber: '****4521', estimatedValue: '850,000' },
]
