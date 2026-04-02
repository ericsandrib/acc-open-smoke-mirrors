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
          (entity.email?.toLowerCase().includes(q) ?? false)
        )
    }
  })
}
