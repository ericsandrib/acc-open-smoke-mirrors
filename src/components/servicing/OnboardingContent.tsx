import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { AccessoryBar } from '@/components/accessory-bar'
import { useServicing } from '@/stores/servicingStore'
import { OnboardingJourneysTable } from './OnboardingJourneysTable'
import { ActionsTable, deriveActionRows } from './ActionsTable'
import { TasksTable, deriveTaskRows } from './TasksTable'
import { TableViewWrapper } from './table-view-wrapper'
import {
  actionColumns,
  actionPresets,
  taskColumns,
  taskPresets,
} from '@/data/servicing-view-presets'

export function OnboardingContent() {
  const { journeys } = useServicing()

  const onboardingJourneys = useMemo(
    () => journeys.filter((j) => j.category === 'Onboarding'),
    [journeys],
  )
  const actionRows = useMemo(() => deriveActionRows(onboardingJourneys), [onboardingJourneys])
  const taskRows = useMemo(() => deriveTaskRows(onboardingJourneys), [onboardingJourneys])

  return (
    <div className="max-w-6xl mx-auto">
      <AccessoryBar
        breadcrumbs={[{ label: 'Home', href: '/' }]}
        currentPage="Onboarding"
        showBackButton={true}
        showBorder={false}
        className="-mt-6 mb-2"
      />
      <Tabs defaultValue="journeys">
        <div className="flex items-center justify-between mb-6">
          <PageTitle
            title="Onboarding"
            subHead="Track client onboarding journeys, actions, and tasks."
          />
          <TabsList variant="elevated">
            <TabsTrigger value="journeys">Journeys</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="journeys">
          <OnboardingJourneysTable />
        </TabsContent>
        <TabsContent value="actions">
          <TableViewWrapper tableId="onboarding-actions" presets={actionPresets} columns={actionColumns} allRows={actionRows}>
            {({ rows, visibleColumns }) => (
              <ActionsTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="tasks">
          <TableViewWrapper tableId="onboarding-tasks" presets={taskPresets} columns={taskColumns} allRows={taskRows}>
            {({ rows, visibleColumns }) => (
              <TasksTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
      </Tabs>
    </div>
  )
}
