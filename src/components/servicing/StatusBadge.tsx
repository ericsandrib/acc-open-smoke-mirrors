import type { TaskStatus } from '@/types/workflow'
import type { JourneyStatus } from '@/types/servicing'
import { OperationalStatusPill } from './operationalStatusPill'
import { getStatusSemanticClasses } from '@/utils/statusSemanticColors'

const JOURNEY_WORKFLOW_CLASS_BY_STATUS: Partial<Record<TaskStatus | JourneyStatus, string>> = {
  not_started: getStatusSemanticClasses('success').pill,
  in_progress: getStatusSemanticClasses('success').pill,
  awaiting_review: getStatusSemanticClasses('success').pill,
  complete: getStatusSemanticClasses('neutral').pill,
  blocked: getStatusSemanticClasses('danger').pill,
  rejected: getStatusSemanticClasses('danger').pill,
  canceled: getStatusSemanticClasses('danger').pill,
  cancelled: getStatusSemanticClasses('danger').pill,
}

export function StatusBadge({
  status,
  iconPosition,
  scheme = 'default',
}: {
  status: TaskStatus | JourneyStatus
  iconPosition?: 'left' | 'right'
  scheme?: 'default' | 'journeyWorkflow'
}) {
  const className =
    scheme === 'journeyWorkflow' ? JOURNEY_WORKFLOW_CLASS_BY_STATUS[status] : undefined

  return (
    <OperationalStatusPill
      status={status}
      iconPosition={iconPosition}
      className={className}
    />
  )
}
