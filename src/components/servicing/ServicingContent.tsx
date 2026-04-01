import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { JourneysTable } from './JourneysTable'
import { ActionsTable } from './ActionsTable'
import { TasksTable } from './TasksTable'

export function ServicingContent() {
  return (
    <div className="max-w-6xl mx-auto">
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
          <JourneysTable />
        </TabsContent>
        <TabsContent value="actions">
          <ActionsTable />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
