import type { ActionRow } from '@/components/servicing/ActionsTable'
import {
  AWAITING_DOCUMENTS_PILL,
  childStatusConfig,
  NEEDS_ATTENTION_PILL,
  type ChildDisplayStatus,
} from '@/utils/childStatusDisplay'

/** Aggregate buckets for child workflow rows. */
type SummaryBucket =
  | 'issue'
  | 'rejected'
  | 'pending'
  | 'awaitingDocs'
  | 'inReview'
  | 'inProgress'
  | 'complete'
  | 'canceled'

export type ParentOperationalState =
  | 'needsAttention'
  | 'awaitingDocuments'
  | 'inReview'
  | 'complete'
  | 'canceled'

export type WorkflowSummaryChip = {
  key: string
  label: string
  className: string
}

export type ParentOperationalSummary = {
  state: ParentOperationalState
  label: string
  className: string
  pillVariant?: 'draft' | 'completed' | 'declined'
}

const CHIP_NEUTRAL =
  'border border-border/80 bg-muted/30 text-muted-foreground dark:bg-muted/20'
const CHIP_ATTENTION = NEEDS_ATTENTION_PILL
const CHIP_REJECT =
  'border border-red-200/80 bg-red-50/35 text-red-900 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200'
const CHIP_PIPELINE =
  'border border-violet-200/80 bg-violet-50/40 text-violet-800 dark:border-violet-800 dark:bg-violet-950/25 dark:text-violet-200'
const CHIP_COMPLETE =
  'border border-green-200/80 bg-green-50/35 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200'

/** Parent journey rollup labels reuse child status pill styling for visual consistency. */
const PARENT_OPERATIONAL_BADGE_CLASS: Record<ParentOperationalState, string> = {
  needsAttention: NEEDS_ATTENTION_PILL,
  awaitingDocuments: AWAITING_DOCUMENTS_PILL,
  inReview: childStatusConfig.awaiting_review.className,
  complete: childStatusConfig.complete.className,
  canceled: childStatusConfig.canceled.className,
}

const SUMMARY_BUCKET_BY_STATUS: Record<ChildDisplayStatus, SummaryBucket> = {
  rejected_aml: 'rejected',
  clarification_required: 'issue',
  nigo: 'issue',
  nigo_document: 'issue',
  nigo_principal: 'issue',
  escalation_hold: 'issue',
  awaiting_review: 'pending',
  awaiting_documents: 'awaitingDocs',
  aml_review: 'inReview',
  document_review: 'inReview',
  ho_kyc_review: 'inReview',
  principal_review: 'inReview',
  draft: 'inProgress',
  awaiting_client_signature: 'inProgress',
  complete: 'complete',
  canceled: 'canceled',
}

function summaryBucketForRow(row: ActionRow): SummaryBucket {
  const ds = row.displayStatus as ChildDisplayStatus | undefined
  if (ds && ds in SUMMARY_BUCKET_BY_STATUS) {
    return SUMMARY_BUCKET_BY_STATUS[ds as ChildDisplayStatus]
  }

  const sm = row.stateModelStatus?.trim().toLowerCase() ?? ''
  if (sm.includes('reject') || sm.includes('aml rejection')) return 'rejected'
  if (sm.includes('nigo') || sm.includes('escalat')) return 'issue'
  if (sm.includes('await') && sm.includes('doc')) return 'awaitingDocs'
  if (sm.includes('complete')) return 'complete'
  if (sm.includes('cancel')) return 'canceled'
  if (sm.includes('review') || sm.includes('aml')) return 'inReview'
  if (sm.includes('progress') || sm.includes('pending')) return 'pending'
  return 'inReview'
}

function countBuckets(allChildRows: ActionRow[]): Map<SummaryBucket, number> {
  const counts = new Map<SummaryBucket, number>()
  for (const row of allChildRows) {
    const bucket = summaryBucketForRow(row)
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return counts
}

function bucketTotal(counts: Map<SummaryBucket, number>, buckets: SummaryBucket[]): number {
  return buckets.reduce((sum, b) => sum + (counts.get(b) ?? 0), 0)
}

/** Severity-ordered tiers for collapsed parent rows (highest wins). */
const PARENT_OPERATIONAL_TIERS: {
  state: ParentOperationalState
  buckets: SummaryBucket[]
  label: string
  className: string
  pillVariant?: 'draft' | 'completed' | 'declined'
}[] = [
  {
    state: 'needsAttention',
    buckets: ['rejected', 'issue', 'pending'],
    label: 'Needs Attention',
    className: PARENT_OPERATIONAL_BADGE_CLASS.needsAttention,
  },
  {
    state: 'awaitingDocuments',
    buckets: ['awaitingDocs'],
    label: 'Awaiting Documents',
    className: PARENT_OPERATIONAL_BADGE_CLASS.awaitingDocuments,
  },
  {
    state: 'inReview',
    buckets: ['inReview', 'inProgress'],
    label: 'In Review',
    className: PARENT_OPERATIONAL_BADGE_CLASS.inReview,
  },
  {
    state: 'complete',
    buckets: ['complete'],
    label: 'Pending Release',
    className: PARENT_OPERATIONAL_BADGE_CLASS.complete,
    pillVariant: 'completed',
  },
]

const BUCKET_DISPLAY_ORDER: SummaryBucket[] = [
  'issue',
  'rejected',
  'pending',
  'awaitingDocs',
  'inReview',
  'inProgress',
  'complete',
  'canceled',
]

function formatBucketLabel(bucket: SummaryBucket, count: number): string {
  switch (bucket) {
    case 'issue':
      return count === 1 ? '1 Issue' : `${count} Issues`
    case 'rejected':
      return count === 1 ? '1 Rejected' : `${count} Rejected`
    case 'pending':
      return count === 1 ? '1 Pending' : `${count} Pending`
    case 'awaitingDocs':
      return count === 1 ? '1 Awaiting Document' : `${count} Awaiting Documents`
    case 'inReview':
      return count === 1 ? '1 In Review' : `${count} In Review`
    case 'inProgress':
      return count === 1 ? '1 In Progress' : `${count} In Progress`
    case 'complete':
      return count === 1 ? '1 Pending Release' : `${count} Pending Release`
    case 'canceled':
      return count === 1 ? '1 Declined' : `${count} Declined`
  }
}

function chipClassName(bucket: SummaryBucket): string {
  switch (bucket) {
    case 'issue':
    case 'pending':
      return CHIP_ATTENTION
    case 'rejected':
      return CHIP_REJECT
    case 'awaitingDocs':
      return AWAITING_DOCUMENTS_PILL
    case 'inReview':
    case 'inProgress':
      return CHIP_PIPELINE
    case 'complete':
      return CHIP_COMPLETE
    default:
      return CHIP_NEUTRAL
  }
}

/**
 * Single operational state for collapsed parent rows — answers “what needs attention most?”
 * Priority: rejected/NIGO → needs attention → awaiting documents → in review → complete.
 */
export function deriveParentOperationalSummary(
  allChildRows: ActionRow[],
): ParentOperationalSummary | null {
  if (allChildRows.length === 0) return null

  const counts = countBuckets(allChildRows)
  const canceledOnly =
    (counts.get('canceled') ?? 0) > 0 &&
    [...counts.entries()].every(([b, n]) => b === 'canceled' || n === 0)

  if (canceledOnly) {
    return {
      state: 'canceled',
      label: 'Declined',
      className: PARENT_OPERATIONAL_BADGE_CLASS.canceled,
      pillVariant: 'declined',
    }
  }

  for (const tier of PARENT_OPERATIONAL_TIERS) {
    if (bucketTotal(counts, tier.buckets) === 0) continue
    return {
      state: tier.state,
      label: tier.label,
      className: tier.className,
      pillVariant: tier.pillVariant,
    }
  }

  return null
}

/**
 * Muted composition line for expanded journey metadata (e.g. "1 in review · 3 complete").
 * Returns null when empty or a single bucket (parent Status badge is sufficient).
 */
export function formatWorkflowBreakdownLine(allChildRows: ActionRow[]): string | null {
  const chips = buildWorkflowBreakdownChips(allChildRows)
  if (chips.length <= 1) return null
  return chips.map((c) => c.label).join(' · ')
}

/** Full workflow composition chips — for expanded metadata. */
export function buildWorkflowBreakdownChips(allChildRows: ActionRow[]): WorkflowSummaryChip[] {
  if (allChildRows.length === 0) return []

  const counts = countBuckets(allChildRows)
  return BUCKET_DISPLAY_ORDER.filter((b) => (counts.get(b) ?? 0) > 0).map((bucket) => {
    const count = counts.get(bucket) ?? 0
    return {
      key: bucket,
      label: formatBucketLabel(bucket, count),
      className: chipClassName(bucket),
    }
  })
}
