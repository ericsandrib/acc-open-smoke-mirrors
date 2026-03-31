import { useWorkflow } from '@/stores/workflowStore'
import { formComponents, taskDescriptions } from './formRegistry'
import { teamMembers } from '@/data/teamMembers'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { User } from 'lucide-react'

export function TaskContent() {
  const { state, dispatch } = useWorkflow()

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const activeChild = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  const formKey = activeTask?.formKey ?? activeChild?.formKey
  const title = activeTask?.title ?? activeChild?.name ?? ''
  const assignedTo = activeTask?.assignedTo ?? state.assignedTo ?? 'Unassigned'

  const FormComponent = formKey ? formComponents[formKey] : null

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-foreground mb-6">{title}</h2>
        <div className="flex items-center gap-2 mb-6">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={assignedTo}
            onValueChange={(value) =>
              dispatch({ type: 'SET_JOURNEY_ASSIGNEE', assignee: value })
            }
          >
            <SelectTrigger className="h-8 w-auto min-w-[180px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unassigned">Unassigned</SelectItem>
              {teamMembers.map((tm) => (
                <SelectItem key={tm.id} value={tm.name}>
                  {tm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {formKey && taskDescriptions[formKey] && (
          <p className="text-base text-muted-foreground mb-6">{taskDescriptions[formKey]}</p>
        )}
        {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
      </div>
    </main>
  )
}
