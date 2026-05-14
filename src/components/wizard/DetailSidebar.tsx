import { cn } from '@/lib/utils'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { JourneySupportingDocumentsPanel } from '@/components/wizard/JourneySupportingDocumentsPanel'
import { useWorkflow } from '@/stores/workflowStore'
import { parseChildSubTaskId, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { FileText, Info } from 'lucide-react'

const JOURNEY_TAB_ORDER = ['details', 'documents'] as const
type JourneyRailTab = (typeof JOURNEY_TAB_ORDER)[number]

const JOURNEY_TAB_META: Record<JourneyRailTab, { label: string; Icon: typeof Info }> = {
  details: { label: 'Details', Icon: Info },
  documents: { label: 'Documents', Icon: FileText },
}

/**
 * Main-journey right rail: same collapse shell as {@link ChildActionRightSidebar},
 * with Details + Documents only (Activity/Comments live on the child rail).
 */
export function DetailSidebar() {
  const { state } = useWorkflow()
  const { collapsed, activeTab, setActiveTab } = useWizardRightPanel()

  const displayTab: JourneyRailTab =
    activeTab === 'documents' ? 'documents' : 'details'

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
        collapsed ? 'w-0' : 'w-[330px] border-l-border',
      )}
      aria-label="Task details"
      aria-hidden={collapsed}
    >
      <div
        className={cn(
          'flex flex-col w-[330px] min-h-0 h-full transition-opacity duration-150 ease-out motion-reduce:transition-none',
          collapsed ? 'opacity-0' : 'opacity-100 delay-200',
        )}
      >
        <div
          className="flex h-14 items-center justify-center gap-0.5 border-b border-border px-2 shrink-0"
          role="tablist"
          aria-label="Right panel"
        >
          {JOURNEY_TAB_ORDER.map((tab) => {
            const { label, Icon } = JOURNEY_TAB_META[tab]
            const selected = displayTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={label}
                title={label}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
                  selected
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 text-sm">
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
          {displayTab === 'documents' && <JourneySupportingDocumentsPanel />}
        </div>
      </div>
    </aside>
  )
}
