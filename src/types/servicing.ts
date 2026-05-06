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
