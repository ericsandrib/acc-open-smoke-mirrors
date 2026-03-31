import { useEffect } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import type { AccountType } from '@/types/workflow'

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

export function AcctChildDetailsForm() {
  const { state } = useWorkflow()

  const parsed = parseChildSubTaskId(state.activeTaskId)
  const child = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null

  const taskId = state.activeTaskId
  const { data, updateField } = useTaskData(taskId)

  // Auto-populate account type from child name on first render
  useEffect(() => {
    if (!child || data.accountType) return
    for (const [type, label] of Object.entries(accountTypeLabels)) {
      if (child.name.startsWith(label)) {
        updateField('accountType', type)
        updateField('accountName', child.name)
        return
      }
    }
  }, [child, data.accountType, updateField])

  const householdMembers = state.relatedParties.filter(
    (p) => p.type === 'household_member' && !p.isHidden,
  )

  const selectedHolders = (data.accountHolders as string[] | undefined) ?? []

  const toggleHolder = (partyId: string) => {
    const next = selectedHolders.includes(partyId)
      ? selectedHolders.filter((id) => id !== partyId)
      : [...selectedHolders, partyId]
    updateField('accountHolders', next)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          className="col-span-2"
          value={(data.accountName as string) ?? ''}
          onChange={(e) => updateField('accountName', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Account Type</Label>
        <div className="col-span-2">
          {data.accountType ? (
            <Badge variant="secondary" className="text-xs">
              {accountTypeLabels[data.accountType as AccountType] ?? data.accountType}
            </Badge>
          ) : (
            <Select
              value={(data.accountType as string) ?? ''}
              onValueChange={(v) => updateField('accountType', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="custodian">Custodian / Platform</Label>
        <Input
          id="custodian"
          className="col-span-2"
          placeholder="e.g., Fidelity, Schwab"
          value={(data.custodian as string) ?? ''}
          onChange={(e) => updateField('custodian', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 items-start gap-4">
        <Label className="pt-2">Account Holders</Label>
        <div className="col-span-2 space-y-2">
          {householdMembers.length > 0 ? (
            householdMembers.map((member) => (
              <label
                key={member.id}
                className="flex items-center gap-2 cursor-pointer rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedHolders.includes(member.id)}
                  onCheckedChange={() => toggleHolder(member.id)}
                />
                <span className="text-sm">{member.name}</span>
                {member.isPrimary && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                )}
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No household members available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="beneficiary">Beneficiary</Label>
        <Input
          id="beneficiary"
          className="col-span-2"
          placeholder="Beneficiary name"
          value={(data.beneficiary as string) ?? ''}
          onChange={(e) => updateField('beneficiary', e.target.value)}
        />
      </div>
    </div>
  )
}
