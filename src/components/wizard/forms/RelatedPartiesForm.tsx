import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Trash2, Users, UserPlus, Building2, ChevronRight, Shield, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty } from '@/types/workflow'
import { AddHouseholdMemberSheet, AddContactSheet } from './AddPartySheet'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const contactCategories = ['Family', 'Professional', 'Other']
const organizationRoles = ['Trust', 'Employer', 'Business Entity', 'Foundation', 'Partnership']
const organizationCategories = ['Business', 'Legal', 'Other']
const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']

function AddOrganizationForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [orgName, setOrgName] = useState('')
  const [role, setRole] = useState('')
  const [category, setCategory] = useState('')

  const handleAdd = () => {
    if (!orgName.trim()) return
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id: `org-${Date.now()}`,
        name: orgName.trim(),
        organizationName: orgName.trim(),
        type: 'related_organization',
        role: role || undefined,
        relationshipCategory: category || undefined,
      },
    })
    onDone()
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Organization name</Label>
        <Input className="col-span-2" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Smith Family Trust" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Role</Label>
        <div className="col-span-2">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {organizationRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Category</Label>
        <div className="col-span-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {organizationCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!orgName.trim()}>Add organization</Button>
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

// --- Card components ---

function HouseholdMemberCard({ party }: { party: RelatedParty }) {
  const { dispatch } = useWorkflow()
  const [open, setOpen] = useState(false)

  const update = (updates: Partial<Omit<RelatedParty, 'id' | 'type' | 'isPrimary'>>) => {
    dispatch({ type: 'UPDATE_RELATED_PARTY', partyId: party.id, updates })
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-t-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-90' : ''}`} />
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
          {party.kycStatus === 'verified' && (
            <Badge variant="secondary" className="text-[10px] text-text-success-primary bg-fill-success-tertiary">Verified</Badge>
          )}
          {party.kycStatus === 'needs_kyc' && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[10px] text-text-warning-primary bg-fill-warning-tertiary">Needs verification</Badge>
                </TooltipTrigger>
                <TooltipContent><p>Identity verification required</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <DeleteButton party={party} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>First name</Label>
            <Input
              className="col-span-2"
              value={party.firstName ?? ''}
              onChange={(e) => update({ firstName: e.target.value, name: `${e.target.value} ${party.lastName ?? ''}`.trim() })}
              placeholder="e.g. Jane"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Last name</Label>
            <Input
              className="col-span-2"
              value={party.lastName ?? ''}
              onChange={(e) => update({ lastName: e.target.value, name: `${party.firstName ?? ''} ${e.target.value}`.trim() })}
              placeholder="e.g. Doe"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Relationship</Label>
            <div className="col-span-2">
              <Select value={party.relationship ?? ''} onValueChange={(v) => update({ relationship: v })}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Role</Label>
            <div className="col-span-2">
              <Select value={party.role ?? ''} onValueChange={(v) => update({ role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Email</Label>
            <Input
              className="col-span-2"
              value={party.email ?? ''}
              onChange={(e) => update({ email: e.target.value })}
              type="email"
              placeholder="name@example.com"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Phone</Label>
            <Input
              className="col-span-2"
              value={party.phone ?? ''}
              onChange={(e) => update({ phone: e.target.value })}
              type="tel"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Date of birth</Label>
            <Input
              className="col-span-2"
              value={party.dob ?? ''}
              onChange={(e) => update({ dob: e.target.value })}
              type="date"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {!party.isPrimary && (
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
      )}
    </div>
  )
}

function ContactCard({ party }: { party: RelatedParty }) {
  const { dispatch } = useWorkflow()
  const [open, setOpen] = useState(false)

  const update = (updates: Partial<Omit<RelatedParty, 'id' | 'type' | 'isPrimary'>>) => {
    dispatch({ type: 'UPDATE_RELATED_PARTY', partyId: party.id, updates })
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-t-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-90' : ''}`} />
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
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>First name</Label>
            <Input
              className="col-span-2"
              value={party.firstName ?? ''}
              onChange={(e) => update({ firstName: e.target.value, name: `${e.target.value} ${party.lastName ?? ''}`.trim() })}
              placeholder="e.g. Jane"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Last name</Label>
            <Input
              className="col-span-2"
              value={party.lastName ?? ''}
              onChange={(e) => update({ lastName: e.target.value, name: `${party.firstName ?? ''} ${e.target.value}`.trim() })}
              placeholder="e.g. Doe"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Relationship</Label>
            <div className="col-span-2">
              <Select value={party.relationship ?? ''} onValueChange={(v) => update({ relationship: v })}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  {contactRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Category</Label>
            <div className="col-span-2">
              <Select value={party.relationshipCategory ?? ''} onValueChange={(v) => update({ relationshipCategory: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {contactCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Email</Label>
            <Input
              className="col-span-2"
              value={party.email ?? ''}
              onChange={(e) => update({ email: e.target.value })}
              type="email"
              placeholder="name@example.com"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Phone</Label>
            <Input
              className="col-span-2"
              value={party.phone ?? ''}
              onChange={(e) => update({ phone: e.target.value })}
              type="tel"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function OrganizationCard({ party }: { party: RelatedParty }) {
  const { dispatch } = useWorkflow()
  const [open, setOpen] = useState(false)

  const update = (updates: Partial<Omit<RelatedParty, 'id' | 'type' | 'isPrimary'>>) => {
    dispatch({ type: 'UPDATE_RELATED_PARTY', partyId: party.id, updates })
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-t-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-90' : ''}`} />
          <span className="text-sm font-medium">{party.organizationName ?? party.name}</span>
          {party.role && (
            <span className="text-xs text-muted-foreground">{party.role}</span>
          )}
          {party.relationshipCategory && (
            <Badge variant="outline" className="text-[10px]">{party.relationshipCategory}</Badge>
          )}
        </div>
        <DeleteButton party={party} />
      </button>
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Organization name</Label>
            <Input
              className="col-span-2"
              value={party.organizationName ?? ''}
              onChange={(e) => update({ organizationName: e.target.value, name: e.target.value })}
              placeholder="e.g. Smith Family Trust"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Role</Label>
            <div className="col-span-2">
              <Select value={party.role ?? ''} onValueChange={(v) => update({ role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {organizationRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Category</Label>
            <div className="col-span-2">
              <Select value={party.relationshipCategory ?? ''} onValueChange={(v) => update({ relationshipCategory: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {organizationCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
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
          mode === 'new'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('new')}
      >
        New
      </button>
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
        Existing
      </button>
    </div>
  )
}

// --- Restore hidden parties checklist ---

function RestorePartiesChecklist({
  hiddenParties,
  onRestore,
  onCancel,
}: {
  hiddenParties: RelatedParty[]
  onRestore: (ids: string[]) => void
  onCancel: () => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Select members to add back to this onboarding journey.
      </p>
      <div className="space-y-2">
        {hiddenParties.map((party) => (
          <label
            key={party.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
          >
            <Checkbox
              checked={selectedIds.has(party.id)}
              onCheckedChange={() => toggle(party.id)}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{party.name}</span>
              {party.relationship && (
                <span className="text-xs text-muted-foreground">{party.relationship}</span>
              )}
              {party.role && (
                <span className="text-xs text-muted-foreground">{party.role}</span>
              )}
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          onClick={() => onRestore(Array.from(selectedIds))}
          disabled={selectedIds.size === 0}
        >
          Restore{selectedIds.size > 0 ? ` ${selectedIds.size}` : ''} {selectedIds.size === 1 ? 'member' : 'members'}
        </Button>
      </div>
    </div>
  )
}

// --- Compact restore section (inline, no cancel needed) ---

function RestoreSection({
  hiddenParties,
  onRestore,
}: {
  hiddenParties: RelatedParty[]
  onRestore: (ids: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-xs text-primary hover:underline"
      >
        Restore previously removed ({hiddenParties.length})
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
      <p className="text-xs text-muted-foreground">Select to restore:</p>
      <div className="space-y-1.5">
        {hiddenParties.map((party) => (
          <label
            key={party.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2 text-sm transition-colors hover:bg-muted/50"
          >
            <Checkbox
              checked={selectedIds.has(party.id)}
              onCheckedChange={() => toggle(party.id)}
            />
            <span className="font-medium">{party.name}</span>
            {party.relationship && (
              <span className="text-xs text-muted-foreground">{party.relationship}</span>
            )}
          </label>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => { setExpanded(false); setSelectedIds(new Set()) }}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onRestore(Array.from(selectedIds))
            setExpanded(false)
            setSelectedIds(new Set())
          }}
          disabled={selectedIds.size === 0}
        >
          Restore {selectedIds.size || ''}
        </Button>
      </div>
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

// --- Main form ---

export function RelatedPartiesForm() {
  const { state, dispatch } = useWorkflow()
  const [showAddHouseholdSheet, setShowAddHouseholdSheet] = useState(false)
  const [showAddContactSheet, setShowAddContactSheet] = useState(false)
  const [showAddOrg, setShowAddOrg] = useState(false)
  const [orgAddMode, setOrgAddMode] = useState<'new' | 'existing'>('new')

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const hiddenHouseholdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && p.isHidden)
  const relatedContacts = state.relatedParties.filter((p) => p.type === 'related_contact' && !p.isHidden)
  const hiddenContacts = state.relatedParties.filter((p) => p.type === 'related_contact' && p.isHidden)
  const relatedOrgs = state.relatedParties.filter((p) => p.type === 'related_organization' && !p.isHidden)
  const hiddenOrgs = state.relatedParties.filter((p) => p.type === 'related_organization' && p.isHidden)

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
              <HouseholdMemberCard key={member.id} party={member} />
            ))
          )}
        </div>

        <HiddenMembersNote count={hiddenHouseholdMembers.length} typeLabel="member" />

        {hiddenHouseholdMembers.length > 0 && (
          <RestoreSection
            hiddenParties={hiddenHouseholdMembers}
            onRestore={(ids) => dispatch({ type: 'RESTORE_RELATED_PARTIES', partyIds: ids })}
          />
        )}

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
              <ContactCard key={contact.id} party={contact} />
            ))
          )}
        </div>

        <HiddenMembersNote count={hiddenContacts.length} typeLabel="contact" />

        {hiddenContacts.length > 0 && (
          <RestoreSection
            hiddenParties={hiddenContacts}
            onRestore={(ids) => dispatch({ type: 'RESTORE_RELATED_PARTIES', partyIds: ids })}
          />
        )}

        <Button variant="outline" className="w-full" onClick={() => setShowAddContactSheet(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add contact
        </Button>

        <AddContactSheet open={showAddContactSheet} onOpenChange={setShowAddContactSheet} />
      </section>

      {/* Related Organizations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Related Organizations</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Businesses, trusts, or entities connected to the household.
        </p>

        <div className="space-y-2">
          {relatedOrgs.length === 0 ? (
            <EmptyState message="No related organizations yet. Add linked businesses, trusts, or entities." />
          ) : (
            relatedOrgs.map((org) => (
              <OrganizationCard key={org.id} party={org} />
            ))
          )}
        </div>

        <HiddenMembersNote count={hiddenOrgs.length} typeLabel="organization" />

        {showAddOrg ? (
          <div className="space-y-3">
            {hiddenOrgs.length > 0 && (
              <AddModeToggle mode={orgAddMode} onModeChange={setOrgAddMode} />
            )}
            {orgAddMode === 'new' || hiddenOrgs.length === 0 ? (
              <AddOrganizationForm onDone={() => { setShowAddOrg(false); setOrgAddMode('new') }} />
            ) : (
              <RestorePartiesChecklist
                hiddenParties={hiddenOrgs}
                onRestore={(ids) => {
                  dispatch({ type: 'RESTORE_RELATED_PARTIES', partyIds: ids })
                  setShowAddOrg(false)
                  setOrgAddMode('new')
                }}
                onCancel={() => { setShowAddOrg(false); setOrgAddMode('new') }}
              />
            )}
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAddOrg(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add organization
          </Button>
        )}
      </section>
    </div>
  )
}
