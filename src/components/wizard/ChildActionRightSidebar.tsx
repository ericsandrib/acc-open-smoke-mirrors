import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChildActionContext, useWorkflow, getChildReviewState } from '@/stores/workflowStore'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'

type Tab = 'activity' | 'details' | 'comments'

export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()
  const { collapsed, setCollapsed } = useWizardRightPanel()
  const [activeTab, setActiveTab] = useState<Tab>('activity')

  if (!ctx) return null

  if (collapsed) {
    return (
      <div className="flex flex-col shrink-0 w-9 border-l border-border bg-sidebar-background items-center py-2 min-h-0 h-full">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(false)}
          aria-label="Expand panel"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    )
  }

  const reviewState = getChildReviewState(state, ctx.child.id)

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-sidebar-background flex flex-col min-h-0 h-full">
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 mr-1"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse panel"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
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
    </aside>
  )
}
