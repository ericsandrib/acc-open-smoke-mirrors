import { useWorkflow } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function KycChildForm() {
  const { state } = useWorkflow()

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  if (!child) return null

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        KYC review for <strong>{child.name}</strong>
      </p>

      <div className="grid grid-cols-3 items-center gap-4">
        <Label>ID Type</Label>
        <div className="col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select ID type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers-license">Driver's License</SelectItem>
              <SelectItem value="national-id">National ID</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="idNumber">ID Number</Label>
        <Input id="idNumber" placeholder="Enter ID number" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="issueDate">Issue Date</Label>
        <Input id="issueDate" type="date" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input id="expiryDate" type="date" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Risk Rating</Label>
        <div className="col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select risk rating..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="pepCheck">Politically Exposed Person (PEP)</Label>
        <div className="col-span-2">
          <Checkbox id="pepCheck" />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="sanctionsCheck">Sanctions Screening Completed</Label>
        <div className="col-span-2">
          <Checkbox id="sanctionsCheck" />
        </div>
      </div>
    </div>
  )
}
