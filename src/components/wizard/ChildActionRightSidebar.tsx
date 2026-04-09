import { useChildActionContext, useWorkflow } from '@/stores/workflowStore'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'

export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()

  if (!ctx) return null

  return (
    <aside className="w-64 shrink-0 border-l border-border bg-sidebar-background flex flex-col min-h-0 h-full">
      <div className="px-4 py-4 flex-1 overflow-y-auto min-h-0">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Summary
        </h3>
        <ChildActionTimeline
          childType={ctx.child.childType}
          status={ctx.child.status}
          compact
          reviewState={state.childReviewState}
        />
      </div>
    </aside>
  )
}
