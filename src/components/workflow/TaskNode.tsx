import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/workflow'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'bg-fill-neutral-secondary text-text-secondary',
  in_progress: 'bg-fill-category1-tertiary text-text-category1-primary',
  complete: 'bg-fill-success-tertiary text-text-success-primary',
  blocked: 'bg-fill-danger-tertiary text-text-danger-primary',
}

export function TaskNode({ data }: NodeProps) {
  const status = data.status as TaskStatus

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-sm w-full">
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="text-sm font-medium text-card-foreground">{data.label as string}</div>
      <div className="flex items-center justify-between mt-1 gap-2">
        <span className="text-[10px] text-muted-foreground">{data.assignedTo as string}</span>
        <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[status]}`} variant="secondary">
          {status.replace('_', ' ')}
        </Badge>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
}
