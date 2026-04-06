import { useChildActionContext, useTaskData, useWorkflow } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ACCOUNT_FEATURE_SERVICE_OPTIONS } from '@/data/accountFeatureServiceOptions'

const workflowStatuses = [
  { value: 'draft', label: 'Draft / intake' },
  { value: 'in_flight', label: 'In progress' },
  { value: 'pending_ops', label: 'Pending operations / HO' },
  { value: 'complete', label: 'Complete' },
]

/** Detail form for a single account feature or service workflow line. */
export function FeatureServiceLineSetupForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const childRoot = ctx ? ((state.taskData[ctx.child.id] as Record<string, unknown> | undefined) ?? undefined) : undefined
  const featureServiceType =
    (data.featureServiceType as string | undefined) ?? (childRoot?.featureServiceType as string | undefined) ?? ''

  if (!ctx || ctx.child.childType !== 'feature-service-line') {
    return (
      <p className="text-sm text-muted-foreground">Open this step from Account features & services on an account.</p>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Account feature & service
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Administrative, setup, or lifecycle management—track status, owners, and references for this workflow line.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Feature / service type</Label>
          <Select
            value={featureServiceType || undefined}
            onValueChange={(v) => updateField('featureServiceType', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(24rem,70vh)]">
              {ACCOUNT_FEATURE_SERVICE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Workflow status</Label>
            <Select
              value={(data.featureWorkflowStatus as string) ?? ''}
              onValueChange={(v) => updateField('featureWorkflowStatus', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {workflowStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Effective / target date</Label>
            <Input
              type="date"
              value={(data.featureEffectiveDate as string) ?? ''}
              onChange={(e) => updateField('featureEffectiveDate', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Internal reference / case ID</Label>
          <Input
            value={(data.featureInternalRef as string) ?? ''}
            onChange={(e) => updateField('featureInternalRef', e.target.value)}
            placeholder="Ticket, NetX, or CRM reference"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Details & routing
        </h3>
        <div className="space-y-2">
          <Label>Assigned queue or team (demo)</Label>
          <Input
            value={(data.featureAssignedQueue as string) ?? ''}
            onChange={(e) => updateField('featureAssignedQueue', e.target.value)}
            placeholder="e.g. Account Maintenance, Operations"
          />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <textarea
            className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.featureWorkflowNotes as string) ?? ''}
            onChange={(e) => updateField('featureWorkflowNotes', e.target.value)}
            placeholder="Client-facing outcome, exceptions, follow-ups…"
          />
        </div>
      </section>
    </div>
  )
}
