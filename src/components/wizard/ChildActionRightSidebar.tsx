import { useChildActionContext } from '@/stores/workflowStore'
import { SmartDocumentsPanel } from '@/components/wizard/SmartDocumentsPanel'
import { ChildActionDetailSidebar } from '@/components/wizard/ChildActionDetailSidebar'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'

export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()

  if (!ctx) return null

  const timelineSection = (
    <div className="px-4 py-4 border-b border-border">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Summary
      </h3>
      <ChildActionTimeline
        childType={ctx.child.childType}
        status={ctx.child.status}
        compact
      />
    </div>
  )

  if (
    ctx.child.childType === 'account-opening' ||
    ctx.child.childType === 'funding-line' ||
    ctx.child.childType === 'feature-service-line'
  ) {
    return (
      <aside className="w-80 shrink-0 border-l border-border flex flex-col min-h-0 min-w-0 bg-sidebar-background">
        {timelineSection}
        <div className="flex-1 overflow-y-auto">
          <SmartDocumentsPanel />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 border-l border-border bg-sidebar-background flex flex-col min-h-0">
      {timelineSection}
      <div className="flex-1 overflow-y-auto">
        <ChildActionDetailSidebar />
      </div>
    </aside>
  )
}
