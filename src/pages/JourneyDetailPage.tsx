import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { useServicing } from '@/stores/servicingStore'
import { StatusBadge } from '@/components/servicing/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function JourneyDetailPage() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const { journeys } = useServicing()
  const navigate = useNavigate()

  const journey = journeys.find((j) => j.id === journeyId)

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar activeItem="Servicing" onCreateClick={() => {}} />

      <main className="flex-1 overflow-y-auto p-8">
        {!journey ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">Journey not found.</p>
            <Button variant="ghost" onClick={() => navigate('/servicing')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Servicing
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => navigate('/servicing')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Servicing
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{journey.name}</h1>
                <StatusBadge status={journey.status} />
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>Relationship: {journey.relationshipName}</span>
                <span>Assigned to: {journey.assignedTo}</span>
                <span>Created: {journey.createdAt}</span>
              </div>
            </div>

            {journey.id === 'live-current' && (
              <Button onClick={() => navigate('/wizard')}>
                Continue in Wizard
              </Button>
            )}

            <div className="space-y-6">
              {journey.actions.map((action) => {
                const completeTasks = action.tasks.filter(
                  (t) => t.status === 'complete',
                ).length

                return (
                  <div key={action.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-medium">{action.title}</h2>
                      <StatusBadge status={action.status} />
                      <span className="text-sm text-muted-foreground">
                        {completeTasks}/{action.tasks.length} tasks
                      </span>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Task</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {action.tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">
                              {task.title}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={task.status} />
                            </TableCell>
                            <TableCell>{task.assignedTo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
