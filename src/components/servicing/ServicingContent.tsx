import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { JourneysTable, deriveJourneyRows } from './JourneysTable'
import { ActionsTable, deriveActionRows } from './ActionsTable'
import { DocumentReviewActionsTable } from './DocumentReviewActionsTable'
import { TasksTable, deriveTaskRows } from './TasksTable'
import { TableViewWrapper } from './table-view-wrapper'
import {
  journeyColumns,
  journeyPresets,
  actionColumns,
  actionPresetsForDemoView,
  actionVisibleColumnsJourneyGroupedShell,
  isReviewerWorkQueuePresetId,
  taskColumns,
  taskPresets,
} from '@/data/servicing-view-presets'
import type { RelationshipScope } from './table-controls'

export function ServicingContent() {
  const { journeys } = useServicing()
  const { state } = useWorkflow()

  const journeyRows = useMemo(() => deriveJourneyRows(journeys), [journeys])
  const actionRows = useMemo(() => deriveActionRows(journeys), [journeys])
  const taskRows = useMemo(() => deriveTaskRows(journeys), [journeys])
  const actionPresets = useMemo(() => actionPresetsForDemoView(state.demoViewMode), [state.demoViewMode])
  const actionsTablePersistKey =
    (state.demoViewMode ?? 'advisor') === 'advisor' ? 'advisor' : 'reviewer'

  /** Reviewer team queues (AML / HO / Principal) span assignees — default to all relationships like Onboarding Actions. */
  const actionsDefaultRelationshipScope: RelationshipScope =
    state.demoViewMode != null && state.demoViewMode !== 'advisor' ? 'all' : 'my'

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="journeys">
        <div className="flex items-center justify-between mb-6">
          <PageTitle
            title="Servicing"
            subHead="Track all journeys, actions, and tasks across all relationships and categories."
          />
          <TabsList variant="elevated">
            <TabsTrigger value="journeys">Journeys</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="journeys">
          <TableViewWrapper tableId="journeys" presets={journeyPresets} columns={journeyColumns} allRows={journeyRows}>
            {({ rows, visibleColumns }) => (
              <JourneysTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="actions">
          <TableViewWrapper
            tableId={`actions-${actionsTablePersistKey}`}
            presets={actionPresets}
            columns={actionColumns}
            allRows={actionRows}
            defaultRelationshipScope={actionsDefaultRelationshipScope}
            showGroupBy
            defaultGroupBy="parentJourneyId"
          >
            {({ rows, visibleColumns, activeViewId, groupBy }) => {
              const reviewerQueue = Boolean(activeViewId && isReviewerWorkQueuePresetId(activeViewId))
              const advisorJourneyGrouped = (state.demoViewMode ?? 'advisor') === 'advisor' && groupBy === 'parentJourneyId'
              if (reviewerQueue || advisorJourneyGrouped) {
                return (
                  <DocumentReviewActionsTable
                    rows={rows}
                    visibleColumns={advisorJourneyGrouped ? actionVisibleColumnsJourneyGroupedShell : visibleColumns}
                    journeys={journeys}
                    groupBy={groupBy}
                    nestRowMode={advisorJourneyGrouped ? 'allChildWorkflows' : 'pipeline'}
                  />
                )
              }
              return <ActionsTable rows={rows} visibleColumns={visibleColumns} groupBy={groupBy} />
            }}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="tasks">
          <TableViewWrapper tableId="tasks" presets={taskPresets} columns={taskColumns} allRows={taskRows}>
            {({ rows, visibleColumns }) => (
              <TasksTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
      </Tabs>
    </div>
  )
}
