import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Search, User, Building2, Plus, Hash, CreditCard, Fingerprint, Users, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import {
  searchPeople,
  searchEntities,
  type DirectoryPerson,
  type DirectoryEntity,
  type SearchField,
  type EntitySearchField,
} from '@/data/people-directory'

// ─── Constants ───

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const contactCategories = ['Family', 'Professional', 'Other']
const entityTypes = ['Trust', 'Employer', 'Business Entity', 'Foundation', 'Partnership']
const entityCategories = ['Business', 'Legal', 'Other']

const searchFieldLabels: Record<SearchField, string> = {
  all: 'All Fields',
  name: 'Name',
  accountNumber: 'Account #',
  ssn: 'Social Security #',
  taxId: 'Tax ID #',
  clientId: 'Client ID',
  household: 'Household',
}

const searchFieldIcons: Record<SearchField, typeof Search> = {
  all: Search,
  name: User,
  accountNumber: CreditCard,
  ssn: Fingerprint,
  taxId: FileText,
  clientId: Hash,
  household: Users,
}

const entitySearchFieldLabels: Record<EntitySearchField, string> = {
  all: 'All Fields',
  entityName: 'Entity Name',
  taxId: 'Tax ID / EIN',
  clientId: 'Client ID',
  contactPerson: 'Contact Person',
}

// ─── Debounce hook ───

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ─── Tab toggle ───

function TabToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: React.ReactNode }[]
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Person search result card ───

function PersonResultCard({
  person,
  onSelect,
}: {
  person: DirectoryPerson
  onSelect: (p: DirectoryPerson) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      className="w-full text-left rounded-lg border border-border p-3 space-y-2 hover:bg-muted/50 hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {person.firstName} {person.lastName}
        </span>
        {person.household && (
          <Badge variant="outline" className="text-[10px]">
            {person.household}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {person.accountNumber && (
          <MetadataItem icon={<CreditCard className="h-3 w-3" />} label="Account #" value={person.accountNumber} />
        )}
        {person.ssn && (
          <MetadataItem icon={<Fingerprint className="h-3 w-3" />} label="SSN" value={person.ssn} />
        )}
        {person.clientId && (
          <MetadataItem icon={<Hash className="h-3 w-3" />} label="Client ID" value={person.clientId} />
        )}
        {person.taxId && (
          <MetadataItem icon={<FileText className="h-3 w-3" />} label="Tax ID" value={person.taxId} />
        )}
      </div>
    </button>
  )
}

// ─── Entity search result card ───

function EntityResultCard({
  entity,
  onSelect,
}: {
  entity: DirectoryEntity
  onSelect: (e: DirectoryEntity) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entity)}
      className="w-full text-left rounded-lg border border-border p-3 space-y-2 hover:bg-muted/50 hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{entity.entityName}</span>
        <Badge variant="outline" className="text-[10px]">
          {entity.entityType}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {entity.taxId && (
          <MetadataItem icon={<FileText className="h-3 w-3" />} label="Tax ID / EIN" value={entity.taxId} />
        )}
        {entity.clientId && (
          <MetadataItem icon={<Hash className="h-3 w-3" />} label="Client ID" value={entity.clientId} />
        )}
        {entity.contactPerson && (
          <MetadataItem icon={<User className="h-3 w-3" />} label="Contact" value={entity.contactPerson} />
        )}
        {entity.jurisdiction && (
          <MetadataItem icon={<Building2 className="h-3 w-3" />} label="Jurisdiction" value={entity.jurisdiction} />
        )}
      </div>
    </button>
  )
}

function MetadataItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span className="opacity-70">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}

// ─── Person search panel ───

function PersonSearchPanel({ onSelect }: { onSelect: (p: DirectoryPerson) => void }) {
  const [query, setQuery] = useState('')
  const [field, setField] = useState<SearchField>('all')
  const debouncedQuery = useDebounce(query, 300)
  const results = searchPeople(debouncedQuery, field)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, account #, SSN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Select value={field} onValueChange={(v) => setField(v as SearchField)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(searchFieldLabels) as SearchField[]).map((f) => {
              const Icon = searchFieldIcons[f]
              return (
                <SelectItem key={f} value={f}>
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {searchFieldLabels[f]}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {debouncedQuery.trim() === '' ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Type to search for existing people
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results found for "{debouncedQuery}"
          </div>
        ) : (
          results.map((person) => (
            <PersonResultCard key={person.id} person={person} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Entity search panel ───

function EntitySearchPanel({ onSelect }: { onSelect: (e: DirectoryEntity) => void }) {
  const [query, setQuery] = useState('')
  const [field, setField] = useState<EntitySearchField>('all')
  const debouncedQuery = useDebounce(query, 300)
  const results = searchEntities(debouncedQuery, field)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by entity name, Tax ID, Client ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Select value={field} onValueChange={(v) => setField(v as EntitySearchField)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(entitySearchFieldLabels) as EntitySearchField[]).map((f) => (
              <SelectItem key={f} value={f}>
                {entitySearchFieldLabels[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {debouncedQuery.trim() === '' ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Type to search for existing entities
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results found for "{debouncedQuery}"
          </div>
        ) : (
          results.map((entity) => (
            <EntityResultCard key={entity.id} entity={entity} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Create Individual form (for contacts) ───

function CreateIndividualForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [category, setCategory] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ssn, setSsn] = useState('')
  const [dob, setDob] = useState('')

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
        ssn: ssn || undefined,
        dob: dob || undefined,
      },
    })
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">First name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Jane" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Last name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Relationship</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {contactRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {contactCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">SSN</Label>
        <Input value={ssn} onChange={(e) => setSsn(e.target.value)} placeholder="***-**-****" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Date of birth</Label>
        <Input value={dob} onChange={(e) => setDob(e.target.value)} type="date" max={new Date().toISOString().split('T')[0]} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Individual
        </Button>
      </div>
    </div>
  )
}

// ─── Create Entity form (for contacts) ───

function CreateEntityForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState('')
  const [category, setCategory] = useState('')
  const [taxId, setTaxId] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleAdd = () => {
    if (!entityName.trim()) return
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id: `contact-ent-${Date.now()}`,
        name: entityName.trim(),
        organizationName: entityName.trim(),
        type: 'related_contact',
        entityType: entityType || undefined,
        relationshipCategory: category || undefined,
        taxId: taxId || undefined,
        jurisdiction: jurisdiction || undefined,
        contactPerson: contactPerson || undefined,
        email: email || undefined,
        phone: phone || undefined,
      },
    })
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Entity name</Label>
        <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="e.g. Smith Family Trust LLC" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Entity type</Label>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {entityCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tax ID / EIN</Label>
        <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Jurisdiction</Label>
        <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="e.g. Delaware" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Contact person</Label>
        <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g. John Smith" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="entity@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!entityName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Entity
        </Button>
      </div>
    </div>
  )
}

// ─── Create Household Member form ───

function CreateHouseholdMemberForm({ onDone }: { onDone: () => void }) {
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
      <div className="space-y-1.5">
        <Label className="text-xs">First name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Jane" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Last name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Relationship</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Member
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// AddHouseholdMemberSheet — search existing + create new
// ═══════════════════════════════════════════════════

export function AddHouseholdMemberSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()
  const [tab, setTab] = useState<'search' | 'create'>('search')

  const handleSelectPerson = useCallback(
    (person: DirectoryPerson) => {
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id: `household-${Date.now()}`,
          name: `${person.firstName} ${person.lastName}`,
          firstName: person.firstName,
          lastName: person.lastName,
          type: 'household_member',
          email: person.email,
          phone: person.phone,
          dob: person.dob,
          accountNumber: person.accountNumber,
          ssn: person.ssn,
          taxId: person.taxId,
          clientId: person.clientId,
          kycStatus: 'needs_kyc',
        },
      })
      onOpenChange(false)
    },
    [dispatch, onOpenChange]
  )

  const resetAndClose = useCallback(() => {
    setTab('search')
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-3 space-y-1">
          <SheetTitle>Add Household Member</SheetTitle>
          <SheetDescription>
            Search for an existing person or create a new household member.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-4">
          <TabToggle
            value={tab}
            onChange={setTab}
            options={[
              { value: 'search', label: 'Search Existing', icon: <Search className="h-3.5 w-3.5" /> },
              { value: 'create', label: 'Create New', icon: <Plus className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-1 pb-4">
          {tab === 'search' ? (
            <PersonSearchPanel onSelect={handleSelectPerson} />
          ) : (
            <CreateHouseholdMemberForm onDone={resetAndClose} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════
// AddContactSheet — individual/entity toggle + search/create
// ═══════════════════════════════════════════════════

export function AddContactSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()
  const [contactKind, setContactKind] = useState<'individual' | 'entity'>('individual')
  const [tab, setTab] = useState<'search' | 'create'>('search')

  const handleSelectPerson = useCallback(
    (person: DirectoryPerson) => {
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id: `contact-${Date.now()}`,
          name: `${person.firstName} ${person.lastName}`,
          firstName: person.firstName,
          lastName: person.lastName,
          type: 'related_contact',
          email: person.email,
          phone: person.phone,
          dob: person.dob,
          accountNumber: person.accountNumber,
          ssn: person.ssn,
          taxId: person.taxId,
          clientId: person.clientId,
        },
      })
      onOpenChange(false)
    },
    [dispatch, onOpenChange]
  )

  const handleSelectEntity = useCallback(
    (entity: DirectoryEntity) => {
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id: `contact-ent-${Date.now()}`,
          name: entity.entityName,
          organizationName: entity.entityName,
          type: 'related_contact',
          entityType: entity.entityType,
          taxId: entity.taxId,
          clientId: entity.clientId,
          jurisdiction: entity.jurisdiction,
          contactPerson: entity.contactPerson,
          email: entity.email,
          phone: entity.phone,
        },
      })
      onOpenChange(false)
    },
    [dispatch, onOpenChange]
  )

  const resetAndClose = useCallback(() => {
    setTab('search')
    setContactKind('individual')
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-3 space-y-1">
          <SheetTitle>Add Related Contact</SheetTitle>
          <SheetDescription>
            Search for an existing contact or create a new one.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={contactKind}
          onValueChange={(v) => setContactKind(v as 'individual' | 'entity')}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList variant="border" className="w-full border-b border-border px-6">
            <TabsTrigger value="individual" className="flex-1 gap-1.5">
              <User className="h-3.5 w-3.5" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="entity" className="flex-1 gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Entity
            </TabsTrigger>
          </TabsList>

          <div className="px-6 pt-4 pb-3">
            <TabToggle
              value={tab}
              onChange={setTab}
              options={[
                { value: 'search', label: 'Search Existing', icon: <Search className="h-3.5 w-3.5" /> },
                { value: 'create', label: 'Create New', icon: <Plus className="h-3.5 w-3.5" /> },
              ]}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-1 pb-4">
            <TabsContent value="individual" className="mt-0">
              {tab === 'search' ? (
                <PersonSearchPanel onSelect={handleSelectPerson} />
              ) : (
                <CreateIndividualForm onDone={resetAndClose} />
              )}
            </TabsContent>

            <TabsContent value="entity" className="mt-0">
              {tab === 'search' ? (
                <EntitySearchPanel onSelect={handleSelectEntity} />
              ) : (
                <CreateEntityForm onDone={resetAndClose} />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
