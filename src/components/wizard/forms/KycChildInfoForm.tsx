import { useEffect, useRef } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function KycChildInfoForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateFields, updateField } = useTaskData(taskId || '__no_child__')
  const prePopulated = useRef(false)

  const child = ctx?.child ?? null

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
      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          placeholder="e.g. Jane"
          value={(data.firstName as string) ?? ''}
          onChange={(e) => updateField('firstName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          placeholder="e.g. Smith"
          value={(data.lastName as string) ?? ''}
          onChange={(e) => updateField('lastName', e.target.value)}
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
        <Label htmlFor="relationship">Relationship</Label>
        <Input
          id="relationship"
          placeholder="e.g. Spouse"
          value={(data.relationship as string) ?? ''}
          onChange={(e) => updateField('relationship', e.target.value)}
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
    </div>
  )
}
