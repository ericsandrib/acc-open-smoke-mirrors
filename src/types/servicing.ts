import type { TaskStatus } from './workflow'

export type JourneyStatus = 'not_started' | 'in_progress' | 'complete' | 'cancelled'

export interface JourneyTask {
  id: string
  actionId: string
  journeyId: string
  title: string
  status: TaskStatus
  assignedTo: string
}

export interface JourneyAction {
  id: string
  journeyId: string
  title: string
  status: JourneyStatus
  tasks: JourneyTask[]
}

export interface Journey {
  id: string
  name: string
  relationshipName: string
  status: JourneyStatus
  createdAt: string
  assignedTo: string
  actions: JourneyAction[]
}
