import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { AccessoryBar } from '@/components/accessory-bar'
import { OnboardingJourneysTable } from './OnboardingJourneysTable'
import { ActionsTable } from './ActionsTable'
import { TasksTable } from './TasksTable'

export function OnboardingContent() {
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
          <ActionsTable filterCategory="Onboarding" />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTable filterCategory="Onboarding" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
