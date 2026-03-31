import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function Placeholder1Form() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input id="accountNumber" placeholder="Auto-generated" disabled />
      </div>
      <div className="space-y-2">
        <Label>Branch Code</Label>
        <Select>
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
      <div className="space-y-2">
        <Label htmlFor="rmCode">Relationship Manager Code</Label>
        <Input id="rmCode" placeholder="RM-0001" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="onlineBanking" />
        <Label htmlFor="onlineBanking">Enable online banking access</Label>
      </div>
    </div>
  )
}

export function Placeholder2Form() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-2">
        <p className="text-sm font-medium">Review Summary</p>
        <p className="text-xs text-muted-foreground">
          All information has been collected and verified. Please review and confirm.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="termsAccepted" />
        <Label htmlFor="termsAccepted">I confirm all information is accurate</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="regulatoryAccepted" />
        <Label htmlFor="regulatoryAccepted">Regulatory disclosures acknowledged</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="dataConsent" />
        <Label htmlFor="dataConsent">Data processing consent granted</Label>
      </div>
    </div>
  )
}
