export type TaskStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked'

export type RelatedPartyType = 'household_member' | 'related_party'

export interface RelatedParty {
  id: string
  name: string
  type: RelatedPartyType
  relationship?: string
  email?: string
  kycStatus?: 'verified' | 'needs_kyc'
}

export type AccountType = 'brokerage' | 'ira' | 'roth_ira' | '401k' | 'trust' | 'checking' | 'savings'

export interface FinancialAccount {
  id: string
  accountName: string
  accountType?: AccountType
  custodian?: string
  accountNumber?: string
  estimatedValue?: string
}

export interface Task {
  id: string
  title: string
  actionId: string
  status: TaskStatus
  assignedTo: string
  formKey: string
  order: number
  children?: KycChild[]
}

export interface KycChild {
  id: string
  name: string
  status: TaskStatus
  formKey: string
}

export interface Action {
  id: string
  title: string
  order: number
}

export interface WorkflowState {
  actions: Action[]
  tasks: Task[]
  relatedParties: RelatedParty[]
  financialAccounts: FinancialAccount[]
  activeTaskId: string
  flatTaskOrder: string[]
  taskData: Record<string, Record<string, unknown>>
}

export type WorkflowAction =
  | { type: 'SET_ACTIVE_TASK'; taskId: string }
  | { type: 'SET_TASK_STATUS'; taskId: string; status: TaskStatus }
  | { type: 'SPAWN_KYC_CHILD'; parentTaskId: string; childName: string }
  | { type: 'REMOVE_KYC_CHILD'; parentTaskId: string; childId: string }
  | { type: 'ADD_RELATED_PARTY'; party: RelatedParty }
  | { type: 'UPDATE_RELATED_PARTY'; partyId: string; updates: Partial<Pick<RelatedParty, 'name' | 'relationship' | 'email'>> }
  | { type: 'REMOVE_RELATED_PARTY'; partyId: string }
  | { type: 'ADD_FINANCIAL_ACCOUNT'; account: FinancialAccount }
  | { type: 'UPDATE_FINANCIAL_ACCOUNT'; accountId: string; updates: Partial<Omit<FinancialAccount, 'id'>> }
  | { type: 'REMOVE_FINANCIAL_ACCOUNT'; accountId: string }
  | { type: 'SET_TASK_DATA'; taskId: string; fields: Record<string, unknown> }
  | { type: 'INITIALIZE_FROM_RELATIONSHIP'; relatedParties: RelatedParty[]; financialAccounts: FinancialAccount[]; clientInfo: Record<string, unknown> }
  | { type: 'GO_NEXT' }
  | { type: 'GO_BACK' }
