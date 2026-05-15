import type { TaskStatus } from '@/types/workflow'
import type { JourneyStatus } from '@/types/servicing'
import { OperationalStatusPill } from './operationalStatusPill'

export function StatusBadge({ status }: { status: TaskStatus | JourneyStatus }) {
  return <OperationalStatusPill status={status} />
}
