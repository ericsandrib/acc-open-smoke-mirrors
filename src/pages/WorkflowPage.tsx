import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflow } from '@/stores/workflowStore'
import { workflowToFlow } from '@/components/workflow/workflowToFlow'
import { ActionGroupNode } from '@/components/workflow/ActionGroupNode'
import { TaskNode } from '@/components/workflow/TaskNode'
import { KycChildNode } from '@/components/workflow/KycChildNode'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const nodeTypes: NodeTypes = {
  actionGroupNode: ActionGroupNode,
  taskNode: TaskNode,
  kycChildNode: KycChildNode,
}

export function WorkflowPage() {
  const { state } = useWorkflow()
  const navigate = useNavigate()
  const { nodes, edges } = useMemo(() => workflowToFlow(state), [state])

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wizard')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Wizard
          </Button>
          <h1 className="text-sm font-semibold">Workflow Viewer</h1>
        </div>
        <ThemeToggle />
      </header>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
