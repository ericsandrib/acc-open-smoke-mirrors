export type TaskStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked'

export interface Task {
  id: string
  title: string
  actionId: string
  status: TaskStatus
  assignedTo: string
  formKey: string
  order: number
  children?: KycChild[]
}

export interface KycChild {
  id: string
  name: string
  status: TaskStatus
  formKey: string
}

export interface Action {
  id: string
  title: string
  order: number
}

export interface WorkflowState {
  actions: Action[]
  tasks: Task[]
  activeTaskId: string
  flatTaskOrder: string[]
}

export type WorkflowAction =
  | { type: 'SET_ACTIVE_TASK'; taskId: string }
  | { type: 'SET_TASK_STATUS'; taskId: string; status: TaskStatus }
  | { type: 'SPAWN_KYC_CHILD'; parentTaskId: string; childName: string }
  | { type: 'REMOVE_KYC_CHILD'; parentTaskId: string; childId: string }
  | { type: 'GO_NEXT' }
  | { type: 'GO_BACK' }
