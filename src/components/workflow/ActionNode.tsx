import { Handle, Position, type NodeProps } from '@xyflow/react'

export function ActionNode({ data }: NodeProps) {
  return (
    <div className="bg-primary text-primary-foreground rounded-lg px-6 py-3 shadow-md min-w-[180px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-primary-foreground" />
      <span className="text-sm font-semibold">{data.label as string}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-primary-foreground" />
    </div>
  )
}
