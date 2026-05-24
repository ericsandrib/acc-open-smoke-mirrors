/**
 * Semantic color palette for status indicators across the app.
 *
 * Every status badge, the Application Status widget icon, and the /test sandbox
 * resolve through this one module so the visual language stays consistent.
 *
 * Buckets:
 *   - success: terminal-positive (only `complete`)
 *   - warning: human follow-up needed (NIGO / clarification / escalation hold)
 *   - danger: explicit failure or blocked
 *   - neutral: in-flight without judgement, pre-flight, or terminal-neutral
 *   - default: black fallback for unknown statuses
 *
 * All classes use Tailwind/shadcn tokens; no hex literals.
 */

export type StatusSemantic = 'success' | 'warning' | 'danger' | 'neutral' | 'default'

export interface StatusSemanticClasses {
  /** Faded / tinted pill (the standard badge variant). */
  pill: string
  /** Solid filled box with inverted text + icon (terminal variant for the widget). */
  solid: string
  /** Icon color when rendered on the neutral light-mode background of the Application Status card. */
  icon: string
  /** Icon color when rendered on the solid-filled variant (inverted). */
  iconOnSolid: string
}

/**
 * Single source of truth for semantic styling. Components import these classes
 * directly (badges, widget, /test sandbox) — never hardcode the color tokens at call sites.
 */
export const statusSemanticClasses: Record<StatusSemantic, StatusSemanticClasses> = {
  success: {
    pill: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200',
    solid: 'border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-600',
    icon: 'text-green-700 dark:text-green-300',
    iconOnSolid: 'text-white',
  },
  warning: {
    pill: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    // amber-500 + white text fails WCAG (~2.0:1); amber-600 + white reaches
    // ~4:1 — passes the 3:1 UI / icon threshold and is readable for the label.
    solid: 'border-amber-600 bg-amber-600 text-white dark:border-amber-600 dark:bg-amber-600',
    icon: 'text-amber-700 dark:text-amber-300',
    iconOnSolid: 'text-white',
  },
  danger: {
    pill: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200',
    solid: 'border-red-600 bg-red-600 text-white dark:border-red-500 dark:bg-red-600',
    icon: 'text-red-700 dark:text-red-300',
    iconOnSolid: 'text-white',
  },
  neutral: {
    pill: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
    solid: 'border-gray-700 bg-gray-700 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900',
    icon: 'text-gray-600 dark:text-gray-400',
    iconOnSolid: 'text-white dark:text-gray-900',
  },
  default: {
    pill: 'border-border bg-background text-foreground',
    solid: 'border-foreground bg-foreground text-background',
    icon: 'text-foreground',
    iconOnSolid: 'text-background',
  },
}

/**
 * Status name → semantic bucket.
 * Covers TaskStatus, JourneyStatus, and ChildDisplayStatus (single union of strings).
 */
export const statusSemantic: Record<string, StatusSemantic> = {
  // success
  complete: 'success',

  // warning — advisor / compliance action needed
  nigo: 'warning',
  nigo_document: 'warning',
  nigo_principal: 'warning',
  clarification_required: 'warning',
  escalation_hold: 'warning',

  // danger — explicit failure or workflow halted
  blocked: 'danger',
  rejected: 'danger',
  rejected_aml: 'danger',

  // neutral — pre-flight / in-flight / terminal-neutral
  not_started: 'neutral',
  draft: 'neutral',
  in_progress: 'neutral',
  awaiting_review: 'neutral',
  awaiting_client_signature: 'neutral',
  awaiting_documents: 'neutral',
  aml_review: 'neutral',
  document_review: 'neutral',
  ho_kyc_review: 'neutral',
  principal_review: 'neutral',
  canceled: 'neutral',
  cancelled: 'neutral',

  // EsignEnvelopeStatus values — same semantic buckets as above.
  // 'sent' renders as "Awaiting Client Signature" → neutral (waiting on the client, no firm-side action).
  // 'completed' is success; 'declined' is danger; 'voided' is neutral (canceled by sender).
  sent: 'neutral',
  delivered: 'neutral',
  completed: 'success',
  declined: 'danger',
  voided: 'neutral',
}

export function getStatusSemantic(status?: string): StatusSemantic {
  if (!status) return 'default'
  return statusSemantic[status] ?? 'default'
}

export function getStatusSemanticClasses(status?: string): StatusSemanticClasses {
  return statusSemanticClasses[getStatusSemantic(status)]
}

/**
 * Maps an Application Status widget stage label (from `getActiveStageLabel`)
 * onto a semantic bucket. Stage labels are the user-visible strings shown in
 * the widget — keep this in sync with `buildTimelineDisplaySteps` in
 * `ChildActionTimelineSheet`.
 *
 * Note on `success`: the widget treats "moving forward through the pipeline"
 * and "completed" as the same positive bucket — both read as green. The
 * terminal-vs-active treatment differentiates the two visually (active stages
 * are tinted green, terminal stages are filled green). The bucket name is
 * shared with the badge palette, where `success` is reserved for `complete`
 * only; widget semantics are intentionally broader.
 */
export const stageLabelSemantic: Record<string, StatusSemantic> = {
  // success — terminal positive
  'Pending Release': 'success',
  Complete: 'success',

  // success — active in-flight (on-track motion reads as positive)
  'ID Verification': 'success',
  'Client Signature': 'success',
  Submitted: 'success',
  'Awaiting Review': 'success',
  'AML Review': 'success',
  'Document Review': 'success',
  'Principal Review': 'success',

  // warning — human follow-up needed
  'Clarification / Document Required': 'warning',
  'Escalation / Hold': 'warning',

  // danger — explicit failure
  Rejected: 'danger',

  // neutral — pre-flight and terminal-neutral
  Draft: 'neutral',
  Canceled: 'neutral',
}

export function getStageLabelSemantic(label?: string): StatusSemantic {
  if (!label) return 'default'
  return stageLabelSemantic[label] ?? 'default'
}

/**
 * Stage labels whose semantic treatment should render as the *terminal*
 * variant (solid filled box, reversed icon). Everything else uses the
 * *active* variant (faded tinted box, colored icon).
 *
 * Terminal = the workflow has come to rest at this stage and won't
 * advance further without external intervention.
 */
export const terminalStageLabels = new Set<string>([
  'Pending Release',
  'Complete',
  'Rejected',
  'Canceled',
])

export function isTerminalStageLabel(label?: string): boolean {
  if (!label) return false
  return terminalStageLabels.has(label)
}
