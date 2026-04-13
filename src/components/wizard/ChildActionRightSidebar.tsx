import { CollapsibleRightPanel } from '@/components/wizard/CollapsibleRightPanel'
import { useChildActionContext, useWorkflow, getChildReviewState } from '@/stores/workflowStore'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'

export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()

  if (!ctx) return null

  return (
    <CollapsibleRightPanel title="Summary">
      <ChildActionTimeline
        childType={ctx.child.childType}
        status={ctx.child.status}
        compact
        reviewState={getChildReviewState(state, ctx.child.id)}
      />
    </CollapsibleRightPanel>
  )
}
