import type { ColumnDef, ViewPreset } from '@/types/view-preset'

// ── Journey columns ─────────────────────────────────────────────────
export const journeyColumns: ColumnDef[] = [
  { key: 'name', label: 'Journey', alwaysVisible: true },
  { key: 'relationshipName', label: 'Relationship', filterable: 'text' },
  { key: 'status', label: 'Status', filterable: 'multi-select' },
  { key: 'assignedTo', label: 'Assigned To', filterable: 'multi-select' },
  { key: 'createdAt', label: 'Created' },
  { key: 'progress', label: 'Progress' },
]

const allJourneyCols = journeyColumns.map((c) => c.key)

export const journeyPresets: ViewPreset[] = [
  {
    id: 'journeys-all',
    name: 'All',
    category: 'pinned',
    isDefault: true,
    filters: [],
    visibleColumns: allJourneyCols,
  },
  {
    id: 'journeys-in-progress',
    name: 'In Progress',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'in_progress' }],
    visibleColumns: allJourneyCols,
  },
  {
    id: 'journeys-completed',
    name: 'Completed',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'complete' }],
    visibleColumns: allJourneyCols,
  },
  {
    id: 'journeys-not-started',
    name: 'Not Started',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'not_started' }],
    visibleColumns: allJourneyCols,
  },
  {
    id: 'journeys-mine',
    name: 'My Journeys',
    category: 'personal',
    filters: [{ column: 'assignedTo', operator: 'equals', value: 'Alice Chen' }],
    visibleColumns: allJourneyCols,
  },
  {
    id: 'journeys-needs-attention',
    name: 'Needs Attention',
    category: 'personal',
    filters: [{ column: 'status', operator: 'includes', value: ['in_progress', 'not_started'] }],
    visibleColumns: ['name', 'relationshipName', 'status', 'assignedTo', 'progress'],
  },
]

// ── Action columns ──────────────────────────────────────────────────
export const actionColumns: ColumnDef[] = [
  { key: 'nickname', label: 'Action Nickname', alwaysVisible: true },
  { key: 'reviewQueueItemType', label: 'Type', filterable: 'multi-select' },
  { key: 'title', label: 'Action Type', filterable: 'multi-select' },
  { key: 'journeyName', label: 'Journey', filterable: 'text' },
  { key: 'relationshipName', label: 'Relationship', filterable: 'text' },
  { key: 'status', label: 'Status', filterable: 'multi-select' },
  { key: 'stateModelStatus', label: 'Review Status', filterable: 'multi-select' },
  /** RBAC/ABAC routing lane for reviewer demo queues (not shown by default). */
  { key: 'reviewerQueueLane', label: 'Work queue', filterable: 'multi-select' },
  { key: 'assignedTo', label: 'Assigned To', filterable: 'multi-select' },
  { key: 'tasksComplete', label: 'Tasks Complete' },
]

const allActionCols = actionColumns.map((c) => c.key)

export const actionPresets: ViewPreset[] = [
  {
    id: 'actions-all',
    name: 'All',
    category: 'pinned',
    isDefault: true,
    filters: [],
    visibleColumns: allActionCols,
  },
  {
    id: 'actions-in-progress',
    name: 'In Progress',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'in_progress' }],
    visibleColumns: allActionCols,
  },
  {
    id: 'actions-completed',
    name: 'Completed',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'complete' }],
    visibleColumns: allActionCols,
  },
  {
    id: 'actions-blocked',
    name: 'Blocked',
    category: 'personal',
    filters: [{ column: 'status', operator: 'equals', value: 'blocked' }],
    visibleColumns: allActionCols,
  },
  {
    id: 'actions-mine',
    name: 'My Actions',
    category: 'personal',
    filters: [{ column: 'assignedTo', operator: 'contains', value: 'Alice Chen' }],
    visibleColumns: allActionCols,
  },
]

/** Prefix for reviewer “work queue” presets (grouped nested table UI). */
export const REVIEWER_WORK_QUEUE_PRESET_PREFIX = 'actions-reviewer-queue'

export function isReviewerWorkQueuePresetId(viewId: string): boolean {
  return viewId.startsWith(REVIEWER_WORK_QUEUE_PRESET_PREFIX)
}

/** @deprecated Use {@link isReviewerWorkQueuePresetId} */
export const DOCUMENT_REVIEW_ACTION_PRESET_ID = `${REVIEWER_WORK_QUEUE_PRESET_PREFIX}-documents`

export type ReviewerQueueLane = 'aml' | 'documents' | 'principal' | 'ho-kyc' | 'none'

/** Demo perspective from workflow store (`demoViewMode`). */
type DemoViewModeForActions = 'advisor' | 'ho-documents' | 'ho-principal' | 'ho-kyc' | 'aml' | undefined

/** Map pipeline display status → reviewer lane (matches demo team views). */
export function reviewerQueueLaneForDisplayStatus(displayStatus: string | undefined): ReviewerQueueLane {
  if (!displayStatus) return 'none'
  switch (displayStatus) {
    case 'aml_review':
    case 'rejected_aml':
      return 'aml'
    case 'document_review':
    case 'nigo_document':
    case 'nigo':
    case 'awaiting_review':
    case 'awaiting_documents':
    case 'escalation_hold':
      return 'documents'
    case 'ho_kyc_review':
      return 'ho-kyc'
    case 'principal_review':
    case 'nigo_principal':
      return 'principal'
    default:
      return 'none'
  }
}

function reviewerLaneForDemoMode(mode: DemoViewModeForActions): ReviewerQueueLane {
  switch (mode) {
    case 'aml':
      return 'aml'
    case 'ho-principal':
      return 'principal'
    case 'ho-kyc':
      return 'ho-kyc'
    case 'ho-documents':
    default:
      return 'documents'
  }
}

function reviewerQueuePreset(lane: ReviewerQueueLane): ViewPreset {
  const names: Record<ReviewerQueueLane, string> = {
    aml: 'Needs Review',
    documents: 'Needs Review',
    principal: 'Needs Review',
    'ho-kyc': 'KYC Review',
    none: 'Queue',
  }
  const visible = allActionCols.filter((k) => k !== 'status' && k !== 'reviewerQueueLane')
  return {
    id: `${REVIEWER_WORK_QUEUE_PRESET_PREFIX}-${lane}`,
    name: names[lane],
    category: 'pinned',
    isDefault: true,
    filters: [{ column: 'reviewerQueueLane', operator: 'equals', value: lane }],
    visibleColumns: visible,
  }
}

/** Reviewer: default tab matches `demoViewMode` team lane; advisor sees no work-queue presets. */
export function actionPresetsForDemoView(mode: DemoViewModeForActions): ViewPreset[] {
  if ((mode ?? 'advisor') === 'advisor') {
    return actionPresets.filter((p) => !isReviewerWorkQueuePresetId(p.id))
  }
  const lane = reviewerLaneForDemoMode(mode)
  const queuePreset = reviewerQueuePreset(lane)
  const rest = actionPresets.filter((p) => !isReviewerWorkQueuePresetId(p.id)).map((p) => ({ ...p, isDefault: false }))
  return [queuePreset, ...rest]
}

// ── Task columns ────────────────────────────────────────────────────
export const taskColumns: ColumnDef[] = [
  { key: 'title', label: 'Task', alwaysVisible: true },
  { key: 'nickname', label: 'Action Nickname' },
  { key: 'actionTitle', label: 'Action Type', filterable: 'multi-select' },
  { key: 'journeyName', label: 'Journey', filterable: 'text' },
  { key: 'relationshipName', label: 'Relationship', filterable: 'text' },
  { key: 'status', label: 'Status', filterable: 'multi-select' },
  { key: 'assignedTo', label: 'Assigned To', filterable: 'multi-select' },
]

const allTaskCols = taskColumns.map((c) => c.key)

export const taskPresets: ViewPreset[] = [
  {
    id: 'tasks-all',
    name: 'All',
    category: 'pinned',
    isDefault: true,
    filters: [],
    visibleColumns: allTaskCols,
  },
  {
    id: 'tasks-in-progress',
    name: 'In Progress',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'in_progress' }],
    visibleColumns: allTaskCols,
  },
  {
    id: 'tasks-completed',
    name: 'Completed',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'complete' }],
    visibleColumns: allTaskCols,
  },
  {
    id: 'tasks-blocked',
    name: 'Blocked',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'blocked' }],
    visibleColumns: allTaskCols,
  },
  {
    id: 'tasks-mine',
    name: 'My Tasks',
    category: 'personal',
    filters: [{ column: 'assignedTo', operator: 'equals', value: 'Alice Chen' }],
    visibleColumns: allTaskCols,
  },
  {
    id: 'tasks-unassigned',
    name: 'Unassigned',
    category: 'personal',
    filters: [{ column: 'assignedTo', operator: 'equals', value: '' }],
    visibleColumns: ['title', 'actionTitle', 'journeyName', 'status'],
  },
]
