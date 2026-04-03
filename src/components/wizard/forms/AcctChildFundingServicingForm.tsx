import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const fundingSources = [
  { value: 'transfer', label: 'Transfer from Another Account' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'check', label: 'Check Deposit' },
  { value: 'ach', label: 'ACH / EFT' },
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
  const { state } = useWorkflow()
  const taskId = `${state.activeChildActionId}-funding-servicing`
  const { data, updateField } = useTaskData(taskId)

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Funding
        </h3>

        <div className="space-y-2">
          <Label>Funding Source</Label>
          <Select
            value={(data.fundingSource as string) ?? ''}
            onValueChange={(v) => updateField('fundingSource', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select funding source..." />
            </SelectTrigger>
            <SelectContent>
              {fundingSources.map((src) => (
                <SelectItem key={src.value} value={src.value}>{src.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.fundingSource === 'transfer' && (
          <div className="space-y-2">
            <Label>Transfer From (Account #)</Label>
            <Input
              value={(data.transferFromAccount as string) ?? ''}
              onChange={(e) => updateField('transferFromAccount', e.target.value)}
              placeholder="Account number to transfer from"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Initial Funding Amount</Label>
          <Input
            value={(data.fundingAmount as string) ?? ''}
            onChange={(e) => updateField('fundingAmount', e.target.value)}
            placeholder="e.g. 100,000"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Servicing
        </h3>

        <div className="space-y-2">
          <Label>Servicing Model</Label>
          <Select
            value={(data.servicingModel as string) ?? ''}
            onValueChange={(v) => updateField('servicingModel', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select servicing model..." />
            </SelectTrigger>
            <SelectContent>
              {servicingModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dividend / Capital Gains Handling</Label>
          <Select
            value={(data.dividendHandling as string) ?? ''}
            onValueChange={(v) => updateField('dividendHandling', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select handling..." />
            </SelectTrigger>
            <SelectContent>
              {dividendOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Servicing Notes</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Any special servicing instructions..."
            value={(data.servicingNotes as string) ?? ''}
            onChange={(e) => updateField('servicingNotes', e.target.value)}
          />
        </div>
      </section>
    </div>
  )
}
