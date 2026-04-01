import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Plus, Trash2, Users, UserPlus, ChevronRight, Shield, Info, Search, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty, RelatedPartyType } from '@/types/workflow'
import { relationships } from '@/data/relationships'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const contactCategories = ['Family', 'Professional', 'Other']
const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']

// --- Add forms per type ---

function AddHouseholdMemberForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleAdd = () => {
    if (!firstName.trim() || !lastName.trim()) return
    const name = `${firstName.trim()} ${lastName.trim()}`
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id: `household-${Date.now()}`,
        name,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        type: 'household_member',
        relationship: relationship || undefined,
        role: role || undefined,
        email: email || undefined,
        phone: phone || undefined,
        kycStatus: 'needs_kyc',
      },
    })
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>First name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Jane" />
      </div>
      <div className="space-y-2">
        <Label>Last name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" />
      </div>
      <div className="space-y-2">
        <Label>Relationship</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
          <SelectContent>
            {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <Button className="w-full" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>Add member</Button>
    </div>
  )
}

function AddContactForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [category, setCategory] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleAdd = () => {
    if (!firstName.trim() || !lastName.trim()) return
    const name = `${firstName.trim()} ${lastName.trim()}`
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id: `contact-${Date.now()}`,
        name,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        type: 'related_contact',
        relationship: relationship || undefined,
        relationshipCategory: category || undefined,
        email: email || undefined,
        phone: phone || undefined,
      },
    })
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>First name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Jane" />
      </div>
      <div className="space-y-2">
        <Label>Last name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" />
      </div>
      <div className="space-y-2">
        <Label>Relationship</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
          <SelectContent>
            {contactRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {contactCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <Button className="w-full" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>Add contact</Button>
    </div>
  )
}

// --- Search existing across households ---

function SearchExistingForm({
  partyTypeFilter,
  existingPartyIds,
  onAdd,
  onCancel,
}: {
  partyTypeFilter: RelatedPartyType
  existingPartyIds: Set<string>
  onAdd: (parties: RelatedParty[]) => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredHouseholds = useMemo(() => {
    const q = query.toLowerCase().trim()
    return relationships.filter((r) => {
      const members = r.relatedParties.filter(
        (p) => p.type === partyTypeFilter && !existingPartyIds.has(p.id)
      )
      if (members.length === 0) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.primaryContact.firstName.toLowerCase().includes(q) ||
        r.primaryContact.lastName.toLowerCase().includes(q) ||
        members.some((m) => m.name.toLowerCase().includes(q))
      )
    })
  }, [query, partyTypeFilter, existingPartyIds])

  const selectedHousehold = selectedHouseholdId
    ? relationships.find((r) => r.id === selectedHouseholdId)
    : null

  const availableMembers = selectedHousehold
    ? selectedHousehold.relatedParties.filter(
        (p) => p.type === partyTypeFilter && !existingPartyIds.has(p.id)
      )
    : []

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddSelected = () => {
    if (!selectedHousehold) return
    const parties = availableMembers.filter((m) => selectedIds.has(m.id))
    onAdd(parties)
  }

  if (selectedHousehold) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setSelectedHouseholdId(null); setSelectedIds(new Set()) }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to search
        </button>
        <div className="space-y-1">
          <p className="text-sm font-medium">{selectedHousehold.name}</p>
          <p className="text-xs text-muted-foreground">
            {partyTypeFilter === 'household_member' ? 'Select members' : 'Select contacts'} to add to this journey.
          </p>
        </div>
        {availableMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            All {partyTypeFilter === 'household_member' ? 'members' : 'contacts'} from this household are already added.
          </p>
        ) : (
          <div className="space-y-2">
            {availableMembers.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedIds.has(member.id)}
                  onCheckedChange={() => toggle(member.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member.name}</span>
                    {member.role && (
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    )}
                    {member.relationship && (
                      <span className="text-xs text-muted-foreground">{member.relationship}</span>
                    )}
                  </div>
                  {member.email && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
        <Button
          className="w-full"
          onClick={handleAddSelected}
          disabled={selectedIds.size === 0}
        >
          Add {selectedIds.size > 0 ? selectedIds.size : ''} {selectedIds.size === 1
            ? (partyTypeFilter === 'household_member' ? 'member' : 'contact')
            : (partyTypeFilter === 'household_member' ? 'members' : 'contacts')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search households..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        {filteredHouseholds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {query ? 'No matching households found.' : 'No households with available members.'}
          </p>
        ) : (
          filteredHouseholds.map((household) => {
            const members = household.relatedParties.filter(
              (p) => p.type === partyTypeFilter && !existingPartyIds.has(p.id)
            )
            return (
              <button
                key={household.id}
                type="button"
                onClick={() => setSelectedHouseholdId(household.id)}
                className="flex items-center justify-between w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{household.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {household.primaryContact.firstName} {household.primaryContact.lastName}
                    {household.primaryContact.email && ` · ${household.primaryContact.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {members.length} {partyTypeFilter === 'household_member' ? 'member' : 'contact'}{members.length !== 1 ? 's' : ''}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

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

function HouseholdMemberCard({ party, onClick }: { party: RelatedParty; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2 min-w-0">
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
        <div className="flex items-center gap-2">
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

// --- Add mode toggle ---

function AddModeToggle({
  mode,
  onModeChange,
}: {
  mode: 'new' | 'existing'
  onModeChange: (mode: 'new' | 'existing') => void
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
      <button
        type="button"
        className={cn(
          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'existing'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('existing')}
      >
        Search existing
      </button>
      <button
        type="button"
        className={cn(
          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'new'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('new')}
      >
        Create new
      </button>
    </div>
  )
}

// --- Hidden members note ---

function HiddenMembersNote({ count, typeLabel }: { count: number; typeLabel: string }) {
  if (count === 0) return null
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <Info className="h-3.5 w-3.5 shrink-0" />
      {count} {typeLabel}{count > 1 ? 's' : ''} not included in this journey.
    </p>
  )
}

// --- Add party sheet ---

function AddPartySheet({
  open,
  onOpenChange,
  title,
  description,
  partyTypeFilter,
  existingPartyIds,
  onAddExisting,
  renderCreateForm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  partyTypeFilter: RelatedPartyType
  existingPartyIds: Set<string>
  onAddExisting: (parties: RelatedParty[]) => void
  renderCreateForm: (onDone: () => void) => React.ReactNode
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('existing')

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setMode('existing')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <AddModeToggle mode={mode} onModeChange={setMode} />
          {mode === 'existing' ? (
            <SearchExistingForm
              partyTypeFilter={partyTypeFilter}
              existingPartyIds={existingPartyIds}
              onAdd={(parties) => {
                onAddExisting(parties)
                handleOpenChange(false)
              }}
              onCancel={() => handleOpenChange(false)}
            />
          ) : (
            renderCreateForm(() => handleOpenChange(false))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- Main form ---

export function RelatedPartiesForm() {
  const { state, dispatch } = useWorkflow()
  const [showAddHousehold, setShowAddHousehold] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const hiddenHouseholdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && p.isHidden)
  const relatedContacts = state.relatedParties.filter((p) => p.type === 'related_contact' && !p.isHidden)
  const hiddenContacts = state.relatedParties.filter((p) => p.type === 'related_contact' && p.isHidden)
  const editingParty = editingPartyId ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null : null

  const existingHouseholdIds = useMemo(
    () => new Set(householdMembers.map((p) => p.id)),
    [householdMembers]
  )
  const existingContactIds = useMemo(
    () => new Set(relatedContacts.map((p) => p.id)),
    [relatedContacts]
  )

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

        <HiddenMembersNote count={hiddenHouseholdMembers.length} typeLabel="member" />

        <Button variant="outline" className="w-full" onClick={() => setShowAddHousehold(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add member
        </Button>
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

        <HiddenMembersNote count={hiddenContacts.length} typeLabel="contact" />

        <Button variant="outline" className="w-full" onClick={() => setShowAddContact(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add contact
        </Button>
      </section>

      {/* Side-panel sheets */}
      <AddPartySheet
        open={showAddHousehold}
        onOpenChange={setShowAddHousehold}
        title="Add Member"
        description="Search for an existing member across households or create a new one."
        partyTypeFilter="household_member"
        existingPartyIds={existingHouseholdIds}
        onAddExisting={(parties) => {
          parties.forEach((p) => dispatch({ type: 'ADD_RELATED_PARTY', party: { ...p, id: `imported-${p.id}-${Date.now()}`, isPrimary: false, kycStatus: p.kycStatus ?? 'needs_kyc' } }))
        }}
        renderCreateForm={(onDone) => <AddHouseholdMemberForm onDone={onDone} />}
      />

      <AddPartySheet
        open={showAddContact}
        onOpenChange={setShowAddContact}
        title="Add Contact"
        description="Search for an existing contact across households or create a new one."
        partyTypeFilter="related_contact"
        existingPartyIds={existingContactIds}
        onAddExisting={(parties) => {
          parties.forEach((p) => dispatch({ type: 'ADD_RELATED_PARTY', party: { ...p, id: `imported-${p.id}-${Date.now()}` } }))
        }}
        renderCreateForm={(onDone) => <AddContactForm onDone={onDone} />}
      />

      <EditPartySheet
        party={editingParty}
        open={!!editingPartyId}
        onOpenChange={(open) => { if (!open) setEditingPartyId(null) }}
      />
    </div>
  )
}
