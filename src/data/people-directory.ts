import type { AccountOwnerIndividualProfile } from '@/types/workflow'

export interface DirectoryPerson {
  id: string
  firstName: string
  lastName: string
  type: 'individual'
  accountNumber?: string
  ssn?: string
  taxId?: string
  clientId?: string
  household?: string
  email?: string
  phone?: string
  dob?: string
  accountOwnerProfile?: AccountOwnerIndividualProfile
}

/** Synthetic profile for directory individuals not modeled as household parties in seed. */
function demoDirectoryOwner(p: {
  street: string
  apt?: string
  city: string
  state: string
  zip: string
  employer: string
  occupation: string
  industry: string
  income: string
  middleName?: string
  netWorthRange?: string
  liquidNetWorthRange?: string
  sourceOfFunds?: string
  investmentObjective?: string
  employmentStatus?: string
  trusted?: { name: string; relationship: string; phoneEmail: string }
}): AccountOwnerIndividualProfile {
  return {
    middleName: p.middleName,
    legalStreet: p.street,
    legalApt: p.apt,
    legalCity: p.city,
    legalState: p.state,
    legalZip: p.zip,
    legalCountry: 'United States',
    mailingSameAsLegal: true,
    employmentStatus: p.employmentStatus ?? 'Employed',
    employerName: p.employer,
    occupation: p.occupation,
    industry: p.industry,
    annualIncomeRange: p.income,
    netWorthRange: p.netWorthRange ?? '$250,000–$499,999',
    liquidNetWorthRange: p.liquidNetWorthRange ?? '$50,000–$149,999',
    sourceOfFunds: p.sourceOfFunds ?? 'Employment Income',
    investmentObjective: p.investmentObjective ?? 'Growth with income',
    riskTolerance: 'Moderate',
    timeHorizon: '7–15 years',
    investmentExperience: 'Moderate',
    controlPerson: 'No',
    bdAffiliation: 'No',
    familyAffiliation: 'No',
    pep: 'No',
    insiderRule144: 'No',
    trustedContactName: p.trusted?.name,
    trustedContactRelationship: p.trusted?.relationship,
    trustedContactPhoneEmail: p.trusted?.phoneEmail,
  }
}

/** Aligned with `initialRelatedParties` Smith household (seed) for directory parity. */
const smithJohnDirectoryProfile: AccountOwnerIndividualProfile = {
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
}

const smithJaneDirectoryProfile: AccountOwnerIndividualProfile = {
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
}

const smithRobertDirectoryProfile: AccountOwnerIndividualProfile = {
  middleName: 'Allen',
  suffix: 'Jr.',
  legalStreet: '2450 North Lakeview Avenue',
  legalApt: 'Unit 12C',
  legalCity: 'Chicago',
  legalState: 'IL',
  legalZip: '60657',
  legalCountry: 'United States',
  mailingSameAsLegal: true,
  employmentStatus: 'Student',
  occupation: 'Student',
  industry: 'Education',
  annualIncomeRange: '$0–$24,999',
  netWorthRange: '$25,000–$49,999',
  liquidNetWorthRange: '$0–$24,999',
  sourceOfFunds: 'Family Support',
  investmentObjective: 'Capital appreciation',
  riskTolerance: 'Moderate',
  timeHorizon: '5–10 years',
  investmentExperience: 'Limited (custodial savings and ETFs)',
  trustedContactName: 'John Smith',
  trustedContactRelationship: 'Parent',
  trustedContactPhoneEmail: '+1 (555) 123-4567 · john.smith@example.com',
  controlPerson: 'No',
  bdAffiliation: 'No',
  familyAffiliation: 'No',
  pep: 'No',
  insiderRule144: 'No',
  kycIdType: 'State ID',
  kycIdNumber: 'IL-98211450',
  kycIdState: 'IL',
  kycIdExpiration: '2028-08-09',
}

export interface DirectoryEntity {
  id: string
  entityName: string
  type: 'entity'
  entityType: string
  taxId?: string
  clientId?: string
  jurisdiction?: string
  contactPerson?: string
  email?: string
  phone?: string
}

export type DirectoryEntry = DirectoryPerson | DirectoryEntity

export const peopleDirectory: DirectoryPerson[] = [
  {
    id: 'dir-ind-1',
    firstName: 'Kevin',
    lastName: 'Tsai',
    type: 'individual',
    accountNumber: 'FL0002582',
    ssn: '***-**-4829',
    taxId: '92-4829173',
    clientId: 'CL-100421',
    household: 'Tsai Family',
    email: 'kevin.tsai@example.com',
    phone: '+1 (555) 201-4421',
    dob: '1981-06-15',
    accountOwnerProfile: demoDirectoryOwner({
      street: '180 Hamilton Avenue',
      city: 'Palo Alto',
      state: 'CA',
      zip: '94301',
      employer: 'Horizon Analytics LLC',
      occupation: 'Director of product strategy',
      industry: 'Technology',
      income: '$200,000–$249,999',
      trusted: {
        name: 'Linda Tsai',
        relationship: 'Spouse',
        phoneEmail: '+1 (555) 201-4422 · linda.tsai@example.com',
      },
    }),
  },
  {
    id: 'dir-ind-2',
    firstName: 'Linda',
    lastName: 'Tsai',
    type: 'individual',
    accountNumber: 'FL0002583',
    ssn: '***-**-7713',
    taxId: '92-7713004',
    clientId: 'CL-100422',
    household: 'Tsai Family',
    email: 'linda.tsai@example.com',
    phone: '+1 (555) 201-4422',
    dob: '1983-09-02',
    accountOwnerProfile: demoDirectoryOwner({
      street: '180 Hamilton Avenue',
      city: 'Palo Alto',
      state: 'CA',
      zip: '94301',
      employer: 'Stanford Health Care',
      occupation: 'Clinical research coordinator',
      industry: 'Health care',
      income: '$120,000–$149,999',
      trusted: {
        name: 'Kevin Tsai',
        relationship: 'Spouse',
        phoneEmail: '+1 (555) 201-4421 · kevin.tsai@example.com',
      },
    }),
  },
  {
    id: 'dir-ind-3',
    firstName: 'Marcus',
    lastName: 'Williams',
    type: 'individual',
    accountNumber: 'FL0003201',
    ssn: '***-**-5561',
    taxId: '83-5561209',
    clientId: 'CL-100530',
    household: 'Williams Household',
    email: 'marcus.williams@example.com',
    phone: '+1 (555) 312-8830',
    dob: '1974-12-08',
    accountOwnerProfile: demoDirectoryOwner({
      street: '4414 Westheimer Road',
      apt: 'Suite 900',
      city: 'Houston',
      state: 'TX',
      zip: '77027',
      employer: 'Gulf Coast Capital Partners',
      occupation: 'Managing director',
      industry: 'Financial services',
      income: '$350,000–$499,999',
      trusted: {
        name: 'Angela Williams',
        relationship: 'Spouse',
        phoneEmail: '+1 (555) 312-8831 · angela.williams@example.com',
      },
    }),
  },
  {
    id: 'dir-ind-4',
    firstName: 'Angela',
    lastName: 'Williams',
    type: 'individual',
    accountNumber: 'FL0003202',
    ssn: '***-**-9982',
    taxId: '83-9982117',
    clientId: 'CL-100531',
    household: 'Williams Household',
    email: 'angela.williams@example.com',
    phone: '+1 (555) 312-8831',
    dob: '1976-04-19',
    accountOwnerProfile: demoDirectoryOwner({
      street: '4414 Westheimer Road',
      apt: 'Suite 900',
      city: 'Houston',
      state: 'TX',
      zip: '77027',
      employer: 'Memorial Hermann Health System',
      occupation: 'Nurse practitioner',
      industry: 'Health care',
      income: '$150,000–$199,999',
      trusted: {
        name: 'Marcus Williams',
        relationship: 'Spouse',
        phoneEmail: '+1 (555) 312-8830 · marcus.williams@example.com',
      },
    }),
  },
  {
    id: 'dir-ind-5',
    firstName: 'Robert',
    lastName: 'Chen',
    type: 'individual',
    accountNumber: 'FL0001847',
    ssn: '***-**-3345',
    taxId: '71-3345882',
    clientId: 'CL-100215',
    household: 'Chen Family',
    email: 'robert.chen@example.com',
    phone: '+1 (555) 408-1102',
    dob: '1969-03-25',
    accountOwnerProfile: demoDirectoryOwner({
      street: '1100 Northeast Campus Parkway',
      city: 'Bellevue',
      state: 'WA',
      zip: '98004',
      employer: 'Cascade Software Inc.',
      occupation: 'Principal engineer',
      industry: 'Technology',
      income: '$225,000–$249,999',
    }),
  },
  {
    id: 'dir-ind-6',
    firstName: 'Patricia',
    lastName: 'Nguyen',
    type: 'individual',
    accountNumber: 'FL0004010',
    ssn: '***-**-6678',
    taxId: '94-6678321',
    clientId: 'CL-100743',
    household: 'Nguyen Household',
    email: 'patricia.nguyen@example.com',
    phone: '+1 (555) 650-2209',
    dob: '1985-07-30',
    accountOwnerProfile: demoDirectoryOwner({
      street: '88 South Almaden Boulevard',
      city: 'San Jose',
      state: 'CA',
      zip: '95113',
      employer: 'Silicon Valley Bank',
      occupation: 'Commercial relationship manager',
      industry: 'Banking',
      income: '$175,000–$199,999',
    }),
  },
  {
    id: 'dir-ind-7',
    firstName: 'David',
    lastName: 'Martinez',
    type: 'individual',
    accountNumber: 'FL0002901',
    ssn: '***-**-1124',
    taxId: '88-1124576',
    clientId: 'CL-100489',
    household: 'Martinez Family',
    email: 'david.martinez@example.com',
    phone: '+1 (555) 773-5501',
    dob: '1978-11-14',
    accountOwnerProfile: demoDirectoryOwner({
      street: '4742 North Scottsdale Road',
      city: 'Scottsdale',
      state: 'AZ',
      zip: '85251',
      employer: 'Desert Sun Hospitality Group',
      occupation: 'Regional operations lead',
      industry: 'Hospitality',
      income: '$140,000–$174,999',
    }),
  },
  {
    id: 'dir-ind-8',
    firstName: 'Susan',
    lastName: 'Park',
    type: 'individual',
    accountNumber: 'FL0003567',
    ssn: '***-**-8890',
    taxId: '76-8890243',
    clientId: 'CL-100612',
    household: 'Park Household',
    email: 'susan.park@example.com',
    phone: '+1 (555) 510-3340',
    dob: '1990-01-22',
    accountOwnerProfile: demoDirectoryOwner({
      street: '1200 Southwest Morrison Street',
      apt: 'Unit 8B',
      city: 'Portland',
      state: 'OR',
      zip: '97205',
      employer: 'Rose City Media',
      occupation: 'Creative director',
      industry: 'Media',
      income: '$110,000–$139,999',
    }),
  },
  {
    id: 'dir-ind-9',
    firstName: 'James',
    lastName: 'O\'Brien',
    type: 'individual',
    accountNumber: 'FL0001503',
    ssn: '***-**-2256',
    taxId: '65-2256781',
    clientId: 'CL-100108',
    household: 'O\'Brien Family',
    email: 'james.obrien@example.com',
    phone: '+1 (555) 617-9012',
    dob: '1965-08-03',
    accountOwnerProfile: demoDirectoryOwner({
      street: '1 Federal Street',
      city: 'Boston',
      state: 'MA',
      zip: '02110',
      employer: 'Harbor Trust Company',
      occupation: 'Trust officer',
      industry: 'Financial services',
      income: '$180,000–$199,999',
    }),
  },
  {
    id: 'dir-ind-10',
    firstName: 'Elena',
    lastName: 'Petrova',
    type: 'individual',
    accountNumber: 'FL0004523',
    ssn: '***-**-4401',
    taxId: '91-4401890',
    clientId: 'CL-100820',
    household: 'Petrova Household',
    email: 'elena.petrova@example.com',
    phone: '+1 (555) 832-6678',
    dob: '1988-05-11',
    accountOwnerProfile: demoDirectoryOwner({
      street: '1450 Brickell Avenue',
      city: 'Miami',
      state: 'FL',
      zip: '33131',
      employer: 'Atlantic Realty Advisors',
      occupation: 'Real estate analyst',
      industry: 'Real estate',
      income: '$95,000–$119,999',
    }),
  },
  {
    id: 'dir-ind-11',
    firstName: 'Thomas',
    lastName: 'Anderson',
    type: 'individual',
    accountNumber: 'FL0002100',
    ssn: '***-**-7734',
    taxId: '80-7734512',
    clientId: 'CL-100330',
    household: 'Anderson Family',
    email: 'thomas.anderson@example.com',
    phone: '+1 (555) 425-1190',
    dob: '1972-02-17',
    accountOwnerProfile: demoDirectoryOwner({
      street: '200 North LaSalle Street',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      employer: 'Midwest Logistics Corp.',
      occupation: 'VP of supply chain',
      industry: 'Transportation',
      income: '$275,000–$299,999',
    }),
  },
  {
    id: 'dir-ind-12',
    firstName: 'Rachel',
    lastName: 'Kim',
    type: 'individual',
    accountNumber: 'FL0003890',
    ssn: '***-**-5523',
    taxId: '87-5523461',
    clientId: 'CL-100701',
    household: 'Kim Household',
    email: 'rachel.kim@example.com',
    phone: '+1 (555) 949-3382',
    dob: '1993-10-05',
    accountOwnerProfile: demoDirectoryOwner({
      street: '750 B Street',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      employer: 'Pacific Biotech Labs',
      occupation: 'Research scientist',
      industry: 'Life sciences',
      income: '$105,000–$124,999',
    }),
  },
  {
    id: 'dir-ind-smith-john',
    firstName: 'John',
    lastName: 'Smith',
    type: 'individual',
    accountNumber: 'FL0001001',
    ssn: '***-**-6789',
    taxId: '12-3456789',
    clientId: 'CLN-7482910',
    household: 'Smith Household',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    dob: '1975-03-15',
    accountOwnerProfile: smithJohnDirectoryProfile,
  },
  {
    id: 'dir-ind-smith-jane',
    firstName: 'Jane',
    lastName: 'Smith',
    type: 'individual',
    accountNumber: 'FL0001002',
    clientId: 'CLN-7482911',
    household: 'Smith Household',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 123-4568',
    dob: '1977-08-22',
    accountOwnerProfile: smithJaneDirectoryProfile,
  },
  {
    id: 'dir-ind-smith-robert',
    firstName: 'Robert',
    lastName: 'Smith',
    type: 'individual',
    accountNumber: 'FL0001003',
    ssn: '***-**-6791',
    taxId: '12-3456791',
    clientId: 'CLN-7482912',
    household: 'Smith Household',
    email: 'robert.smith@example.com',
    phone: '+1 (555) 123-4569',
    dob: '2005-01-10',
    accountOwnerProfile: smithRobertDirectoryProfile,
  },
]

export const entityDirectory: DirectoryEntity[] = [
  {
    id: 'dir-ent-1',
    entityName: 'Tsai Family Trust',
    type: 'entity',
    entityType: 'Trust',
    taxId: '92-4820001',
    clientId: 'ENT-200101',
    jurisdiction: 'California',
    contactPerson: 'Kevin Tsai',
    email: 'trust@tsaifamily.com',
    phone: '+1 (555) 201-4400',
  },
  {
    id: 'dir-ent-2',
    entityName: 'Williams Holdings LLC',
    type: 'entity',
    entityType: 'Business Entity',
    taxId: '83-5500012',
    clientId: 'ENT-200205',
    jurisdiction: 'Delaware',
    contactPerson: 'Marcus Williams',
    email: 'info@williamsholdings.com',
    phone: '+1 (555) 312-8800',
  },
  {
    id: 'dir-ent-3',
    entityName: 'Chen Family Foundation',
    type: 'entity',
    entityType: 'Foundation',
    taxId: '71-3340001',
    clientId: 'ENT-200089',
    jurisdiction: 'New York',
    contactPerson: 'Robert Chen',
    email: 'foundation@chenfamily.org',
    phone: '+1 (555) 408-1100',
  },
  {
    id: 'dir-ent-4',
    entityName: 'Martinez & Partners LP',
    type: 'entity',
    entityType: 'Partnership',
    taxId: '88-1120034',
    clientId: 'ENT-200312',
    jurisdiction: 'Texas',
    contactPerson: 'David Martinez',
    email: 'partners@martinezlp.com',
    phone: '+1 (555) 773-5500',
  },
  {
    id: 'dir-ent-5',
    entityName: 'Park Ventures Inc',
    type: 'entity',
    entityType: 'Business Entity',
    taxId: '76-8880005',
    clientId: 'ENT-200445',
    jurisdiction: 'Washington',
    contactPerson: 'Susan Park',
    email: 'info@parkventures.com',
    phone: '+1 (555) 510-3300',
  },
  {
    id: 'dir-ent-6',
    entityName: 'O\'Brien Family Trust',
    type: 'entity',
    entityType: 'Trust',
    taxId: '65-2250006',
    clientId: 'ENT-200056',
    jurisdiction: 'Massachusetts',
    contactPerson: 'James O\'Brien',
    email: 'trust@obrienfamily.com',
    phone: '+1 (555) 617-9000',
  },
  {
    id: 'dir-ent-7',
    entityName: 'Anderson Consulting Group',
    type: 'entity',
    entityType: 'Employer',
    taxId: '80-7730007',
    clientId: 'ENT-200267',
    jurisdiction: 'Illinois',
    contactPerson: 'Thomas Anderson',
    email: 'info@andersoncg.com',
    phone: '+1 (555) 425-1100',
  },
  {
    id: 'dir-ent-8',
    entityName: 'Nguyen Real Estate Trust',
    type: 'entity',
    entityType: 'Trust',
    taxId: '94-6670008',
    clientId: 'ENT-200501',
    jurisdiction: 'California',
    contactPerson: 'Patricia Nguyen',
    email: 'trust@nguyenre.com',
    phone: '+1 (555) 650-2200',
  },
  {
    id: 'dir-ent-smith-trust',
    entityName: 'Smith Family Trust LLC',
    type: 'entity',
    entityType: 'Trust',
    taxId: '36-7123456',
    clientId: 'ENT-200901',
    jurisdiction: 'Illinois',
    contactPerson: 'John Smith',
    email: 'trust@smithfamily.example.com',
    phone: '+1 (555) 123-4570',
  },
]

export type SearchField = 'all' | 'name' | 'accountNumber' | 'ssn' | 'taxId' | 'clientId' | 'household'

export function searchPeople(query: string, field: SearchField = 'all'): DirectoryPerson[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()

  return peopleDirectory.filter((person) => {
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase()
    switch (field) {
      case 'name':
        return fullName.includes(q)
      case 'accountNumber':
        return person.accountNumber?.toLowerCase().includes(q) ?? false
      case 'ssn':
        return person.ssn?.includes(q) ?? false
      case 'taxId':
        return person.taxId?.toLowerCase().includes(q) ?? false
      case 'clientId':
        return person.clientId?.toLowerCase().includes(q) ?? false
      case 'household':
        return person.household?.toLowerCase().includes(q) ?? false
      case 'all':
      default:
        return (
          fullName.includes(q) ||
          (person.accountNumber?.toLowerCase().includes(q) ?? false) ||
          (person.ssn?.includes(q) ?? false) ||
          (person.taxId?.toLowerCase().includes(q) ?? false) ||
          (person.clientId?.toLowerCase().includes(q) ?? false) ||
          (person.household?.toLowerCase().includes(q) ?? false) ||
          (person.email?.toLowerCase().includes(q) ?? false)
        )
    }
  })
}

export type CombinedSearchField = 'all' | 'name' | 'accountNumber' | 'taxId' | 'clientId'

export function searchAll(query: string, field: CombinedSearchField = 'all'): DirectoryEntry[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()

  const people = peopleDirectory.filter((person) => {
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase()
    switch (field) {
      case 'name':
        return fullName.includes(q)
      case 'accountNumber':
        return person.accountNumber?.toLowerCase().includes(q) ?? false
      case 'taxId':
        return person.taxId?.toLowerCase().includes(q) ?? false
      case 'clientId':
        return person.clientId?.toLowerCase().includes(q) ?? false
      case 'all':
      default:
        return (
          fullName.includes(q) ||
          (person.accountNumber?.toLowerCase().includes(q) ?? false) ||
          (person.ssn?.includes(q) ?? false) ||
          (person.taxId?.toLowerCase().includes(q) ?? false) ||
          (person.clientId?.toLowerCase().includes(q) ?? false) ||
          (person.household?.toLowerCase().includes(q) ?? false) ||
          (person.email?.toLowerCase().includes(q) ?? false) ||
          (person.phone?.toLowerCase().includes(q) ?? false)
        )
    }
  })

  const entities = entityDirectory.filter((entity) => {
    switch (field) {
      case 'name':
        return entity.entityName.toLowerCase().includes(q)
      case 'accountNumber':
        return false
      case 'taxId':
        return entity.taxId?.toLowerCase().includes(q) ?? false
      case 'clientId':
        return entity.clientId?.toLowerCase().includes(q) ?? false
      case 'all':
      default:
        return (
          entity.entityName.toLowerCase().includes(q) ||
          (entity.taxId?.toLowerCase().includes(q) ?? false) ||
          (entity.clientId?.toLowerCase().includes(q) ?? false) ||
          (entity.contactPerson?.toLowerCase().includes(q) ?? false) ||
          (entity.entityType?.toLowerCase().includes(q) ?? false) ||
          (entity.email?.toLowerCase().includes(q) ?? false) ||
          (entity.jurisdiction?.toLowerCase().includes(q) ?? false) ||
          (entity.phone?.toLowerCase().includes(q) ?? false)
        )
    }
  })

  return [...people, ...entities]
}

export type EntitySearchField = 'all' | 'entityName' | 'taxId' | 'clientId' | 'contactPerson'

export function searchEntities(query: string, field: EntitySearchField = 'all'): DirectoryEntity[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()

  return entityDirectory.filter((entity) => {
    switch (field) {
      case 'entityName':
        return entity.entityName.toLowerCase().includes(q)
      case 'taxId':
        return entity.taxId?.toLowerCase().includes(q) ?? false
      case 'clientId':
        return entity.clientId?.toLowerCase().includes(q) ?? false
      case 'contactPerson':
        return entity.contactPerson?.toLowerCase().includes(q) ?? false
      case 'all':
      default:
        return (
          entity.entityName.toLowerCase().includes(q) ||
          (entity.taxId?.toLowerCase().includes(q) ?? false) ||
          (entity.clientId?.toLowerCase().includes(q) ?? false) ||
          (entity.contactPerson?.toLowerCase().includes(q) ?? false) ||
          (entity.entityType?.toLowerCase().includes(q) ?? false) ||
          (entity.email?.toLowerCase().includes(q) ?? false) ||
          (entity.jurisdiction?.toLowerCase().includes(q) ?? false) ||
          (entity.phone?.toLowerCase().includes(q) ?? false)
        )
    }
  })
}
