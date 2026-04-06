import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type { BeneficiarySlot, InterestedPartySlot } from '@/types/partySlot'

export function InterestedPartySlotFields({
  slot,
  onChange,
}: {
  slot: InterestedPartySlot
  onChange: (patch: Partial<InterestedPartySlot>) => void
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-border/80">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interested party details</p>
      <div className="space-y-2">
        <Label className="text-xs">Relationship to account</Label>
        <Input
          className="h-9"
          value={slot.relationshipToAccount ?? ''}
          onChange={(e) => onChange({ relationshipToAccount: e.target.value })}
          placeholder="e.g. Attorney-in-fact, CPA"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={!!slot.receiveDuplicateStatements}
          onCheckedChange={(c) => onChange({ receiveDuplicateStatements: c === true })}
        />
        Receive duplicate statements
      </label>
    </div>
  )
}

export function BeneficiarySlotFields({
  slot,
  onChange,
}: {
  slot: BeneficiarySlot
  onChange: (patch: Partial<BeneficiarySlot>) => void
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-border/80">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beneficiary designation</p>
      <div className="space-y-2">
        <Label className="text-xs">Designation type</Label>
        <Select
          value={slot.designationType ?? ''}
          onValueChange={(v) => onChange({ designationType: v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="contingent">Contingent</SelectItem>
            <SelectItem value="tod">Transfer on death</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Allocation %</Label>
        <Input
          className="h-9 tabular-nums"
          inputMode="decimal"
          value={slot.allocationPercent ?? ''}
          onChange={(e) => onChange({ allocationPercent: e.target.value })}
          placeholder="e.g. 50"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={!!slot.perStirpes}
          onCheckedChange={(c) => onChange({ perStirpes: c === true })}
        />
        Per stirpes
      </label>
    </div>
  )
}
