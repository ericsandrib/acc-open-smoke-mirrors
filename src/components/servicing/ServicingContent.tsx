import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { AccessoryBar } from '@/components/accessory-bar'
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

  const journeyRows = useMemo(() => deriveJourneyRows(journeys), [journeys])
  const actionRows = useMemo(() => deriveActionRows(journeys), [journeys])
  const taskRows = useMemo(() => deriveTaskRows(journeys), [journeys])

  return (
    <div className="max-w-6xl mx-auto">
      <AccessoryBar
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        currentPage="Servicing"
        showBackButton={true}
        showBorder={false}
        className="-mt-6 mb-2"
      />
      <Tabs defaultValue="journeys">
        <div className="flex items-center justify-between mb-6">
          <PageTitle
            title="Servicing"
            subHead="Track onboarding journeys, actions, and tasks across all relationships."
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
          <TableViewWrapper tableId="actions" presets={actionPresets} columns={actionColumns} allRows={actionRows}>
            {({ rows, visibleColumns }) => (
              <ActionsTable rows={rows} visibleColumns={visibleColumns} />
            )}
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
