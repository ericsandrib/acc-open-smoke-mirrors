import {
  childStatusConfig,
  type ChildDisplayStatus,
} from '@/utils/childStatusDisplay'
import {
  getStatusSemanticClasses,
  type StatusSemantic,
} from '@/utils/statusSemanticColors'
import type { JourneyStatus } from '@/types/servicing'

export type OnboardingActionStatusKey = ChildDisplayStatus | 'pending_release' | 'unknown'

export type SummaryBucket =
  | 'danger'
  | 'warning'
  | 'inReview'
  | 'draft'
  | 'complete'
  | 'canceled'
  | 'unknown'

export type OnboardingParentOperationalState =
  | 'escalationHold'
  | 'awaitingDocuments'
  | 'inReview'
  | 'draft'
  | 'complete'
  | 'canceled'
  | 'unknown'

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
  draft: 'draft',
  awaiting_client_signature: 'draft',

  pending_release: 'complete',
  complete: 'complete',

  canceled: 'canceled',
  unknown: 'unknown',
}

const STATUS_SEMANTIC_BY_BUCKET: Record<SummaryBucket, StatusSemantic> = {
  danger: 'danger',
  warning: 'warning',
  inReview: 'neutral',
  draft: 'neutral',
  complete: 'success',
  canceled: 'neutral',
  unknown: 'default',
}

const STATUS_PILL_VARIANT_BY_STATUS: Partial<
  Record<OnboardingActionStatusKey, 'draft' | 'completed' | 'declined'>
> = {
  draft: 'draft',
  rejected_aml: 'declined',
  pending_release: 'completed',
  complete: 'completed',
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

const PARENT_OPERATIONAL_TIERS: Array<{
  state: OnboardingParentOperationalState
  buckets: SummaryBucket[]
  label: string
  semanticColor: StatusSemantic
  pillVariant?: 'draft' | 'completed' | 'declined'
}> = [
  {
    state: 'escalationHold',
    buckets: ['danger'],
    label: 'Escalation / Hold',
    semanticColor: 'danger',
  },
  {
    state: 'awaitingDocuments',
    buckets: ['warning'],
    label: 'Awaiting Documents',
    semanticColor: 'warning',
  },
  {
    state: 'inReview',
    buckets: ['inReview'],
    label: 'In Review',
    semanticColor: 'neutral',
  },
  {
    state: 'draft',
    buckets: ['draft'],
    label: 'Draft',
    semanticColor: 'neutral',
    pillVariant: 'draft',
  },
  {
    state: 'complete',
    buckets: ['complete'],
    label: 'Complete',
    semanticColor: 'success',
    pillVariant: 'completed',
  },
  {
    state: 'canceled',
    buckets: ['canceled'],
    label: 'Canceled',
    semanticColor: 'neutral',
  },
]

const KNOWN_STATUS_KEYS = new Set<OnboardingActionStatusKey>(
  Object.keys(STATUS_LABELS) as OnboardingActionStatusKey[],
)

const BUCKET_DISPLAY_ORDER: SummaryBucket[] = [
  'danger',
  'warning',
  'inReview',
  'draft',
  'complete',
  'canceled',
  'unknown',
]

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
  if (
    label.includes('needs attention') ||
    label.includes('clarification') ||
    label.includes('document required') ||
    label.includes('awaiting documents')
  ) {
    return 'warning'
  }
  if (label.includes('review') || label.includes('kyc review')) {
    return 'inReview'
  }
  if (
    label.includes('draft') ||
    label.includes('signature') ||
    label.includes('submitted')
  ) {
    return 'draft'
  }
  if (label.includes('complete') || label.includes('pending release')) {
    return 'complete'
  }
  if (label.includes('cancel')) return 'canceled'
  if (label.includes('progress')) return 'inReview'
  return 'unknown'
}

function countBuckets(rows: StatusSource[]): Map<SummaryBucket, number> {
  const counts = new Map<SummaryBucket, number>()
  for (const row of rows) {
    const bucket = bucketForSource(row)
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return counts
}

function bucketTotal(counts: Map<SummaryBucket, number>, buckets: SummaryBucket[]): number {
  return buckets.reduce((sum, bucket) => sum + (counts.get(bucket) ?? 0), 0)
}

function formatBucketLabel(bucket: SummaryBucket, count: number): string {
  switch (bucket) {
    case 'danger':
      return count === 1 ? '1 Escalated / Rejected' : `${count} Escalated / Rejected`
    case 'warning':
      return count === 1 ? '1 Awaiting Documents / Attention' : `${count} Awaiting Documents / Attention`
    case 'inReview':
      return count === 1 ? '1 In Review' : `${count} In Review`
    case 'draft':
      return count === 1 ? '1 Draft' : `${count} Draft`
    case 'complete':
      return count === 1 ? '1 Complete' : `${count} Complete`
    case 'canceled':
      return count === 1 ? '1 Canceled' : `${count} Canceled`
    case 'unknown':
      return count === 1 ? '1 Unknown' : `${count} Unknown`
  }
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
      : bucket === 'complete'
        ? 'completed'
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
): {
  state: OnboardingParentOperationalState
  label: string
  className: string
  pillVariant?: 'draft' | 'completed' | 'declined'
} | null {
  if (rows.length === 0) return null

  const counts = countBuckets(rows)
  for (const tier of PARENT_OPERATIONAL_TIERS) {
    if (bucketTotal(counts, tier.buckets) === 0) continue
    return {
      state: tier.state,
      label: tier.label,
      className: semanticPill(tier.semanticColor),
      pillVariant: tier.pillVariant,
    }
  }

  if ((counts.get('unknown') ?? 0) > 0) {
    return {
      state: 'unknown',
      label: 'Unknown',
      className: semanticPill('default'),
    }
  }

  return null
}

export function formatOnboardingWorkflowBreakdownLine(rows: StatusSource[]): string | null {
  const counts = countBuckets(rows)
  const parts = BUCKET_DISPLAY_ORDER
    .filter((bucket) => (counts.get(bucket) ?? 0) > 0)
    .map((bucket) => formatBucketLabel(bucket, counts.get(bucket) ?? 0))
  return parts.length <= 1 ? null : parts.join(' · ')
}

export function getOnboardingGenericStatusDisplay(
  status?: JourneyStatus | 'canceled',
): OnboardingActionStatusDisplay {
  const normalized = status === 'cancelled' ? 'canceled' : status
  const label = GENERIC_STATUS_LABELS[normalized ?? 'canceled'] ?? 'Unknown'
  return getOnboardingActionStatusDisplay(undefined, label)
}
