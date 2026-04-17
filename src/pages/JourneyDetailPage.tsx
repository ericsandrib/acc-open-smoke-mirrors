import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Circle, Loader, CheckCircle2, Ban, CheckCheck, Clock, XCircle } from 'lucide-react'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { StatusBadge as ServicingStatusBadge } from '@/components/servicing/StatusBadge'
import { AccessoryBar, type BreadcrumbSegment } from '@/components/accessory-bar'
import { PageTitle } from '@/components/page-title'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { teamMembers } from '@/data/teamMembers'
import { formComponents, taskDescriptions } from '@/components/wizard/formRegistry'
import type { Task, TaskStatus } from '@/types/workflow'
import type { JourneyTask } from '@/types/servicing'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'text-text-tertiary',
  in_progress: 'text-text-category1-primary',
  complete: 'text-text-success-primary',
  canceled: 'text-text-tertiary',
  blocked: 'text-text-danger-primary',
  awaiting_review: 'text-text-warning-primary',
  rejected: 'text-text-danger-primary',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  canceled: 'Canceled',
  blocked: 'Blocked',
  awaiting_review: 'Awaiting Review',
  rejected: 'Rejected',
}

const StatusIcon: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  in_progress: Loader,
  complete: CheckCircle2,
  canceled: XCircle,
  blocked: Ban,
  awaiting_review: Clock,
  rejected: XCircle,
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

function stripJourneyPrefix(servicingTaskId: string, journeyId: string): string {
  const prefix = `${journeyId}-`
  return servicingTaskId.startsWith(prefix)
    ? servicingTaskId.slice(prefix.length)
    : servicingTaskId
}

function getFormKeyForTask(workflowTaskId: string, tasks: Task[]): string | undefined {
  const parentTask = tasks.find((t) => t.id === workflowTaskId)
  if (parentTask) return parentTask.formKey
  for (const task of tasks) {
    const child = task.children?.find((c) => c.id === workflowTaskId)
    if (child) return child.formKey
  }
  return undefined
}

export function JourneyDetailPage() {
  const { journeyId, actionId } = useParams<{ journeyId: string; actionId?: string }>()
  const { journeys, updateJourneyAssignee } = useServicing()
  const { state: workflowState, dispatch } = useWorkflow()
  const navigate = useNavigate()

  const journey = journeys.find((j) => j.id === journeyId)
  const isLiveJourney = journey?.id === workflowState.journeyId
  const focusedAction = actionId ? journey?.actions.find((a) => a.id === actionId) : null
  const sidebarActions = focusedAction
    ? [focusedAction]
    : (journey?.actions.filter((a) => !a.parentActionId) ?? [])
  const allTasks = (focusedAction ? [focusedAction] : journey?.actions ?? []).flatMap((a) => a.tasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(allTasks[0]?.id ?? null)

  const activeTask = allTasks.find((t) => t.id === activeTaskId) ?? null
  const activeAction = journey?.actions.find((a) => a.tasks.some((t) => t.id === activeTaskId)) ?? null

  const handleTaskSelect = (taskId: string) => {
    setActiveTaskId(taskId)
    if (isLiveJourney && journey) {
      const workflowTaskId = stripJourneyPrefix(taskId, journey.id)
      dispatch({ type: 'SET_ACTIVE_TASK', taskId: workflowTaskId })
    }
  }

  // Reset active task when route params change (e.g. navigating between parent/child views)
  useEffect(() => {
    setActiveTaskId(allTasks[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId, actionId])

  // Sync workflow activeTaskId on mount for live journey
  useEffect(() => {
    if (isLiveJourney && activeTaskId && journey) {
      const wfId = stripJourneyPrefix(activeTaskId, journey.id)
      dispatch({ type: 'SET_ACTIVE_TASK', taskId: wfId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bidirectional sync: when KycForm changes activeTaskId in workflow store, reflect in sidebar
  useEffect(() => {
    if (isLiveJourney && journey && workflowState.activeTaskId) {
      const servicingId = `${journey.id}-${workflowState.activeTaskId}`
      if (allTasks.some((t) => t.id === servicingId) && servicingId !== activeTaskId) {
        setActiveTaskId(servicingId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowState.activeTaskId])

  // Resolve formKey for the active task (live journey only)
  const workflowTaskId = isLiveJourney && activeTask && journey
    ? stripJourneyPrefix(activeTask.id, journey.id)
    : null
  const formKey = workflowTaskId
    ? getFormKeyForTask(workflowTaskId, workflowState.tasks)
    : undefined
  const FormComponent = formKey ? formComponents[formKey] : null

  if (!journey) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-muted-foreground">Journey not found.</p>
          <Button variant="ghost" onClick={() => navigate('/servicing')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servicing
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col h-full -m-8">
          {/* Accessory bar with breadcrumbs */}
          <AccessoryBar
            breadcrumbs={(() => {
              const crumbs: BreadcrumbSegment[] = [
                { label: 'Home', href: '/' },
                { label: 'Servicing', href: '/servicing' },
              ]
              if (focusedAction) {
                crumbs.push({ label: journey.name, href: `/servicing/${journeyId}` })
              }
              return crumbs
            })()}
            currentPage={focusedAction?.nickname ?? journey.name}
            rightContent={
              <div className="flex items-center gap-2">
                <ServicingStatusBadge status={focusedAction?.status ?? journey.status} />
                {journey.id === workflowState.journeyId && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/wizard')}>
                    Continue in Wizard
                  </Button>
                )}
              </div>
            }
            className="shrink-0"
          />

          {/* Three-column layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar -- task navigation */}
            <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto">
              {focusedAction && (
                <button
                  onClick={() => navigate(`/servicing/${journeyId}`)}
                  className="flex items-center gap-1 px-3 py-2 mb-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to {journey.name}
                </button>
              )}
              {sidebarActions.map((action) => (
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
                            onClick={() => handleTaskSelect(task.id)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors',
                              activeTaskId === task.id
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'hover:bg-muted text-foreground',
                            )}
                          >
                            <span className={cn("truncate", task.isSubTask && "pl-3 text-xs text-muted-foreground")}>{task.title}</span>
                            <span className="flex items-center gap-1">
                              {isTaskSubmitted && task.status !== 'complete' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <CheckCheck className="h-3 w-3 text-text-category1-primary shrink-0" />
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
                  <PageTitle
                    title={activeTask.title}
                    subHead={`Part of ${activeAction.title}`}
                    size="small"
                  />
                  <div className="flex items-center gap-3">
                    <ServicingStatusBadge status={activeTask.status} />
                  </div>
                  {FormComponent ? (
                    <>
                      {formKey && taskDescriptions[formKey] && (
                        <p className="text-base text-muted-foreground">{taskDescriptions[formKey]}</p>
                      )}
                      <FormComponent />
                    </>
                  ) : (
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
                      {!isLiveJourney && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Form editing is available for active journeys.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-center mt-20">
                  Select a task from the sidebar
                </div>
              )}
            </div>

            {/* Right sidebar -- details */}
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
                  {focusedAction && (
                    <div>
                      <span className="text-muted-foreground">Parent Journey</span>
                      <button
                        onClick={() => navigate(`/servicing/${journeyId}`)}
                        className="block font-medium text-foreground hover:underline"
                      >
                        {journey.name}
                      </button>
                    </div>
                  )}
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
    </AppShell>
  )
}
