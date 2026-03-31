import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function Placeholder1Form() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input id="accountNumber" placeholder="Auto-generated" disabled className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Branch Code</Label>
        <div className="col-span-2">
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
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="rmCode">Relationship Manager Code</Label>
        <Input id="rmCode" placeholder="RM-0001" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="onlineBanking">Online Banking Access</Label>
        <div className="col-span-2">
          <Checkbox id="onlineBanking" />
        </div>
      </div>
    </div>
  )
}

export function Placeholder2Form() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-2">
        <p className="text-sm font-medium">Review Summary</p>
        <p className="text-xs text-muted-foreground">
          All information has been collected and verified. Please review and confirm.
        </p>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="termsAccepted">Information Accurate</Label>
        <div className="col-span-2">
          <Checkbox id="termsAccepted" />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="regulatoryAccepted">Regulatory Disclosures</Label>
        <div className="col-span-2">
          <Checkbox id="regulatoryAccepted" />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="dataConsent">Data Processing Consent</Label>
        <div className="col-span-2">
          <Checkbox id="dataConsent" />
        </div>
      </div>
    </div>
  )
}
