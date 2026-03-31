import { useEffect, useRef } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseChildSubTaskId } from '@/utils/kycChildSubTasks'

export function KycChildInfoForm() {
  const { state } = useWorkflow()
  const { data, updateFields, updateField } = useTaskData(state.activeTaskId)
  const prePopulated = useRef(false)

  // Find the child this sub-task belongs to
  const parsed = parseChildSubTaskId(state.activeTaskId)
  const child = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null

  // Pre-populate from RelatedParty on first render
  const party = child
    ? state.relatedParties.find((p) => p.name === child.name)
    : null

  useEffect(() => {
    if (party && !prePopulated.current && Object.keys(data).length === 0) {
      prePopulated.current = true
      updateFields({
        firstName: party.firstName ?? '',
        lastName: party.lastName ?? '',
        dob: party.dob ?? '',
        relationship: party.relationship ?? '',
        email: party.email ?? '',
        phone: party.phone ?? '',
      })
    }
  }, [party, data, updateFields])

  if (!child) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          placeholder="e.g. Jane"
          className="col-span-2"
          value={(data.firstName as string) ?? ''}
          onChange={(e) => updateField('firstName', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          placeholder="e.g. Smith"
          className="col-span-2"
          value={(data.lastName as string) ?? ''}
          onChange={(e) => updateField('lastName', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="dob">Date of birth</Label>
        <Input
          id="dob"
          type="date"
          className="col-span-2"
          value={(data.dob as string) ?? ''}
          onChange={(e) => updateField('dob', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="relationship">Relationship</Label>
        <Input
          id="relationship"
          placeholder="e.g. Spouse"
          className="col-span-2"
          value={(data.relationship as string) ?? ''}
          onChange={(e) => updateField('relationship', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          className="col-span-2"
          value={(data.email as string) ?? ''}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          className="col-span-2"
          value={(data.phone as string) ?? ''}
          onChange={(e) => updateField('phone', e.target.value)}
        />
      </div>
    </div>
  )
}
