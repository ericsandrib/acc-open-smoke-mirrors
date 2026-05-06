import { cn } from '@/lib/utils'
import { useChildActionContext, useWorkflow, getChildReviewState } from '@/stores/workflowStore'
import {
  useWizardRightPanel,
  type WizardRightPanelTab,
} from '@/components/wizard/wizardRightPanelContext'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'

const TAB_ORDER: WizardRightPanelTab[] = ['details', 'activity', 'comments']

/**
 * Mirrors {@link CollapsibleRightPanel}'s collapse animation: width + border
 * transition together, content opacity fades with a delay only when opening.
 * Toggle lives in the wizard accessory bar (`RightSidebarToggle`) — this panel
 * doesn't render its own.
 */
export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()
  const { collapsed, activeTab, setActiveTab } = useWizardRightPanel()

  if (!ctx) return null

  const reviewState = getChildReviewState(state, ctx.child.id)

  return (
    <aside
      id="wizard-right-panel"
      className={cn(
        'shrink-0 overflow-hidden bg-white border-l border-l-transparent flex flex-col min-h-0 h-full',
        'transition-[width,border-color] duration-200 ease-out motion-reduce:transition-none',
        collapsed ? 'w-0' : 'w-[330px] border-l-border',
      )}
      aria-label="Application details"
      aria-hidden={collapsed}
    >
      <div
        className={cn(
          'flex flex-col w-[330px] min-h-0 h-full transition-opacity duration-150 ease-out motion-reduce:transition-none',
          collapsed ? 'opacity-0' : 'opacity-100 delay-200',
        )}
      >
        <div className="flex h-14 items-center gap-1 border-b border-border px-3 shrink-0">
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {activeTab === 'activity' && (
            <>
              <h3 className="text-sm font-semibold mb-4">Application activity</h3>
              <ChildActionTimeline
                childType={ctx.child.childType}
                status={ctx.child.status}
                reviewState={reviewState ?? undefined}
              />
            </>
          )}
          {activeTab === 'details' && (
            <p className="text-sm text-muted-foreground">No details available.</p>
          )}
          {activeTab === 'comments' && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
