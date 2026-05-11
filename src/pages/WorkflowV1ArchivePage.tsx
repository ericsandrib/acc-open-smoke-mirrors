import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArchiveRestore, ArrowLeft } from 'lucide-react'
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

/**
 * V1 workflow viewer — archived. Identical to the old /workflow page but
 * with a deprecation banner so anyone landing here knows the V2 model is
 * the active spec.
 */

const nodeTypes: NodeTypes = {
  actionGroupNode: ActionGroupNode,
  taskNode: TaskNode,
  kycChildNode: KycChildNode,
}

export function WorkflowV1ArchivePage() {
  const { state } = useWorkflow()
  const { nodes, edges } = useMemo(() => workflowToFlow(state), [state])

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-amber-50 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <ArchiveRestore className="h-4 w-4 text-amber-700" />
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 items-center rounded bg-amber-200 px-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
                  Archived — V1
                </span>
                <h1 className="text-sm font-semibold text-foreground">
                  Account opening workflow (Guardian-shaped, pre-RIA-segment)
                </h1>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                The active workflow spec is V2 at <Link to="/workflow" className="underline">/workflow</Link>. This view is preserved for reference.
              </p>
            </div>
          </div>
          <Link
            to="/workflow"
            className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go to V2
          </Link>
        </div>
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
