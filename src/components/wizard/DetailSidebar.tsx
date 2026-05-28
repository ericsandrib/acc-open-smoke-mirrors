import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useWizardRightPanel, WIZARD_RIGHT_RAIL_WIDTH_CLASS } from '@/components/wizard/wizardRightPanelContext'
import { JourneySupportingDocumentsPanel } from '@/components/wizard/JourneySupportingDocumentsPanel'
import { ParentActionDocumentsPanel } from '@/components/wizard/ParentActionDocumentsPanel'
import { ParentJourneyDetailsPanel } from '@/components/wizard/ParentJourneyDetailsPanel'
import { useWorkflow } from '@/stores/workflowStore'
import { parseChildSubTaskId, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import {
  handleWizardIsolatedPanelShellWheel,
  handleWizardIsolatedScrollPaneWheel,
} from '@/utils/wizardScroll'

type JourneyRailTab = 'details' | 'comments' | 'documents'

const JOURNEY_TAB_LABELS: Record<JourneyRailTab, string> = {
  details: 'Details',
  comments: 'Comments',
  documents: 'Documents',
}

function journeyTabOrder(showDocumentsTab: boolean): JourneyRailTab[] {
  return showDocumentsTab ? ['details', 'comments', 'documents'] : ['details', 'comments']
}

/**
 * Main-journey right rail: Details + Comments; Documents when reviewer-only
 * (`demoViewMode` set and not `advisor`). Activity lives on the child rail.
 */
export function DetailSidebar() {
  const { state } = useWorkflow()
  const { collapsed, activeTab, setActiveTab } = useWizardRightPanel()
  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const isOpenAccountsParentTask = activeTask?.id === 'open-accounts'

  const showDocumentsTab =
    !isOpenAccountsParentTask && state.demoViewMode != null && state.demoViewMode !== 'advisor'
  const tabOrder = journeyTabOrder(showDocumentsTab)

  useEffect(() => {
    if (activeTab === 'documents' && !showDocumentsTab) {
      setActiveTab('details')
    }
    if (activeTab === 'activity') {
      setActiveTab('details')
    }
  }, [showDocumentsTab, activeTab, setActiveTab])

  const displayTab: JourneyRailTab = tabOrder.includes(activeTab as JourneyRailTab)
    ? (activeTab as JourneyRailTab)
    : 'details'

  const activeChild = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  const parsed = parseChildSubTaskId(state.activeTaskId)
  const subTaskChild = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null
  const subTaskDef = parsed
    ? parsed.config.subTasks.find((s) => s.suffix === parsed.suffix)
    : null

  const title = activeTask?.title ?? activeChild?.name ?? ''
  const assignedTo = activeTask?.assignedTo ?? ''

  return (
    <aside
      id="wizard-right-panel"
      className={cn(
        'shrink-0 overflow-hidden bg-white border-l border-l-transparent flex flex-col min-h-0 h-full',
        'transition-[width,border-color] duration-200 ease-out motion-reduce:transition-none',
        collapsed ? 'w-0' : cn(WIZARD_RIGHT_RAIL_WIDTH_CLASS, 'border-l-border'),
      )}
      aria-label="Task details"
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
          {tabOrder.map((tab) => {
            const label = JOURNEY_TAB_LABELS[tab]
            const selected = displayTab === tab
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
            'flex flex-1 min-h-0 flex-col overscroll-y-contain text-sm',
            displayTab === 'documents'
              ? 'overflow-hidden'
              : displayTab === 'details' && isOpenAccountsParentTask
                ? 'overflow-y-auto p-3'
                : 'overflow-y-auto p-4',
          )}
          onWheel={handleWizardIsolatedScrollPaneWheel}
        >
          {displayTab === 'details' && isOpenAccountsParentTask && activeTask ? (
            <ParentJourneyDetailsPanel parentTaskId={activeTask.id} />
          ) : null}
          {displayTab === 'comments' && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          {displayTab === 'details' && !isOpenAccountsParentTask && (
            <>
              {activeTask && (
                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Task</span>
                    <p className="font-medium text-foreground">{title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Owner</span>
                    <p className="font-medium text-foreground">{assignedTo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium text-foreground capitalize">
                      {activeTask.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}
              {!activeTask && activeChild && (
                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Child Action</span>
                    <p className="font-medium text-foreground">{activeChild.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium text-foreground capitalize">
                      {activeChild.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}
              {!activeTask && !activeChild && subTaskChild && subTaskDef && parsed && (
                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">{parsed.config.displayLabel}</span>
                    <p className="font-medium text-foreground">{subTaskChild.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Task</span>
                    <p className="font-medium text-foreground">
                      {getSubTaskDisplayTitle(
                        parsed.config.childType,
                        subTaskDef,
                        state.demoViewMode,
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium text-foreground capitalize">
                      {subTaskChild.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          {displayTab === 'documents' && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-2">
              {isOpenAccountsParentTask ? (
                <ParentActionDocumentsPanel parentTaskId={activeTask.id} />
              ) : (
                <JourneySupportingDocumentsPanel />
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
