import { useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useChildActionContext, useWorkflow, getChildReviewState } from '@/stores/workflowStore'
import {
  useWizardRightPanel,
  type WizardRightPanelTab,
  WIZARD_RIGHT_RAIL_WIDTH_CLASS,
} from '@/components/wizard/wizardRightPanelContext'
import { ChildActionTimeline } from '@/components/wizard/ChildActionTimelineSheet'
import { JourneySupportingDocumentsPanel } from '@/components/wizard/JourneySupportingDocumentsPanel'

const TAB_ORDER_FULL: WizardRightPanelTab[] = ['details', 'activity', 'comments', 'documents']

const TAB_META: Record<WizardRightPanelTab, { label: string }> = {
  details: { label: 'Info' },
  activity: { label: 'Activity' },
  comments: { label: 'Comments' },
  documents: { label: 'Documents' },
}

/**
 * Collapse animation matches the main journey right rail: width + border
 * transition together, content opacity fades with a delay only when opening.
 * Toggle lives in the wizard accessory bar (`RightSidebarToggle`) — this panel
 * doesn't render its own. The Documents tab is shown only when `demoViewMode`
 * is a reviewer mode (set and not `advisor`).
 */
export function ChildActionRightSidebar() {
  const ctx = useChildActionContext()
  const { state } = useWorkflow()
  const { collapsed, activeTab, setActiveTab } = useWizardRightPanel()

  const showDocumentsTab =
    state.demoViewMode != null && state.demoViewMode !== 'advisor'

  const tabOrder = useMemo(
    () =>
      showDocumentsTab
        ? TAB_ORDER_FULL
        : TAB_ORDER_FULL.filter((t) => t !== 'documents'),
    [showDocumentsTab],
  )

  useEffect(() => {
    if (!showDocumentsTab && activeTab === 'documents') {
      setActiveTab('details')
    }
  }, [showDocumentsTab, activeTab, setActiveTab])

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
          {tabOrder.map((tab) => {
            const { label } = TAB_META[tab]
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
          className={cn(
            'flex flex-1 min-h-0 flex-col',
            activeTab === 'activity' ? 'overflow-y-auto p-4' : 'overflow-hidden p-4',
            showDocumentsTab && activeTab === 'documents' && 'overflow-hidden p-0',
          )}
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
          {activeTab === 'details' && (
            <p className="text-sm text-muted-foreground">No details available.</p>
          )}
          {activeTab === 'comments' && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          {showDocumentsTab && activeTab === 'documents' && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-2">
              <JourneySupportingDocumentsPanel />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
