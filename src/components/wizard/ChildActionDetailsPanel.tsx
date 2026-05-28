import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChildActionDocumentLists } from '@/components/wizard/ChildActionDocumentsPanel'
import { ClientHouseholdSummaryCard } from '@/components/wizard/ClientHouseholdSummaryCard'
import { useChildActionContext, useWorkflow } from '@/stores/workflowStore'
import { getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { cn } from '@/lib/utils'

type DetailsSubTab = 'summary' | 'action-details' | 'task-details'

export function ChildActionDetailsPanel() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const [subTab, setSubTab] = useState<DetailsSubTab>('summary')

  if (!ctx) {
    return (
      <p className="text-sm text-muted-foreground px-1">
        Open a child workflow step to see client details here.
      </p>
    )
  }

  const { child, config, currentSubTask, subTaskIndex, totalSubTasks } = ctx
  const taskTitle = getSubTaskDisplayTitle(config.childType, currentSubTask, state.demoViewMode)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <ClientHouseholdSummaryCard />

      <Tabs
        value={subTab}
        onValueChange={(v) => setSubTab(v as DetailsSubTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList variant="border" className="w-full justify-start gap-4 border-b border-border px-0 h-auto">
          <TabsTrigger
            value="summary"
            className={cn(
              'rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 shadow-none',
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground',
            )}
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="action-details"
            className={cn(
              'rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 shadow-none',
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground',
            )}
          >
            Action Details
          </TabsTrigger>
          <TabsTrigger
            value="task-details"
            className={cn(
              'rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 shadow-none',
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground',
            )}
          >
            Task Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 text-sm">
          <ChildActionDocumentLists />
        </TabsContent>

        <TabsContent value="action-details" className="mt-4 space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Child action</span>
            <p className="font-medium text-foreground">{config.displayLabel}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Account</span>
            <p className="font-medium text-foreground">{child.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium text-foreground capitalize">{child.status.replace(/_/g, ' ')}</p>
          </div>
        </TabsContent>

        <TabsContent value="task-details" className="mt-4 space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Current task</span>
            <p className="font-medium text-foreground">{taskTitle}</p>
          </div>
          {totalSubTasks > 1 ? (
            <div>
              <span className="text-muted-foreground">Progress</span>
              <p className="font-medium text-foreground">
                Step {subTaskIndex + 1} of {totalSubTasks}
              </p>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
