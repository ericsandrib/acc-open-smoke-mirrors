import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Search, User, Building2, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty } from '@/types/workflow'
import { AccountOwnerIndividualFormFields } from '@/components/wizard/forms/AccountOwnerIndividualFormFields'
import {
  createEmptyIndividualAccountOwnerForm,
  hydrateIndividualFormFromDirectoryPerson,
  hydrateIndividualFormFromParty,
  splitFormIntoPartyUpdate,
  type IndividualAccountOwnerFormState,
} from '@/types/accountOwnerIndividual'
import {
  searchPeople,
  searchAll,
  searchEntities,
  type DirectoryPerson,
  type DirectoryEntity,
  type DirectoryEntry,
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

const ID_TYPES = ['Driver\'s License', 'Passport', 'State ID', 'Military ID'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'
const unifiedSheetWidthCls = 'sm:max-w-[488px]'

/** Pinned to the bottom of sheet scroll areas that use horizontal px-6 padding. */
const sheetStickyFooterCls =
  'sticky bottom-0 z-10 !mt-0 -mx-6 px-6 py-3 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-6px_18px_-6px_rgba(0,0,0,0.1)]'

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

function relatedPartyIsIndividualForBeneficiary(p: RelatedParty): boolean {
  if (p.isHidden) return false
  if (p.type === 'household_member') return true
  if (p.type === 'related_contact') {
    if (p.organizationName || p.entityType) return false
    return Boolean(p.firstName?.trim() || p.lastName?.trim() || p.name?.trim())
  }
  return false
}

function relatedPartyRowSubtitle(p: RelatedParty): string {
  if (p.type === 'household_member') {
    return p.role ? `Household · ${p.role}` : 'Household member'
  }
  const bits = [p.relationship, p.relationshipCategory].filter(Boolean)
  return bits.length > 0 ? bits.join(' · ') : 'Related contact'
}

/**
 * Same section order as RelatedPartiesForm (Client Info): Household → Related Individuals → Professional Contacts.
 * Within household, primary member first; within each group, preserve `relatedParties` array order.
 */
function sortClientRecordPartiesLikeClientInfo(allParties: RelatedParty[]): (a: RelatedParty, b: RelatedParty) => number {
  const indexById = new Map(allParties.map((p, i) => [p.id, i]))

  const clientInfoSection = (p: RelatedParty): 0 | 1 | 2 => {
    if (p.type === 'household_member') return 0
    if (p.type === 'related_contact') {
      return p.relationshipCategory === 'Professional' ? 2 : 1
    }
    return 2
  }

  return (a, b) => {
    const sa = clientInfoSection(a)
    const sb = clientInfoSection(b)
    if (sa !== sb) return sa - sb

    if (sa === 0 && a.type === 'household_member' && b.type === 'household_member') {
      const pa = a.isPrimary ? 0 : 1
      const pb = b.isPrimary ? 0 : 1
      if (pa !== pb) return pa - pb
    }

    return (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0)
  }
}

/** Pick from parties already captured in Collect Client Data (household + individual contacts). */
function RelatedIndividualsFromClientPanel({
  parties,
  excludePartyIds,
  onSave,
}: {
  parties: RelatedParty[]
  excludePartyIds?: string[]
  onSave: (partyId: string, fields: BeneficiaryManualCreateFields) => void
}) {
  const excluded = useMemo(() => new Set(excludePartyIds ?? []), [excludePartyIds])
  const rows = useMemo(() => {
    const eligible = parties.filter(
      (p) => relatedPartyIsIndividualForBeneficiary(p) && !excluded.has(p.id),
    )
    const sortFn = sortClientRecordPartiesLikeClientInfo(parties)
    return eligible.slice().sort(sortFn)
  }, [parties, excluded])
  const [selectedPartyId, setSelectedPartyId] = useState('')
  const [designationType, setDesignationType] = useState<BeneficiaryDesignationType>('primary')
  const [allocationPercent, setAllocationPercent] = useState('')
  const [relationshipIndicator, setRelationshipIndicator] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [taxIdType, setTaxIdType] = useState('')
  const [taxIdNumber, setTaxIdNumber] = useState('')

  const selectedParty = useMemo(
    () => rows.find((p) => p.id === selectedPartyId) ?? null,
    [rows, selectedPartyId],
  )

  const handleSelectClientRecord = (partyId: string) => {
    setSelectedPartyId(partyId)
    const party = rows.find((p) => p.id === partyId)
    if (!party) return
    setDesignationType('primary')
    setAllocationPercent('')
    setRelationshipIndicator('')
    setFirstName(party.firstName ?? '')
    setLastName(party.lastName ?? '')
    setDateOfBirth(party.dob ?? '')
    setGender('')
    setTaxIdType('')
    setTaxIdNumber(party.taxId ?? '')
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground space-y-2 px-1">
        <p>No household members or individual related contacts are available yet.</p>
        <p className="text-xs">
          Add people in <span className="font-medium text-foreground">Collect Client Data</span>, or use Directory or
          Create new.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="space-y-3">
        <h4 className={sectionCls}>Client Record Selection</h4>
        <div className="space-y-1.5">
          <Label className={fieldCls}>Select person</Label>
          <Select value={selectedPartyId || undefined} onValueChange={handleSelectClientRecord}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a household member or related contact" />
            </SelectTrigger>
            <SelectContent>
              {rows.map((party) => (
                <SelectItem key={party.id} value={party.id}>
                  {party.name || 'Unnamed'} - {relatedPartyRowSubtitle(party)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {selectedParty ? (
        <>
          <hr className="border-border" />
          <section className="space-y-3">
            <h4 className={sectionCls}>Personal Information</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Date of birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Gender</Label>
                <Select value={gender || undefined} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="X">Other / Unspecified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-3">
            <h4 className={sectionCls}>Beneficiary Designation</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Beneficiary type</Label>
                <Select
                  value={designationType}
                  onValueChange={(v) => setDesignationType(v as BeneficiaryDesignationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary (P)</SelectItem>
                    <SelectItem value="contingent">Contingent (C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Allocation %</Label>
                <Input
                  className="tabular-nums"
                  inputMode="decimal"
                  value={allocationPercent}
                  onChange={(e) => setAllocationPercent(clampBeneficiaryAllocationInput(e.target.value))}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Relationship to account owner</Label>
                <Select value={relationshipIndicator || undefined} onValueChange={setRelationshipIndicator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFICIARY_RELATIONSHIP_TO_OWNER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-3">
            <h4 className={sectionCls}>Tax Identification</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Tax ID type</Label>
                <Select value={taxIdType || undefined} onValueChange={setTaxIdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Social Security Number (S)</SelectItem>
                    <SelectItem value="T">Taxpayer Identification Number (T)</SelectItem>
                    <SelectItem value="N">National Identification Number (N)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Tax ID number</Label>
                <SensitiveTaxIdInput
                  value={taxIdNumber}
                  onChange={(e) => setTaxIdNumber(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
            </div>
          </section>

          <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
            <Button
              size="sm"
              onClick={() =>
                onSave(selectedParty.id, {
                  designationType,
                  allocationPercent: allocationPercent.trim() || undefined,
                  relationshipIndicator: relationshipIndicator || undefined,
                  firstName: firstName.trim() || undefined,
                  lastName: lastName.trim() || undefined,
                  dateOfBirth: dateOfBirth || undefined,
                  gender: gender || undefined,
                  taxIdType: taxIdType || undefined,
                  taxIdNumber: taxIdNumber.trim() || undefined,
                })
              }
              disabled={!firstName.trim() || !lastName.trim()}
            >
              Save beneficiary
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function BeneficiaryDirectorySearchPanel({
  onSave,
}: {
  onSave: (person: DirectoryPerson, fields: BeneficiaryManualCreateFields) => void
}) {
  const [query, setQuery] = useState('')
  const [searchDismissed, setSearchDismissed] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const results = searchPeople(debouncedQuery, 'all')
  const [selectedPerson, setSelectedPerson] = useState<DirectoryPerson | null>(null)
  const [designationType, setDesignationType] = useState<BeneficiaryDesignationType>('primary')
  const [allocationPercent, setAllocationPercent] = useState('')
  const [relationshipIndicator, setRelationshipIndicator] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [taxIdType, setTaxIdType] = useState('')
  const [taxIdNumber, setTaxIdNumber] = useState('')

  const searchAnchorRef = useRef<HTMLDivElement>(null)
  const [searchAnchorWidth, setSearchAnchorWidth] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    const el = searchAnchorRef.current
    if (!el) return
    const measure = () => setSearchAnchorWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const searchPopoverOpen = query.trim() !== '' && !searchDismissed

  const handleSelectPerson = (person: DirectoryPerson) => {
    setQuery('')
    setSearchDismissed(false)
    setSelectedPerson(person)
    setDesignationType('primary')
    setAllocationPercent('')
    setRelationshipIndicator('')
    setFirstName(person.firstName ?? '')
    setLastName(person.lastName ?? '')
    setDateOfBirth(person.dob ?? '')
    setGender('')
    setTaxIdType('')
    setTaxIdNumber(person.taxId ?? person.ssn ?? '')
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="space-y-3">
        <h4 className={sectionCls}>Directory Search</h4>
        <Popover
          open={searchPopoverOpen}
          onOpenChange={(open) => {
            if (!open) setSearchDismissed(true)
          }}
          modal={false}
        >
          <PopoverAnchor asChild>
            <div ref={searchAnchorRef} className="w-full">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone, client ID, tax ID, account #, household…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSearchDismissed(false)
                  }}
                  onFocus={() => {
                    if (query.trim()) setSearchDismissed(false)
                  }}
                  className="relative pl-9"
                  autoFocus
                />
              </div>
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={4}
            style={searchAnchorWidth != null ? { width: searchAnchorWidth } : undefined}
            className="z-[70] max-h-[min(16rem,50vh)] overflow-y-auto p-1 max-w-none data-[state=open]:animate-none"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {results.length === 0 ? (
              debouncedQuery.trim() === '' ? null : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {`No results for “${debouncedQuery}”.`}
                </div>
              )
            ) : (
              <div role="listbox" className="flex flex-col gap-0.5">
                {results.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    onClick={() => handleSelectPerson(person)}
                    className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                  >
                    <p className="text-sm font-medium">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[person.household, person.clientId ? `Client ID ${person.clientId}` : null].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </section>

      {selectedPerson ? (
        <>
          <hr className="border-border" />
          <section className="space-y-3">
            <h4 className={sectionCls}>Personal Information</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Date of birth</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Gender</Label>
                <Select value={gender || undefined} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="X">Other / Unspecified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-3">
            <h4 className={sectionCls}>Beneficiary Designation</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Beneficiary type</Label>
                <Select
                  value={designationType}
                  onValueChange={(v) => setDesignationType(v as BeneficiaryDesignationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary (P)</SelectItem>
                    <SelectItem value="contingent">Contingent (C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Allocation %</Label>
                <Input
                  className="tabular-nums"
                  inputMode="decimal"
                  value={allocationPercent}
                  onChange={(e) => setAllocationPercent(clampBeneficiaryAllocationInput(e.target.value))}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Relationship to account owner</Label>
                <Select value={relationshipIndicator || undefined} onValueChange={setRelationshipIndicator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFICIARY_RELATIONSHIP_TO_OWNER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-3">
            <h4 className={sectionCls}>Tax Identification</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Tax ID type</Label>
                <Select value={taxIdType || undefined} onValueChange={setTaxIdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Social Security Number (S)</SelectItem>
                    <SelectItem value="T">Taxpayer Identification Number (T)</SelectItem>
                    <SelectItem value="N">National Identification Number (N)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Tax ID number</Label>
                <SensitiveTaxIdInput
                  value={taxIdNumber}
                  onChange={(e) => setTaxIdNumber(e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
            </div>
          </section>

          <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
            <Button
              size="sm"
              onClick={() =>
                onSave(selectedPerson, {
                  designationType,
                  allocationPercent: allocationPercent.trim() || undefined,
                  relationshipIndicator: relationshipIndicator || undefined,
                  firstName: firstName.trim() || undefined,
                  lastName: lastName.trim() || undefined,
                  dateOfBirth: dateOfBirth || undefined,
                  gender: gender || undefined,
                  taxIdType: taxIdType || undefined,
                  taxIdNumber: taxIdNumber.trim() || undefined,
                })
              }
              disabled={!firstName.trim() || !lastName.trim()}
            >
              Save beneficiary
            </Button>
          </div>
        </>
      ) : null}
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
  const trimmedQuery = query.trim()
  const results = searchAll(trimmedQuery, 'all')
  const hasQuery = trimmedQuery !== ''

  const pickPerson = (p: DirectoryPerson) => {
    setQuery('')
    onSelectPerson(p)
  }
  const pickEntity = (e: DirectoryEntity) => {
    setQuery('')
    onSelectEntity(e)
  }

  /**
   * Render matches in normal document flow below the field (not Popover/portal).
   * Sheets + overflow + portaled/fixed layers were hiding results; in-flow always scrolls with the panel.
   */
  return (
    <div className="space-y-3">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search people or entities: name, ID, email, jurisdiction…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
          className="relative pl-9"
          autoFocus
          autoComplete="off"
          name="directory-combined-search"
        />
      </div>
      {hasQuery ? (
        <div
          role="listbox"
          aria-live="polite"
          className="max-h-[min(20rem,55vh)] min-h-[4.5rem] overflow-y-auto rounded-md border border-border bg-card p-1 text-card-foreground shadow-sm"
        >
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No results for &ldquo;{trimmedQuery}&rdquo;. Try another name, client ID, or email.
            </div>
          ) : (
            <>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
                {results.length} match{results.length === 1 ? '' : 'es'}
              </p>
              <div className="flex flex-col gap-0.5 pt-1">
                {results.map((entry) =>
                  entry.type === 'individual' ? (
                    <button
                      key={entry.id}
                      type="button"
                      role="option"
                      className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                      onClick={() => pickPerson(entry)}
                    >
                      <p className="text-sm font-medium">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Individual
                        {entry.household || entry.clientId
                          ? ` · ${[entry.household, entry.clientId ? `Client ID ${entry.clientId}` : null].filter(Boolean).join(' · ')}`
                          : ''}
                      </p>
                    </button>
                  ) : (
                    <button
                      key={entry.id}
                      type="button"
                      role="option"
                      className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                      onClick={() => pickEntity(entry)}
                    >
                      <p className="text-sm font-medium">{entry.entityName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[entry.entityType, entry.clientId ? `Client ID ${entry.clientId}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
      {!hasQuery ? (
        <p className="text-xs text-muted-foreground">Type to search individuals or legal entities.</p>
      ) : null}
    </div>
  )
}

/** Shared by Create New and directory search review for individuals (household + client-info modes). */
function IndividualManualEntryFormFields({
  form,
  patch,
  clientInfoMode,
  idType,
  setIdType,
  idNumber,
  setIdNumber,
  idState,
  setIdState,
  idExpiration,
  setIdExpiration,
  contactCategory,
  setContactCategory,
  fieldIdPrefix = '',
}: {
  form: IndividualAccountOwnerFormState
  patch: (p: Partial<IndividualAccountOwnerFormState>) => void
  clientInfoMode: 'household' | ClientInfoIndividualMode
  idType: string
  setIdType: (v: string) => void
  idNumber: string
  setIdNumber: (v: string) => void
  idState: string
  setIdState: (v: string) => void
  idExpiration: string
  setIdExpiration: (v: string) => void
  contactCategory: 'Family' | 'Other'
  setContactCategory: (v: 'Family' | 'Other') => void
  fieldIdPrefix?: string
}) {
  const relationshipOptions =
    clientInfoMode === 'professional'
      ? [...professionalContactRelationships]
      : clientInfoMode === 'related-family'
        ? relatedIndividualRelationshipOptions
        : householdRelationships
  const mailingLocked = form.mailingSameAsLegal
  const mailingCbId = `${fieldIdPrefix}ind-mailing-same`

  return (
    <div className="space-y-6 pb-20">
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
            id={mailingCbId}
            checked={mailingLocked}
            onChange={(e) => patch({ mailingSameAsLegal: e.target.checked })}
            className="rounded border-border"
          />
          <Label htmlFor={mailingCbId} className="text-sm font-normal cursor-pointer">
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
    </div>
  )
}

type SearchPersonReviewPanelProps =
  | {
      saveLabel?: string
      accountOwnerFields?: false
      clientInfoFull?: false
      onSave: (person: DirectoryPerson, patch: Partial<DirectoryPerson>) => void
    }
  | {
      saveLabel?: string
      accountOwnerFields: true
      directoryMatchParties?: RelatedParty[]
      onSave: (person: DirectoryPerson, form: IndividualAccountOwnerFormState) => void
    }
  | {
      saveLabel?: string
      clientInfoFull: true
      clientInfoMode: 'household' | ClientInfoIndividualMode
      directoryMatchParties?: RelatedParty[]
      /** `contactCategory` omitted when `clientInfoMode` is `household` (same as Create household individual). */
      onSave: (
        person: DirectoryPerson,
        form: IndividualAccountOwnerFormState,
        meta?: { contactCategory: 'Family' | 'Other' },
      ) => void
    }

type SearchPersonReviewEmbedProps = {
  /** Combined directory flow: start on review form for this person (skips search UI). */
  embedStartPerson?: DirectoryPerson
  hideSearchChrome?: boolean
  /** Hide the "Review & edit before adding" heading (e.g. KYC with search shown above). */
  omitReviewHeading?: boolean
}

function SearchPersonReviewPanel(props: SearchPersonReviewPanelProps & SearchPersonReviewEmbedProps) {
  const { saveLabel = 'Save', embedStartPerson, hideSearchChrome, omitReviewHeading } = props
  const clientInfoFull = 'clientInfoFull' in props && props.clientInfoFull === true
  const accountOwnerFields = 'accountOwnerFields' in props && props.accountOwnerFields === true

  const [query, setQuery] = useState('')
  const [searchDismissed, setSearchDismissed] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const results = searchPeople(debouncedQuery, 'all')
  const [selected, setSelected] = useState<DirectoryPerson | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [taxId, setTaxId] = useState('')
  const [accountOwnerForm, setAccountOwnerForm] = useState<IndividualAccountOwnerFormState>(() =>
    createEmptyIndividualAccountOwnerForm(),
  )
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idState, setIdState] = useState('')
  const [idExpiration, setIdExpiration] = useState('')
  const [contactCategory, setContactCategory] = useState<'Family' | 'Other'>('Family')
  const patchAccountOwnerForm = (p: Partial<IndividualAccountOwnerFormState>) =>
    setAccountOwnerForm((prev) => ({ ...prev, ...p }))

  const pick = (p: DirectoryPerson) => {
    setQuery('')
    setSelected(p)
    if (clientInfoFull) {
      const matchByClientId =
        p.clientId &&
        props.directoryMatchParties?.find(
          (rp) =>
            !rp.isHidden &&
            rp.clientId === p.clientId &&
            (rp.type === 'household_member' || rp.type === 'related_contact'),
        )
      setAccountOwnerForm(
        matchByClientId ? hydrateIndividualFormFromParty(matchByClientId) : hydrateIndividualFormFromDirectoryPerson(p),
      )
      setIdType('')
      setIdNumber('')
      setIdState('')
      setIdExpiration('')
      setContactCategory('Family')
    } else if (accountOwnerFields) {
      const matchByClientId =
        p.clientId &&
        props.directoryMatchParties?.find(
          (rp) => rp.type === 'household_member' && !rp.isHidden && rp.clientId === p.clientId,
        )
      setAccountOwnerForm(
        matchByClientId ? hydrateIndividualFormFromParty(matchByClientId) : hydrateIndividualFormFromDirectoryPerson(p),
      )
    } else {
      setFirstName(p.firstName ?? '')
      setLastName(p.lastName ?? '')
      setEmail(p.email ?? '')
      setPhone(p.phone ?? '')
      setDob(p.dob ?? '')
      setTaxId(p.taxId ?? p.ssn ?? '')
    }
  }

  const didApplyEmbed = useRef(false)
  useLayoutEffect(() => {
    if (!embedStartPerson || didApplyEmbed.current) return
    didApplyEmbed.current = true
    pick(embedStartPerson)
  }, [embedStartPerson])

  const handleSave = () => {
    if (!selected) return
    if (clientInfoFull && 'clientInfoFull' in props && props.clientInfoFull) {
      if (props.clientInfoMode === 'household') {
        props.onSave(selected, accountOwnerForm)
      } else {
        props.onSave(selected, accountOwnerForm, { contactCategory })
      }
      return
    }
    if (accountOwnerFields && 'accountOwnerFields' in props && props.accountOwnerFields) {
      props.onSave(selected, accountOwnerForm)
      return
    }
    ;(
      props as Extract<
        SearchPersonReviewPanelProps,
        { onSave: (person: DirectoryPerson, patch: Partial<DirectoryPerson>) => void }
      >
    ).onSave(selected, { firstName, lastName, email, phone, dob, taxId })
  }

  const saveDisabled =
    accountOwnerFields || clientInfoFull
      ? !accountOwnerForm.firstName.trim() || !accountOwnerForm.lastName.trim()
      : !firstName.trim() || !lastName.trim()

  const searchAnchorRef = useRef<HTMLDivElement>(null)
  const [searchAnchorWidth, setSearchAnchorWidth] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    const el = searchAnchorRef.current
    if (!el) return
    const measure = () => setSearchAnchorWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const searchPopoverOpen = query.trim() !== '' && !searchDismissed

  return (
    <div className="space-y-6 pb-20">
      {!hideSearchChrome ? (
        <section className="space-y-3">
          <h4 className={sectionCls}>Search Existing</h4>
          <Popover
            open={searchPopoverOpen}
            onOpenChange={(open) => {
              if (!open) setSearchDismissed(true)
            }}
            modal={false}
          >
            <PopoverAnchor asChild>
              <div ref={searchAnchorRef} className="w-full">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, phone, client ID, tax ID, account #, household…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSearchDismissed(false)
                    }}
                    onFocus={() => {
                      if (query.trim()) setSearchDismissed(false)
                    }}
                    className="relative pl-9"
                    autoFocus
                  />
                </div>
              </div>
            </PopoverAnchor>
            <PopoverContent
              align="start"
              sideOffset={4}
              style={searchAnchorWidth != null ? { width: searchAnchorWidth } : undefined}
              className="z-[70] max-h-[min(16rem,50vh)] overflow-y-auto p-1 max-w-none data-[state=open]:animate-none"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {results.length === 0 ? (
                debouncedQuery.trim() === '' ? null : (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No results for &ldquo;{debouncedQuery}&rdquo;.
                  </div>
                )
              ) : (
                <div role="listbox" className="flex flex-col gap-0.5">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      onClick={() => pick(p)}
                      className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                    >
                      <p className="text-sm font-medium">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[p.household, p.clientId ? `Client ID ${p.clientId}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </section>
      ) : null}

      {selected ? (
        <>
          {!hideSearchChrome ? <hr className="border-border" /> : null}
          <section className="space-y-3">
            {!omitReviewHeading ? (
              <h4 className={sectionCls}>
                {accountOwnerFields
                  ? 'Review & edit before adding'
                  : clientInfoFull
                    ? 'Review & edit before adding'
                    : 'Selected Individual'}
              </h4>
            ) : null}
            {clientInfoFull && 'clientInfoMode' in props ? (
              <IndividualManualEntryFormFields
                form={accountOwnerForm}
                patch={patchAccountOwnerForm}
                clientInfoMode={props.clientInfoMode}
                idType={idType}
                setIdType={setIdType}
                idNumber={idNumber}
                setIdNumber={setIdNumber}
                idState={idState}
                setIdState={setIdState}
                idExpiration={idExpiration}
                setIdExpiration={setIdExpiration}
                contactCategory={contactCategory}
                setContactCategory={setContactCategory}
                fieldIdPrefix="dir-search-"
              />
            ) : accountOwnerFields ? (
              <AccountOwnerIndividualFormFields value={accountOwnerForm} onChange={patchAccountOwnerForm} />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className={fieldCls}>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Phone</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Date of birth</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Tax ID</Label>
                  <SensitiveTaxIdInput value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </div>
              </div>
            )}
          </section>
          <div className={cn(sheetStickyFooterCls, 'flex justify-end')}>
            <Button size="sm" onClick={handleSave} disabled={saveDisabled}>
              {saveLabel}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function SearchEntityReviewPanel({
  legalEntityVariant,
  onSave,
  saveLabel = 'Save',
  embedStartEntity,
  hideSearchChrome,
  omitReviewHeading,
}: {
  legalEntityVariant: 'trust-only' | 'non-trust'
  onSave: (entity: DirectoryEntity, form: LegalEntityFormState) => void
  saveLabel?: string
  embedStartEntity?: DirectoryEntity
  hideSearchChrome?: boolean
  omitReviewHeading?: boolean
}) {
  const { state } = useWorkflow()
  const [query, setQuery] = useState('')
  const [searchDismissed, setSearchDismissed] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const raw = searchEntities(debouncedQuery, 'all')
  const results =
    legalEntityVariant === 'trust-only'
      ? raw.filter((e) => e.entityType === 'Trust')
      : raw.filter((e) => e.entityType !== 'Trust')
  const [selected, setSelected] = useState<DirectoryEntity | null>(() =>
    hideSearchChrome && embedStartEntity ? embedStartEntity : null,
  )
  const [form, setForm] = useState<LegalEntityFormState>(() =>
    hideSearchChrome && embedStartEntity
      ? hydrateLegalEntityFormFromDirectory(embedStartEntity, legalEntityVariant)
      : emptyLegalEntityFormState(legalEntityVariant),
  )
  const patch = useCallback((p: Partial<LegalEntityFormState>) => {
    setForm((prev) => ({ ...prev, ...p }))
  }, [])
  const householdMembers = useMemo(
    () => state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden),
    [state.relatedParties],
  )
  const [addBeneficialOwnerSheetOpen, setAddBeneficialOwnerSheetOpen] = useState(false)
  const [pendingBeneficialOwnerRow, setPendingBeneficialOwnerRow] = useState<number | null>(null)

  const searchAnchorRef = useRef<HTMLDivElement>(null)
  const [searchAnchorWidth, setSearchAnchorWidth] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    const el = searchAnchorRef.current
    if (!el) return
    const measure = () => setSearchAnchorWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const searchPopoverOpen = query.trim() !== '' && !searchDismissed

  const pick = (e: DirectoryEntity) => {
    setQuery('')
    setSearchDismissed(false)
    setSelected(e)
    setForm(hydrateLegalEntityFormFromDirectory(e, legalEntityVariant))
  }

  const handleSave = () => {
    const directoryEntity =
      selected ?? (hideSearchChrome && embedStartEntity ? embedStartEntity : null)
    if (!directoryEntity) return
    onSave(directoryEntity, form)
  }
  const handleBeneficialOwnerMemberAdded = (newPartyId: string) => {
    const row = pendingBeneficialOwnerRow
    setAddBeneficialOwnerSheetOpen(false)
    setPendingBeneficialOwnerRow(null)
    if (row === null) return
    const m = state.relatedParties.find((p) => p.id === newPartyId)
    if (!m?.name?.trim()) return
    setForm((prev) => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map((owner, i) =>
        i === row ? { ...owner, name: m.name.trim() } : owner,
      ),
    }))
  }

  const saveDisabled = !form.legalName.trim()

  return (
    <div className="space-y-6">
      {!hideSearchChrome ? (
        <section className="space-y-3">
          <h4 className={sectionCls}>Search Existing</h4>
          <Popover
            open={searchPopoverOpen}
            onOpenChange={(open) => {
              if (!open) setSearchDismissed(true)
            }}
            modal={false}
          >
            <PopoverAnchor asChild>
              <div ref={searchAnchorRef} className="w-full">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entity name, type, contact, client ID, tax ID, email, jurisdiction…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSearchDismissed(false)
                    }}
                    onFocus={() => {
                      if (query.trim()) setSearchDismissed(false)
                    }}
                    className="relative pl-9"
                    autoFocus
                  />
                </div>
              </div>
            </PopoverAnchor>
            <PopoverContent
              align="start"
              sideOffset={4}
              style={searchAnchorWidth != null ? { width: searchAnchorWidth } : undefined}
              className="z-[70] max-h-[min(16rem,50vh)] overflow-y-auto p-1 max-w-none data-[state=open]:animate-none"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {results.length === 0 ? (
                debouncedQuery.trim() === '' ? null : (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No results found.
                  </div>
                )
              ) : (
                <div role="listbox" className="flex flex-col gap-0.5">
                  {results.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      role="option"
                      onClick={() => pick(e)}
                      className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                    >
                      <p className="text-sm font-medium">{e.entityName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[e.entityType, e.clientId ? `Client ID ${e.clientId}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </section>
      ) : null}

      {selected ? (
        <>
          {!hideSearchChrome ? <hr className="border-border" /> : null}
          <section className="space-y-3">
            {!omitReviewHeading ? (
              <h4 className={sectionCls}>Review & edit before adding</h4>
            ) : null}
            <HouseholdLegalEntityFormFields
              legalEntityVariant={legalEntityVariant}
              form={form}
              patch={patch}
              householdMembers={householdMembers}
              onCreateBeneficialOwner={(rowIdx) => {
                setPendingBeneficialOwnerRow(rowIdx)
                setAddBeneficialOwnerSheetOpen(true)
              }}
            />
          </section>
          <div className={cn(sheetStickyFooterCls, 'flex justify-end')}>
            <Button size="sm" onClick={handleSave} disabled={saveDisabled}>
              {saveLabel}
            </Button>
          </div>
          <AddHouseholdMemberSheet
            open={addBeneficialOwnerSheetOpen}
            onOpenChange={(v) => {
              setAddBeneficialOwnerSheetOpen(v)
              if (!v) setPendingBeneficialOwnerRow(null)
            }}
            onPartyAdded={handleBeneficialOwnerMemberAdded}
            title="Add beneficial owner"
            description="Search for someone already in the household directory, or create a new individual to link as beneficial owner."
            individualCreateOnly
          />
        </>
      ) : null}
    </div>
  )
}

/** KYC / combined directory: same Popover search pattern as client-info household, but people + entities. */
function KycCombinedDirectorySearchPopover({ onPick }: { onPick: (entry: DirectoryEntry) => void }) {
  const [query, setQuery] = useState('')
  const [searchDismissed, setSearchDismissed] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const results = searchAll(debouncedQuery, 'all')
  const searchAnchorRef = useRef<HTMLDivElement>(null)
  const [searchAnchorWidth, setSearchAnchorWidth] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    const el = searchAnchorRef.current
    if (!el) return
    const measure = () => setSearchAnchorWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const searchPopoverOpen = query.trim() !== '' && !searchDismissed

  const pick = (entry: DirectoryEntry) => {
    setQuery('')
    setSearchDismissed(false)
    onPick(entry)
  }

  return (
    <section className="space-y-3">
      <h4 className={sectionCls}>Search Existing</h4>
      <Popover
        open={searchPopoverOpen}
        onOpenChange={(o) => {
          if (!o) setSearchDismissed(true)
        }}
        modal={false}
      >
        <PopoverAnchor asChild>
          <div ref={searchAnchorRef} className="w-full">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people or entities: name, ID, email, jurisdiction…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearchDismissed(false)
                }}
                onFocus={() => {
                  if (query.trim()) setSearchDismissed(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault()
                }}
                className="relative pl-9"
                autoFocus
                autoComplete="off"
                name="kyc-directory-combined-search"
              />
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          style={searchAnchorWidth != null ? { width: searchAnchorWidth } : undefined}
          className="z-[70] max-h-[min(16rem,50vh)] overflow-y-auto p-1 max-w-none data-[state=open]:animate-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {results.length === 0 ? (
            debouncedQuery.trim() === '' ? null : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results for &ldquo;{debouncedQuery.trim()}&rdquo;.
              </div>
            )
          ) : (
            <div role="listbox" className="flex flex-col gap-0.5">
              {results.map((entry) =>
                entry.type === 'individual' ? (
                  <button
                    key={entry.id}
                    type="button"
                    role="option"
                    onClick={() => pick(entry)}
                    className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                  >
                    <p className="text-sm font-medium">
                      {entry.firstName} {entry.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Individual
                      {entry.household || entry.clientId
                        ? ` · ${[entry.household, entry.clientId ? `Client ID ${entry.clientId}` : null].filter(Boolean).join(' · ')}`
                        : ''}
                    </p>
                  </button>
                ) : (
                  <button
                    key={entry.id}
                    type="button"
                    role="option"
                    onClick={() => pick(entry)}
                    className="w-full rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                  >
                    <p className="text-sm font-medium">{entry.entityName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[entry.entityType, entry.clientId ? `Client ID ${entry.clientId}` : null].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                ),
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </section>
  )
}

/** KYC: Popover directory search (like client-info household) + review form below; search stays available to pick another record. */
function HouseholdKycCombinedSearchFlow({
  open,
  directoryMatchParties,
  onSaveIndividual,
  onSaveEntity,
}: {
  open: boolean
  directoryMatchParties?: RelatedParty[]
  onSaveIndividual: (person: DirectoryPerson, form: IndividualAccountOwnerFormState) => void
  onSaveEntity: (entity: DirectoryEntity, form: LegalEntityFormState) => void
}) {
  const [picked, setPicked] = useState<DirectoryEntry | null>(null)

  useEffect(() => {
    if (!open) return
    setPicked(null)
  }, [open])

  return (
    <div className="space-y-6">
      <KycCombinedDirectorySearchPopover onPick={setPicked} />
      {picked?.type === 'individual' ? (
        <>
          <hr className="border-border" />
          <SearchPersonReviewPanel
            key={picked.id}
            clientInfoFull
            clientInfoMode="household"
            directoryMatchParties={directoryMatchParties}
            embedStartPerson={picked}
            hideSearchChrome
            omitReviewHeading
            onSave={onSaveIndividual}
            saveLabel="Save"
          />
        </>
      ) : picked?.type === 'entity' ? (
        <>
          <hr className="border-border" />
          <SearchEntityReviewPanel
            key={picked.id}
            legalEntityVariant={picked.entityType === 'Trust' ? 'trust-only' : 'non-trust'}
            embedStartEntity={picked}
            hideSearchChrome
            omitReviewHeading
            onSave={onSaveEntity}
            saveLabel="Save"
          />
        </>
      ) : null}
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
    <div className="space-y-4 pb-20">
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
      <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>
          Save
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
    <div className="space-y-4 pb-20">
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
      <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
        <Button size="sm" onClick={handleAdd} disabled={!entityName.trim()}>
          Save
        </Button>
      </div>
    </div>
  )
}

// ─── Create legal entity (account owner / household sheet) ───

const REVENUE_RANGES = ['Under $500K', '$500K – $1M', '$1M – $5M', '$5M – $25M', '$25M+'] as const

type LegalEntityVariant = 'default' | 'trust-only' | 'non-trust'

type LegalEntityFormState = {
  legalName: string
  entityType: string
  taxId: string
  jurisdiction: string
  email: string
  phone: string
  cpFirstName: string
  cpLastName: string
  cpDob: string
  cpSsn: string
  cpAddress: string
  cpRelationship: string
  beneficialOwners: Array<{ name: string; ownershipPercent: string }>
  bizIndustry: string
  bizSourceOfFunds: string
  bizRevenueRange: string
}

function emptyLegalEntityFormState(legalEntityVariant: LegalEntityVariant): LegalEntityFormState {
  return {
    legalName: '',
    entityType: legalEntityVariant === 'trust-only' ? 'Trust' : '',
    taxId: '',
    jurisdiction: '',
    email: '',
    phone: '',
    cpFirstName: '',
    cpLastName: '',
    cpDob: '',
    cpSsn: '',
    cpAddress: '',
    cpRelationship: '',
    beneficialOwners: [{ name: '', ownershipPercent: '' }],
    bizIndustry: '',
    bizSourceOfFunds: '',
    bizRevenueRange: '',
  }
}

/** Split a display name like "Jane Q. Smith" into first / last for control person fields. */
function splitContactPersonName(name?: string): { first: string; last: string } {
  const t = name?.trim() ?? ''
  if (!t) return { first: '', last: '' }
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] ?? '' }
}

function hydrateLegalEntityFormFromDirectory(
  e: DirectoryEntity,
  legalEntityVariant: LegalEntityVariant,
): LegalEntityFormState {
  const blank = emptyLegalEntityFormState(legalEntityVariant)
  const cp = splitContactPersonName(e.contactPerson)
  return {
    ...blank,
    legalName: e.entityName ?? '',
    entityType: legalEntityVariant === 'trust-only' ? 'Trust' : (e.entityType ?? blank.entityType),
    taxId: e.taxId ?? '',
    jurisdiction: e.jurisdiction ?? '',
    email: e.email ?? '',
    phone: e.phone ?? '',
    cpFirstName: cp.first,
    cpLastName: cp.last,
  }
}

function buildRelatedOrganizationFieldsFromForm(
  form: LegalEntityFormState,
  legalEntityVariant: LegalEntityVariant,
  options: { clientId?: string } = {},
) {
  const legalName = form.legalName.trim()
  if (!legalName) return null
  const resolvedEntityType =
    legalEntityVariant === 'trust-only' ? 'Trust' : form.entityType || undefined
  const validOwners = form.beneficialOwners.filter((o) => o.name.trim())
  return {
    name: legalName,
    organizationName: legalName,
    type: 'related_organization' as const,
    entityType: resolvedEntityType,
    taxId: form.taxId || undefined,
    jurisdiction: form.jurisdiction || undefined,
    clientId: options.clientId,
    contactPerson: form.cpFirstName.trim()
      ? `${form.cpFirstName.trim()} ${form.cpLastName.trim()}`.trim()
      : undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    relationshipCategory: 'Legal' as const,
    controlPerson: form.cpFirstName.trim()
      ? {
          firstName: form.cpFirstName.trim(),
          lastName: form.cpLastName.trim(),
          dob: form.cpDob || undefined,
          ssn: form.cpSsn || undefined,
          address: form.cpAddress || undefined,
          relationship: form.cpRelationship || undefined,
        }
      : undefined,
    beneficialOwners: validOwners.length > 0 ? validOwners : undefined,
    businessProfile:
      form.bizIndustry || form.bizSourceOfFunds || form.bizRevenueRange
        ? {
            industry: form.bizIndustry || undefined,
            sourceOfFunds: form.bizSourceOfFunds || undefined,
            annualRevenueRange: form.bizRevenueRange || undefined,
          }
        : undefined,
  }
}

function HouseholdLegalEntityFormFields({
  legalEntityVariant,
  form,
  patch,
  householdMembers,
  onCreateBeneficialOwner,
}: {
  legalEntityVariant: LegalEntityVariant
  form: LegalEntityFormState
  patch: (p: Partial<LegalEntityFormState>) => void
  householdMembers: RelatedParty[]
  onCreateBeneficialOwner: (rowIdx: number) => void
}) {
  const entityTypeOptions =
    legalEntityVariant === 'non-trust' ? entityTypes.filter((t) => t !== 'Trust') : entityTypes

  const addOwner = () =>
    patch({ beneficialOwners: [...form.beneficialOwners, { name: '', ownershipPercent: '' }] })
  const removeOwner = (idx: number) =>
    patch({ beneficialOwners: form.beneficialOwners.filter((_, i) => i !== idx) })
  const updateOwner = (idx: number, field: 'name' | 'ownershipPercent', value: string) =>
    patch({
      beneficialOwners: form.beneficialOwners.map((o, i) =>
        i === idx ? { ...o, [field]: value } : o,
      ),
    })
  const setBeneficialOwnerMember = (idx: number, memberId: string) => {
    if (memberId === '__create__') {
      onCreateBeneficialOwner(idx)
      return
    }
    const m = householdMembers.find((p) => p.id === memberId)
    if (!m?.name?.trim()) return
    updateOwner(idx, 'name', m.name.trim())
  }
  const membersAvailableForBeneficialOwnerRow = (rowIdx: number) => {
    const currentName = form.beneficialOwners[rowIdx]?.name.trim()
    return householdMembers.filter((m) => {
      const memberName = m.name?.trim()
      if (!memberName) return false
      if (memberName === currentName) return true
      return !form.beneficialOwners.some((owner, i) => i !== rowIdx && owner.name.trim() === memberName)
    })
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="space-y-3">
        <h4 className={sectionCls}>1. Entity Information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Legal name</Label>
            <Input
              value={form.legalName}
              onChange={(e) => patch({ legalName: e.target.value })}
              placeholder="Smith Family Trust LLC"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Entity type</Label>
            <Select
              value={form.entityType}
              onValueChange={(v) => patch({ entityType: v })}
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
            <SensitiveTaxIdInput
              value={form.taxId}
              onChange={(e) => patch({ taxId: e.target.value })}
              placeholder="XX-XXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Jurisdiction of formation</Label>
            <Input
              value={form.jurisdiction}
              onChange={(e) => patch({ jurisdiction: e.target.value })}
              placeholder="Delaware, USA"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => patch({ email: e.target.value })}
              placeholder="entity@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-3">
        <h4 className={sectionCls}>2. Control Person</h4>
        <p className="text-xs text-muted-foreground">Required for Customer Identification Program (CIP) compliance.</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>First name</Label>
            <Input value={form.cpFirstName} onChange={(e) => patch({ cpFirstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Last name</Label>
            <Input value={form.cpLastName} onChange={(e) => patch({ cpLastName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Date of birth</Label>
            <Input
              type="date"
              value={form.cpDob}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => patch({ cpDob: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>SSN</Label>
            <SensitiveTaxIdInput
              value={form.cpSsn}
              onChange={(e) => patch({ cpSsn: e.target.value })}
              placeholder="XXX-XX-XXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Address</Label>
            <Input
              value={form.cpAddress}
              onChange={(e) => patch({ cpAddress: e.target.value })}
              placeholder="Full address"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Relationship to entity</Label>
            <Input
              value={form.cpRelationship}
              onChange={(e) => patch({ cpRelationship: e.target.value })}
              placeholder="e.g. Trustee, Managing Member, Director"
            />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-3">
        <h4 className={sectionCls}>3. Beneficial Owners (&ge;25%)</h4>
        <p className="text-xs text-muted-foreground">List all individuals who directly or indirectly own 25% or more of the entity.</p>
        <div className="space-y-2">
          {form.beneficialOwners.map((owner, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className={fieldCls}>Owner</Label>
                <Select
                  value={householdMembers.find((m) => m.name?.trim() === owner.name.trim())?.id}
                  onValueChange={(v) => setBeneficialOwnerMember(idx, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select household member" /></SelectTrigger>
                  <SelectContent>
                    {membersAvailableForBeneficialOwnerRow(idx).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    <SelectItem value="__create__">Create new individual…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-1.5">
                <Label className={fieldCls}>Ownership %</Label>
                <Input
                  value={owner.ownershipPercent}
                  onChange={(e) => updateOwner(idx, 'ownershipPercent', e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              {form.beneficialOwners.length > 1 && (
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

      <section className="space-y-3">
        <h4 className={sectionCls}>4. Business Profile</h4>
        <p className="text-xs text-muted-foreground">Information used for AML risk assessment.</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Industry</Label>
            <Input
              value={form.bizIndustry}
              onChange={(e) => patch({ bizIndustry: e.target.value })}
              placeholder="e.g. Financial Services, Real Estate"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Source of funds</Label>
            <Input
              value={form.bizSourceOfFunds}
              onChange={(e) => patch({ bizSourceOfFunds: e.target.value })}
              placeholder="e.g. Business operations, Investment returns"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Annual revenue range</Label>
            <Select
              value={form.bizRevenueRange || undefined}
              onValueChange={(v) => patch({ bizRevenueRange: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>
                {REVENUE_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  )
}

function CreateHouseholdLegalEntityForm({
  onDone,
  onPartyAdded,
  legalEntityVariant = 'default',
  kycVerification = false,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
  legalEntityVariant?: LegalEntityVariant
  /** When true (KYC add flow), mark the entity for identity verification (KYB). */
  kycVerification?: boolean
}) {
  const { dispatch, state } = useWorkflow()
  const [form, setForm] = useState<LegalEntityFormState>(() => emptyLegalEntityFormState(legalEntityVariant))
  const [addBeneficialOwnerSheetOpen, setAddBeneficialOwnerSheetOpen] = useState(false)
  const [pendingBeneficialOwnerRow, setPendingBeneficialOwnerRow] = useState<number | null>(null)
  const patch = useCallback((p: Partial<LegalEntityFormState>) => {
    setForm((prev) => ({ ...prev, ...p }))
  }, [])
  const householdMembers = useMemo(
    () => state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden),
    [state.relatedParties],
  )

  const handleAdd = () => {
    const fields = buildRelatedOrganizationFieldsFromForm(form, legalEntityVariant, {})
    if (!fields) return
    const id = `org-${Date.now()}`
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
        ...fields,
        ...(kycVerification ? { kycStatus: 'needs_kyc' as const } : {}),
      },
    })
    onPartyAdded?.(id)
    onDone()
  }
  const handleBeneficialOwnerMemberAdded = (newPartyId: string) => {
    const row = pendingBeneficialOwnerRow
    setAddBeneficialOwnerSheetOpen(false)
    setPendingBeneficialOwnerRow(null)
    if (row === null) return
    const m = state.relatedParties.find((p) => p.id === newPartyId)
    if (!m?.name?.trim()) return
    setForm((prev) => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map((owner, i) =>
        i === row ? { ...owner, name: m.name.trim() } : owner,
      ),
    }))
  }

  return (
    <div className="space-y-6">
      <HouseholdLegalEntityFormFields
        legalEntityVariant={legalEntityVariant}
        form={form}
        patch={patch}
        householdMembers={householdMembers}
        onCreateBeneficialOwner={(rowIdx) => {
          setPendingBeneficialOwnerRow(rowIdx)
          setAddBeneficialOwnerSheetOpen(true)
        }}
      />
      <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
        <Button size="sm" onClick={handleAdd} disabled={!form.legalName.trim()}>
          Save
        </Button>
      </div>
      <AddHouseholdMemberSheet
        open={addBeneficialOwnerSheetOpen}
        onOpenChange={(v) => {
          setAddBeneficialOwnerSheetOpen(v)
          if (!v) setPendingBeneficialOwnerRow(null)
        }}
        onPartyAdded={handleBeneficialOwnerMemberAdded}
        title="Add beneficial owner"
        description="Search for someone already in the household directory, or create a new individual to link as beneficial owner."
        individualCreateOnly
      />
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
    <div className="space-y-4 pb-20">
      <AccountOwnerIndividualFormFields value={form} onChange={patch} />
      <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
        <Button size="sm" onClick={handleAdd} disabled={!form.firstName.trim() || !form.lastName.trim()}>
          Save
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

  return (
    <div className="space-y-6 pb-20">
      <IndividualManualEntryFormFields
        form={form}
        patch={patch}
        clientInfoMode={clientInfoMode}
        idType={idType}
        setIdType={setIdType}
        idNumber={idNumber}
        setIdNumber={setIdNumber}
        idState={idState}
        setIdState={setIdState}
        idExpiration={idExpiration}
        setIdExpiration={setIdExpiration}
        contactCategory={contactCategory}
        setContactCategory={setContactCategory}
        fieldIdPrefix="create-ind-"
      />

      <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
        <Button size="sm" onClick={handleAdd} disabled={!form.firstName.trim() || !form.lastName.trim()}>
          Save
        </Button>
      </div>
    </div>
  )
}

/** Fields collected on manual beneficiary create; align with account-opening beneficiary row / edit sheet. */
type BeneficiaryDesignationType = 'primary' | 'contingent'

export type BeneficiaryManualCreateFields = {
  designationType?: BeneficiaryDesignationType
  allocationPercent?: string
  relationshipIndicator?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  taxIdType?: string
  taxIdNumber?: string
}

export const BENEFICIARY_RELATIONSHIP_TO_OWNER_OPTIONS = [
  { value: 'SP', label: 'Spouse (SP)' },
  { value: 'SO', label: 'Son / Daughter (SO)' },
  { value: 'PA', label: 'Parent (PA)' },
  { value: 'SI', label: 'Sibling (SI)' },
  { value: 'OT', label: 'Other (OT)' },
] as const

export function clampBeneficiaryAllocationInput(raw: string): string {
  const normalized = raw.replace(/[^0-9.]/g, '')
  if (normalized === '' || normalized === '.') return normalized
  const n = Number.parseFloat(normalized)
  if (!Number.isFinite(n)) return ''
  if (n > 100) return '100'
  return normalized
}

function CreateBeneficiaryIndividualForm({
  onDone,
  onPartyAdded,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string, fields: BeneficiaryManualCreateFields) => void
}) {
  const { dispatch } = useWorkflow()
  const [designationType, setDesignationType] = useState<BeneficiaryDesignationType>('primary')
  const [allocationPercent, setAllocationPercent] = useState('')
  const [relationshipIndicator, setRelationshipIndicator] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [taxIdType, setTaxIdType] = useState('')
  const [taxIdNumber, setTaxIdNumber] = useState('')

  const handleAdd = () => {
    if (!firstName.trim() || !lastName.trim()) return
    const id = `household-${Date.now()}`
    const fn = firstName.trim()
    const ln = lastName.trim()
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id,
        name: `${fn} ${ln}`,
        firstName: fn,
        lastName: ln,
        type: 'household_member',
        dob: dateOfBirth || undefined,
        taxId: taxIdNumber.trim() || undefined,
        kycStatus: 'needs_kyc',
      },
    })
    onPartyAdded?.(id, {
      designationType,
      allocationPercent: allocationPercent.trim() || undefined,
      relationshipIndicator: relationshipIndicator || undefined,
      firstName: fn,
      lastName: ln,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      taxIdType: taxIdType || undefined,
      taxIdNumber: taxIdNumber.trim() || undefined,
    })
    onDone()
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="space-y-3">
        <h4 className={sectionCls}>Personal Information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>First name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Last name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Date of birth</Label>
            <Input
              type="date"
              value={dateOfBirth}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Gender</Label>
            <Select value={gender || undefined} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="X">Other / Unspecified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-3">
        <h4 className={sectionCls}>Beneficiary Designation</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Beneficiary type</Label>
            <Select
              value={designationType}
              onValueChange={(v) => setDesignationType(v as BeneficiaryDesignationType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary (P)</SelectItem>
                <SelectItem value="contingent">Contingent (C)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Allocation %</Label>
            <Input
              className="tabular-nums"
              inputMode="decimal"
              value={allocationPercent}
              onChange={(e) => setAllocationPercent(clampBeneficiaryAllocationInput(e.target.value))}
              placeholder="e.g. 50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Relationship to account owner</Label>
            <Select value={relationshipIndicator || undefined} onValueChange={setRelationshipIndicator}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {BENEFICIARY_RELATIONSHIP_TO_OWNER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-3">
        <h4 className={sectionCls}>Tax Identification</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Tax ID type</Label>
            <Select value={taxIdType || undefined} onValueChange={setTaxIdType}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Social Security Number (S)</SelectItem>
                <SelectItem value="T">Taxpayer Identification Number (T)</SelectItem>
                <SelectItem value="N">National Identification Number (N)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Tax ID number</Label>
            <SensitiveTaxIdInput
              value={taxIdNumber}
              onChange={(e) => setTaxIdNumber(e.target.value)}
              placeholder="XXX-XX-XXXX"
            />
          </div>
        </div>
      </section>

      <div className={cn(sheetStickyFooterCls, 'flex gap-2 justify-end')}>
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add beneficiary
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
  accountOwnerSearchFullForm = false,
  kycVerification = false,
}: {
  onDone: () => void
  onPartyAdded?: (partyId: string) => void
  includeLegalEntityCreate?: boolean
  individualCreateOnly?: boolean
  /** When true with individual-only create, use the same full account-owner field set as directory search. */
  accountOwnerSearchFullForm?: boolean
  /** Legal entities created from the KYC add-contact flow need KYB tracking. */
  kycVerification?: boolean
}) {
  const [createKind, setCreateKind] = useState<'individual' | 'entity'>('individual')

  if (individualCreateOnly) {
    if (accountOwnerSearchFullForm) {
      return (
        <CreateAccountOwnerIndividualForm
          onDone={onDone}
          onPartyAdded={onPartyAdded}
        />
      )
    }
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
          <CreateAccountOwnerIndividualForm
            onDone={onDone}
            onPartyAdded={onPartyAdded}
          />
        </TabsContent>
        <TabsContent value="entity" className="mt-0">
          <CreateHouseholdLegalEntityForm
            onDone={onDone}
            onPartyAdded={onPartyAdded}
            kycVerification={kycVerification}
          />
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
          <CreateHouseholdLegalEntityForm
            onDone={onDone}
            onPartyAdded={onPartyAdded}
            kycVerification={kycVerification}
          />
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

type AddHouseholdMemberTab = 'client' | 'search' | 'create'

export function AddHouseholdMemberSheet({
  open,
  onOpenChange,
  onPartyAdded,
  title = DEFAULT_HOUSEHOLD_MEMBER_SHEET_TITLE,
  description = DEFAULT_HOUSEHOLD_MEMBER_SHEET_DESCRIPTION,
  includeLegalEntityCreate = false,
  individualCreateOnly = false,
  accountOwnerSearchFullForm = false,
  beneficiaryCreateFields = false,
  excludePartyIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the new party id after a member is added from search or create. */
  onPartyAdded?: (partyId: string, beneficiaryFields?: BeneficiaryManualCreateFields) => void
  /** e.g. household member vs account owner vs KYC — defaults match Related parties / Collect client data */
  title?: string
  description?: string
  /** When true, Create tab offers Individual vs Legal entity (account owner flow). */
  includeLegalEntityCreate?: boolean
  /** For Client Info household, create flow is individual-only. */
  individualCreateOnly?: boolean
  /** When true, Search tab uses the same full account-owner field set as Create New (individual). */
  accountOwnerSearchFullForm?: boolean
  /** When true, Create tab collects beneficiary registration fields instead of the full household form. */
  beneficiaryCreateFields?: boolean
  /** Party ids to omit from the Client record list (e.g. already added as beneficiaries). */
  excludePartyIds?: string[]
}) {
  const { state, dispatch } = useWorkflow()
  const [tab, setTab] = useState<AddHouseholdMemberTab>(() =>
    beneficiaryCreateFields ? 'client' : 'search',
  )

  const resetAndClose = useCallback(() => {
    setTab(beneficiaryCreateFields ? 'client' : 'search')
    onOpenChange(false)
  }, [onOpenChange, beneficiaryCreateFields])

  const resolveExistingHouseholdByClientId = useCallback(
    (clientId: string | undefined) => {
      if (!clientId) return undefined
      return state.relatedParties.find(
        (p) => p.type === 'household_member' && !p.isHidden && p.clientId === clientId,
      )
    },
    [state.relatedParties],
  )

  const handleSavePersonFromSearch = useCallback(
    (person: DirectoryPerson, patch: Partial<DirectoryPerson>) => {
      const existing = resolveExistingHouseholdByClientId(person.clientId)
      if (existing) {
        onPartyAdded?.(existing.id)
        resetAndClose()
        return
      }
      const id = `household-${Date.now()}`
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id,
          name: `${(patch.firstName ?? person.firstName) || ''} ${(patch.lastName ?? person.lastName) || ''}`.trim(),
          firstName: patch.firstName ?? person.firstName,
          lastName: patch.lastName ?? person.lastName,
          type: 'household_member',
          email: patch.email ?? person.email,
          phone: patch.phone ?? person.phone,
          dob: patch.dob ?? person.dob,
          accountNumber: person.accountNumber,
          ssn: person.ssn,
          taxId: patch.taxId ?? person.taxId,
          clientId: person.clientId,
          kycStatus: 'needs_kyc',
        },
      })
      onPartyAdded?.(id)
      resetAndClose()
    },
    [dispatch, onPartyAdded, resetAndClose, resolveExistingHouseholdByClientId],
  )

  const handleSaveAccountOwnerFromSearch = useCallback(
    (person: DirectoryPerson, form: IndividualAccountOwnerFormState) => {
      const existing = resolveExistingHouseholdByClientId(person.clientId)
      if (existing) {
        onPartyAdded?.(existing.id)
        resetAndClose()
        return
      }
      const id = `household-${Date.now()}`
      const { top, accountOwnerIndividual } = splitFormIntoPartyUpdate(form)
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id,
          type: 'household_member',
          ...top,
          accountOwnerIndividual,
          accountNumber: person.accountNumber,
          ssn: person.ssn,
          clientId: person.clientId,
          kycStatus: 'needs_kyc',
        },
      })
      onPartyAdded?.(id)
      resetAndClose()
    },
    [dispatch, onPartyAdded, resetAndClose, resolveExistingHouseholdByClientId],
  )

  const handleSaveEntityFromDirectoryForKyc = useCallback(
    (entity: DirectoryEntity, form: LegalEntityFormState) => {
      if (entity.clientId) {
        const existing = state.relatedParties.find(
          (p) =>
            p.type === 'related_organization' &&
            !p.isHidden &&
            p.clientId === entity.clientId,
        )
        if (existing) {
          onPartyAdded?.(existing.id)
          resetAndClose()
          return
        }
      }
      const kycEntityVariant: LegalEntityVariant =
        entity.entityType === 'Trust' ? 'trust-only' : 'non-trust'
      const fields = buildRelatedOrganizationFieldsFromForm(form, kycEntityVariant, {
        clientId: entity.clientId,
      })
      if (!fields) return
      const id = `org-${Date.now()}`
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: { id, ...fields, kycStatus: 'needs_kyc' },
      })
      onPartyAdded?.(id)
      resetAndClose()
    },
    [dispatch, onPartyAdded, resetAndClose, state.relatedParties],
  )

  const useKycCombinedDirectorySearch =
    includeLegalEntityCreate &&
    !accountOwnerSearchFullForm &&
    !individualCreateOnly &&
    !beneficiaryCreateFields

  const tabToggleOptions = beneficiaryCreateFields
    ? [
        { value: 'client' as const, label: 'Client record', icon: <Users className="h-3.5 w-3.5" /> },
        { value: 'search' as const, label: 'Directory', icon: <Search className="h-3.5 w-3.5" /> },
        { value: 'create' as const, label: 'Create New', icon: <Plus className="h-3.5 w-3.5" /> },
      ]
    : [
        { value: 'search' as const, label: 'Search Existing', icon: <Search className="h-3.5 w-3.5" /> },
        { value: 'create' as const, label: 'Create New', icon: <Plus className="h-3.5 w-3.5" /> },
      ]

  const handleSaveFromClientRecord = useCallback(
    (partyId: string, fields: BeneficiaryManualCreateFields) => {
      onPartyAdded?.(partyId, fields)
      resetAndClose()
    },
    [onPartyAdded, resetAndClose],
  )

  /** Match Create → Individual (household) manual entry: same as account-owner search payload, different UI fields. */
  const useHouseholdManualEntrySearch =
    !beneficiaryCreateFields &&
    !includeLegalEntityCreate &&
    !(individualCreateOnly && accountOwnerSearchFullForm)

  const handleSaveFromDirectory = useCallback(
    (person: DirectoryPerson, fields: BeneficiaryManualCreateFields) => {
      let partyId: string | undefined
      if (person.clientId) {
        const existing = state.relatedParties.find(
          (p) =>
            p.type === 'household_member' &&
            !p.isHidden &&
            p.clientId === person.clientId,
        )
        partyId = existing?.id
      }

      if (!partyId) {
        partyId = `household-${Date.now()}`
        dispatch({
          type: 'ADD_RELATED_PARTY',
          party: {
            id: partyId,
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
      }

      onPartyAdded?.(partyId, fields)
      resetAndClose()
    },
    [dispatch, onPartyAdded, resetAndClose, state.relatedParties],
  )

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent
        side="right"
        className={cn(
          'w-full flex flex-col gap-0 p-0 min-h-0 overflow-hidden',
          unifiedSheetWidthCls,
        )}
      >
        <SheetHeader className="px-6 pt-6 pb-3 space-y-1">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-4">
          <TabToggle
            value={tab}
            onChange={(v) => setTab(v as AddHouseholdMemberTab)}
            options={tabToggleOptions}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-1 pb-0">
          {beneficiaryCreateFields && tab === 'client' ? (
            <RelatedIndividualsFromClientPanel
              parties={state.relatedParties}
              excludePartyIds={excludePartyIds}
              onSave={handleSaveFromClientRecord}
            />
          ) : beneficiaryCreateFields && tab === 'search' ? (
            <BeneficiaryDirectorySearchPanel onSave={handleSaveFromDirectory} />
          ) : tab === 'search' ? (
            useKycCombinedDirectorySearch ? (
              <HouseholdKycCombinedSearchFlow
                open={open}
                directoryMatchParties={state.relatedParties}
                onSaveIndividual={handleSaveAccountOwnerFromSearch}
                onSaveEntity={handleSaveEntityFromDirectoryForKyc}
              />
            ) : accountOwnerSearchFullForm ? (
              <SearchPersonReviewPanel
                accountOwnerFields
                directoryMatchParties={state.relatedParties}
                onSave={handleSaveAccountOwnerFromSearch}
                saveLabel="Save"
              />
            ) : useHouseholdManualEntrySearch ? (
              <SearchPersonReviewPanel
                clientInfoFull
                clientInfoMode="household"
                directoryMatchParties={state.relatedParties}
                onSave={handleSaveAccountOwnerFromSearch}
                saveLabel="Save"
              />
            ) : (
              <SearchPersonReviewPanel onSave={handleSavePersonFromSearch} saveLabel="Save" />
            )
          ) : beneficiaryCreateFields ? (
            <CreateBeneficiaryIndividualForm
              onDone={resetAndClose}
              onPartyAdded={onPartyAdded}
            />
          ) : (
            <CreateHouseholdMemberForm
              onDone={resetAndClose}
              onPartyAdded={onPartyAdded}
              includeLegalEntityCreate={includeLegalEntityCreate}
              individualCreateOnly={individualCreateOnly}
              accountOwnerSearchFullForm={accountOwnerSearchFullForm}
              kycVerification={useKycCombinedDirectorySearch}
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
  const { dispatch, state } = useWorkflow()
  const [tab, setTab] = useState<'search' | 'create'>('search')
  const resetAndClose = useCallback(() => {
    setTab('search')
    onOpenChange(false)
  }, [onOpenChange])

  const handleSavePersonFromSearch = useCallback(
    (
      person: DirectoryPerson,
      form: IndividualAccountOwnerFormState,
      meta?: { contactCategory: 'Family' | 'Other' },
    ) => {
      const id = `contact-${Date.now()}`
      const { top, accountOwnerIndividual } = splitFormIntoPartyUpdate(form)
      const category = meta?.contactCategory ?? 'Family'
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: {
          id,
          type: 'related_contact',
          ...top,
          role: undefined,
          accountOwnerIndividual,
          clientId: person.clientId,
          accountNumber: person.accountNumber,
          ssn: person.ssn,
          relationshipCategory:
            clientInfoMode === 'professional' ? 'Professional' : category,
        },
      })
      onPartyAdded?.(id)
      resetAndClose()
    },
    [clientInfoMode, dispatch, onPartyAdded, resetAndClose],
  )

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent side="right" className={cn('w-full flex flex-col gap-0 p-0', unifiedSheetWidthCls)}>
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

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-1 pb-0">
          {tab === 'search' ? (
            <SearchPersonReviewPanel
              clientInfoFull
              clientInfoMode={clientInfoMode}
              directoryMatchParties={state.relatedParties}
              onSave={handleSavePersonFromSearch}
              saveLabel="Save"
            />
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
  const resetAndClose = useCallback(() => {
    setTab('search')
    onOpenChange(false)
  }, [onOpenChange])

  const handleSaveEntityFromSearch = useCallback(
    (entity: DirectoryEntity, form: LegalEntityFormState) => {
      const fields = buildRelatedOrganizationFieldsFromForm(form, legalEntityVariant, {
        clientId: entity.clientId,
      })
      if (!fields) return
      const id = `org-${Date.now()}`
      dispatch({
        type: 'ADD_RELATED_PARTY',
        party: { id, ...fields },
      })
      onPartyAdded?.(id)
      resetAndClose()
    },
    [dispatch, legalEntityVariant, onPartyAdded, resetAndClose],
  )

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(true) }}>
      <SheetContent side="right" className={cn('w-full flex flex-col gap-0 p-0', unifiedSheetWidthCls)}>
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

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-1 pb-0">
          {tab === 'search' ? (
            <SearchEntityReviewPanel
              legalEntityVariant={legalEntityVariant}
              onSave={handleSaveEntityFromSearch}
              saveLabel="Save"
            />
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
      <SheetContent
        side="right"
        className={cn(
          'w-full flex flex-col gap-0 p-0 min-h-0 overflow-hidden',
          unifiedSheetWidthCls,
        )}
      >
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
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-1 pb-0">
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
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-0 border-t border-border">
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
