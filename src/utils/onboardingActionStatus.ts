import {
  childStatusConfig,
  type ChildDisplayStatus,
} from '@/utils/childStatusDisplay'
import {
  getStatusSemanticClasses,
  type StatusSemantic,
} from '@/utils/statusSemanticColors'
import type { JourneyStatus } from '@/types/servicing'

export type OnboardingActionStatusKey =
  | ChildDisplayStatus
  | 'pending_release'
  | 'submitted'
  | 'unknown'

export type SummaryBucket = 'danger' | 'warning' | 'inReview' | 'draft' | 'complete' | 'canceled' | 'unknown'

export type OnboardingActionStatusDisplay = {
  key: OnboardingActionStatusKey
  label: string
  bucket: SummaryBucket
  semanticColor: StatusSemantic
  className: string
  pillVariant?: 'draft' | 'completed' | 'declined'
}

type StatusSource = {
  displayStatus?: string
  stateModelStatus?: string
}

function semanticPill(semanticColor: StatusSemantic): string {
  return getStatusSemanticClasses(semanticColor).pill
}

const STATUS_LABELS: Record<OnboardingActionStatusKey, string> = {
  draft: 'Draft',
  awaiting_client_signature: 'Awaiting Signature',
  awaiting_review: childStatusConfig.awaiting_review.label,
  aml_review: childStatusConfig.aml_review.label,
  document_review: childStatusConfig.document_review.label,
  ho_kyc_review: 'KYC Review',
  principal_review: childStatusConfig.principal_review.label,
  clarification_required: childStatusConfig.clarification_required.label,
  nigo: childStatusConfig.nigo.label,
  nigo_document: childStatusConfig.nigo_document.label,
  nigo_principal: childStatusConfig.nigo_principal.label,
  awaiting_documents: childStatusConfig.awaiting_documents.label,
  escalation_hold: childStatusConfig.escalation_hold.label,
  rejected_aml: 'Rejected',
  submitted: 'Submitted',
  pending_release: 'Pending Release',
  complete: 'Complete',
  canceled: 'Canceled',
  unknown: 'Unknown',
}

const SUMMARY_BUCKET_BY_STATUS: Record<OnboardingActionStatusKey, SummaryBucket> = {
  rejected_aml: 'danger',
  escalation_hold: 'danger',

  clarification_required: 'warning',
  nigo: 'warning',
  nigo_document: 'warning',
  nigo_principal: 'warning',
  awaiting_documents: 'warning',

  awaiting_review: 'inReview',
  aml_review: 'inReview',
  document_review: 'inReview',
  ho_kyc_review: 'inReview',
  principal_review: 'inReview',
  submitted: 'inReview',
  awaiting_client_signature: 'inReview',
  draft: 'draft',

  pending_release: 'complete',
  complete: 'complete',

  canceled: 'canceled',
  unknown: 'unknown',
}

const STATUS_SEMANTIC_BY_BUCKET: Record<SummaryBucket, StatusSemantic> = {
  danger: 'danger',
  warning: 'warning',
  inReview: 'success',
  draft: 'neutral',
  complete: 'neutral',
  canceled: 'danger',
  unknown: 'default',
}

const STATUS_PILL_VARIANT_BY_STATUS: Partial<
  Record<OnboardingActionStatusKey, 'draft' | 'completed' | 'declined'>
> = {
  draft: 'draft',
  rejected_aml: 'declined',
}

const GENERIC_STATUS_LABELS: Partial<Record<JourneyStatus | 'canceled', string>> = {
  not_started: 'Draft',
  in_progress: 'In Progress',
  complete: 'Complete',
  cancelled: 'Canceled',
  canceled: 'Canceled',
  awaiting_review: 'Awaiting Review',
  rejected: 'Rejected',
}

const KNOWN_STATUS_KEYS = new Set<OnboardingActionStatusKey>(
  Object.keys(STATUS_LABELS) as OnboardingActionStatusKey[],
)

const PARENT_STATUS_PRIORITY: OnboardingActionStatusKey[] = [
  'escalation_hold',
  'rejected_aml',
  'clarification_required',
  'nigo',
  'nigo_document',
  'nigo_principal',
  'awaiting_documents',
  'principal_review',
  'document_review',
  'ho_kyc_review',
  'aml_review',
  'awaiting_review',
  'awaiting_client_signature',
  'submitted',
  'draft',
  'pending_release',
  'complete',
  'canceled',
]

const PARENT_STATUS_PRIORITY_INDEX = new Map(
  PARENT_STATUS_PRIORITY.map((status, index) => [status, index] as const),
)

function normalizeStatusKey(status?: string): OnboardingActionStatusKey {
  if (!status) return 'unknown'
  if (KNOWN_STATUS_KEYS.has(status as OnboardingActionStatusKey)) {
    return status as OnboardingActionStatusKey
  }
  return 'unknown'
}

function bucketForSource(source: StatusSource): SummaryBucket {
  const knownKey = normalizeStatusKey(source.displayStatus)
  if (knownKey !== 'unknown') return SUMMARY_BUCKET_BY_STATUS[knownKey]

  const label = source.stateModelStatus?.trim().toLowerCase() ?? ''
  if (!label) return 'unknown'
  if (label.includes('reject') || label.includes('escalat') || label.includes('hold')) {
    return 'danger'
  }
  if (label.includes('awaiting documents')) {
    return 'warning'
  }
  if (
    label.includes('needs attention') ||
    label.includes('clarification') ||
    label.includes('document required') ||
    label.includes('nigo')
  ) {
    return 'warning'
  }
  if (
    label.includes('review') ||
    label.includes('kyc review') ||
    label.includes('submitted') ||
    label.includes('signature') ||
    label.includes('progress')
  ) {
    return 'inReview'
  }
  if (label.includes('draft')) {
    return 'draft'
  }
  if (
    label.includes('complete') ||
    label.includes('pending release') ||
    label.includes('approved') ||
    label.includes('verified') ||
    label.includes('pass') ||
    label.includes('clear') ||
    label.includes('scheduled')
  ) {
    return 'complete'
  }
  if (label.includes('cancel') || label.includes('declin')) return 'canceled'
  return 'unknown'
}

function parentPriorityKeyForSource(source: StatusSource): OnboardingActionStatusKey {
  const knownKey = normalizeStatusKey(source.displayStatus)
  if (knownKey !== 'unknown') return knownKey

  const label = source.stateModelStatus?.trim().toLowerCase() ?? ''
  if (!label) return 'unknown'
  if (label.includes('escalat') || label.includes('hold')) return 'escalation_hold'
  if (label.includes('reject')) return 'rejected_aml'
  if (
    label.includes('clarification') ||
    label.includes('document required') ||
    label.includes('nigo') ||
    label.includes('needs attention')
  ) {
    return 'clarification_required'
  }
  if (label.includes('awaiting documents')) return 'awaiting_documents'
  if (label.includes('principal review')) return 'principal_review'
  if (label.includes('document review')) return 'document_review'
  if (label.includes('kyc review')) return 'ho_kyc_review'
  if (label.includes('aml review')) return 'aml_review'
  if (label.includes('awaiting review') || label.includes('in review')) return 'awaiting_review'
  if (label.includes('signature')) return 'awaiting_client_signature'
  if (label.includes('submitted')) return 'submitted'
  if (label.includes('draft')) return 'draft'
  if (label.includes('pending release')) return 'pending_release'
  if (
    label.includes('complete') ||
    label.includes('approved') ||
    label.includes('verified') ||
    label.includes('pass') ||
    label.includes('clear') ||
    label.includes('scheduled')
  ) {
    return 'complete'
  }
  if (label.includes('cancel') || label.includes('declin')) return 'canceled'
  return 'unknown'
}

export function getOnboardingActionStatusDisplay(
  status?: string,
  fallbackLabel?: string,
): OnboardingActionStatusDisplay {
  const key = normalizeStatusKey(status)
  const label = key === 'unknown' && fallbackLabel ? fallbackLabel : STATUS_LABELS[key]
  const bucket =
    key === 'unknown' && fallbackLabel
      ? bucketForSource({ stateModelStatus: fallbackLabel })
      : SUMMARY_BUCKET_BY_STATUS[key]
  const semanticColor = STATUS_SEMANTIC_BY_BUCKET[bucket]
  const pillVariant =
    key !== 'unknown'
      ? STATUS_PILL_VARIANT_BY_STATUS[key]
      : bucket === 'danger'
          ? 'declined'
          : bucket === 'draft' || label.toLowerCase().includes('draft')
            ? 'draft'
            : undefined
  return {
    key,
    label,
    bucket,
    semanticColor,
    className: semanticPill(semanticColor),
    pillVariant,
  }
}

export function deriveOnboardingParentOperationalSummary(
  rows: StatusSource[],
): OnboardingActionStatusDisplay | null {
  if (rows.length === 0) return null

  let bestMatch:
    | {
        priority: number
        display: OnboardingActionStatusDisplay
      }
    | undefined

  for (const row of rows) {
    const priorityKey = parentPriorityKeyForSource(row)
    if (priorityKey === 'unknown') continue
    const priority = PARENT_STATUS_PRIORITY_INDEX.get(priorityKey)
    if (priority === undefined) continue

    const display = getOnboardingActionStatusDisplay(row.displayStatus, row.stateModelStatus)
    if (!bestMatch || priority < bestMatch.priority) {
      bestMatch = { priority, display }
    }
  }

  return bestMatch?.display ?? null
}

export function formatOnboardingWorkflowBreakdownLine(rows: StatusSource[]): string | null {
  const countsByLabel = new Map<string, { count: number; priority: number }>()

  for (const row of rows) {
    const display = getOnboardingActionStatusDisplay(row.displayStatus, row.stateModelStatus)
    const priorityKey = parentPriorityKeyForSource(row)
    const priority =
      priorityKey === 'unknown'
        ? Number.MAX_SAFE_INTEGER
        : (PARENT_STATUS_PRIORITY_INDEX.get(priorityKey) ?? Number.MAX_SAFE_INTEGER)
    const existing = countsByLabel.get(display.label)
    countsByLabel.set(display.label, {
      count: (existing?.count ?? 0) + 1,
      priority: existing ? Math.min(existing.priority, priority) : priority,
    })
  }

  const parts = [...countsByLabel.entries()]
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([label, meta]) => `${meta.count} ${label}`)

  return parts.length <= 1 ? null : parts.join(' · ')
}

export function getOnboardingGenericStatusDisplay(
  status?: JourneyStatus | 'canceled',
): OnboardingActionStatusDisplay {
  const normalized = status === 'cancelled' ? 'canceled' : status
  const label = GENERIC_STATUS_LABELS[normalized ?? 'canceled'] ?? 'Unknown'
  return getOnboardingActionStatusDisplay(undefined, label)
}
