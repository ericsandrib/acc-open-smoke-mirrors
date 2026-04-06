import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Plus, Trash2, Users, UserPlus, Shield } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty } from '@/types/workflow'
import { AddHouseholdMemberSheet, AddContactSheet } from './AddPartySheet'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const contactCategories = ['Family', 'Professional', 'Other']
const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']

// --- Delete confirmation button ---

function DeleteButton({ party }: { party: RelatedParty }) {
  const { dispatch } = useWorkflow()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  if (party.isPrimary) return null

  if (confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
        onClick={(e) => {
          e.stopPropagation()
          dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: party.id })
        }}
        aria-label={`Confirm remove ${party.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove?
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={(e) => {
        e.stopPropagation()
        setConfirming(true)
      }}
      aria-label={`Remove ${party.name}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}

// --- Card components (click to open side modal) ---

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function HouseholdMemberCard({ party, onClick }: { party: RelatedParty; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
            {getInitials(party.name)}
          </div>
          <span className="text-sm font-medium truncate">{party.name}</span>
          {party.role && (
            <span className="text-xs text-muted-foreground shrink-0">{party.role}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {party.isPrimary && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Shield className="h-2.5 w-2.5" />
              Primary
            </Badge>
          )}
          <DeleteButton party={party} />
        </div>
      </button>
    </div>
  )
}

function ContactCard({ party, onClick }: { party: RelatedParty; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
            {getInitials(party.name)}
          </div>
          <span className="text-sm font-medium">{party.name}</span>
          {party.relationship && (
            <span className="text-xs text-muted-foreground">{party.relationship}</span>
          )}
          {party.relationshipCategory && (
            <Badge variant="outline" className="text-[10px]">{party.relationshipCategory}</Badge>
          )}
        </div>
        <DeleteButton party={party} />
      </button>
    </div>
  )
}

// --- Edit party sheet (buffered save) ---

interface EditFields {
  firstName: string
  lastName: string
  relationship: string
  role: string
  relationshipCategory: string
  email: string
  phone: string
  dob: string
}

function snapshotFields(party: RelatedParty): EditFields {
  return {
    firstName: party.firstName ?? '',
    lastName: party.lastName ?? '',
    relationship: party.relationship ?? '',
    role: party.role ?? '',
    relationshipCategory: party.relationshipCategory ?? '',
    email: party.email ?? '',
    phone: party.phone ?? '',
    dob: party.dob ?? '',
  }
}

function EditPartySheet({
  party,
  open,
  onOpenChange,
}: {
  party: RelatedParty | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()
  const [fields, setFields] = useState<EditFields>({
    firstName: '', lastName: '', relationship: '', role: '',
    relationshipCategory: '', email: '', phone: '', dob: '',
  })
  const [snapshot, setSnapshot] = useState<EditFields>(fields)

  useEffect(() => {
    if (party && open) {
      const s = snapshotFields(party)
      setFields(s)
      setSnapshot(s)
    }
  }, [party?.id, open])

  if (!party) return null

  const isMember = party.type === 'household_member'
  const isDirty = Object.keys(snapshot).some(
    (k) => fields[k as keyof EditFields] !== snapshot[k as keyof EditFields]
  )

  const setField = (key: keyof EditFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const name = `${fields.firstName} ${fields.lastName}`.trim()
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId: party.id,
      updates: {
        firstName: fields.firstName || undefined,
        lastName: fields.lastName || undefined,
        name: name || party.name,
        relationship: fields.relationship || undefined,
        role: fields.role || undefined,
        relationshipCategory: fields.relationshipCategory || undefined,
        email: fields.email || undefined,
        phone: fields.phone || undefined,
        dob: fields.dob || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{party.name}</SheetTitle>
          <SheetDescription>
            {isMember ? 'Edit household member details.' : 'Edit contact details.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input
              value={fields.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              placeholder="e.g. Jane"
            />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input
              value={fields.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              placeholder="e.g. Doe"
            />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={fields.relationship} onValueChange={(v) => setField('relationship', v)}>
              <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {(isMember ? householdRelationships : contactRelationships).map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isMember ? (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={fields.role} onValueChange={(v) => setField('role', v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={fields.relationshipCategory} onValueChange={(v) => setField('relationshipCategory', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {contactCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={fields.email}
              onChange={(e) => setField('email', e.target.value)}
              type="email"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={fields.phone}
              onChange={(e) => setField('phone', e.target.value)}
              type="tel"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          {isMember && (
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input
                value={fields.dob}
                onChange={(e) => setField('dob', e.target.value)}
                type="date"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
          {isMember && !party.isPrimary && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => dispatch({ type: 'SET_PRIMARY_MEMBER', partyId: party.id })}
            >
              <Shield className="h-3.5 w-3.5" />
              Set as primary member
            </Button>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty}>
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- Empty state ---

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}


// --- Main form ---

export function RelatedPartiesForm() {
  const { state } = useWorkflow()
  const [showAddHouseholdSheet, setShowAddHouseholdSheet] = useState(false)
  const [showAddContactSheet, setShowAddContactSheet] = useState(false)
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const relatedContacts = state.relatedParties.filter((p) => p.type === 'related_contact' && !p.isHidden)
  const editingParty = editingPartyId ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null : null

  return (
    <div className="space-y-8">
      {/* Household Members */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Household Members</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          People in the household you're onboarding — the primary contact and their family.
        </p>

        <div className="space-y-2">
          {householdMembers.length === 0 ? (
            <EmptyState message="No household members added yet. Start by adding the primary contact." />
          ) : (
            householdMembers.map((member) => (
              <HouseholdMemberCard key={member.id} party={member} onClick={() => setEditingPartyId(member.id)} />
            ))
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={() => setShowAddHouseholdSheet(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add member
        </Button>

        <AddHouseholdMemberSheet open={showAddHouseholdSheet} onOpenChange={setShowAddHouseholdSheet} />
      </section>

      {/* Related Contacts */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Related Contacts</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Other people connected to the household — such as attorneys, accountants, or family.
        </p>

        <div className="space-y-2">
          {relatedContacts.length === 0 ? (
            <EmptyState message="No related contacts yet. Add attorneys, accountants, or family connections." />
          ) : (
            relatedContacts.map((contact) => (
              <ContactCard key={contact.id} party={contact} onClick={() => setEditingPartyId(contact.id)} />
            ))
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={() => setShowAddContactSheet(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add contact
        </Button>

        <AddContactSheet open={showAddContactSheet} onOpenChange={setShowAddContactSheet} />
      </section>

      {/* Edit party side-panel */}
      <EditPartySheet
        party={editingParty}
        open={!!editingPartyId}
        onOpenChange={(open) => { if (!open) setEditingPartyId(null) }}
      />
    </div>
  )
}
