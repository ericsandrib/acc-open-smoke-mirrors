import type { RelatedParty, FinancialAccount } from './workflow'

export interface Relationship {
  id: string
  name: string
  primaryContact: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dob?: string
    clientType?: string
  }
  relatedParties: RelatedParty[]
  financialAccounts: FinancialAccount[]
}
