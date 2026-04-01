import { useTaskData } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function ClientInfoForm() {
  const { data, updateField } = useTaskData('client-info')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          placeholder="e.g. Alex"
          value={(data.firstName as string) ?? ''}
          onChange={(e) => updateField('firstName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          placeholder="e.g. Chen"
          value={(data.lastName as string) ?? ''}
          onChange={(e) => updateField('lastName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={(data.email as string) ?? ''}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={(data.phone as string) ?? ''}
          onChange={(e) => updateField('phone', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input
          id="dob"
          type="date"
          value={(data.dob as string) ?? ''}
          onChange={(e) => updateField('dob', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Client type</Label>
        <Select
          value={(data.clientType as string) ?? ''}
          onValueChange={(v) => updateField('clientType', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="joint">Joint</SelectItem>
            <SelectItem value="trust">Trust</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
