import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { useServicing } from '@/stores/servicingStore'
import { JourneysTable, deriveJourneyRows } from './JourneysTable'
import { ActionsTable, deriveActionRows } from './ActionsTable'
import { TasksTable, deriveTaskRows } from './TasksTable'
import { TableViewWrapper } from './table-view-wrapper'
import {
  journeyColumns,
  journeyPresets,
  actionColumns,
  actionPresets,
  taskColumns,
  taskPresets,
} from '@/data/servicing-view-presets'

export function ServicingContent() {
  const { journeys } = useServicing()
  const [searchParams] = useSearchParams()

  const journeyRows = useMemo(() => deriveJourneyRows(journeys), [journeys])
  const actionRows = useMemo(() => deriveActionRows(journeys), [journeys])
  const taskRows = useMemo(() => deriveTaskRows(journeys), [journeys])

  // Allow deep-links (e.g. from the Home dashboard) to open a specific tab via ?tab=.
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'actions' || tabParam === 'journeys' ? tabParam : 'tasks'

  return (
    <div className="max-w-6xl mx-auto">
      {/* key forces the uncontrolled Tabs to re-init when the ?tab= param changes,
          while leaving the tabs freely clickable afterward. */}
      <Tabs key={initialTab} defaultValue={initialTab}>
        <div className="flex items-center justify-between mb-6">
          <PageTitle
            title="Servicing"
            subHead="Track account-opening journeys, actions, and tasks across all client relationships."
          />
          <TabsList variant="elevated">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="journeys">Journeys</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tasks">
          <TableViewWrapper tableId="ao-tasks" presets={taskPresets} columns={taskColumns} allRows={taskRows}>
            {({ rows, visibleColumns }) => (
              <TasksTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="actions">
          <TableViewWrapper tableId="ao-actions" presets={actionPresets} columns={actionColumns} allRows={actionRows}>
            {({ rows, visibleColumns }) => (
              <ActionsTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="journeys">
          <TableViewWrapper tableId="ao-journeys" presets={journeyPresets} columns={journeyColumns} allRows={journeyRows}>
            {({ rows, visibleColumns }) => (
              <JourneysTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
      </Tabs>
    </div>
  )
}
