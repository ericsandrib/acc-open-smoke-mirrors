import { useChildActionContext } from '@/stores/workflowStore'
import { SmartDocumentsPanel } from '@/components/wizard/SmartDocumentsPanel'
import { ChildActionDetailSidebar } from '@/components/wizard/ChildActionDetailSidebar'

/**
 * Account-opening uses a persistent Documents rail; KYC keeps the legacy detail sidebar.
 */
export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()

  if (!ctx) return null

  if (ctx.child.childType === 'account-opening') {
    return (
      <aside className="w-80 shrink-0 border-l border-border flex flex-col min-h-0 min-w-0 bg-sidebar-background">
        <SmartDocumentsPanel />
      </aside>
    )
  }

  return <ChildActionDetailSidebar />
}
