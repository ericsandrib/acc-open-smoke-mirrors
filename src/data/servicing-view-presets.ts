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
    filters: [{ column: 'assignedTo', operator: 'equals', value: 'Greta Fure' }],
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
// Ordered to match the Servicing → Actions view: Relationship · Category ·
// Action ID · Action Description · Action Nickname.
export const actionColumns: ColumnDef[] = [
  { key: 'relationshipName', label: 'Relationship', filterable: 'text' },
  { key: 'category', label: 'Category', filterable: 'multi-select' },
  { key: 'actionCode', label: 'Action ID' },
  { key: 'description', label: 'Action Description', filterable: 'text' },
  { key: 'nickname', label: 'Action Nickname', alwaysVisible: true },
  // Available via Display (hidden by default to mirror the reference UI):
  { key: 'title', label: 'Action Type', filterable: 'multi-select' },
  { key: 'status', label: 'Status', filterable: 'multi-select' },
  { key: 'assignedTo', label: 'Assigned To', filterable: 'multi-select' },
  { key: 'tasksComplete', label: 'Tasks Complete' },
]

const defaultActionCols = ['relationshipName', 'category', 'actionCode', 'description', 'nickname']

export const actionPresets: ViewPreset[] = [
  {
    id: 'actions-all',
    name: 'All',
    category: 'pinned',
    isDefault: true,
    filters: [],
    visibleColumns: defaultActionCols,
  },
  {
    id: 'actions-account-opening',
    name: 'Account Opening',
    category: 'pinned',
    filters: [{ column: 'category', operator: 'equals', value: 'Account Opening' }],
    visibleColumns: defaultActionCols,
  },
  {
    id: 'actions-in-progress',
    name: 'In Progress',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'in_progress' }],
    visibleColumns: [...defaultActionCols, 'status'],
  },
  {
    id: 'actions-completed',
    name: 'Completed',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'complete' }],
    visibleColumns: [...defaultActionCols, 'status'],
  },
  {
    id: 'actions-awaiting-review',
    name: 'Awaiting Review',
    category: 'personal',
    filters: [{ column: 'status', operator: 'equals', value: 'awaiting_review' }],
    visibleColumns: [...defaultActionCols, 'status'],
  },
  {
    id: 'actions-mine',
    name: 'My Actions',
    category: 'personal',
    filters: [{ column: 'assignedTo', operator: 'contains', value: 'Greta Fure' }],
    visibleColumns: defaultActionCols,
  },
]

// ── Task columns ────────────────────────────────────────────────────
// Ordered to match the Servicing → Tasks view: Relationship · Task ·
// Task Owner · Status · Next Step. (Complexity Level intentionally omitted.)
export const taskColumns: ColumnDef[] = [
  { key: 'relationshipName', label: 'Relationship', filterable: 'text' },
  { key: 'category', label: 'Category', filterable: 'multi-select' },
  { key: 'actionCode', label: 'Action ID' },
  { key: 'description', label: 'Action Description', filterable: 'text' },
  { key: 'nickname', label: 'Action Nickname' },
  { key: 'title', label: 'Task', alwaysVisible: true },
  { key: 'taskOwner', label: 'Task Owner', filterable: 'multi-select' },
  { key: 'readyToBegin', label: 'Ready to Begin' },
  { key: 'due', label: 'Due' },
  { key: 'begin', label: 'Begin' },
  // Available via Display (hidden by default to mirror the reference UI):
  { key: 'status', label: 'Status', filterable: 'multi-select' },
  { key: 'nextStep', label: 'Next Step' },
  { key: 'actionTitle', label: 'Action Type', filterable: 'multi-select' },
  { key: 'journeyName', label: 'Journey', filterable: 'text' },
]

const defaultTaskCols = ['relationshipName', 'category', 'actionCode', 'description', 'title', 'taskOwner', 'readyToBegin', 'due', 'begin']

export const taskPresets: ViewPreset[] = [
  {
    id: 'tasks-all',
    name: 'All',
    category: 'pinned',
    isDefault: true,
    filters: [],
    visibleColumns: defaultTaskCols,
  },
  {
    id: 'tasks-in-progress',
    name: 'In Progress',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'in_progress' }],
    visibleColumns: defaultTaskCols,
  },
  {
    id: 'tasks-ready',
    name: 'Ready to Begin',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'not_started' }],
    visibleColumns: defaultTaskCols,
  },
  {
    id: 'tasks-completed',
    name: 'Completed',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'complete' }],
    visibleColumns: defaultTaskCols,
  },
  {
    id: 'tasks-blocked',
    name: 'Blocked',
    category: 'pinned',
    filters: [{ column: 'status', operator: 'equals', value: 'blocked' }],
    visibleColumns: defaultTaskCols,
  },
  {
    id: 'tasks-mine',
    name: 'My Tasks',
    category: 'personal',
    filters: [{ column: 'assignedTo', operator: 'equals', value: 'Greta Fure' }],
    visibleColumns: defaultTaskCols,
  },
]
