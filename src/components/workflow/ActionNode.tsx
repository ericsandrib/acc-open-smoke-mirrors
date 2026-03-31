import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/workflow'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
}

export function ActionNode({ data }: NodeProps) {
  const status = data.status as TaskStatus

  return (
    <div className="bg-primary text-primary-foreground rounded-lg px-6 py-3 shadow-md min-w-[180px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-primary-foreground" />
      <span className="text-sm font-semibold">{data.label as string}</span>
      {status && (
        <div className="mt-1">
          <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[status]}`} variant="secondary">
            {statusLabels[status]}
          </Badge>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary-foreground" />
    </div>
  )
}
