export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'canceled'
  | 'blocked'
  | 'awaiting_review'
  | 'rejected'

export type RelatedPartyType = 'household_member' | 'related_contact' | 'related_organization'

/** Trustee or trust owner linked to a trust entity (CIP / required documents). */
export interface TrustPartyRef {
  id: string
  /** When set, resolves to an existing household or contact party for display and deduplication. */
  partyId?: string
  displayName: string
  role?: string
}

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
  /** Optional seed for KYC child ID verification (wizard prepopulation). */
  kycIdType?: string
  kycIdNumber?: string
  kycIdState?: string
  kycIdExpiration?: string
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
  dateOfFormation?: string
  contactPerson?: string
  accountOwnerIndividual?: AccountOwnerIndividualProfile
  kycDirectAdd?: boolean
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
  /** For trust organizations: trustees / trust owners requiring government-issued ID for CIP. */
  trustParties?: TrustPartyRef[]
}

export type AccountType = 'brokerage' | 'ira' | 'roth_ira' | '401k' | 'trust' | 'checking' | 'savings'

export type ChildType = 'kyc' | 'account-opening' | 'funding-line' | 'feature-service-line'

export interface FinancialAccount {
  id: string
  accountName: string
  accountType?: AccountType
  custodian?: string
  /** Bank deposit accounts (checking/savings): ABA routing for ACH / wires. */
  routingNumber?: string
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

/** Review / compliance state for one child workflow (KYC vs account opening are isolated per child id). */
export interface ChildReviewState {
  documentReview?: { status: 'pending' | 'igo' | 'nigo'; decidedAt?: string; nigoReason?: string; nigoFeedback?: string }
  principalReview?: { status: 'pending' | 'igo' | 'nigo'; decidedAt?: string; nigoReason?: string; nigoFeedback?: string }
  amlFlagged?: boolean
  amlNotes?: string
  amlReview?: { status: 'pending' | 'cleared' | 'flagged' | 'info_requested' | 'escalated'; decidedAt?: string; findings?: string; infoRequestComments?: string; reason?: string }
  cipStatus?: {
    idVerification: 'pass' | 'fail' | 'pending'
    addressMatch: 'pass' | 'fail' | 'pending'
    dobMatch: 'pass' | 'fail' | 'pending'
    overallStatus: 'pass' | 'fail' | 'pending'
  }
  hoKycReview?: { status: 'pending' | 'approved' | 'changes_requested'; decidedAt?: string; comments?: string }
  principalKycReview?: { status: 'pending' | 'approved' | 'rejected'; decidedAt?: string; reason?: string }
  validationErrors?: string[]
  /** Demo: timestamps for timeline steps before AML (set when the KYC child is submitted for review). */
  kycPreAmlTimeline?: { draftAt: string; idVerificationAt: string; submittedForReviewAt: string }
  /** Demo: timestamps for Draft / Client Signature / Submitted before Home Office review (non-KYC child workflows). */
  accountOpeningPreReviewTimeline?: { draftAt: string; clientSignatureAt: string; submittedForReviewAt: string }
}

export type ChildReviewDecision = { outcome: 'approved' | 'rejected'; decidedAt: string }

/** Captured when creating an onboarding journey (Compose / new journey flow). */
export interface JourneyOnboardingConfig {
  /** Branch / office identifier (demo: office code). */
  office: string
  /** Selected investment professional (team member id). */
  investmentProfessionalId: string
  /** Whether the client will open an account that includes an annuity. */
  openAnnuityAccount: boolean
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
  /** Optional onboarding journey configuration from the new-journey modal. */
  journeyOnboardingConfig?: JourneyOnboardingConfig
  submittedTaskIds: string[]
  activeChildActionId?: string
  activeChildSubTaskIndex?: number
  /** When drilling into a funding-line or feature-service-line child, EXIT restores this account child + sub-step. */
  childActionResume?: { accountChildId: string; subTaskIndex: number }
  reviewState?: ReviewState
  demoViewMode?: 'advisor' | 'ho-documents' | 'ho-principal' | 'ho-kyc' | 'aml'
  submittedAt?: string
  /** Last review outcome per child id (demo / footer messaging). */
  childReviewDecisionsByChildId?: Record<string, ChildReviewDecision>
  /** AML, document, principal, and KYC review substeps keyed by {@link ChildTask.id}. */
  childReviewsByChildId?: Record<string, ChildReviewState>
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
  | {
      type: 'INITIALIZE_FROM_RELATIONSHIP'
      relatedParties: RelatedParty[]
      financialAccounts: FinancialAccount[]
      clientInfo: Record<string, unknown>
      journeyName?: string
      journeyId?: string
      assignedTo?: string
      journeyOnboardingConfig?: JourneyOnboardingConfig
    }
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
  | { type: 'SUBMIT_ALL_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW' }
  | { type: 'ACCEPT_REVIEW' }
  | { type: 'REJECT_REVIEW'; reason: string; feedback?: string }
  | { type: 'SUBMIT_CHILD_FOR_REVIEW' }
  | { type: 'ACCEPT_CHILD_REVIEW' }
  | { type: 'REJECT_CHILD_REVIEW'; reason: string; feedback?: string }
  | { type: 'SET_DEMO_VIEW'; mode: 'advisor' | 'ho-documents' | 'ho-principal' | 'ho-kyc' | 'aml' }
  | { type: 'DOCUMENT_REVIEW_IGO' }
  | { type: 'DOCUMENT_REVIEW_NIGO'; reason: string; feedback?: string }
  | { type: 'PRINCIPAL_REVIEW_IGO' }
  | { type: 'PRINCIPAL_REVIEW_NIGO'; reason: string; feedback?: string }
  | { type: 'SET_AML_FLAG'; flagged: boolean; notes?: string }
  | { type: 'AML_REVIEW_CLEAR' }
  | { type: 'AML_REVIEW_FLAG'; findings?: string }
  | { type: 'HO_KYC_APPROVE' }
  | { type: 'HO_KYC_REQUEST_CHANGES'; comments: string }
  | { type: 'AML_REQUEST_MORE_INFO'; comments: string }
  | { type: 'AML_ESCALATE_SAR'; reason?: string }
