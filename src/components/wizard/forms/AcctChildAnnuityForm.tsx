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
import { Checkbox } from '@/components/ui/checkbox'

const annuityTypes = [
  { value: 'fixed', label: 'Fixed Annuity' },
  { value: 'variable', label: 'Variable Annuity' },
  { value: 'indexed', label: 'Fixed Indexed Annuity' },
  { value: 'immediate', label: 'Immediate Annuity (SPIA)' },
  { value: 'deferred', label: 'Deferred Income Annuity (DIA)' },
]

const payoutFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'lump-sum', label: 'Lump Sum' },
]

export function AcctChildAnnuityForm() {
  const { state } = useWorkflow()
  const taskId = `${state.activeChildActionId}-annuity`
  const { data, updateField } = useTaskData(taskId)

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Annuity Details
        </h3>

        <div className="space-y-2">
          <Label>Annuity Type</Label>
          <Select
            value={(data.annuityType as string) ?? ''}
            onValueChange={(v) => updateField('annuityType', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select annuity type..." />
            </SelectTrigger>
            <SelectContent>
              {annuityTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Carrier / Insurance Company</Label>
          <Input
            value={(data.carrier as string) ?? ''}
            onChange={(e) => updateField('carrier', e.target.value)}
            placeholder="e.g. Lincoln Financial, Pacific Life"
          />
        </div>

        <div className="space-y-2">
          <Label>Premium Amount</Label>
          <Input
            value={(data.premiumAmount as string) ?? ''}
            onChange={(e) => updateField('premiumAmount', e.target.value)}
            placeholder="e.g. 250,000"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Payout Configuration
        </h3>

        <div className="space-y-2">
          <Label>Payout Frequency</Label>
          <Select
            value={(data.payoutFrequency as string) ?? ''}
            onValueChange={(v) => updateField('payoutFrequency', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency..." />
            </SelectTrigger>
            <SelectContent>
              {payoutFrequencies.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Guaranteed Period (years)</Label>
          <Input
            value={(data.guaranteedPeriod as string) ?? ''}
            onChange={(e) => updateField('guaranteedPeriod', e.target.value)}
            placeholder="e.g. 10"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={(data.hasDeathBenefit as boolean) ?? false}
            onCheckedChange={(v) => updateField('hasDeathBenefit', v)}
          />
          <span className="text-sm">Include Enhanced Death Benefit Rider</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={(data.hasLivingBenefit as boolean) ?? false}
            onCheckedChange={(v) => updateField('hasLivingBenefit', v)}
          />
          <span className="text-sm">Include Guaranteed Living Benefit Rider</span>
        </label>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Beneficiary
        </h3>

        <div className="space-y-2">
          <Label>Primary Beneficiary</Label>
          <Input
            value={(data.primaryBeneficiary as string) ?? ''}
            onChange={(e) => updateField('primaryBeneficiary', e.target.value)}
            placeholder="Beneficiary name"
          />
        </div>

        <div className="space-y-2">
          <Label>Contingent Beneficiary</Label>
          <Input
            value={(data.contingentBeneficiary as string) ?? ''}
            onChange={(e) => updateField('contingentBeneficiary', e.target.value)}
            placeholder="Contingent beneficiary name"
          />
        </div>
      </section>
    </div>
  )
}
