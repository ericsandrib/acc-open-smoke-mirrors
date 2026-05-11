// V2 workflow types — RIA-segment Open Accounts model.
//
// Source: Avantos_RIA_Account_Opening_Spec.docx v1.0. The V2 model replaces
// the old broker-dealer-shaped workflow (V1) with a 5-lane RIA workflow,
// rules engine, single review queue with parallel action types, and an
// explicit account lifecycle state machine.
//
// Tagging conventions from the spec:
//   • Platform     — applies to every RIA on Avantos
//   • Stratos config — Stratos's specific values; configurable per RIA
//   • Open Question — decision not yet made (see V2_OPEN_QUESTIONS)
//
// Kept separate from src/types/workflow.ts so the existing V1 wizard /
// onboarding flows continue to compile unchanged.

// ─── Lanes ─────────────────────────────────────────────────────────────

export type V2LaneId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export interface V2Lane {
  id: V2LaneId
  name: string
  purpose: string
}

export const V2_LANES: V2Lane[] = [
  {
    id: 'L1',
    name: 'Setup & validate',
    purpose:
      'Capture account-level data, validate inline, run advisor licensing. Errors caught here never reach a reviewer.',
  },
  {
    id: 'L2',
    name: 'Identity & KYC (per owner)',
    purpose:
      'Per-owner KYC sub-workflow. Runs in parallel with the main spine, gates final account submission.',
  },
  {
    id: 'L3',
    name: 'Risk routing',
    purpose:
      'Rules engine evaluates the account and produces a tag set determining required review actions. Most accounts route directly to L5.',
  },
  {
    id: 'L4',
    name: 'Review',
    purpose:
      'Human review for flagged accounts. One queue, multiple action types. Reviewers act in parallel; results consolidate.',
  },
  {
    id: 'L5',
    name: 'Sign & open',
    purpose:
      'eSign once after review clears, then final licensing recheck, AML 90-day recheck, custodian submission, account opened.',
  },
]

// ─── Node families (visual conventions §6.3) ───────────────────────────

export type V2NodeFamily =
  | 'start_end'
  | 'process'
  | 'gate'
  | 'hold_block'
  | 'state'
  | 'api_system'
  | 'human_review'
  | 'nigo_rework'

export interface V2Node {
  /** ID convention: G-## (Guardian reuse), S-## (Stratos new), K-## (KYC) */
  id: string
  lane: V2LaneId
  family: V2NodeFamily
  label: string
  /** Whether this is new for Stratos (amber) vs reused from Guardian (white) */
  newForStratos: boolean
  /** Short note shown on hover / panel */
  note?: string
  /** Optional column index within the lane for layout */
  column?: number
}

// ─── Rules engine ──────────────────────────────────────────────────────

export type V2RuleCategory = 'guardrail' | 'high_risk' | 'universal'

export type V2ReviewActionType =
  | 'suitability-review'
  | 'best-interest-review'
  | 'compliance-review'
  | 'documentation-review'
  | 'sim-document-review'

/**
 * Inputs available to rules at evaluation time. Sourced from Orion
 * (prefilled), advisor input, advisor profile, or system-derived.
 */
export interface V2AccountContext {
  // Identity
  primaryClientId: string
  primaryClientName: string

  // From Orion (or advisor edit)
  age: number
  employmentStatus?: 'Employed' | 'Retired' | 'Unemployed' | 'Self-Employed' | 'Student' | null
  liquidNetWorth: number
  netWorth: number
  netIncome: number
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive'
  investmentObjective: 'Capital Preservation' | 'Income' | 'Balanced' | 'Growth' | 'Aggressive Growth'
  timeHorizon: 'Short' | 'Intermediate' | 'Long'
  clientEmail: string
  liquidityNeed: number

  // Advisor input on the account itself
  accountType: 'individual' | 'joint' | 'qualified-ira' | 'qualified-401k' | 'qualified-roth' | 'trust' | 'entity'
  approximateAccountValue: number
  sourceOfFunds: 'New money' | 'Rollover' | 'Transfer' | 'Inheritance' | 'Sale of property' | 'Other'
  advisorFee: number   // percent, e.g. 1.0
  simFee?: number      // percent — present means SIM account
  margin: boolean
  options: boolean
  optionsActivityLevel?: 'low' | 'medium' | 'high'

  // Advisor profile
  advisorEmail: string
  advisorLicensedStates: string[]
  clientStateOfResidence: string

  // Entity-attribute flags (when accountType is 'entity' or 'trust')
  entityAttributes?: {
    isStratosEmployeeOba?: boolean
    obaVerificationOnFile?: boolean
    beneficialOwnerDisclosurePresent?: boolean
    isTrust?: boolean
    foreignResidency?: boolean
    promoterRelationship?: boolean
  }

  // Disclosure / document state
  bidAttached: boolean
  adv2bAttached: boolean
  clientAgreementCompleteness: {
    subAdvisor: boolean
    advisorFee: boolean
    simFee: boolean
    transactionCharges: boolean
    annualLiquidityNeeds: boolean
    investmentTimeHorizon: boolean
    investmentObjective: boolean
    householdData: boolean
    financialInformation: boolean
    clientBackground: boolean
  }

  // System / household
  householdProfileMismatchDetected?: boolean
}

export interface V2Rule {
  id: string
  category: V2RuleCategory
  name: string
  /** Plain-language condition for the rules-explorer UI */
  conditionLabel: string
  /** Pure predicate; returns true when the rule FIRES (problem) */
  evaluate: (ctx: V2AccountContext) => boolean
  /** For guardrails: which fields error; for routing: which review tag */
  action:
    | { kind: 'block_submit'; errorMessage: string; affectedFields?: string[] }
    | { kind: 'tag'; tag: V2ReviewActionType }
  /** Source columns from the spec — for traceability in the UI */
  inputs: string[]
  source: 'Stratos' | 'Platform'
  /** When the rule has an Open Question that affects it */
  openQuestionId?: string
}

export interface V2RulesEvaluation {
  /** Guardrails that fired → block submit */
  blockingErrors: Array<{ ruleId: string; ruleName: string; message: string; affectedFields?: string[] }>
  /** High-risk + universal tags produced */
  tags: V2ReviewActionType[]
  /** Detailed firing record — which rule produced each tag */
  firings: Array<{ ruleId: string; ruleName: string; tag?: V2ReviewActionType }>
  /** True when zero tags → bypass review */
  bypassReview: boolean
  /** True when any guardrail fired → cannot submit */
  cannotSubmit: boolean
}

// ─── Lifecycle state machine (Appendix C) ──────────────────────────────

export type V2LifecycleState =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'nigo'
  | 'pending_documentation'
  | 'de_linked'
  | 'approved'
  | 'awaiting_signature'
  | 'signed'
  | 'submitted_to_custodian'
  | 'opened'
  | 'closed'

export interface V2StateMeta {
  id: V2LifecycleState
  name: string
  description: string
  family: 'start' | 'active' | 'review' | 'hold' | 'final'
}

export const V2_LIFECYCLE_STATES: V2StateMeta[] = [
  { id: 'draft', name: 'Draft', description: 'Advisor is filling in the form. No reviews triggered.', family: 'start' },
  { id: 'submitted', name: 'Submitted', description: 'Form submitted; rules engine has evaluated; routing decision made.', family: 'active' },
  { id: 'in_review', name: 'In Review', description: 'One or more reviewer actions pending; advisor is waiting.', family: 'review' },
  { id: 'nigo', name: 'NIGO', description: 'A reviewer has returned the account with deficiencies. Advisor is working on resolution.', family: 'review' },
  { id: 'pending_documentation', name: 'Pending Documentation', description: 'Account is in operations review; documentation completeness is being validated.', family: 'review' },
  { id: 'de_linked', name: 'De-Linked', description: 'Account disconnected from active workflow because required documentation is missing. Reversible.', family: 'hold' },
  { id: 'approved', name: 'Approved', description: 'All required reviews complete and approved. Ready to generate eSign.', family: 'active' },
  { id: 'awaiting_signature', name: 'Awaiting Signature', description: 'eSign envelope generated; client has not yet signed.', family: 'active' },
  { id: 'signed', name: 'Signed', description: 'Client has signed and returned the envelope.', family: 'active' },
  { id: 'submitted_to_custodian', name: 'Submitted to Custodian', description: 'Account submission sent to custodian API; awaiting confirmation.', family: 'active' },
  { id: 'opened', name: 'Opened', description: 'Custodian has confirmed account opening.', family: 'final' },
  { id: 'closed', name: 'Closed', description: 'Workflow terminated. May or may not have reached Opened.', family: 'final' },
]

export type V2Transition =
  | { from: V2LifecycleState; to: V2LifecycleState; trigger: string; actorRole: 'advisor' | 'reviewer' | 'system' | 'client' | 'custodian'; rationale?: string }

export interface V2LifecycleEvent {
  at: string  // ISO timestamp
  from: V2LifecycleState
  to: V2LifecycleState
  actor: string
  trigger: string
  reason?: string
}

// ─── Review queue model (§5.4) ─────────────────────────────────────────

export interface V2ReviewAction {
  type: V2ReviewActionType
  /** Which queue / role handles it (Stratos config) */
  assignedTo: string
  status: 'pending' | 'approved' | 'nigo'
  reviewer?: string
  decidedAt?: string
  nigoDeficiencies?: Array<{
    category: 'documentation' | 'suitability' | 'compliance_attribute' | 'other'
    description: string
  }>
}

export interface V2QueuedAccount {
  id: string
  client: string
  accountType: string
  enteredQueueAt: string
  state: V2LifecycleState
  /** Tags that landed it in review */
  tags: V2ReviewActionType[]
  actions: V2ReviewAction[]
  /** Slowest reviewer determines the time-to-clear */
  slaHours: number
}

// ─── Open Questions (§7) ───────────────────────────────────────────────

export interface V2OpenQuestion {
  id: string
  question: string
  affects: string
}

export const V2_OPEN_QUESTIONS: V2OpenQuestion[] = [
  { id: 'OQ-1', question: 'Write semantics for Orion edits — synchronous, asynchronous, or queued-for-review?', affects: 'R-4.3, L1 latency' },
  { id: 'OQ-2', question: 'Stratos licensing service — LAWS or alternate?', affects: 'R-5.1.4, R-5.7.3' },
  { id: 'OQ-3', question: 'AML escalation queue ownership at Stratos — which team?', affects: 'R-5.2.3 routing' },
  { id: 'OQ-4', question: 'Orion Employment Status field availability — required for rule R-2', affects: 'R-2 retired/unemployed + aggressive growth' },
  { id: 'OQ-5', question: 'Stratos advisory fee threshold — what is it?', affects: 'R-7' },
  { id: 'OQ-6', question: 'Options activity-level threshold — what level requires review?', affects: 'R-9' },
  { id: 'OQ-7', question: 'Entity-attribute review activation — compliance-tagged, or silent?', affects: 'R-11' },
  { id: 'OQ-8', question: 'ADV 2B storage and versioning — per-advisor, per-relationship, CRM-pulled?', affects: 'R-5.5.4' },
  { id: 'OQ-9', question: 'Foreign residency country list — accepted countries?', affects: 'R-11 entity attribute' },
  { id: 'OQ-10', question: 'Universal Best Interest Review reviewer assignment', affects: 'U-1' },
  { id: 'OQ-11', question: 'Promoter agreement workflow — Compliance owns the agreement or reviews post-hoc?', affects: 'R-11 promoter sub-flow' },
]
