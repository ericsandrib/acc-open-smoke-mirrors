import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function ClientInfoForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="firstName">First Name</Label>
        <Input id="firstName" placeholder="John" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="lastName">Last Name</Label>
        <Input id="lastName" placeholder="Smith" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="john.smith@example.com" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input id="dob" type="date" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Client Type</Label>
        <div className="col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
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
    </div>
  )
}
