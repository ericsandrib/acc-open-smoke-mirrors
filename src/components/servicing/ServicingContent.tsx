import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JourneysTable } from './JourneysTable'
import { ActionsTable } from './ActionsTable'
import { TasksTable } from './TasksTable'

export function ServicingContent() {
  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="journeys">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Servicing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track onboarding journeys, actions, and tasks across all relationships.
            </p>
          </div>
          <TabsList>
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
