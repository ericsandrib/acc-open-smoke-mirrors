import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function Placeholder1Form() {
  const { data, updateField } = useTaskData('placeholder-1')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input id="accountNumber" placeholder="Auto-generated" disabled className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Branch Code</Label>
        <div className="col-span-2">
          <Select
            value={(data.branchCode as string) ?? ''}
            onValueChange={(v) => updateField('branchCode', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nyc">New York - 001</SelectItem>
              <SelectItem value="lon">London - 002</SelectItem>
              <SelectItem value="zurich">Zurich - 003</SelectItem>
              <SelectItem value="singapore">Singapore - 004</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="rmCode">Relationship Manager Code</Label>
        <Input
          id="rmCode"
          placeholder="RM-0001"
          className="col-span-2"
          value={(data.rmCode as string) ?? ''}
          onChange={(e) => updateField('rmCode', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="onlineBanking">Online Banking Access</Label>
        <div className="col-span-2">
          <Checkbox
            id="onlineBanking"
            checked={!!data.onlineBanking}
            onCheckedChange={(v) => updateField('onlineBanking', v)}
          />
        </div>
      </div>
    </div>
  )
}

const branchLabels: Record<string, string> = {
  nyc: 'New York - 001',
  lon: 'London - 002',
  zurich: 'Zurich - 003',
  singapore: 'Singapore - 004',
}

export function Placeholder2Form() {
  const { state } = useWorkflow()
  const { data, updateField } = useTaskData('placeholder-2')
  const clientInfo = state.taskData['client-info'] ?? {}
  const accountSetup = state.taskData['placeholder-1'] ?? {}

  const clientName = [clientInfo.firstName, clientInfo.lastName].filter(Boolean).join(' ')
  const branch = branchLabels[accountSetup.branchCode as string] ?? undefined

  const hasSummary = clientName || branch

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-2">
        <p className="text-sm font-medium">Review Summary</p>
        {hasSummary ? (
          <dl className="text-xs text-muted-foreground space-y-1">
            {clientName && (
              <div className="flex gap-2">
                <dt className="font-medium">Client:</dt>
                <dd>{clientName}</dd>
              </div>
            )}
            {!!clientInfo.email && (
              <div className="flex gap-2">
                <dt className="font-medium">Email:</dt>
                <dd>{String(clientInfo.email)}</dd>
              </div>
            )}
            {branch && (
              <div className="flex gap-2">
                <dt className="font-medium">Branch:</dt>
                <dd>{branch}</dd>
              </div>
            )}
            {!!accountSetup.rmCode && (
              <div className="flex gap-2">
                <dt className="font-medium">RM Code:</dt>
                <dd>{String(accountSetup.rmCode)}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            All information has been collected and verified. Please review and confirm.
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="termsAccepted">Information Accurate</Label>
        <div className="col-span-2">
          <Checkbox
            id="termsAccepted"
            checked={!!data.termsAccepted}
            onCheckedChange={(v) => updateField('termsAccepted', v)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="regulatoryAccepted">Regulatory Disclosures</Label>
        <div className="col-span-2">
          <Checkbox
            id="regulatoryAccepted"
            checked={!!data.regulatoryAccepted}
            onCheckedChange={(v) => updateField('regulatoryAccepted', v)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="dataConsent">Data Processing Consent</Label>
        <div className="col-span-2">
          <Checkbox
            id="dataConsent"
            checked={!!data.dataConsent}
            onCheckedChange={(v) => updateField('dataConsent', v)}
          />
        </div>
      </div>
    </div>
  )
}
