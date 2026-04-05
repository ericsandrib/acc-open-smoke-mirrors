import { useChildActionContext, useTaskData, useWorkflow } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertTriangle, HelpCircle, Sparkles, FileSignature, ExternalLink } from 'lucide-react'

export function AcctChildDocumentsReviewForm() {
  const { dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  const parentOpenAccountsId = ctx.parentTask?.id

  const goToOpenAccountsForEsign = () => {
    if (!parentOpenAccountsId) return
    dispatch({ type: 'EXIT_CHILD_ACTION' })
    dispatch({ type: 'SET_ACTIVE_TASK', taskId: parentOpenAccountsId })
  }

  const statusRows = [
    {
      key: 'ready',
      label: 'Ready to submit',
      icon: CheckCircle2,
      tone: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-900/50',
      bg: 'bg-green-50/80 dark:bg-green-950/30',
    },
    {
      key: 'missing',
      label: 'Missing documents',
      icon: AlertTriangle,
      tone: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-200 dark:border-amber-900/50',
      bg: 'bg-amber-50/80 dark:bg-amber-950/30',
    },
    {
      key: 'clarify',
      label: 'Needs clarification',
      icon: HelpCircle,
      tone: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-900/50',
      bg: 'bg-blue-50/80 dark:bg-blue-950/30',
    },
    {
      key: 'optional',
      label: 'Optional but recommended',
      icon: Sparkles,
      tone: 'text-muted-foreground',
      border: 'border-border',
      bg: 'bg-muted/40',
    },
  ] as const

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Package status (this account)
        </h3>
        <p className="text-sm text-muted-foreground">
          Final reconciliation for <span className="text-foreground font-medium">{ctx.child.name}</span>: upload,
          resolve exceptions, and confirm this account’s paperwork. The Documents panel (right) has shown
          rule-driven requirements for this account since Task 1—it does not replace the single aggregated eSign
          envelope.
        </p>
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
          <div className="flex items-start gap-2">
            <FileSignature className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div className="min-w-0 space-y-2">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">eSign lives on Open Accounts.</span> Forms from every
                account are combined into one signing package at the parent step—not per account.
              </p>
              {parentOpenAccountsId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={goToOpenAccountsForEsign}
                >
                  Go to Open Accounts (eSign package)
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {statusRows.map((row) => {
            const Icon = row.icon
            return (
              <div
                key={row.key}
                className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${row.border} ${row.bg}`}
              >
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${row.tone}`} />
                <div>
                  <p className={`font-medium ${row.tone}`}>{row.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Demo placeholder — connect to your rules engine and custody workflow.
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Lists & uploads
        </h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Required now documents</Label>
            <textarea
              className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.requiredDocsList as string) ?? ''}
              onChange={(e) => updateField('requiredDocsList', e.target.value)}
              placeholder="One per line"
            />
          </div>
          <div className="space-y-2">
            <Label>Missing documents</Label>
            <textarea
              className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.missingDocsList as string) ?? ''}
              onChange={(e) => updateField('missingDocsList', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Uploaded documents</Label>
            <textarea
              className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.uploadedDocsList as string) ?? ''}
              onChange={(e) => updateField('uploadedDocsList', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Forms for this account
        </h3>
        <p className="text-xs text-muted-foreground">
          Tags below are scoped to this account. The aggregated eSign envelope is assembled on Open Accounts.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Account &amp; owner forms</Badge>
          <Badge variant="outline">Funding forms</Badge>
          <Badge variant="outline">Feature / add-on forms</Badge>
          <Badge variant="outline">Transfer paperwork</Badge>
        </div>
        <div className="space-y-2">
          <Label>Exceptions / notes</Label>
          <textarea
            className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.exceptionsNotes as string) ?? ''}
            onChange={(e) => updateField('exceptionsNotes', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm">
            Preview this account’s package
          </Button>
          <Button type="button" size="sm">
            Mark account paperwork complete
          </Button>
        </div>
      </section>
    </div>
  )
}
