import { useMemo } from 'react'
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
import {
  ACCOUNT_EMBEDDED_FEATURE_VALUES,
  ACCOUNT_FEATURE_SERVICE_OPTIONS,
  ACCOUNT_FEATURE_SERVICE_SPAWN_OPTIONS,
} from '@/data/accountFeatureServiceOptions'
import { FinancialAccountSlotCard } from '@/components/wizard/forms/FinancialAccountSlotCard'
import { useOpenAccountsVariant } from '@/components/wizard/openAccountsVariantContext'
import { cn } from '@/lib/utils'

const workflowStatuses = [
  { value: 'draft', label: 'Draft / intake' },
  { value: 'in_flight', label: 'In progress' },
  { value: 'pending_ops', label: 'Pending operations / HO' },
  { value: 'complete', label: 'Complete' },
]

/** Detail form for a single account feature or service workflow line. */
export function FeatureServiceLineSetupForm() {
  const { state } = useWorkflow()
  const variant = useOpenAccountsVariant()
  const isVersion2 = variant === 'v2' || variant === 'v5'
  const isVersion3 = variant === 'v3'
  const isVersion4 = variant === 'v4'
  const isCardVariant = isVersion2 || isVersion3 || isVersion4
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const allFinancialAccounts = useMemo(() => state.financialAccounts, [state.financialAccounts])
  const featureLinkId = String((data.featureLinkedFinancialAccountId as string) ?? '').trim()

  const childRoot = ctx ? ((state.taskData[ctx.child.id] as Record<string, unknown> | undefined) ?? undefined) : undefined
  const featureServiceType =
    (data.featureServiceType as string | undefined) ?? (childRoot?.featureServiceType as string | undefined) ?? ''

  const serviceTypeOptions = useMemo(() => {
    const cur = featureServiceType
    const spawn = ACCOUNT_FEATURE_SERVICE_SPAWN_OPTIONS
    if (!cur) return spawn
    if (!spawn.some((o) => o.value === cur)) {
      const extra = ACCOUNT_FEATURE_SERVICE_OPTIONS.filter((o) => o.value === cur)
      return [...extra, ...spawn]
    }
    return spawn
  }, [featureServiceType])

  if (!ctx || ctx.child.childType !== 'feature-service-line') {
    return (
      <p className="text-sm text-muted-foreground">Open this step from Account features & services on an account.</p>
    )
  }

  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <div
          className={cn(
            isCardVariant &&
              cn(
                'rounded-xl p-6 space-y-6 overflow-hidden',
                isVersion2 && 'border border-foreground/30 bg-background',
                isVersion3 && 'v3-card-inner-strokes border border-foreground/20 bg-[#fafafa]',
                isVersion4 && 'border border-foreground/30 bg-white',
              ),
          )}
        >
        <div
          className={cn(
            isCardVariant &&
              cn(
                '-mx-6 -mt-6 mb-8 px-6 py-4',
                isVersion2 && 'border-b border-border/60 bg-[#F5F5F4]',
                isVersion4 && 'border-b border-border/60',
                    isVersion3 && 'mx-0 mt-0 px-0 pt-0 pb-4 border-b border-border/60',
                isVersion4 && 'bg-[#F5F5F4]',
              ),
          )}
        >
          <h3 className={cn(isCardVariant ? 'text-sm font-semibold uppercase tracking-wide' : 'text-sm font-semibold uppercase tracking-wide text-muted-foreground')}>
            Account feature & service
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Administrative, setup, or lifecycle management—track status, owners, and references for this workflow line.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Feature / service type</Label>
          {(ACCOUNT_EMBEDDED_FEATURE_VALUES as readonly string[]).includes(featureServiceType) ? (
            <p className="text-xs text-amber-900 dark:text-amber-100 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-2">
              Margin, options, and alternative strategy selection are configured on the parent account under{' '}
              <strong>Account &amp; owners</strong>. This service line is legacy if it still shows those types—prefer
              closing it and using the account step instead.
            </p>
          ) : null}
          <Select
            value={featureServiceType || undefined}
            onValueChange={(v) => updateField('featureServiceType', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(24rem,70vh)]">
              {serviceTypeOptions.map((opt) => (
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

        <FinancialAccountSlotCard
          title="Related financial account (optional)"
          selectLabel="Choose an account"
          financialAccountId={featureLinkId || undefined}
          onFinancialAccountIdChange={(id) => updateField('featureLinkedFinancialAccountId', id)}
          allAccounts={allFinancialAccounts}
          selectCandidates={allFinancialAccounts}
          emptyCandidatesHint="No accounts in Existing accounts yet. Add one below."
          addAccountItemDescription="Creates an account in Existing accounts (collect client data) and links it here."
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
