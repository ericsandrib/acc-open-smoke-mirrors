import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Users, UserPlus, ChevronRight } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedPartyType } from '@/types/workflow'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const nonHouseholdRelationships = ['Business Partner', 'Beneficiary', 'Trustee', 'Power of Attorney', 'Authorized Signer']

function AddPartyForm({ type, onAdd }: { type: RelatedPartyType; onAdd: () => void }) {
  const { dispatch } = useWorkflow()
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [email, setEmail] = useState('')

  const relationships = type === 'household_member' ? householdRelationships : nonHouseholdRelationships

  const handleAdd = () => {
    if (!name.trim()) return
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id: `${type}-${Date.now()}`,
        name: name.trim(),
        type,
        relationship: relationship || undefined,
        email: email || undefined,
      },
    })
    setName('')
    setRelationship('')
    setEmail('')
    onAdd()
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Full Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="col-span-2"
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Relationship</Label>
        <div className="col-span-2">
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {relationships.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Email</Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="email@example.com"
          className="col-span-2"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onAdd}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>Add</Button>
      </div>
    </div>
  )
}

function PartyCard({ party, relationships }: { party: { id: string; name: string; type: RelatedPartyType; relationship?: string; email?: string }; relationships: string[] }) {
  const { dispatch } = useWorkflow()
  const [open, setOpen] = useState(false)

  const update = (updates: Partial<Pick<typeof party, 'name' | 'relationship' | 'email'>>) => {
    dispatch({ type: 'UPDATE_RELATED_PARTY', partyId: party.id, updates })
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className="text-sm font-medium">{party.name}</span>
          {party.relationship && (
            <span className="text-xs text-muted-foreground">{party.relationship}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: party.id })
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </button>
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Full Name</Label>
            <Input
              value={party.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Full name"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Relationship</Label>
            <div className="col-span-2">
              <Select value={party.relationship ?? ''} onValueChange={(v) => update({ relationship: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Email</Label>
            <Input
              value={party.email ?? ''}
              onChange={(e) => update({ email: e.target.value })}
              type="email"
              placeholder="email@example.com"
              className="col-span-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function RelatedPartiesForm() {
  const { state } = useWorkflow()
  const [showAddHousehold, setShowAddHousehold] = useState(false)
  const [showAddRelated, setShowAddRelated] = useState(false)

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member')
  const relatedParties = state.relatedParties.filter((p) => p.type === 'related_party')

  return (
    <div className="space-y-8">
      {/* Household Members Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Household Members</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          People in the household who will be onboarded as part of this account opening.
        </p>

        <div className="space-y-2">
          {householdMembers.map((member) => (
            <PartyCard key={member.id} party={member} relationships={householdRelationships} />
          ))}
        </div>

        {showAddHousehold ? (
          <AddPartyForm type="household_member" onAdd={() => setShowAddHousehold(false)} />
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAddHousehold(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Household Member
          </Button>
        )}
      </section>

      {/* Related Parties Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Related Parties</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Non-household members related to the people being onboarded (e.g. business partners, beneficiaries).
        </p>

        <div className="space-y-2">
          {relatedParties.map((party) => (
            <PartyCard key={party.id} party={party} relationships={nonHouseholdRelationships} />
          ))}
        </div>

        {showAddRelated ? (
          <AddPartyForm type="related_party" onAdd={() => setShowAddRelated(false)} />
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAddRelated(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Related Party
          </Button>
        )}
      </section>
    </div>
  )
}
