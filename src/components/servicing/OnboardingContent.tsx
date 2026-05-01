import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { useServicing } from '@/stores/servicingStore'
import { OnboardingJourneysTable, deriveOnboardingJourneyRows } from './OnboardingJourneysTable'
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

export function OnboardingContent() {
  const { onboardingJourneys, currentLiveJourney } = useServicing()

  const journeyRows = useMemo(() => deriveOnboardingJourneyRows(onboardingJourneys), [onboardingJourneys])
  const actionRows = useMemo(() => deriveActionRows(onboardingJourneys), [onboardingJourneys])
  const taskRows = useMemo(() => deriveTaskRows(onboardingJourneys), [onboardingJourneys])

  return (
    <div className="max-w-6xl mx-auto">
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
          <TableViewWrapper
            tableId="onboarding-journeys"
            presets={journeyPresets}
            columns={journeyColumns}
            allRows={journeyRows}
            defaultRelationshipScope="all"
            pinRowId={currentLiveJourney?.id}
          >
            {({ rows, visibleColumns }) => (
              <OnboardingJourneysTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="actions">
          <TableViewWrapper tableId="onboarding-actions" presets={actionPresets} columns={actionColumns} allRows={actionRows} defaultRelationshipScope="all">
            {({ rows, visibleColumns }) => (
              <ActionsTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="tasks">
          <TableViewWrapper tableId="onboarding-tasks" presets={taskPresets} columns={taskColumns} allRows={taskRows} defaultRelationshipScope="all">
            {({ rows, visibleColumns }) => (
              <TasksTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
      </Tabs>
    </div>
  )
}
