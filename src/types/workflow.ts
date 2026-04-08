export type TaskStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked' | 'awaiting_review' | 'rejected'

export type RelatedPartyType = 'household_member' | 'related_contact' | 'related_organization'

/** Suitability / regulatory extension for account-owner individuals (wizard). */
export interface AccountOwnerIndividualProfile {
  middleName?: string
  suffix?: string
  legalStreet?: string
  legalApt?: string
  legalCity?: string
  legalState?: string
  legalZip?: string
  legalCountry?: string
  mailingSameAsLegal?: boolean
  mailingStreet?: string
  mailingApt?: string
  mailingCity?: string
  mailingState?: string
  mailingZip?: string
  mailingCountry?: string
  employmentStatus?: string
  employerName?: string
  occupation?: string
  industry?: string
  annualIncomeRange?: string
  netWorthRange?: string
  liquidNetWorthRange?: string
  sourceOfFunds?: string
  investmentObjective?: string
  riskTolerance?: string
  timeHorizon?: string
  investmentExperience?: string
  controlPerson?: string
  bdAffiliation?: string
  familyAffiliation?: string
  pep?: string
  insiderRule144?: string
  trustedContactName?: string
  trustedContactRelationship?: string
  trustedContactPhoneEmail?: string
}

export interface RelatedParty {
  id: string
  name: string
  firstName?: string
  lastName?: string
  organizationName?: string
  type: RelatedPartyType
  relationship?: string
  relationshipCategory?: string
  role?: string
  isPrimary?: boolean
  email?: string
  phone?: string
  dob?: string
  kycStatus?: 'verified' | 'needs_kyc' | 'pending'
  isHidden?: boolean
  accountNumber?: string
  ssn?: string
  taxId?: string
  clientId?: string
  entityType?: string
  jurisdiction?: string
  contactPerson?: string
  accountOwnerIndividual?: AccountOwnerIndividualProfile
  controlPerson?: {
    firstName?: string
    lastName?: string
    dob?: string
    ssn?: string
    address?: string
    relationship?: string
  }
  beneficialOwners?: Array<{
    name: string
    ownershipPercent: string
  }>
  businessProfile?: {
    industry?: string
    sourceOfFunds?: string
    annualRevenueRange?: string
  }
}

export type AccountType = 'brokerage' | 'ira' | 'roth_ira' | '401k' | 'trust' | 'checking' | 'savings'

export type ChildType = 'kyc' | 'account-opening' | 'funding-line' | 'feature-service-line'

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
  unread?: boolean
  edited?: boolean
  children?: ChildTask[]
}

export interface ChildTask {
  id: string
  name: string
  status: TaskStatus
  formKey: string
  childType: ChildType
}

export interface Action {
  id: string
  title: string
  order: number
}

export type ReviewStatus = 'pending' | 'accepted' | 'rejected'

export interface ReviewState {
  reviewStatus: ReviewStatus
  assignedTo: string
  rejectionReason?: string
  rejectionFeedback?: string
}

export interface WorkflowState {
  actions: Action[]
  tasks: Task[]
  relatedParties: RelatedParty[]
  financialAccounts: FinancialAccount[]
  activeTaskId: string
  flatTaskOrder: string[]
  taskData: Record<string, Record<string, unknown>>
  journeyName?: string
  journeyId?: string
  assignedTo?: string
  submittedTaskIds: string[]
  activeChildActionId?: string
  activeChildSubTaskIndex?: number
  /** When drilling into a funding-line or feature-service-line child, EXIT restores this account child + sub-step. */
  childActionResume?: { accountChildId: string; subTaskIndex: number }
  reviewState?: ReviewState
  demoViewMode?: 'advisor' | 'ho-documents' | 'ho-principal' | 'aml'
  submittedAt?: string
  childReviewDecision?: { outcome: 'approved' | 'rejected'; decidedAt: string }
  childReviewState?: {
    documentReview?: { status: 'pending' | 'igo' | 'nigo'; decidedAt?: string; nigoReason?: string; nigoFeedback?: string }
    principalReview?: { status: 'pending' | 'igo' | 'nigo'; decidedAt?: string; nigoReason?: string; nigoFeedback?: string }
    amlFlagged?: boolean
    amlNotes?: string
    amlReview?: { status: 'pending' | 'cleared' | 'flagged'; decidedAt?: string; findings?: string }
  }
}

export type WorkflowAction =
  | { type: 'SET_ACTIVE_TASK'; taskId: string }
  /** Leave any child / drill-in flow and open a top-level task from {@link WorkflowState.flatTaskOrder}. */
  | { type: 'GO_TO_TASK'; taskId: string }
  | { type: 'SET_TASK_STATUS'; taskId: string; status: TaskStatus }
  | { type: 'CONFIRM_TASK'; taskId: string }
  | { type: 'REOPEN_TASK'; taskId: string }
  | { type: 'SPAWN_CHILD'; parentTaskId: string; childName: string; childType: ChildType; metadata?: Record<string, unknown> }
  | { type: 'SPAWN_AND_ENTER_CHILD'; parentTaskId: string; childName: string; childType: ChildType }
  | { type: 'REMOVE_CHILD'; parentTaskId: string; childId: string }
  | { type: 'ADD_RELATED_PARTY'; party: RelatedParty }
  | { type: 'UPDATE_RELATED_PARTY'; partyId: string; updates: Partial<Omit<RelatedParty, 'id' | 'type' | 'isPrimary'>> }
  | { type: 'SET_PRIMARY_MEMBER'; partyId: string }
  | { type: 'REMOVE_RELATED_PARTY'; partyId: string }
  | { type: 'RESTORE_RELATED_PARTIES'; partyIds: string[] }
  | { type: 'ADD_FINANCIAL_ACCOUNT'; account: FinancialAccount }
  | { type: 'UPDATE_FINANCIAL_ACCOUNT'; accountId: string; updates: Partial<Omit<FinancialAccount, 'id'>> }
  | { type: 'REMOVE_FINANCIAL_ACCOUNT'; accountId: string }
  | { type: 'SET_TASK_DATA'; taskId: string; fields: Record<string, unknown> }
  | { type: 'INITIALIZE_FROM_RELATIONSHIP'; relatedParties: RelatedParty[]; financialAccounts: FinancialAccount[]; clientInfo: Record<string, unknown>; journeyName?: string; assignedTo?: string }
  | { type: 'SET_JOURNEY_ASSIGNEE'; assignee: string }
  | { type: 'GO_NEXT' }
  | { type: 'GO_BACK' }
  | {
      type: 'ENTER_CHILD_ACTION'
      childId: string
      /** When set, open this sub-step instead of defaulting to the first. */
      subTaskIndex?: number
      /** When set, EXIT_CHILD_ACTION / back from first sub-step returns to this account child + sub-step. */
      resumeAfterExit?: { accountChildId: string; subTaskIndex: number }
    }
  | { type: 'EXIT_CHILD_ACTION' }
  | { type: 'CHILD_GO_NEXT' }
  | { type: 'CHILD_GO_BACK' }
  | { type: 'SET_CHILD_SUB_TASK'; index: number }
  | { type: 'SUBMIT_FOR_REVIEW' }
  | { type: 'ACCEPT_REVIEW' }
  | { type: 'REJECT_REVIEW'; reason: string; feedback?: string }
  | { type: 'SUBMIT_CHILD_FOR_REVIEW' }
  | { type: 'ACCEPT_CHILD_REVIEW' }
  | { type: 'REJECT_CHILD_REVIEW'; reason: string; feedback?: string }
  | { type: 'SET_DEMO_VIEW'; mode: 'advisor' | 'ho-documents' | 'ho-principal' | 'aml' }
  | { type: 'DOCUMENT_REVIEW_IGO' }
  | { type: 'DOCUMENT_REVIEW_NIGO'; reason: string; feedback?: string }
  | { type: 'PRINCIPAL_REVIEW_IGO' }
  | { type: 'PRINCIPAL_REVIEW_NIGO'; reason: string; feedback?: string }
  | { type: 'SET_AML_FLAG'; flagged: boolean; notes?: string }
  | { type: 'AML_REVIEW_CLEAR' }
  | { type: 'AML_REVIEW_FLAG'; findings?: string }
