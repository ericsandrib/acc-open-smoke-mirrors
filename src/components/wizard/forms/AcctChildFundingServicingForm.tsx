import { useChildActionContext, useTaskData } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const fundingMethods = [
  { value: 'ach', label: 'ACH' },
  { value: 'wire', label: 'Wire' },
  { value: 'check', label: 'Check' },
  { value: 'journal', label: 'Journal' },
  { value: 'transfer', label: 'ACAT / transfer' },
  { value: 'rollover', label: 'Rollover' },
  { value: 'other', label: 'Other' },
]

const servicingModels = [
  { value: 'advisory', label: 'Advisory (Fee-based)' },
  { value: 'brokerage', label: 'Brokerage (Commission-based)' },
  { value: 'self-directed', label: 'Self-Directed' },
  { value: 'wrap', label: 'Wrap Program' },
]

const dividendOptions = [
  { value: 'reinvest', label: 'Reinvest' },
  { value: 'cash', label: 'Pay in Cash' },
  { value: 'transfer', label: 'Transfer to Another Account' },
]

export function AcctChildFundingServicingForm() {
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  const fs = data.fundingSource as string | undefined
  const needsBank = fs === 'ach' || fs === 'wire'

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/30 px-3 py-2">
        This funding step applies only to <span className="font-medium text-foreground">{ctx.child.name}</span>—the same
        parent/child pattern as <span className="font-medium text-foreground">Open Accounts</span>, where each spawned
        account has its own sub-steps. Use <span className="font-medium text-foreground">Back to Open Accounts</span> in
        the sidebar to work on a different account; add accounts from the parent Open Accounts task.
      </p>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Initial funding
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            How this account will be funded—this often triggers transfer- and funding-specific documents (see smart
            documents panel).
          </p>
        </div>

        <div className="space-y-2">
          <Label>Initial funding method</Label>
          <Select
            value={(data.fundingSource as string) ?? ''}
            onValueChange={(v) => updateField('fundingSource', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method…" />
            </SelectTrigger>
            <SelectContent>
              {fundingMethods.map((src) => (
                <SelectItem key={src.value} value={src.value}>
                  {src.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Initial funding amount</Label>
            <Input
              value={(data.fundingAmount as string) ?? ''}
              onChange={(e) => updateField('fundingAmount', e.target.value)}
              placeholder="e.g. 100,000"
            />
          </div>
          <div className="space-y-2">
            <Label>Transfer type</Label>
            <Select
              value={(data.transferScope as string) ?? ''}
              onValueChange={(v) => updateField('transferScope', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="If transfer…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Source of funds / source of wealth</Label>
            <textarea
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.sourceOfFundsWealth as string) ?? ''}
              onChange={(e) => updateField('sourceOfFundsWealth', e.target.value)}
              placeholder="Employment income, sale of business, inheritance, etc."
            />
          </div>
        </div>
      </section>

      {fs === 'transfer' && (
        <section className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            ACAT / external transfer
          </h3>
          <div className="space-y-2">
            <Label>Delivering firm</Label>
            <Input
              value={(data.deliveringFirm as string) ?? ''}
              onChange={(e) => updateField('deliveringFirm', e.target.value)}
              placeholder="Firm name / DTC as applicable"
            />
          </div>
          <div className="space-y-2">
            <Label>Transfer from (account #)</Label>
            <Input
              value={(data.transferFromAccount as string) ?? ''}
              onChange={(e) => updateField('transferFromAccount', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Asset transfer details / instructions</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.transferInstructions as string) ?? ''}
              onChange={(e) => updateField('transferInstructions', e.target.value)}
            />
          </div>
        </section>
      )}

      {needsBank && (
        <section className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Bank details (ACH / wire)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Financial institution</Label>
              <Input
                value={(data.bankName as string) ?? ''}
                onChange={(e) => updateField('bankName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Routing / ABA</Label>
              <Input
                value={(data.bankRouting as string) ?? ''}
                onChange={(e) => updateField('bankRouting', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account # (masked in production)</Label>
              <Input
                value={(data.bankAccountNumber as string) ?? ''}
                onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Standing instructions & acknowledgments
        </h3>
        <div className="space-y-2">
          <Label>Standing money movement instructions</Label>
          <textarea
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.standingMoneyInstructions as string) ?? ''}
            onChange={(e) => updateField('standingMoneyInstructions', e.target.value)}
            placeholder="Recurring ACH, sweeps, etc."
          />
        </div>
        <div className="space-y-2">
          <Label>Transaction-level acknowledgments</Label>
          <textarea
            className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.fundingAcknowledgments as string) ?? ''}
            onChange={(e) => updateField('fundingAcknowledgments', e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Servicing (demo)
        </h3>
        <div className="space-y-2">
          <Label>Servicing model</Label>
          <Select
            value={(data.servicingModel as string) ?? ''}
            onValueChange={(v) => updateField('servicingModel', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select servicing model…" />
            </SelectTrigger>
            <SelectContent>
              {servicingModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dividend / capital gains handling</Label>
          <Select
            value={(data.dividendHandling as string) ?? ''}
            onValueChange={(v) => updateField('dividendHandling', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select handling…" />
            </SelectTrigger>
            <SelectContent>
              {dividendOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Servicing notes</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Any special servicing instructions…"
            value={(data.servicingNotes as string) ?? ''}
            onChange={(e) => updateField('servicingNotes', e.target.value)}
          />
        </div>
      </section>
    </div>
  )
}
