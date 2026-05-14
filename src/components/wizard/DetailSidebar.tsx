import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useWizardRightPanel, WIZARD_RIGHT_RAIL_WIDTH_CLASS } from '@/components/wizard/wizardRightPanelContext'
import { JourneySupportingDocumentsPanel } from '@/components/wizard/JourneySupportingDocumentsPanel'
import { useWorkflow } from '@/stores/workflowStore'
import { parseChildSubTaskId, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'

const JOURNEY_TAB_ORDER = ['details', 'documents'] as const
type JourneyRailTab = (typeof JOURNEY_TAB_ORDER)[number]

const JOURNEY_TAB_META: Record<JourneyRailTab, { label: string }> = {
  details: { label: 'Info' },
  documents: { label: 'Documents' },
}

/**
 * Main-journey right rail: same collapse shell as {@link ChildActionRightSidebar},
 * with Info + Documents text tabs only (Activity/Comments live on the child rail).
 * Documents tab is reviewer-only (when `demoViewMode` is set and not `advisor`).
 */
export function DetailSidebar() {
  const { state } = useWorkflow()
  const { collapsed, activeTab, setActiveTab } = useWizardRightPanel()

  const showDocumentsTab =
    state.demoViewMode != null && state.demoViewMode !== 'advisor'

  useEffect(() => {
    if (!showDocumentsTab && activeTab === 'documents') {
      setActiveTab('details')
    }
  }, [showDocumentsTab, activeTab, setActiveTab])

  const displayTab: JourneyRailTab =
    showDocumentsTab && activeTab === 'documents' ? 'documents' : 'details'

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
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
    >
      <div
        className={cn(
          'flex flex-col min-h-0 h-full transition-opacity duration-150 ease-out motion-reduce:transition-none',
          WIZARD_RIGHT_RAIL_WIDTH_CLASS,
          collapsed ? 'opacity-0' : 'opacity-100 delay-200',
        )}
      >
        {showDocumentsTab ? (
          <div
            className="flex h-14 shrink-0 flex-nowrap items-center gap-1 overflow-x-auto border-b border-border px-3"
            role="tablist"
            aria-label="Right panel"
          >
            {JOURNEY_TAB_ORDER.map((tab) => {
              const { label } = JOURNEY_TAB_META[tab]
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
        ) : (
          <div className="flex h-14 items-center border-b border-border px-3 shrink-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Info</h3>
          </div>
        )}

        <div
          className={cn(
            'flex flex-1 min-h-0 flex-col text-sm',
            displayTab === 'documents' ? 'overflow-hidden' : 'overflow-y-auto p-4',
          )}
        >
          {displayTab === 'details' && (
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
              <JourneySupportingDocumentsPanel />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
