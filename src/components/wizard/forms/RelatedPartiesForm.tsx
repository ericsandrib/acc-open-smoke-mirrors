import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Users, UserPlus, Building2, ChevronRight, Shield } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty } from '@/types/workflow'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const contactCategories = ['Family', 'Professional', 'Other']
const organizationRoles = ['Trust', 'Employer', 'Business Entity', 'Foundation', 'Partnership']
const organizationCategories = ['Business', 'Legal', 'Other']
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
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>First name</Label>
        <Input className="col-span-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Last name</Label>
        <Input className="col-span-2" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Relationship</Label>
        <div className="col-span-2">
          <Select value={relationship} onValueChange={setRelationship}>
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
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Email</Label>
        <Input className="col-span-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@example.com" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Phone</Label>
        <Input className="col-span-2" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>Add member</Button>
      </div>
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
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>First name</Label>
        <Input className="col-span-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Last name</Label>
        <Input className="col-span-2" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Relationship</Label>
        <div className="col-span-2">
          <Select value={relationship} onValueChange={setRelationship}>
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
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {contactCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Email</Label>
        <Input className="col-span-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@example.com" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Phone</Label>
        <Input className="col-span-2" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>Add contact</Button>
      </div>
    </div>
  )
}

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
        <Input className="col-span-2" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" />
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
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-90' : ''}`} />
          <span className="text-sm font-medium">{party.name}</span>
          {party.role && (
            <span className="text-xs text-muted-foreground">{party.role}</span>
          )}
          {party.isPrimary && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Shield className="h-2.5 w-2.5" />
              Primary
            </Badge>
          )}
          {party.kycStatus === 'verified' && (
            <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-100">Verified</Badge>
          )}
          {party.kycStatus === 'needs_kyc' && (
            <Badge variant="secondary" className="text-[10px] text-amber-700 bg-amber-100">Needs KYC</Badge>
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
              placeholder="First name"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Last name</Label>
            <Input
              className="col-span-2"
              value={party.lastName ?? ''}
              onChange={(e) => update({ lastName: e.target.value, name: `${party.firstName ?? ''} ${e.target.value}`.trim() })}
              placeholder="Last name"
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
              placeholder="email@example.com"
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
              placeholder="First name"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Last name</Label>
            <Input
              className="col-span-2"
              value={party.lastName ?? ''}
              onChange={(e) => update({ lastName: e.target.value, name: `${party.firstName ?? ''} ${e.target.value}`.trim() })}
              placeholder="Last name"
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
              placeholder="email@example.com"
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
              placeholder="Organization name"
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

// --- Main form ---

export function RelatedPartiesForm() {
  const { state } = useWorkflow()
  const [showAddHousehold, setShowAddHousehold] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddOrg, setShowAddOrg] = useState(false)

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member')
  const relatedContacts = state.relatedParties.filter((p) => p.type === 'related_contact')
  const relatedOrgs = state.relatedParties.filter((p) => p.type === 'related_organization')

  return (
    <div className="space-y-8">
      {/* Household Members */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Household Members</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Household members included in this onboarding journey.
        </p>

        <div className="space-y-2">
          {householdMembers.length === 0 ? (
            <EmptyState message="No household members added. Add at least the primary contact to continue." />
          ) : (
            householdMembers.map((member) => (
              <HouseholdMemberCard key={member.id} party={member} />
            ))
          )}
        </div>

        {showAddHousehold ? (
          <AddHouseholdMemberForm onDone={() => setShowAddHousehold(false)} />
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAddHousehold(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add member
          </Button>
        )}
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

        {showAddContact ? (
          <AddContactForm onDone={() => setShowAddContact(false)} />
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAddContact(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add contact
          </Button>
        )}
      </section>

      {/* Related Organizations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Related Organizations</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Businesses and entities linked to this household.
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

        {showAddOrg ? (
          <AddOrganizationForm onDone={() => setShowAddOrg(false)} />
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
