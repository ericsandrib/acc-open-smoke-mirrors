import type { TaskStatus } from './workflow'

export type JourneyStatus = 'not_started' | 'in_progress' | 'complete' | 'cancelled' | 'awaiting_review' | 'rejected'

export interface JourneyTask {
  id: string
  actionId: string
  journeyId: string
  title: string
  status: TaskStatus
  assignedTo: string
  isSubTask?: boolean
  nickname?: string
  /** Servicing dashboard display: person responsible for this task (defaults to assignedTo). */
  taskOwner?: string
  /** Servicing dashboard display: next-step date, pre-formatted (e.g. "Nov 12, 2025"). */
  nextStep?: string
  /** Servicing dashboard display: ready-to-begin date, pre-formatted. */
  readyToBegin?: string
}

export interface JourneyAction {
  id: string
  journeyId: string
  title: string
  status: JourneyStatus
  displayStatus?: string
  nickname?: string
  parentActionId?: string
  /** When set, this action is a group header (e.g. 'funding' or 'feature-service') */
  groupType?: 'funding' | 'feature-service'
  /** Original workflow child ID (before journey/action prefix) */
  childId?: string
  /** Servicing dashboard display: action category (e.g. "Account Opening", "Move Money"). */
  category?: string
  /** Servicing dashboard display: short numeric action identifier (e.g. "002431"). */
  actionCode?: string
  /** Servicing dashboard display: human-readable action description (custodian / registration). */
  description?: string
  tasks: JourneyTask[]
}

export type JourneyCategory = 'Onboarding' | 'Account Transfer' | 'Investment Review' | 'Tax Planning' | 'Consolidation' | 'Estate Planning'

export interface Journey {
  id: string
  name: string
  category: JourneyCategory
  relationshipName: string
  status: JourneyStatus
  createdAt: string
  assignedTo: string
  createdBy: string
  actions: JourneyAction[]
}
