import type { Relationship } from '@/types/relationship'

export const relationships: Relationship[] = [
  {
    id: 'smith-family',
    name: 'The Smith Family',
    primaryContact: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      dob: '1975-03-15',
      clientType: 'joint',
    },
    relatedParties: [
      { id: 'member-1', name: 'John Smith', type: 'household_member' },
      { id: 'member-2', name: 'Jane Smith', type: 'household_member', relationship: 'Spouse' },
      { id: 'member-3', name: 'Robert Smith', type: 'household_member', relationship: 'Child' },
    ],
    financialAccounts: [
      { id: 'acct-1', accountName: 'Smith Family Trust', accountType: 'trust', custodian: 'Fidelity', estimatedValue: '2,500,000' },
      { id: 'acct-2', accountName: 'John IRA', accountType: 'ira', custodian: 'Charles Schwab', accountNumber: '****4521', estimatedValue: '850,000' },
    ],
  },
  {
    id: 'johnson-trust',
    name: 'Johnson Trust',
    primaryContact: {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@example.com',
      phone: '+1 (555) 234-5678',
      dob: '1968-07-22',
      clientType: 'trust',
    },
    relatedParties: [
      { id: 'johnson-1', name: 'Michael Johnson', type: 'household_member' },
      { id: 'johnson-2', name: 'Sarah Johnson', type: 'household_member', relationship: 'Spouse' },
    ],
    financialAccounts: [
      { id: 'johnson-acct-1', accountName: 'Johnson Family Trust', accountType: 'trust', custodian: 'Vanguard', estimatedValue: '4,200,000' },
      { id: 'johnson-acct-2', accountName: 'Michael Roth IRA', accountType: 'roth_ira', custodian: 'Fidelity', estimatedValue: '620,000' },
    ],
  },
  {
    id: 'davis-household',
    name: 'Davis Household',
    primaryContact: {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@example.com',
      phone: '+1 (555) 345-6789',
      dob: '1982-11-08',
      clientType: 'individual',
    },
    relatedParties: [
      { id: 'davis-1', name: 'Emily Davis', type: 'household_member' },
      { id: 'davis-2', name: 'James Davis', type: 'household_member', relationship: 'Spouse' },
      { id: 'davis-3', name: 'Olivia Davis', type: 'household_member', relationship: 'Child' },
    ],
    financialAccounts: [
      { id: 'davis-acct-1', accountName: 'Davis Brokerage', accountType: 'brokerage', custodian: 'Merrill Lynch', estimatedValue: '1,150,000' },
    ],
  },
]
