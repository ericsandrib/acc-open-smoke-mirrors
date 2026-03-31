import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export function ClientInfoForm() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Smith" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="john.smith@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input id="dob" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientType">Client Type</Label>
        <Select id="clientType">
          <option value="">Select type...</option>
          <option value="individual">Individual</option>
          <option value="joint">Joint</option>
          <option value="trust">Trust</option>
          <option value="corporate">Corporate</option>
        </Select>
      </div>
    </div>
  )
}
