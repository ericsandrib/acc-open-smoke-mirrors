import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/workflow'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
}

export function KycChildNode({ data }: NodeProps) {
  const status = data.status as TaskStatus

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm w-full">
      <Handle type="target" position={Position.Left} className="!bg-blue-300" />
      <div className="text-xs font-medium text-blue-900">{data.label as string}</div>
      <Badge className={`text-[10px] px-1.5 py-0 mt-1 ${statusColors[status]}`} variant="secondary">
        {status.replace('_', ' ')}
      </Badge>
      <Handle type="source" position={Position.Right} className="!bg-blue-300" />
    </div>
  )
}
