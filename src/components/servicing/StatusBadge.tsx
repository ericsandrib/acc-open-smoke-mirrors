import type { TaskStatus } from '@/types/workflow'
import type { JourneyStatus } from '@/types/servicing'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: {
    label: 'Not Started',
    className: 'bg-fill-neutral-secondary text-text-secondary border-border-primary',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-fill-category1-tertiary text-text-category1-primary border-border-category1-primary',
  },
  complete: {
    label: 'Complete',
    className: 'bg-fill-success-tertiary text-text-success-primary border-border-success-primary',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-fill-danger-tertiary text-text-danger-primary border-border-danger-primary',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-fill-neutral-secondary text-text-tertiary border-border-primary',
  },
}

export function StatusBadge({ status }: { status: TaskStatus | JourneyStatus }) {
  const config = statusConfig[status] ?? statusConfig.not_started
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
