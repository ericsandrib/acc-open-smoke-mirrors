import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function RelatedPartiesForm() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h4 className="text-sm font-medium">Related Party #1</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rp1Name">Full Name</Label>
            <Input id="rp1Name" placeholder="Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="business-partner">Business Partner</SelectItem>
                <SelectItem value="beneficiary">Beneficiary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp1Email">Email</Label>
          <Input id="rp1Email" type="email" placeholder="jane.smith@example.com" />
        </div>
      </div>

      <Button variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Related Party
      </Button>
    </div>
  )
}
