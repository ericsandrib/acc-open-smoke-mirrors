import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useChildActionContext, useWorkflow, getChildReviewState } from '@/stores/workflowStore'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'

type Tab = 'activity' | 'details' | 'comments'

/**
 * Mirrors {@link CollapsibleRightPanel}'s collapse animation: width + border
 * transition together, content opacity fades with a delay only when opening.
 * Toggle lives in the wizard accessory bar (`RightSidebarToggle`) — this panel
 * doesn't render its own.
 */
export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()
  const { collapsed } = useWizardRightPanel()
  const [activeTab, setActiveTab] = useState<Tab>('activity')

  if (!ctx) return null

  const reviewState = getChildReviewState(state, ctx.child.id)

  return (
    <aside
      id="wizard-right-panel"
      className={cn(
        'shrink-0 overflow-hidden bg-white border-l border-l-transparent flex flex-col min-h-0 h-full',
        'transition-[width,border-color] duration-200 ease-out motion-reduce:transition-none',
        collapsed ? 'w-0' : 'w-72 border-l-border',
      )}
      aria-label="Application details"
      aria-hidden={collapsed}
    >
      <div
        className={cn(
          'flex flex-col w-72 min-h-0 h-full transition-opacity duration-150 ease-out motion-reduce:transition-none',
          collapsed ? 'opacity-0' : 'opacity-100 delay-200',
        )}
      >
        <div className="flex items-center border-b border-border shrink-0">
          <div className="flex flex-1">
            {(['activity', 'details', 'comments'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-2.5 text-sm capitalize transition-colors',
                  activeTab === tab
                    ? 'font-semibold text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {activeTab === 'activity' && (
            <>
              <h3 className="text-sm font-semibold mb-4">Application timeline</h3>
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
