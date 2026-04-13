import type { Action, Task, RelatedParty, FinancialAccount } from '@/types/workflow'

export const actions: Action[] = [
  { id: 'collect-client-data', title: 'Collect Client Data', order: 1 },
  { id: 'account-opening', title: 'Account Opening', order: 2 },
]

export const tasks: Task[] = [
  {
    id: 'related-parties',
    title: 'Client Info',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'related-parties',
    order: 1,
  },
  {
    id: 'existing-accounts',
    title: 'Existing Accounts',
    actionId: 'collect-client-data',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'existing-accounts',
    order: 2,
  },
  {
    id: 'open-accounts',
    title: 'Open Accounts',
    actionId: 'account-opening',
    status: 'not_started',
    assignedTo: 'Unassigned',
    formKey: 'open-accounts',
    order: 1,
    children: [],
  },
]

export const initialRelatedParties: RelatedParty[] = [
  {
    id: 'member-1',
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    type: 'household_member',
    role: 'Client',
    isPrimary: true,
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    dob: '1975-03-15',
    kycStatus: 'verified',
    clientId: 'CLN-7482910',
    taxId: '123-45-6789',
    accountOwnerIndividual: {
      middleName: 'Howard',
      legalStreet: '2450 North Lakeview Avenue',
      legalApt: 'Unit 12C',
      legalCity: 'Chicago',
      legalState: 'IL',
      legalZip: '60657',
      legalCountry: 'United States',
      mailingSameAsLegal: true,
      employmentStatus: 'Employed',
      employerName: 'ComEd (Commonwealth Edison)',
      occupation: 'Senior grid operations supervisor',
      industry: 'Electric utilities',
      annualIncomeRange: '$150,000–$249,999',
      netWorthRange: '$500,000–$999,999',
      liquidNetWorthRange: '$150,000–$249,999',
      sourceOfFunds: 'Salary, savings, and proceeds from prior home sale (2021)',
      investmentObjective: 'Growth with income',
      riskTolerance: 'Moderate',
      timeHorizon: '10–15 years',
      investmentExperience: 'Moderate (stocks, mutual funds, employer 401(k))',
      controlPerson: 'No',
      bdAffiliation: 'No',
      familyAffiliation: 'No',
      pep: 'No',
      insiderRule144: 'No',
      trustedContactName: 'Jane Smith',
      trustedContactRelationship: 'Spouse',
      trustedContactPhoneEmail: '+1 (555) 123-4568 · jane.smith@example.com',
    },
  },
  {
    id: 'member-2',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    type: 'household_member',
    relationship: 'Spouse',
    role: 'Spouse',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 123-4568',
    dob: '1977-08-22',
    kycStatus: 'needs_kyc',
    clientId: 'CLN-7482911',
    accountOwnerIndividual: {
      middleName: 'Marie',
      legalStreet: '2450 North Lakeview Avenue',
      legalApt: 'Unit 12C',
      legalCity: 'Chicago',
      legalState: 'IL',
      legalZip: '60657',
      legalCountry: 'United States',
      mailingSameAsLegal: true,
      employmentStatus: 'Employed',
      employerName: 'Northwestern Memorial Hospital',
      occupation: 'Clinical nurse specialist',
      industry: 'Health care',
      annualIncomeRange: '$100,000–$149,999',
      netWorthRange: '$500,000–$999,999',
      liquidNetWorthRange: '$100,000–$149,999',
      sourceOfFunds: 'Employment Income',
      investmentObjective: 'Growth with income',
      riskTolerance: 'Moderate',
      timeHorizon: '10–15 years',
      investmentExperience: 'Moderate (stocks, mutual funds, employer 401(k))',
      trustedContactName: 'John Smith',
      trustedContactRelationship: 'Spouse',
      trustedContactPhoneEmail: '+1 (555) 123-4567 · john.smith@example.com',
      controlPerson: 'No',
      bdAffiliation: 'No',
      familyAffiliation: 'No',
      pep: 'No',
      insiderRule144: 'No',
      kycIdType: "Driver's License",
      kycIdNumber: 'S771234567890',
      kycIdState: 'IL',
      kycIdExpiration: '2029-03-15',
    },
  },
  { id: 'member-3', name: 'Robert Smith', firstName: 'Robert', lastName: 'Smith', type: 'household_member', relationship: 'Child', role: 'Dependent', dob: '2005-01-10', kycStatus: 'needs_kyc' },
  { id: 'contact-1', name: 'Margaret Smith', firstName: 'Margaret', lastName: 'Smith', type: 'related_contact', relationship: 'Parent', relationshipCategory: 'Family', dob: '1948-06-15' },
  { id: 'contact-2', name: 'David Chen', firstName: 'David', lastName: 'Chen', type: 'related_contact', relationship: 'Attorney', relationshipCategory: 'Professional', email: 'dchen@lawfirm.com', phone: '+1 (555) 987-6543' },
  {
    id: 'org-1',
    name: 'Smith Family Trust LLC',
    organizationName: 'Smith Family Trust LLC',
    type: 'related_organization',
    role: 'Trust',
    relationshipCategory: 'Legal',
    entityType: 'Trust',
    taxId: '36-7123456',
    clientId: 'ENT-200901',
    jurisdiction: 'Illinois',
    contactPerson: 'John Smith',
    email: 'trust@smithfamily.example.com',
    phone: '+1 (555) 123-4570',
    kycStatus: 'verified',
    businessProfile: {
      industry: 'Trust / fiduciary',
      sourceOfFunds: 'Trust corpus / investment proceeds',
      annualRevenueRange: 'N/A',
    },
    beneficialOwners: [
      { name: 'John Smith', ownershipPercent: '40' },
      { name: 'Jane Smith', ownershipPercent: '40' },
      { name: 'Robert Smith', ownershipPercent: '20' },
    ],
    trustParties: [
      { id: 'trustee-smith-1', partyId: 'member-1', displayName: 'John Smith', role: 'Trustee' },
      { id: 'trustee-smith-2', partyId: 'member-2', displayName: 'Jane Smith', role: 'Co-trustee' },
    ],
  },
]

/** Ordered by typical registration frequency (most common first); trust last. */
export const initialFinancialAccounts: FinancialAccount[] = [
  {
    id: 'acct-ind-broker',
    accountName: 'John Smith — Individual Brokerage',
    accountType: 'brokerage',
    custodian: 'Fidelity',
    accountNumber: 'Z12-3456789',
    estimatedValue: '420,000',
  },
  {
    id: 'acct-401k',
    accountName: 'John Smith — 401(k) (ComEd)',
    accountType: '401k',
    custodian: 'Vanguard Retirement Plan Services',
    accountNumber: '401K-8849201',
    estimatedValue: '385,000',
  },
  {
    id: 'acct-joint-broker',
    accountName: 'John & Jane Smith — Joint Brokerage',
    accountType: 'brokerage',
    custodian: 'Charles Schwab',
    accountNumber: '8934-221199',
    estimatedValue: '1,200,000',
  },
  {
    id: 'acct-ira',
    accountName: 'John Smith — Traditional IRA',
    accountType: 'ira',
    custodian: 'Charles Schwab',
    accountNumber: '884215531',
    estimatedValue: '850,000',
  },
  {
    id: 'acct-trust',
    accountName: 'Smith Family Trust',
    accountType: 'trust',
    custodian: 'Fidelity',
    accountNumber: 'TRU-7719023',
    estimatedValue: '2,500,000',
  },
  {
    id: 'acct-checking',
    accountName: 'John Smith — Checking',
    accountType: 'checking',
    custodian: 'Chase Bank',
    routingNumber: '021000021',
    accountNumber: '4532198762',
    estimatedValue: '85,000',
  },
]

/**
 * Seeded for Existing Accounts / Open Accounts “Additional instructions” (taskData key: open-accounts).
 * References the Smith household existing accounts above; advisor-facing custodian & funding notes.
 */
export const seedOpenAccountsAdditionalInstructions = `Custodian & new-account setup
Open new accounts at the firm’s custodian (e.g. Pershing) using the registration titles and ownership elected in Open Accounts (individual, joint, traditional IRA, trust, etc.). Confirm titling, TIN, and trusted contacts match each new account before first funding.

Funding & moving assets from existing accounts

• Brokerage (in-kind ACAT): Plan to transfer positions from Fidelity individual brokerage (Z12-3456789) and Charles Schwab joint brokerage (8934-221199) into the new corresponding accounts after new account numbers are live. Client may prefer partial ACATs first if keeping legacy accounts open during transition.

• 401(k) rollover: John’s employer plan is at Vanguard Retirement Plan Services (401K-8849201, ~$385k). Use direct rollover into the new traditional IRA where that is the elected destination; confirm plan contact, vesting, and any outstanding loan payoff before initiating.

• IRA consolidation: ACAT or cash transfer from existing Schwab traditional IRA (884215531) into the new IRA per client direction.

• Trust: For the Smith Family Trust at Fidelity (TRU-7719023), coordinate with trustee/counsel before moving trust-owned assets; obtain LOA / trustee resolutions as required for ACAT or cash movement.

Operational: Collect transfer authorizations (Medallion or custodian-specific), monitor ACAT/rollover status in the custodian workflow, and reconcile statement values to the estimated balances on file when transfers complete.`
