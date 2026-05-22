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
    solid: 'border-amber-500 bg-amber-500 text-white dark:border-amber-500 dark:bg-amber-500',
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
