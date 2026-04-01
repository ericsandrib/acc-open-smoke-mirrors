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
  { key: 'title', label: 'Action Type', filterable: 'multi-select' },
  { key: 'journeyName', label: 'Journey', filterable: 'text' },
  { key: 'relationshipName', label: 'Relationship', filterable: 'text' },
  { key: 'status', label: 'Status', filterable: 'multi-select' },
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
