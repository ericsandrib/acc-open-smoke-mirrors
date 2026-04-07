import { useChildActionContext } from '@/stores/workflowStore'
import { SmartDocumentsPanel } from '@/components/wizard/SmartDocumentsPanel'
import { ChildActionDetailSidebar } from '@/components/wizard/ChildActionDetailSidebar'
import { MissingDataSection } from '@/components/wizard/MissingDataSection'
import { cn } from '@/lib/utils'

/**
 * Account-opening (and funding / feature): Details / Context / Owners, then missing data, then documents.
 * KYC: Details tabs, then missing data (no documents rail).
 */
export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()

  if (!ctx) return null

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
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        <ChildActionDetailSidebar variant="embedded" embeddedLayout="fill" />
      </div>
      {missingRail('border-t border-border')}
    </aside>
  )
}
