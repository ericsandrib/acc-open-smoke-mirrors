import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useChildActionContext, useWorkflow, getChildReviewState } from '@/stores/workflowStore'
import {
  useWizardRightPanel,
  type WizardRightPanelTab,
  WIZARD_RIGHT_RAIL_WIDTH_CLASS,
} from '@/components/wizard/wizardRightPanelContext'
import { ChildActionDetailsPanel } from '@/components/wizard/ChildActionDetailsPanel'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'
import {
  handleWizardIsolatedPanelShellWheel,
  handleWizardIsolatedScrollPaneWheel,
} from '@/utils/wizardScroll'

const CHILD_TAB_ORDER = ['details', 'comments', 'activity'] as const satisfies readonly WizardRightPanelTab[]

const CHILD_TAB_META: Record<(typeof CHILD_TAB_ORDER)[number], { label: string }> = {
  details: { label: 'Details' },
  comments: { label: 'Comments' },
  activity: { label: 'Activity' },
}

/**
 * Collapse animation matches the main journey right rail: width + border
 * transition together, content opacity fades with a delay only when opening.
 * Toggle lives in the wizard accessory bar (`RightSidebarToggle`) — this panel
 * doesn't render its own.
 */
export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()
  const { collapsed, activeTab, setActiveTab } = useWizardRightPanel()

  useEffect(() => {
    if (activeTab === 'documents') {
      setActiveTab('details')
    }
  }, [activeTab, setActiveTab])

  if (!ctx) return null

  const reviewState = getChildReviewState(state, ctx.child.id)

  return (
    <aside
      id="wizard-right-panel"
      className={cn(
        'shrink-0 overflow-hidden bg-white border-l border-l-transparent flex flex-col min-h-0 h-full',
        'transition-[width,border-color] duration-200 ease-out motion-reduce:transition-none',
        collapsed ? 'w-0' : cn(WIZARD_RIGHT_RAIL_WIDTH_CLASS, 'border-l-border'),
      )}
      aria-label="Application details"
      aria-hidden={collapsed}
      onWheel={handleWizardIsolatedPanelShellWheel}
    >
      <div
        className={cn(
          'flex flex-col min-h-0 h-full transition-opacity duration-150 ease-out motion-reduce:transition-none',
          WIZARD_RIGHT_RAIL_WIDTH_CLASS,
          collapsed ? 'opacity-0' : 'opacity-100 delay-200',
        )}
      >
        <div
          className="flex h-14 shrink-0 flex-nowrap items-center gap-1 overflow-x-auto border-b border-border px-3"
          role="tablist"
          aria-label="Right panel"
        >
          {CHILD_TAB_ORDER.map((tab) => {
            const { label } = CHILD_TAB_META[tab]
            const selected = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={label}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0',
                  selected
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div
          data-wizard-scroll-pane
          className={cn(
            'flex flex-1 min-h-0 flex-col overscroll-y-contain',
            activeTab === 'activity'
              ? 'overflow-y-auto p-4'
              : activeTab === 'details'
                ? 'overflow-y-auto p-3'
                : 'overflow-hidden p-4',
          )}
          onWheel={handleWizardIsolatedScrollPaneWheel}
        >
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
          {activeTab === 'details' && <ChildActionDetailsPanel />}
          {activeTab === 'comments' && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
