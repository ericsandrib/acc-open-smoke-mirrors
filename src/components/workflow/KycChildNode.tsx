import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/workflow'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'bg-fill-neutral-secondary text-text-secondary',
  in_progress: 'bg-fill-category1-tertiary text-text-category1-primary',
  complete: 'bg-fill-success-tertiary text-text-success-primary',
  blocked: 'bg-fill-danger-tertiary text-text-danger-primary',
}

export function KycChildNode({ data }: NodeProps) {
  const status = data.status as TaskStatus

  return (
    <div className="bg-fill-category1-tertiary border border-border-category1-primary rounded-lg px-4 py-2 shadow-sm w-full">
      <Handle type="target" position={Position.Left} className="!bg-fill-category1-secondary" />
      <div className="text-xs font-medium text-text-category1-primary">{data.label as string}</div>
      <Badge className={`text-[10px] px-1.5 py-0 mt-1 ${statusColors[status]}`} variant="secondary">
        {status.replace('_', ' ')}
      </Badge>
      <Handle type="source" position={Position.Right} className="!bg-fill-category1-secondary" />
    </div>
  )
}
