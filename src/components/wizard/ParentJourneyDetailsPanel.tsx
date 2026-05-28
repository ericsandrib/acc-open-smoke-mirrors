import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientHouseholdSummaryCard } from '@/components/wizard/ClientHouseholdSummaryCard'
import { ParentActionDocumentLists } from '@/components/wizard/ParentActionDocumentsPanel'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'

type JourneyDetailsSubTab = 'summary' | 'action-details' | 'task-details'

export function ParentJourneyDetailsPanel({ parentTaskId }: { parentTaskId: string }) {
  const { state } = useWorkflow()
  const [subTab, setSubTab] = useState<JourneyDetailsSubTab>('summary')

  const parentTask = state.tasks.find((t) => t.id === parentTaskId)
  const accountChildren = useMemo(
    () => (parentTask?.children ?? []).filter((c) => c.childType === 'account-opening'),
    [parentTask],
  )

  if (!parentTask) {
    return <p className="text-sm text-muted-foreground px-1">Task not found.</p>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <ClientHouseholdSummaryCard />

      <Tabs
        value={subTab}
        onValueChange={(v) => setSubTab(v as JourneyDetailsSubTab)}
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
          <ParentActionDocumentLists parentTaskId={parentTaskId} />
        </TabsContent>

        <TabsContent value="action-details" className="mt-4 space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Action</span>
            <p className="font-medium text-foreground">Account Opening</p>
          </div>
          <div>
            <span className="text-muted-foreground">Task</span>
            <p className="font-medium text-foreground">{parentTask.title}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Accounts in flow</span>
            <p className="font-medium text-foreground">{accountChildren.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium text-foreground capitalize">
              {parentTask.status.replace(/_/g, ' ')}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="task-details" className="mt-4 space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Owner</span>
            <p className="font-medium text-foreground">{parentTask.assignedTo || state.assignedTo || '—'}</p>
          </div>
          {state.journeyName ? (
            <div>
              <span className="text-muted-foreground">Journey</span>
              <p className="font-medium text-foreground">{state.journeyName}</p>
            </div>
          ) : null}
          {state.journeyDateLabel ? (
            <div>
              <span className="text-muted-foreground">Due</span>
              <p className="font-medium text-foreground">{state.journeyDateLabel}</p>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
