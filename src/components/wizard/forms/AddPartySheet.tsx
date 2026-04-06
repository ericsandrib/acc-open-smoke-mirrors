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
import { AccountOwnerIndividualFormFields } from '@/components/wizard/forms/AccountOwnerIndividualFormFields'
import {
  createEmptyIndividualAccountOwnerForm,
  splitFormIntoPartyUpdate,
  type IndividualAccountOwnerFormState,
} from '@/types/accountOwnerIndividual'
import {
  searchPeople,
  searchAll,
  type DirectoryPerson,
  type DirectoryEntity,
  type SearchField,
  type CombinedSearchField,
} from '@/data/people-directory'

// ─── Constants ───

export const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
export const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const contactCategories = ['Family', 'Professional', 'Other']
export const entityTypes = ['Trust', 'Employer', 'Business Entity', 'Foundation', 'Partnership']
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

const combinedSearchFieldLabels: Record<CombinedSearchField, string> = {
  all: 'All Fields',
  name: 'Name',
  accountNumber: 'Account #',
  taxId: 'Tax ID / EIN',
  clientId: 'Client ID',
}

const combinedSearchFieldIcons: Record<CombinedSearchField, typeof Search> = {
  all: Search,
  name: User,
  accountNumber: CreditCard,
  taxId: FileText,
  clientId: Hash,
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

// ─── Related contact create: Individual vs Entity (radio cards) ───

function ContactCreateKindRadioCards({
  value,
  onChange,
}: {
  value: 'individual' | 'entity'
  onChange: (v: 'individual' | 'entity') => void
}) {
  return (
    <div role="radiogroup" aria-label="Contact type" className="grid grid-cols-2 gap-3">
      <button
        type="button"
        role="radio"
        aria-checked={value === 'individual'}
        onClick={() => onChange('individual')}
        className={cn(
          'rounded-lg border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value === 'individual'
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
            : 'border-border bg-background hover:bg-muted/40 hover:border-primary/25'
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 rounded-full border-2 items-center justify-center',
              value === 'individual' ? 'border-primary' : 'border-muted-foreground/35'
            )}
            aria-hidden
          >
            {value === 'individual' ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm font-semibold leading-tight">Individual</p>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">Add a person as a related contact.</p>
          </div>
        </div>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'entity'}
        onClick={() => onChange('entity')}
        className={cn(
          'rounded-lg border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value === 'entity'
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
            : 'border-border bg-background hover:bg-muted/40 hover:border-primary/25'
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 rounded-full border-2 items-center justify-center',
              value === 'entity' ? 'border-primary' : 'border-muted-foreground/35'
            )}
            aria-hidden
          >
            {value === 'entity' ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm font-semibold leading-tight">Entity</p>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">Company, trust, or other organization.</p>
          </div>
        </div>
      </button>
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

// ─── Combined search panel (people + entities) ───

function CombinedSearchPanel({
  onSelectPerson,
  onSelectEntity,
}: {
  onSelectPerson: (p: DirectoryPerson) => void
  onSelectEntity: (e: DirectoryEntity) => void
}) {
  const [query, setQuery] = useState('')
  const [field, setField] = useState<CombinedSearchField>('all')
  const debouncedQuery = useDebounce(query, 300)
  const results = searchAll(debouncedQuery, field)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search individuals and entities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Select value={field} onValueChange={(v) => setField(v as CombinedSearchField)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(combinedSearchFieldLabels) as CombinedSearchField[]).map((f) => {
              const Icon = combinedSearchFieldIcons[f]
              return (
                <SelectItem key={f} value={f}>
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {combinedSearchFieldLabels[f]}
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
            Type to search for existing contacts
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results found for &ldquo;{debouncedQuery}&rdquo;
          </div>
        ) : (
          results.map((entry) =>
            entry.type === 'individual' ? (
              <PersonResultCard key={entry.id} person={entry} onSelect={onSelectPerson} />
            ) : (
              <EntityResultCard key={entry.id} entity={entry} onSelect={onSelectEntity} />
            )
          )
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

// ─── Create legal entity (account owner / household sheet) ───

function CreateHouseholdLegalEntityForm({
  onDone,
  onPartyAdded,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
}) {
  const { dispatch } = useWorkflow()
  const [legalName, setLegalName] = useState('')
  const [entityType, setEntityType] = useState('')
  const [taxId, setTaxId] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [authorizedSignatory, setAuthorizedSignatory] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleAdd = () => {
    if (!legalName.trim()) return
    const id = `org-${Date.now()}`
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
        name: legalName.trim(),
        organizationName: legalName.trim(),
        type: 'related_organization',
        entityType: entityType || undefined,
        taxId: taxId || undefined,
        jurisdiction: jurisdiction || undefined,
        contactPerson: authorizedSignatory || undefined,
        email: email || undefined,
        phone: phone || undefined,
        relationshipCategory: 'Legal',
      },
    })
    onPartyAdded?.(id)
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Legal entity name</Label>
        <Input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="e.g. Smith Family Trust LLC"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Entity type</Label>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tax ID / EIN</Label>
        <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Jurisdiction of formation</Label>
        <Input
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          placeholder="e.g. Delaware, USA"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Authorized signatory</Label>
        <Input
          value={authorizedSignatory}
          onChange={(e) => setAuthorizedSignatory(e.target.value)}
          placeholder="Name of person authorized to act for this entity"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Email</Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="entity@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!legalName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add legal entity
        </Button>
      </div>
    </div>
  )
}

// ─── Full individual create (account owner: all suitability / regulatory sections) ───

function CreateAccountOwnerIndividualForm({
  onDone,
  onPartyAdded,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
}) {
  const { dispatch } = useWorkflow()
  const [form, setForm] = useState<IndividualAccountOwnerFormState>(() =>
    createEmptyIndividualAccountOwnerForm(),
  )

  const patch = (p: Partial<IndividualAccountOwnerFormState>) => {
    setForm((prev) => ({ ...prev, ...p }))
  }

  const handleAdd = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return
    const id = `household-${Date.now()}`
    const { top, accountOwnerIndividual } = splitFormIntoPartyUpdate(form)
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
        type: 'household_member',
        ...top,
        accountOwnerIndividual,
        kycStatus: 'needs_kyc',
      },
    })
    onPartyAdded?.(id)
    onDone()
  }

  return (
    <div className="space-y-4">
      <AccountOwnerIndividualFormFields value={form} onChange={patch} />
      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!form.firstName.trim() || !form.lastName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add individual
        </Button>
      </div>
    </div>
  )
}

// ─── Create Household Member form ───

function CreateHouseholdMemberForm({
  onDone,
  onPartyAdded,
  includeLegalEntityCreate = false,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
  /** When true (e.g. account owner), show Individual vs Legal entity tabs on Create. */
  includeLegalEntityCreate?: boolean
}) {
  const { dispatch } = useWorkflow()
  const [createKind, setCreateKind] = useState<'individual' | 'entity'>('individual')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleAddIndividual = () => {
    if (!firstName.trim() || !lastName.trim()) return
    const name = `${firstName.trim()} ${lastName.trim()}`
    const id = `household-${Date.now()}`
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
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
    onPartyAdded?.(id)
    onDone()
  }

  if (includeLegalEntityCreate) {
    return (
      <Tabs
        value={createKind}
        onValueChange={(v) => setCreateKind(v as 'individual' | 'entity')}
        className="w-full"
      >
        <TabsList variant="border" className="w-full border-b border-border mb-1">
          <TabsTrigger value="individual" className="flex-1 gap-1.5">
            <User className="h-3.5 w-3.5" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="entity" className="flex-1 gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Legal entity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="individual" className="mt-0">
          <CreateAccountOwnerIndividualForm onDone={onDone} onPartyAdded={onPartyAdded} />
        </TabsContent>
        <TabsContent value="entity" className="mt-0">
          <CreateHouseholdLegalEntityForm onDone={onDone} onPartyAdded={onPartyAdded} />
        </TabsContent>
      </Tabs>
    )
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
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {householdRelationships.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {householdRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
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
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAddIndividual} disabled={!firstName.trim() || !lastName.trim()}>
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

const DEFAULT_HOUSEHOLD_MEMBER_SHEET_TITLE = 'Add household member'
const DEFAULT_HOUSEHOLD_MEMBER_SHEET_DESCRIPTION =
  'Search for an existing person or create a new household member.'

export function AddHouseholdMemberSheet({
  open,
  onOpenChange,
  onPartyAdded,
  title = DEFAULT_HOUSEHOLD_MEMBER_SHEET_TITLE,
  description = DEFAULT_HOUSEHOLD_MEMBER_SHEET_DESCRIPTION,
  includeLegalEntityCreate = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the new party id after a member is added from search or create. */
  onPartyAdded?: (partyId: string) => void
  /** e.g. household member vs account owner vs KYC — defaults match Related parties / Collect client data */
  title?: string
  description?: string
  /** When true, Create tab offers Individual vs Legal entity (account owner flow). */
  includeLegalEntityCreate?: boolean
}) {
  const { dispatch } = useWorkflow()
  const [tab, setTab] = useState<'search' | 'create'>('search')

  const handleSelectPerson = useCallback(
    (person: DirectoryPerson) => {
      const id = `household-${Date.now()}`
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id,
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
      onPartyAdded?.(id)
      onOpenChange(false)
    },
    [dispatch, onOpenChange, onPartyAdded]
  )

  const resetAndClose = useCallback(() => {
    setTab('search')
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent
        side="right"
        className={cn(
          'w-full flex flex-col gap-0 p-0',
          includeLegalEntityCreate ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <SheetHeader className="px-6 pt-6 pb-3 space-y-1">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
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

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-1 pb-4">
          {tab === 'search' ? (
            <PersonSearchPanel onSelect={handleSelectPerson} />
          ) : (
            <CreateHouseholdMemberForm
              onDone={resetAndClose}
              onPartyAdded={onPartyAdded}
              includeLegalEntityCreate={includeLegalEntityCreate}
            />
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
  const [tab, setTab] = useState<'search' | 'create'>('search')
  const [contactKind, setContactKind] = useState<'individual' | 'entity'>('individual')

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
      <SheetContent side="right" className={cn('w-full flex flex-col gap-0 p-0', tab === 'create' ? 'sm:max-w-xl' : 'sm:max-w-lg')}>
        <SheetHeader className="px-6 pt-6 pb-3 space-y-1">
          <SheetTitle>Add Related Contact</SheetTitle>
          <SheetDescription>
            Search for an existing contact or create a new one.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-3">
          <TabToggle
            value={tab}
            onChange={setTab}
            options={[
              { value: 'search', label: 'Search Existing', icon: <Search className="h-3.5 w-3.5" /> },
              { value: 'create', label: 'Create New', icon: <Plus className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>

        {tab === 'search' ? (
          <div className="flex-1 overflow-y-auto px-6 pt-1 pb-4">
            <CombinedSearchPanel
              onSelectPerson={handleSelectPerson}
              onSelectEntity={handleSelectEntity}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-6 pb-4">
              <ContactCreateKindRadioCards value={contactKind} onChange={setContactKind} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4 border-t border-border">
              {contactKind === 'individual' ? (
                <CreateIndividualForm onDone={resetAndClose} />
              ) : (
                <CreateEntityForm onDone={resetAndClose} />
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
