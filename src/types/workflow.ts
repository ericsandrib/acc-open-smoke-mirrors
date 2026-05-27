export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'canceled'
  | 'blocked'
  | 'awaiting_review'
  | 'rejected'

export type RelatedPartyType = 'household_member' | 'related_contact' | 'related_organization'

/** Trustee or trust owner linked to a trust entity (CIP / supporting documents). */
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
  /** ISO date (YYYY-MM-DD) of the last completed AML screening; drives the 90-day AML renewal window. */
  lastAmlRunAt?: string
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
  /** Demo-only: when true, automated AML screening returns a flagged result for this party. */
  demoForceFlagAml?: boolean
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

/**
 * Dev-only: presenter-selected identity card scenario. Does not modify client {@link WorkflowState.taskData}.
 * Stripped before workflow localStorage persistence.
 */
export type AdvisorIdentityDemoSimulation =
  | 'address_mismatch'
  | 'dob_mismatch'
  | 'name_mismatch'
  | 'tin_mismatch'
  | 'unable_to_verify'
  | 'verification_pending'

export type SimulateAdvisorIdentityPreset = AdvisorIdentityDemoSimulation | 'reset'

/** Review / compliance state for one child workflow (KYC vs account opening are isolated per child id). */
export interface ChildReviewState {
  documentReview?: { status: 'pending' | 'igo' | 'nigo'; decidedAt?: string; nigoReason?: string; nigoFeedback?: string }
  principalReview?: { status: 'pending' | 'igo' | 'nigo'; decidedAt?: string; nigoReason?: string; nigoFeedback?: string }
  amlFlagged?: boolean
  amlNotes?: string
  amlReview?: { status: 'pending' | 'cleared' | 'flagged' | 'info_requested' | 'escalated'; decidedAt?: string; findings?: string; infoRequestComments?: string; reason?: string; approvalReason?: string }
  cipStatus?: {
    idVerification: 'pass' | 'fail' | 'pending'
    addressMatch: 'pass' | 'fail' | 'pending'
    dobMatch: 'pass' | 'fail' | 'pending'
    overallStatus: 'pass' | 'fail' | 'pending'
  }
  /** Dev-only: see {@link AdvisorIdentityDemoSimulation}. */
  demoAdvisorIdentitySimulation?: AdvisorIdentityDemoSimulation
  /** ISO timestamp of last advisor-triggered KYC/CIP check (demo). */
  kycVerificationLastCheckedAt?: string
  /** Advisor-facing summary line from the last check. */
  kycVerificationResultSummary?: string
  hoKycReview?: { status: 'pending' | 'approved' | 'changes_requested'; decidedAt?: string; comments?: string }
  principalKycReview?: { status: 'pending' | 'approved' | 'rejected'; decidedAt?: string; reason?: string }
  validationErrors?: string[]
  /** Demo: timestamps for timeline steps before AML (set when the KYC child is submitted for review). */
  kycPreAmlTimeline?: { draftAt: string; idVerificationAt: string; submittedForReviewAt: string }
  /** Demo: timestamps for Draft / Client Signature / Submitted before Home Office review (non-KYC child workflows). */
  accountOpeningPreReviewTimeline?: { draftAt: string; clientSignatureAt: string; submittedForReviewAt: string }
  /**
   * Single-flow KYC: owner-level verification keyed by {@link RelatedParty.id}.
   * Reused across accounts; AML/CIP detail payloads live here (not on separate kyc children).
   */
  ownerReviews?: Record<string, OwnerKycReviewState>
  /** Single-flow account child: centralized routing state (replaces separate KYC child pipelines). */
  accountWorkflowPhase?: AccountWorkflowPhase
}

/** Unified account-opening workflow phase (single-flow mode). */
export type AccountWorkflowPhase =
  | 'draft'
  | 'submitted'
  | 'aml_review'
  | 'document_review'
  | 'principal_review'
  | 'pending_release'
  | 'complete'
  | 'escalation_hold'

/** Per-owner KYC / AML / CIP state (person-level, reusable across accounts). */
export interface OwnerKycReviewState {
  /** ISO timestamp when background KYC was auto-triggered after required fields completed. */
  autoTriggeredAt?: string
  /** Hash of required-field values — CIP re-run only when this changes. */
  requiredFieldsKey?: string
  amlReview?: ChildReviewState['amlReview']
  cipStatus?: ChildReviewState['cipStatus']
  hoKycReview?: ChildReviewState['hoKycReview']
  kycVerificationLastCheckedAt?: string
  kycVerificationResultSummary?: string
  demoAdvisorIdentitySimulation?: ChildReviewState['demoAdvisorIdentitySimulation']
  /** AML team only — demo payload. */
  amlPayloadDemo?: { ofacMatches?: number; watchlistHits?: string[]; summary?: string }
  /** Document review team only — demo CIP payload. */
  cipPayloadDemo?: { mismatches?: string[]; identityProvider?: string }
  /** True when this owner has prior Verified KYC reusable on future accounts (no re-trigger needed). */
  reusableVerifiedKyc?: boolean
  /** Single-flow: latest source (account child id) that produced this owner's verified KYC. */
  reusableSourceAccountChildId?: string
  /** Run metadata surfaced in CIP / AML review tasks (demo). */
  provider?: string
  runType?: 'Automated' | 'Re-run' | 'Manual'
  triggerSource?: string
  lastReRunBy?: string
  reRunReason?: string
  /** Immutable verification + disposition audit trail. Newest entry last. */
  verificationSnapshots?: VerificationSnapshot[]
  /** Fingerprint of identity + screening inputs at last automated screening (AML reuse gate). */
  screeningFingerprint?: string
}

/** Advisor acknowledgment before sending a forms package when KYC screening needs review. */
export interface FormsPackageKycAcknowledgment {
  id: string
  acknowledgedAt: string
  acknowledgedBy: string
  envelopeId?: string
  participants: Array<{
    partyId: string
    partyName: string
    amlLabel: string
    cipLabel: string
    kycStatus: string
    accountChildIds: string[]
  }>
}

/**
 * Person-level verification profile reused across account-opening workflows.
 * Account workflow phases remain independent; only AML/CIP disposition is shared.
 */
export interface ParticipantVerificationProfile {
  participantId: string
  screeningFingerprint: string
  screeningPayloadVersion?: string
  amlStatus: 'cleared' | 'pending' | 'flagged' | 'info_requested' | 'escalated'
  /** Simplified CIP disposition for reuse checks (not a substitute for per-account HO review). */
  cipStatus: 'verified' | 'pending' | 'fail'
  lastVerifiedAt: string
  expiresAt: string
  lastAmlDispositionAt: string
  dispositionReviewer?: string
  approvalReason?: string
  provider?: string
  /** Account child where the disposition was first recorded. */
  sourceAccountChildId?: string
}

/**
 * Audit-safe record of a verification run or disposition event.
 * Once appended, never mutated. Live owner field edits do not retroactively change a snapshot.
 */
export interface VerificationSnapshot {
  id: string
  ranAt: string
  /** What occurred: a KYC screening run or a reviewer disposition. */
  eventKind:
    | 'screening_run'
    | 'aml_approve'
    | 'aml_approve_reused'
    | 'aml_reject'
    | 'aml_request_info'
    | 'aml_escalate'
    | 'cip_approve'
    | 'cip_reject'
    | 'cip_request_info'
    | 'forms_package_kyc_ack'
  /** Provider / orchestrator label (e.g. "LexisNexis InstantID"). */
  provider?: string
  runType?: 'Automated' | 'Re-run' | 'Manual'
  triggerSource?: string
  /** Role / actor that initiated the event. */
  runBy?: string
  reRunReason?: string
  /** Owner field values that were verified at this point in time. */
  snapshotOf?: {
    firstName?: string
    lastName?: string
    dob?: string
    email?: string
    phone?: string
    taxId?: string
    legalStreet?: string
    legalCity?: string
    legalState?: string
    legalZip?: string
  }
  amlOutcome?: 'cleared' | 'pending' | 'flagged' | 'info_requested' | 'escalated'
  cipOutcome?: 'pass' | 'fail' | 'pending'
  /** Reviewer-supplied note (approval reason / findings / info-request comments). */
  note?: string
  /** Structured AML rejection reason code (account-opening disposition). */
  rejectionReasonCode?: string
  /** Human-readable structured AML rejection reason label. */
  rejectionReason?: string
  /** Optional reviewer notes separate from structured rejection reason. */
  reviewerNotes?: string
}

export type ChildReviewDecision = { outcome: 'approved' | 'rejected'; decidedAt: string }

/** Captured when creating an onboarding journey (Compose / new journey flow). */
export interface JourneyOnboardingConfig {
  /** Branch / office identifier (demo: office code). */
  office: string
  /** Selected investment professional (team member id). */
  investmentProfessionalId: string
  /** Whether advisor expects to open more than one account for this client. */
  openMultipleAccounts: boolean
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
  /** ISO timestamp when the advisor started this journey (Compose / template); drives servicing “Created” + sort. */
  journeyStartedAt?: string
  /** Display date for the journey header (e.g. "Oct 8"). */
  journeyDateLabel?: string
  /** ISO timestamp for journey due date (tooltip + header short label source). */
  journeyDueAt?: string
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
  /** Reusable participant-level AML/CIP verification profiles (keyed by {@link RelatedParty.id}). */
  participantVerificationsByPartyId?: Record<string, ParticipantVerificationProfile>
  /** Audit trail when an advisor sends a forms package after acknowledging KYC review warnings. */
  formsPackageKycAcknowledgments?: FormsPackageKycAcknowledgment[]
  /**
   * One-shot: after leaving a child workflow via breadcrumb, StepSidebar should select this
   * parent form section id (e.g. oa-kyc). Cleared when applied or invalid.
   */
  parentSectionFocusId?: string
  /**
   * v5 + split journey: which “page” of the no-annuity Open Accounts task is shown
   * (Account Instructions / KYC Verification / Forms Package). Null when not in that mode.
   */
  v5NoAnnuityOpenAccountsPage?: 'instructions' | 'kyc' | 'documents' | 'envelopes' | null
  /**
   * v6 split journey: whether the with-annuity Open Accounts path is shown in the sidebar and main area.
   * Persisted with workflow state; default false (No).
   */
  v6IncludeAnnuityAccounts?: boolean
  /** Tracks the furthest sub-task index each child has reached (for progress display). */
  childHighWaterMark?: Record<string, number>
  /**
   * One-shot deep-link from CIP Verification & Review to Account & Owners.
   * Consumed by the owners form: scrolls to and highlights the owner / hinted field, then clears.
   */
  ownerFieldFocus?: {
    accountChildId: string
    partyId: string
    /** Optional anchor suffix: 'address' | 'tax-id' | 'dob' | 'email' | 'phone' | 'name'. */
    fieldHint?: string
    /** Monotonic counter so consumers re-fire when the same target is re-requested. */
    requestedAt: string
  }
}

export type WorkflowAction =
  | { type: 'SET_ACTIVE_TASK'; taskId: string }
  /** Highlight this section in {@link StepSidebar} for the current task; consumed by the sidebar. */
  | { type: 'FOCUS_PARENT_TASK_SECTION'; sectionId: string }
  | { type: 'CLEAR_PARENT_SECTION_FOCUS' }
  /** Deep-link from CIP review to Account & Owners. Consumer scrolls + highlights the field. */
  | { type: 'FOCUS_OWNER_FIELDS'; accountChildId: string; partyId: string; fieldHint?: string }
  | { type: 'CLEAR_OWNER_FIELD_FOCUS' }
  | { type: 'SET_V5_NO_ANNUITY_OPEN_ACCOUNTS_PAGE'; page: 'instructions' | 'kyc' | 'documents' | 'envelopes' }
  | { type: 'SET_V6_INCLUDE_ANNUITY_ACCOUNTS'; include: boolean }
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
  | { type: 'SET_TASKS_ASSIGNEE'; taskIds: string[]; assignee: string }
  | {
      type: 'RESTORE_ASSIGNEE_SNAPSHOT'
      journeyAssignee: string
      taskAssignees: Record<string, string>
    }
  | {
      type: 'SYNC_SEEDED_JOURNEY_METADATA'
      journeyId: string
      journeyName: string
      assignedTo?: string
    }
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
  /** Marks a child sub-step as visited (drives progress for optional / read-only steps). */
  | { type: 'MARK_CHILD_SUB_TASK_VISITED'; index: number }
  | { type: 'SUBMIT_FOR_REVIEW' }
  | { type: 'SUBMIT_ALL_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW'; openAccountsTaskId: string }
  | { type: 'SUBMIT_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW'; childIds: string[] }
  /**
   * After simulated (or real) client e-sign on account paperwork: run AML on KYC child workflows for
   * account owners tied to those accounts. Sets {@link ChildReviewState.amlReview} to pending; if
   * {@link ChildReviewState.amlFlagged} is already true, the wizard shows AML review (see `deriveChildDisplayStatus`).
   * Optional `supplementalOwnerPartyIds` merges e-sign recipients when account-owner taskData is sparse.
   */
  | { type: 'POST_ENVELOPE_SIGNATURE_AML_FOR_OWNERS'; accountChildIds: string[]; supplementalOwnerPartyIds?: string[] }
  | { type: 'ACCEPT_REVIEW' }
  | { type: 'REJECT_REVIEW'; reason: string; feedback?: string }
  | { type: 'SUBMIT_CHILD_FOR_REVIEW' }
  /** Demo: advisor runs KYC/CIP screening from Client Verification Information; updates {@link ChildReviewState.cipStatus}. */
  | { type: 'RUN_ADVISOR_KYC_VERIFICATION'; childId: string }
  /**
   * Dev-only: set advisor identity verification card to a canned scenario for demos (no {@link WorkflowState.taskData} changes).
   * No-op in production builds. Not persisted to localStorage.
   */
  | { type: 'SIMULATE_ADVISOR_IDENTITY_VERIFICATION'; childId: string; preset: SimulateAdvisorIdentityPreset }
  | { type: 'ACCEPT_CHILD_REVIEW' }
  | { type: 'REJECT_CHILD_REVIEW'; reason: string; feedback?: string }
  | { type: 'SET_DEMO_VIEW'; mode: 'advisor' | 'ho-documents' | 'ho-principal' | 'ho-kyc' | 'aml' }
  | { type: 'DOCUMENT_REVIEW_IGO' }
  | { type: 'DOCUMENT_REVIEW_NIGO'; reason: string; feedback?: string }
  | { type: 'PRINCIPAL_REVIEW_IGO' }
  | { type: 'PRINCIPAL_REVIEW_NIGO'; reason: string; feedback?: string }
  | { type: 'SET_AML_FLAG'; flagged: boolean; notes?: string }
  | { type: 'AML_REVIEW_CLEAR'; approvalReason?: string }
  | { type: 'AML_REVIEW_FLAG'; findings?: string }
  | { type: 'HO_KYC_APPROVE' }
  | { type: 'HO_KYC_REQUEST_CHANGES'; comments: string }
  | { type: 'AML_REQUEST_MORE_INFO'; comments: string }
  | { type: 'AML_ESCALATE_SAR'; reason?: string }
  /** Single-flow: auto-run owner KYC when required owner fields are complete or envelope is sent. */
  | {
      type: 'AUTO_RUN_OWNER_KYC'
      accountChildId: string
      partyId: string
      reRunReason?: string
      runBy?: string
    }
  | {
      type: 'LOG_FORMS_PACKAGE_KYC_ACK'
      envelopeId: string
      acknowledgedBy: string
      participants: FormsPackageKycAcknowledgment['participants']
    }
  | { type: 'OWNER_AML_REVIEW_CLEAR'; accountChildId: string; partyId: string; approvalReason?: string }
  | { type: 'OWNER_AML_REVIEW_FLAG'; accountChildId: string; partyId: string; findings?: string }
  | { type: 'OWNER_AML_REQUEST_INFO'; accountChildId: string; partyId: string; comments: string }
  | { type: 'OWNER_CIP_APPROVE'; accountChildId: string; partyId: string }
  | { type: 'OWNER_CIP_REQUEST_CHANGES'; accountChildId: string; partyId: string; comments: string }
  | { type: 'SET_ACCOUNT_WORKFLOW_PHASE'; accountChildId: string; phase: AccountWorkflowPhase }
  /** Account-level AML disposition: applies to every natural-person owner on the account. */
  | { type: 'ACCOUNT_AML_APPROVE_ALL'; accountChildId: string; approvalReason?: string }
  | {
      type: 'ACCOUNT_AML_REJECT_ALL'
      accountChildId: string
      rejectionReasonCode: string
      rejectionReason: string
      reviewerNotes?: string
    }
  | { type: 'ACCOUNT_AML_REQUEST_INFO'; accountChildId: string; comments?: string }
  | { type: 'ACCOUNT_AML_ESCALATE'; accountChildId: string; reason?: string }
  /** Account-level CIP / document review disposition: applies to every natural-person owner on the account. */
  | { type: 'ACCOUNT_CIP_APPROVE_ALL'; accountChildId: string }
  | { type: 'ACCOUNT_CIP_REJECT_ALL'; accountChildId: string; comments?: string }
  | { type: 'ACCOUNT_CIP_REQUEST_INFO'; accountChildId: string; comments?: string }
  /** Account-level Principal Review disposition (single-flow). */
  | { type: 'ACCOUNT_PRINCIPAL_APPROVE'; accountChildId: string }
  | { type: 'ACCOUNT_PRINCIPAL_REJECT'; accountChildId: string; reason?: string }
  | { type: 'ACCOUNT_PRINCIPAL_REQUEST_INFO'; accountChildId: string; comments?: string }
