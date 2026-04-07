import { useChildActionContext, useWorkflow } from '@/stores/workflowStore'
import { SmartDocumentsPanel } from '@/components/wizard/SmartDocumentsPanel'
import { ChildActionDetailSidebar } from '@/components/wizard/ChildActionDetailSidebar'
import { MissingDataSection } from '@/components/wizard/MissingDataSection'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'
import { cn } from '@/lib/utils'

export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()

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
        reviewState={state.childReviewState}
      />
    </div>
  )

  function missingRail(className?: string) {
    return (
      <div className={cn('shrink-0 p-3 bg-sidebar-background', className)}>
        <MissingDataSection variant="compact" />
      </div>
    )
  }

  if (
    ctx.child.childType === 'account-opening' ||
    ctx.child.childType === 'funding-line' ||
    ctx.child.childType === 'feature-service-line'
  ) {
    return (
      <aside className="w-80 shrink-0 border-l border-border flex flex-col min-h-0 min-w-0 h-full bg-sidebar-background">
        {timelineSection}
        <ChildActionDetailSidebar variant="embedded" embeddedLayout="docsRail" />
        {missingRail('border-t border-b border-border')}
        <div className="flex-1 min-h-0 flex flex-col">
          <SmartDocumentsPanel showStepFooter={false} />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 shrink-0 border-l border-border bg-sidebar-background flex flex-col min-h-0 h-full">
      {timelineSection}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        <ChildActionDetailSidebar variant="embedded" embeddedLayout="fill" />
      </div>
      {missingRail('border-t border-border')}
    </aside>
  )
}
