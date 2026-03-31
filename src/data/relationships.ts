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
      { id: 'member-1', name: 'John Smith', firstName: 'John', lastName: 'Smith', type: 'household_member', role: 'Client', isPrimary: true, email: 'john.smith@example.com', phone: '+1 (555) 123-4567', dob: '1975-03-15', kycStatus: 'verified' },
      { id: 'member-2', name: 'Jane Smith', firstName: 'Jane', lastName: 'Smith', type: 'household_member', relationship: 'Spouse', role: 'Spouse', email: 'jane.smith@example.com', phone: '+1 (555) 123-4568', dob: '1977-08-22', kycStatus: 'needs_kyc' },
      { id: 'member-3', name: 'Robert Smith', firstName: 'Robert', lastName: 'Smith', type: 'household_member', relationship: 'Child', role: 'Dependent', dob: '2005-01-10', kycStatus: 'needs_kyc' },
      { id: 'contact-1', name: 'Margaret Smith', firstName: 'Margaret', lastName: 'Smith', type: 'related_contact', relationship: 'Parent', relationshipCategory: 'Family', dob: '1948-06-15' },
      { id: 'contact-2', name: 'David Chen', firstName: 'David', lastName: 'Chen', type: 'related_contact', relationship: 'Attorney', relationshipCategory: 'Professional', email: 'dchen@lawfirm.com', phone: '+1 (555) 987-6543' },
      { id: 'org-1', name: 'Smith Family Trust LLC', organizationName: 'Smith Family Trust LLC', type: 'related_organization', role: 'Trust', relationshipCategory: 'Legal' },
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
      { id: 'johnson-1', name: 'Michael Johnson', firstName: 'Michael', lastName: 'Johnson', type: 'household_member', role: 'Client', isPrimary: true, email: 'michael.johnson@example.com', phone: '+1 (555) 234-5678', dob: '1968-07-22', kycStatus: 'verified' },
      { id: 'johnson-2', name: 'Sarah Johnson', firstName: 'Sarah', lastName: 'Johnson', type: 'household_member', relationship: 'Spouse', role: 'Spouse', email: 'sarah.johnson@example.com', phone: '+1 (555) 234-5679', dob: '1970-03-14', kycStatus: 'verified' },
      { id: 'johnson-contact-1', name: 'Patricia Wells', firstName: 'Patricia', lastName: 'Wells', type: 'related_contact', relationship: 'Accountant', relationshipCategory: 'Professional', email: 'pwells@accounting.com', phone: '+1 (555) 345-0001' },
      { id: 'johnson-org-1', name: 'Johnson Holdings Inc', organizationName: 'Johnson Holdings Inc', type: 'related_organization', role: 'Business Entity', relationshipCategory: 'Business' },
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
      { id: 'davis-1', name: 'Emily Davis', firstName: 'Emily', lastName: 'Davis', type: 'household_member', role: 'Client', isPrimary: true, email: 'emily.davis@example.com', phone: '+1 (555) 345-6789', dob: '1982-11-08', kycStatus: 'needs_kyc' },
      { id: 'davis-2', name: 'James Davis', firstName: 'James', lastName: 'Davis', type: 'household_member', relationship: 'Spouse', role: 'Spouse', email: 'james.davis@example.com', phone: '+1 (555) 345-6790', dob: '1980-05-03', kycStatus: 'needs_kyc' },
      { id: 'davis-3', name: 'Olivia Davis', firstName: 'Olivia', lastName: 'Davis', type: 'household_member', relationship: 'Child', role: 'Dependent', dob: '2012-09-17', kycStatus: 'needs_kyc' },
      { id: 'davis-contact-1', name: 'Richard Palmer', firstName: 'Richard', lastName: 'Palmer', type: 'related_contact', relationship: 'Financial Advisor', relationshipCategory: 'Professional', email: 'rpalmer@advisory.com' },
      { id: 'davis-org-1', name: 'Davis & Associates', organizationName: 'Davis & Associates', type: 'related_organization', role: 'Employer', relationshipCategory: 'Business' },
    ],
    financialAccounts: [
      { id: 'davis-acct-1', accountName: 'Davis Brokerage', accountType: 'brokerage', custodian: 'Merrill Lynch', estimatedValue: '1,150,000' },
    ],
  },
  {
    id: 'garcia-family',
    name: 'The Garcia Family',
    primaryContact: {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@example.com',
      phone: '+1 (555) 456-7890',
      dob: '1979-04-12',
      clientType: 'joint',
    },
    relatedParties: [
      { id: 'garcia-1', name: 'Maria Garcia', firstName: 'Maria', lastName: 'Garcia', type: 'household_member', role: 'Client', isPrimary: true, email: 'maria.garcia@example.com', phone: '+1 (555) 456-7890', dob: '1979-04-12', kycStatus: 'verified' },
      { id: 'garcia-2', name: 'Carlos Garcia', firstName: 'Carlos', lastName: 'Garcia', type: 'household_member', relationship: 'Spouse', role: 'Spouse', email: 'carlos.garcia@example.com', phone: '+1 (555) 456-7891', dob: '1977-09-28', kycStatus: 'verified' },
      { id: 'garcia-3', name: 'Sofia Garcia', firstName: 'Sofia', lastName: 'Garcia', type: 'household_member', relationship: 'Child', role: 'Dependent', dob: '2008-06-03', kycStatus: 'needs_kyc' },
      { id: 'garcia-contact-1', name: 'Elena Vargas', firstName: 'Elena', lastName: 'Vargas', type: 'related_contact', relationship: 'CPA', relationshipCategory: 'Professional', email: 'evargas@taxgroup.com', phone: '+1 (555) 567-0012' },
      { id: 'garcia-org-1', name: 'Garcia Ventures LLC', organizationName: 'Garcia Ventures LLC', type: 'related_organization', role: 'Business Entity', relationshipCategory: 'Business' },
    ],
    financialAccounts: [
      { id: 'garcia-acct-1', accountName: 'Garcia Joint Brokerage', accountType: 'brokerage', custodian: 'TD Ameritrade', estimatedValue: '1,800,000' },
      { id: 'garcia-acct-2', accountName: 'Maria 401k', accountType: '401k', custodian: 'Vanguard', accountNumber: '****7832', estimatedValue: '520,000' },
    ],
  },
]
