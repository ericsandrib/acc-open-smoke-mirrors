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
import { SensitiveTaxIdInput } from '@/components/ui/sensitive-tax-id-input'
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
import { Search, Globe, User, Building2, Plus, Hash, CreditCard, Fingerprint, Users, FileText } from 'lucide-react'
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
  searchEntities,
  type DirectoryPerson,
  type DirectoryEntity,
  type SearchField,
  type CombinedSearchField,
  type EntitySearchField,
} from '@/data/people-directory'

// ─── Constants ───

export const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
export const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']
const contactRelationships = ['Attorney', 'Accountant', 'Financial Advisor', 'Parent', 'Guardian', 'Power of Attorney']
const professionalContactRelationships = new Set(['Attorney', 'Accountant', 'Financial Advisor'])
const contactCategories = ['Family', 'Professional', 'Other']
export const relatedIndividualRelationshipOptions: string[] = Array.from(
  new Set([...householdRelationships, ...contactRelationships.filter((r) => !professionalContactRelationships.has(r))]),
)
export type ClientInfoIndividualMode = 'related-family' | 'professional'
export const entityTypes = ['Trust', 'LLC', 'Corporation', 'Partnership', 'Foundation', 'Other']
const entityCategories = ['Business', 'Legal', 'Other']

const searchFieldLabels: Record<SearchField, string> = {
  all: 'Search All Fields',
  name: 'Name',
  accountNumber: 'Account #',
  ssn: 'Social Security #',
  taxId: 'Tax ID #',
  clientId: 'Client ID',
  household: 'Household',
}

const searchFieldIcons: Record<SearchField, typeof Search> = {
  all: Globe,
  name: User,
  accountNumber: CreditCard,
  ssn: Fingerprint,
  taxId: FileText,
  clientId: Hash,
  household: Users,
}

const combinedSearchFieldLabels: Record<CombinedSearchField, string> = {
  all: 'Search All Fields',
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
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {person.firstName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold">
            {person.firstName} {person.lastName}
          </span>
          {person.household && (
            <p className="text-[11px] text-muted-foreground leading-tight">
              {person.household}
            </p>
          )}
        </div>
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
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, account number, or SSN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>
      <Select value={field} onValueChange={(v) => setField(v as SearchField)}>
        <SelectTrigger className="w-full">
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

      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {debouncedQuery.trim() === '' ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Search for people already in your directory
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results for &ldquo;{debouncedQuery}&rdquo;. Try a different search or create a new member.
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

const entitySearchFieldLabels: Record<EntitySearchField, string> = {
  all: 'Search All Fields',
  entityName: 'Entity name',
  taxId: 'Tax ID / EIN',
  clientId: 'Client ID',
  contactPerson: 'Contact person',
}

const entitySearchFieldIcons: Record<EntitySearchField, typeof Search> = {
  all: Search,
  entityName: Building2,
  taxId: FileText,
  clientId: Hash,
  contactPerson: User,
}

function EntitySearchPanel({
  onSelect,
  trustOnly,
}: {
  onSelect: (e: DirectoryEntity) => void
  trustOnly: boolean
}) {
  const [query, setQuery] = useState('')
  const [field, setField] = useState<EntitySearchField>('all')
  const debouncedQuery = useDebounce(query, 300)
  const raw = searchEntities(debouncedQuery, field)
  const results = trustOnly
    ? raw.filter((e) => e.entityType === 'Trust')
    : raw.filter((e) => e.entityType !== 'Trust')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search legal entities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Select value={field} onValueChange={(v) => setField(v as EntitySearchField)}>
          <SelectTrigger className="w-[148px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(entitySearchFieldLabels) as EntitySearchField[]).map((f) => {
              const Icon = entitySearchFieldIcons[f]
              return (
                <SelectItem key={f} value={f}>
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {entitySearchFieldLabels[f]}
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
            Type to search for existing legal entities
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results for &ldquo;{debouncedQuery}&rdquo;. Try another search or create new.
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
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Last name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
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
        <SensitiveTaxIdInput value={ssn} onChange={(e) => setSsn(e.target.value)} placeholder="***-**-****" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Date of birth</Label>
        <Input value={dob} onChange={(e) => setDob(e.target.value)} type="date" max={new Date().toISOString().split('T')[0]} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add individual
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
        <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Smith Family Trust LLC" />
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
        <SensitiveTaxIdInput value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Jurisdiction</Label>
        <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="Delaware" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Contact person</Label>
        <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="John Smith" />
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

const REVENUE_RANGES = ['Under $500K', '$500K – $1M', '$1M – $5M', '$5M – $25M', '$25M+'] as const

function CreateHouseholdLegalEntityForm({
  onDone,
  onPartyAdded,
  legalEntityVariant = 'default',
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
  legalEntityVariant?: 'default' | 'trust-only' | 'non-trust'
}) {
  const { dispatch } = useWorkflow()

  const [legalName, setLegalName] = useState('')
  const [entityType, setEntityType] = useState(() => (legalEntityVariant === 'trust-only' ? 'Trust' : ''))
  const [taxId, setTaxId] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [cpFirstName, setCpFirstName] = useState('')
  const [cpLastName, setCpLastName] = useState('')
  const [cpDob, setCpDob] = useState('')
  const [cpSsn, setCpSsn] = useState('')
  const [cpAddress, setCpAddress] = useState('')
  const [cpRelationship, setCpRelationship] = useState('')

  const [beneficialOwners, setBeneficialOwners] = useState<Array<{ name: string; ownershipPercent: string }>>([
    { name: '', ownershipPercent: '' },
  ])

  const [bizIndustry, setBizIndustry] = useState('')
  const [bizSourceOfFunds, setBizSourceOfFunds] = useState('')
  const [bizRevenueRange, setBizRevenueRange] = useState('')

  const addOwner = () => setBeneficialOwners((prev) => [...prev, { name: '', ownershipPercent: '' }])
  const removeOwner = (idx: number) => setBeneficialOwners((prev) => prev.filter((_, i) => i !== idx))
  const updateOwner = (idx: number, field: 'name' | 'ownershipPercent', value: string) =>
    setBeneficialOwners((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)))

  const entityTypeOptions =
    legalEntityVariant === 'non-trust' ? entityTypes.filter((t) => t !== 'Trust') : entityTypes
  const resolvedEntityType =
    legalEntityVariant === 'trust-only' ? 'Trust' : entityType || undefined

  const handleAdd = () => {
    if (!legalName.trim()) return
    const id = `org-${Date.now()}`
    const validOwners = beneficialOwners.filter((o) => o.name.trim())
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
        name: legalName.trim(),
        organizationName: legalName.trim(),
        type: 'related_organization',
        entityType: resolvedEntityType,
        taxId: taxId || undefined,
        jurisdiction: jurisdiction || undefined,
        contactPerson: cpFirstName.trim() ? `${cpFirstName.trim()} ${cpLastName.trim()}` : undefined,
        email: email || undefined,
        phone: phone || undefined,
        relationshipCategory: 'Legal',
        controlPerson: cpFirstName.trim()
          ? {
              firstName: cpFirstName.trim(),
              lastName: cpLastName.trim(),
              dob: cpDob || undefined,
              ssn: cpSsn || undefined,
              address: cpAddress || undefined,
              relationship: cpRelationship || undefined,
            }
          : undefined,
        beneficialOwners: validOwners.length > 0 ? validOwners : undefined,
        businessProfile:
          bizIndustry || bizSourceOfFunds || bizRevenueRange
            ? {
                industry: bizIndustry || undefined,
                sourceOfFunds: bizSourceOfFunds || undefined,
                annualRevenueRange: bizRevenueRange || undefined,
              }
            : undefined,
      },
    })
    onPartyAdded?.(id)
    onDone()
  }

  return (
    <div className="space-y-6">
      {/* 1. Entity Information */}
      <section className="space-y-3">
        <h4 className={sectionCls}>1. Entity Information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Legal name</Label>
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Smith Family Trust LLC" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Entity type</Label>
            <Select
              value={entityType}
              onValueChange={setEntityType}
              disabled={legalEntityVariant === 'trust-only'}
            >
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>EIN / Tax ID</Label>
            <SensitiveTaxIdInput value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Jurisdiction of formation</Label>
            <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="Delaware, USA" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="entity@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Phone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* 2. Control Person (CIP) */}
      <section className="space-y-3">
        <h4 className={sectionCls}>2. Control Person</h4>
        <p className="text-xs text-muted-foreground">Required for Customer Identification Program (CIP) compliance.</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>First name</Label>
            <Input value={cpFirstName} onChange={(e) => setCpFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Last name</Label>
            <Input value={cpLastName} onChange={(e) => setCpLastName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Date of birth</Label>
            <Input type="date" value={cpDob} max={new Date().toISOString().split('T')[0]} onChange={(e) => setCpDob(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>SSN</Label>
            <SensitiveTaxIdInput value={cpSsn} onChange={(e) => setCpSsn(e.target.value)} placeholder="XXX-XX-XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Address</Label>
            <Input value={cpAddress} onChange={(e) => setCpAddress(e.target.value)} placeholder="Full address" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Relationship to entity</Label>
            <Input value={cpRelationship} onChange={(e) => setCpRelationship(e.target.value)} placeholder="e.g. Trustee, Managing Member, Director" />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* 3. Beneficial Owners (≥25%) */}
      <section className="space-y-3">
        <h4 className={sectionCls}>3. Beneficial Owners (&ge;25%)</h4>
        <p className="text-xs text-muted-foreground">List all individuals who directly or indirectly own 25% or more of the entity.</p>
        <div className="space-y-2">
          {beneficialOwners.map((owner, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className={fieldCls}>Name</Label>
                <Input value={owner.name} onChange={(e) => updateOwner(idx, 'name', e.target.value)} placeholder="Full name" />
              </div>
              <div className="w-28 space-y-1.5">
                <Label className={fieldCls}>Ownership %</Label>
                <Input value={owner.ownershipPercent} onChange={(e) => updateOwner(idx, 'ownershipPercent', e.target.value)} placeholder="e.g. 50" />
              </div>
              {beneficialOwners.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive h-9" onClick={() => removeOwner(idx)}>
                  &times;
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addOwner} className="mt-1">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add owner
        </Button>
      </section>

      <hr className="border-border" />

      {/* 4. Business Profile (AML Context) */}
      <section className="space-y-3">
        <h4 className={sectionCls}>4. Business Profile</h4>
        <p className="text-xs text-muted-foreground">Information used for AML risk assessment.</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Industry</Label>
            <Input value={bizIndustry} onChange={(e) => setBizIndustry(e.target.value)} placeholder="e.g. Financial Services, Real Estate" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Source of funds</Label>
            <Input value={bizSourceOfFunds} onChange={(e) => setBizSourceOfFunds(e.target.value)} placeholder="e.g. Business operations, Investment returns" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Annual revenue range</Label>
            <Select value={bizRevenueRange || undefined} onValueChange={setBizRevenueRange}>
              <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>
                {REVENUE_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
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

function HouseholdMemberKindRadioCards({
  value,
  onChange,
}: {
  value: 'individual' | 'entity'
  onChange: (v: 'individual' | 'entity') => void
}) {
  return (
    <div role="radiogroup" aria-label="Member type" className="grid grid-cols-2 gap-3">
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
            <p className="text-xs text-muted-foreground leading-snug">Add a person to this household.</p>
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
            <p className="text-xs text-muted-foreground leading-snug">Trust, LLC, or other organization.</p>
          </div>
        </div>
      </button>
    </div>
  )
}

const ID_TYPES = ['Driver\'s License', 'Passport', 'State ID', 'Military ID'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'

function CreateHouseholdIndividualForm({
  onDone,
  onPartyAdded,
  clientInfoMode = 'household',
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
  clientInfoMode?: 'household' | ClientInfoIndividualMode
}) {
  const { dispatch } = useWorkflow()
  const [form, setForm] = useState<IndividualAccountOwnerFormState>(() =>
    createEmptyIndividualAccountOwnerForm(),
  )
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idState, setIdState] = useState('')
  const [idExpiration, setIdExpiration] = useState('')
  const [contactCategory, setContactCategory] = useState<'Family' | 'Other'>('Family')

  const patch = (p: Partial<IndividualAccountOwnerFormState>) => setForm((prev) => ({ ...prev, ...p }))
  const relationshipOptions =
    clientInfoMode === 'professional'
      ? [...professionalContactRelationships]
      : clientInfoMode === 'related-family'
        ? relatedIndividualRelationshipOptions
        : householdRelationships

  const handleAdd = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return
    const { top, accountOwnerIndividual } = splitFormIntoPartyUpdate(form)

    if (clientInfoMode === 'household') {
      const id = `household-${Date.now()}`
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
      return
    }

    const id = `contact-${Date.now()}`
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
        type: 'related_contact',
        ...top,
        role: undefined,
        accountOwnerIndividual,
        relationshipCategory: clientInfoMode === 'professional' ? 'Professional' : contactCategory,
      },
    })
    onPartyAdded?.(id)
    onDone()
  }

  const mailingLocked = form.mailingSameAsLegal

  return (
    <div className="space-y-6">
      {/* 1. Personal Information */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Personal Information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>First name</Label>
            <Input value={form.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Middle name</Label>
            <Input value={form.middleName} onChange={(e) => patch({ middleName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Last name</Label>
            <Input value={form.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Suffix</Label>
            <Select value={form.suffix || '__none__'} onValueChange={(v) => patch({ suffix: v === '__none__' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(['Jr.', 'Sr.', 'II', 'III', 'IV', 'Esq.'] as const).map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Date of birth</Label>
            <Input type="date" value={form.dob} max={new Date().toISOString().split('T')[0]} onChange={(e) => patch({ dob: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>SSN / Tax ID</Label>
            <SensitiveTaxIdInput value={form.taxId} onChange={(e) => patch({ taxId: e.target.value })} placeholder="XXX-XX-XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Relationship</Label>
            <Select value={form.relationship || undefined} onValueChange={(v) => patch({ relationship: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {relationshipOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {clientInfoMode === 'related-family' ? (
            <div className="space-y-1.5">
              <Label className={fieldCls}>Contact category</Label>
              <Select value={contactCategory} onValueChange={(v) => setContactCategory(v as 'Family' | 'Other')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {clientInfoMode === 'household' ? (
            <div className="space-y-1.5">
              <Label className={fieldCls}>Role</Label>
              <Select value={form.role || undefined} onValueChange={(v) => patch({ role: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </section>

      <hr className="border-border" />

      {/* 2. Address & Contact */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Address</h4>
        <p className="text-xs text-muted-foreground font-medium">Legal (residential) address</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Street</Label>
            <Input value={form.legalStreet} onChange={(e) => patch({ legalStreet: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Apt / unit</Label>
            <Input value={form.legalApt} onChange={(e) => patch({ legalApt: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>City</Label>
            <Input value={form.legalCity} onChange={(e) => patch({ legalCity: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>State</Label>
            <Input value={form.legalState} onChange={(e) => patch({ legalState: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>ZIP</Label>
            <Input value={form.legalZip} onChange={(e) => patch({ legalZip: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Country</Label>
            <Input value={form.legalCountry} onChange={(e) => patch({ legalCountry: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="ind-mailing-same"
            checked={mailingLocked}
            onChange={(e) => patch({ mailingSameAsLegal: e.target.checked })}
            className="rounded border-border"
          />
          <Label htmlFor="ind-mailing-same" className="text-sm font-normal cursor-pointer">
            Mailing address is the same as legal address
          </Label>
        </div>

        {!mailingLocked && (
          <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium">Mailing address</p>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Street</Label>
              <Input value={form.mailingStreet} onChange={(e) => patch({ mailingStreet: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>City</Label>
              <Input value={form.mailingCity} onChange={(e) => patch({ mailingCity: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>State</Label>
              <Input value={form.mailingState} onChange={(e) => patch({ mailingState: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>ZIP</Label>
              <Input value={form.mailingZip} onChange={(e) => patch({ mailingZip: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Country</Label>
              <Input value={form.mailingCountry} onChange={(e) => patch({ mailingCountry: e.target.value })} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className={fieldCls}>Phone</Label>
          <Input type="tel" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className={fieldCls}>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} />
        </div>
      </section>

      <hr className="border-border" />

      {/* 3. ID Verification */}
      <section className="space-y-3">
        <h4 className={sectionCls}>ID Verification</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>ID type</Label>
            <Select value={idType || undefined} onValueChange={setIdType}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>ID number</Label>
            <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="ID number" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Issuing state</Label>
            <Input value={idState} onChange={(e) => setIdState(e.target.value)} placeholder="e.g. California" />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Expiration date</Label>
            <Input type="date" value={idExpiration} onChange={(e) => setIdExpiration(e.target.value)} />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* 4. Employment */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Employment</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Employment status</Label>
            <Select value={form.employmentStatus || undefined} onValueChange={(v) => patch({ employmentStatus: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['Employed', 'Self-employed', 'Retired', 'Unemployed'] as const).map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Employer name</Label>
            <Input value={form.employerName} onChange={(e) => patch({ employerName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Occupation</Label>
            <Input value={form.occupation} onChange={(e) => patch({ occupation: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Industry</Label>
            <Input value={form.industry} onChange={(e) => patch({ industry: e.target.value })} />
          </div>
        </div>
      </section>

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!form.firstName.trim() || !form.lastName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add individual
        </Button>
      </div>
    </div>
  )
}

function CreateHouseholdMemberForm({
  onDone,
  onPartyAdded,
  includeLegalEntityCreate = false,
  individualCreateOnly = false,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
  includeLegalEntityCreate?: boolean
  individualCreateOnly?: boolean
}) {
  const [createKind, setCreateKind] = useState<'individual' | 'entity'>('individual')

  if (individualCreateOnly) {
    return (
      <CreateHouseholdIndividualForm onDone={onDone} onPartyAdded={onPartyAdded} clientInfoMode="household" />
    )
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
      <HouseholdMemberKindRadioCards value={createKind} onChange={setCreateKind} />
      <div className="border-t border-border pt-4">
        {createKind === 'individual' ? (
          <CreateHouseholdIndividualForm onDone={onDone} onPartyAdded={onPartyAdded} />
        ) : (
          <CreateHouseholdLegalEntityForm onDone={onDone} onPartyAdded={onPartyAdded} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// AddHouseholdMemberSheet — search existing + create new
// ═══════════════════════════════════════════════════

const DEFAULT_HOUSEHOLD_MEMBER_SHEET_TITLE = 'Add household member'
const DEFAULT_HOUSEHOLD_MEMBER_SHEET_DESCRIPTION =
  'Find someone in your directory or add a new person to this household.'

export function AddHouseholdMemberSheet({
  open,
  onOpenChange,
  onPartyAdded,
  title = DEFAULT_HOUSEHOLD_MEMBER_SHEET_TITLE,
  description = DEFAULT_HOUSEHOLD_MEMBER_SHEET_DESCRIPTION,
  includeLegalEntityCreate = false,
  individualCreateOnly = false,
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
  /** For Client Info household, create flow is individual-only. */
  individualCreateOnly?: boolean
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
              individualCreateOnly={individualCreateOnly}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════
// Client Info — related/professional individuals
// ═══════════════════════════════════════════════════

export function AddClientInfoIndividualSheet({
  open,
  onOpenChange,
  onPartyAdded,
  clientInfoMode,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartyAdded?: (partyId: string) => void
  clientInfoMode: ClientInfoIndividualMode
  title: string
  description: string
}) {
  const { dispatch } = useWorkflow()
  const [tab, setTab] = useState<'search' | 'create'>('search')

  const handleSelectPerson = useCallback(
    (person: DirectoryPerson) => {
      const id = `contact-${Date.now()}`
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id,
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
          relationshipCategory: clientInfoMode === 'professional' ? 'Professional' : 'Family',
        },
      })
      onPartyAdded?.(id)
      onOpenChange(false)
    },
    [clientInfoMode, dispatch, onOpenChange, onPartyAdded],
  )

  const resetAndClose = useCallback(() => {
    setTab('search')
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent side="right" className="w-full flex flex-col gap-0 p-0 sm:max-w-lg">
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
            <CreateHouseholdIndividualForm
              onDone={resetAndClose}
              onPartyAdded={onPartyAdded}
              clientInfoMode={clientInfoMode}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════
// Client Info — trusts/other legal entities
// ═══════════════════════════════════════════════════

export function AddClientInfoLegalEntitySheet({
  open,
  onOpenChange,
  onPartyAdded,
  variant,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartyAdded?: (partyId: string) => void
  variant: 'trust' | 'other'
  title: string
  description: string
}) {
  const { dispatch } = useWorkflow()
  const [tab, setTab] = useState<'search' | 'create'>('search')
  const legalEntityVariant = variant === 'trust' ? 'trust-only' : 'non-trust'

  const handleSelectEntity = useCallback(
    (entity: DirectoryEntity) => {
      const id = `org-${Date.now()}`
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id,
          name: entity.entityName,
          organizationName: entity.entityName,
          type: 'related_organization',
          entityType: entity.entityType,
          taxId: entity.taxId,
          clientId: entity.clientId,
          jurisdiction: entity.jurisdiction,
          contactPerson: entity.contactPerson,
          email: entity.email,
          phone: entity.phone,
          relationshipCategory: 'Legal',
        },
      })
      onPartyAdded?.(id)
      onOpenChange(false)
    },
    [dispatch, onOpenChange, onPartyAdded],
  )

  const resetAndClose = useCallback(() => {
    setTab('search')
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent side="right" className="w-full flex flex-col gap-0 p-0 sm:max-w-2xl">
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
            <EntitySearchPanel onSelect={handleSelectEntity} trustOnly={variant === 'trust'} />
          ) : (
            <CreateHouseholdLegalEntityForm
              onDone={resetAndClose}
              onPartyAdded={onPartyAdded}
              legalEntityVariant={legalEntityVariant}
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
