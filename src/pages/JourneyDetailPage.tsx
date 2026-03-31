import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Circle, Loader, CheckCircle2, Ban, CheckCheck } from 'lucide-react'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { StatusBadge as ServicingStatusBadge } from '@/components/servicing/StatusBadge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { teamMembers } from '@/data/teamMembers'
import type { TaskStatus } from '@/types/workflow'
import type { JourneyTask } from '@/types/servicing'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  complete: 'text-green-500',
  blocked: 'text-red-500',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
}

const StatusIcon: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  in_progress: Loader,
  complete: CheckCircle2,
  blocked: Ban,
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const Icon = StatusIcon[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('shrink-0 flex items-center', statusColors[status])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{statusLabels[status]}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function getActionStatus(tasks: JourneyTask[]): TaskStatus {
  if (tasks.every((t) => t.status === 'complete')) return 'complete'
  if (tasks.some((t) => t.status === 'blocked')) return 'blocked'
  if (tasks.some((t) => t.status === 'in_progress' || t.status === 'complete')) return 'in_progress'
  return 'not_started'
}

export function JourneyDetailPage() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const { journeys, updateJourneyAssignee } = useServicing()
  const { state: workflowState } = useWorkflow()
  const navigate = useNavigate()

  const journey = journeys.find((j) => j.id === journeyId)
  const allTasks = journey?.actions.flatMap((a) => a.tasks) ?? []
  const [activeTaskId, setActiveTaskId] = useState<string | null>(allTasks[0]?.id ?? null)

  const activeTask = allTasks.find((t) => t.id === activeTaskId) ?? null
  const activeAction = journey?.actions.find((a) => a.tasks.some((t) => t.id === activeTaskId)) ?? null

  if (!journey) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center gap-4">
        <p className="text-muted-foreground">Journey not found.</p>
        <Button variant="ghost" onClick={() => navigate('/servicing')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Servicing
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/servicing')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Servicing
            </Button>
            <h1 className="text-sm font-semibold text-foreground">{journey.name}</h1>
            <ServicingStatusBadge status={journey.status} />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {journey.id === workflowState.journeyId && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/wizard')}>
                Continue in Wizard
              </Button>
            )}
          </div>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — task navigation */}
          <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto">
            {journey.actions.map((action) => (
              <div key={action.id} className="mb-6">
                <div className="flex items-center justify-between mb-2 px-3">
                  <h3 className="text-xs font-semibold text-muted-foreground">
                    {action.title}
                  </h3>
                  <TaskStatusBadge status={getActionStatus(action.tasks)} />
                </div>
                <ul className="space-y-1">
                  {action.tasks.map((task) => {
                    const isTaskSubmitted = workflowState.submittedTaskIds.includes(
                      task.id.replace(`${journey.id}-`, '')
                    ) || workflowState.submittedTaskIds.includes(task.id)
                    return (
                      <li key={task.id}>
                        <button
                          onClick={() => setActiveTaskId(task.id)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors',
                            activeTaskId === task.id
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'hover:bg-muted text-foreground',
                          )}
                        >
                          <span className="truncate">{task.title}</span>
                          <span className="flex items-center gap-1">
                            {isTaskSubmitted && task.status !== 'complete' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CheckCheck className="h-3 w-3 text-blue-500 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>Submitted</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <TaskStatusBadge status={task.status} />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTask && activeAction ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl font-semibold">{activeTask.title}</h2>
                <div className="flex items-center gap-3">
                  <ServicingStatusBadge status={activeTask.status} />
                  <span className="text-sm text-muted-foreground">
                    Part of {activeAction.title}
                  </span>
                </div>
                <div className="rounded-lg border border-border p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Assigned To</span>
                      <p className="font-medium">{activeTask.assignedTo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className="font-medium capitalize">{activeTask.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Journey</span>
                      <p className="font-medium">{journey.relationshipName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Action</span>
                      <p className="font-medium">{activeAction.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center mt-20">
                Select a task from the sidebar
              </div>
            )}
          </div>

          {/* Right sidebar — details */}
          <aside className="w-64 border-l border-border bg-sidebar-background p-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Details
            </h3>
            {activeTask ? (
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground">Task</span>
                  <p className="font-medium text-foreground">{activeTask.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Owner</span>
                  <p className="font-medium text-foreground">{activeTask.assignedTo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-medium text-foreground capitalize">
                    {activeTask.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No task selected</p>
            )}

            <div className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Journey
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground">Relationship</span>
                  <p className="font-medium text-foreground">{journey.relationshipName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned To</span>
                  <Select
                    value={journey.assignedTo}
                    onValueChange={(value) => updateJourneyAssignee(journey.id, value)}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((tm) => (
                        <SelectItem key={tm.id} value={tm.name}>
                          {tm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-muted-foreground">Created By</span>
                  <p className="font-medium text-foreground">{journey.createdBy}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium text-foreground">{journey.createdAt}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Progress</span>
                  <p className="font-medium text-foreground">
                    {allTasks.filter((t) => t.status === 'complete').length}/{allTasks.length} tasks
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  )
}