import { useWorkflow } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function KycChildForm() {
  const { state } = useWorkflow()

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  if (!child) return null

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        KYC review for <strong>{child.name}</strong>
      </p>

      <div className="space-y-2">
        <Label htmlFor="idType">ID Type</Label>
        <Select id="idType">
          <option value="">Select ID type...</option>
          <option value="passport">Passport</option>
          <option value="drivers-license">Driver's License</option>
          <option value="national-id">National ID</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="idNumber">ID Number</Label>
        <Input id="idNumber" placeholder="Enter ID number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issueDate">Issue Date</Label>
        <Input id="issueDate" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input id="expiryDate" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="riskRating">Risk Rating</Label>
        <Select id="riskRating">
          <option value="">Select risk rating...</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pepCheck" />
        <Label htmlFor="pepCheck">Politically Exposed Person (PEP)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="sanctionsCheck" />
        <Label htmlFor="sanctionsCheck">Sanctions screening completed</Label>
      </div>
    </div>
  )
}
