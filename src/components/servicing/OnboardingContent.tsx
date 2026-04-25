import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/page-title'
import { AccessoryBar } from '@/components/accessory-bar'
import { useServicing } from '@/stores/servicingStore'
import { TEST_CLIENT } from '@/data/testClientFlow'
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

        <Link
          to="/onboarding/flow"
          className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border-category1-primary bg-fill-category1-tertiary p-4 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-fill-category1-primary text-text-oncategory1-primary flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {TEST_CLIENT.name}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Open the onboarding journey for this client.
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" asChild>
            <span className="flex items-center gap-1">
              Open
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Button>
        </Link>

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
