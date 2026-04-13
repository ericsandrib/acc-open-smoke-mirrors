import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { SensitiveTaxIdInput } from '@/components/ui/sensitive-tax-id-input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Plus, Trash2, Shield } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty } from '@/types/workflow'
import {
  AddHouseholdMemberSheet,
  AddClientInfoIndividualSheet,
  AddClientInfoLegalEntitySheet,
  entityTypes,
} from './AddPartySheet'
import {
  hydrateIndividualFormFromParty,
  splitFormIntoPartyUpdate,
  type IndividualAccountOwnerFormState,
} from '@/types/accountOwnerIndividual'
import { isTrustEntityParty } from '@/utils/trustEntityParty'

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
        Remove member
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
  const isIncomplete = !party.email?.trim() || !party.phone?.trim()
  return (
    <div>
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
          {isIncomplete && (
            <Badge variant="outline" className="text-[10px] text-text-warning-primary border-border-warning-primary">
              Incomplete
            </Badge>
          )}
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
    <div>
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

const ID_TYPES = ['Driver\'s License', 'Passport', 'State ID', 'Military ID'] as const
const REVENUE_RANGES = ['Under $500K', '$500K – $1M', '$1M – $5M', '$5M – $25M', '$25M+'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'

interface ContactEditFields {
  firstName: string
  lastName: string
  relationship: string
  relationshipCategory: string
  email: string
  phone: string
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
  if (!party) return null
  const isOrg = party.type === 'related_organization'
  const isMember = party.type === 'household_member'

  if (isOrg) {
    return <EditEntitySheet party={party} open={open} onOpenChange={onOpenChange} />
  }
  if (isMember) {
    return <EditIndividualSheet key={party.id} party={party} open={open} onOpenChange={onOpenChange} />
  }
  return <EditContactSheet party={party} open={open} onOpenChange={onOpenChange} />
}

// ─── Individual household member edit ───

function EditIndividualSheet({
  party,
  open,
  onOpenChange,
}: {
  party: RelatedParty
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()
  const [form, setForm] = useState<IndividualAccountOwnerFormState>(() =>
    hydrateIndividualFormFromParty(party),
  )
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(hydrateIndividualFormFromParty(party)))
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idState, setIdState] = useState('')
  const [idExpiration, setIdExpiration] = useState('')

  useEffect(() => {
    if (!open) return
    const hydrated = hydrateIndividualFormFromParty(party)
    setForm(hydrated)
    setSnapshot(JSON.stringify(hydrated))
    setIdType('')
    setIdNumber('')
    setIdState('')
    setIdExpiration('')
  }, [open, party])

  const patch = (p: Partial<IndividualAccountOwnerFormState>) => setForm((prev) => ({ ...prev, ...p }))

  const isDirty = JSON.stringify(form) !== snapshot || idType || idNumber || idState || idExpiration
  const mailingLocked = form.mailingSameAsLegal

  const handleSave = () => {
    const { top, accountOwnerIndividual } = splitFormIntoPartyUpdate(form)
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId: party.id,
      updates: {
        ...top,
        accountOwnerIndividual,
      },
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{party.name}</SheetTitle>
          <SheetDescription>Edit household member details.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Personal Information */}
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
                    {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Role</Label>
                <Select value={form.role || undefined} onValueChange={(v) => patch({ role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Address */}
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
                id="edit-mailing-same"
                checked={mailingLocked}
                onChange={(e) => patch({ mailingSameAsLegal: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="edit-mailing-same" className="text-sm font-normal cursor-pointer">
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

          {/* ID Verification */}
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

          {/* Employment */}
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

          {!party.isPrimary && (
            <>
              <hr className="border-border" />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => dispatch({ type: 'SET_PRIMARY_MEMBER', partyId: party.id })}
              >
                <Shield className="h-3.5 w-3.5" />
                Set as primary member
              </Button>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Entity / organization edit ───

function EditEntitySheet({
  party,
  open,
  onOpenChange,
}: {
  party: RelatedParty
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()

  const [legalName, setLegalName] = useState('')
  const [entityType, setEntityType] = useState('')
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

  const [snapshot, setSnapshot] = useState('')

  useEffect(() => {
    if (open) {
      setLegalName(party.organizationName ?? party.name ?? '')
      setEntityType(party.entityType ?? '')
      setTaxId(party.taxId ?? '')
      setJurisdiction(party.jurisdiction ?? '')
      setEmail(party.email ?? '')
      setPhone(party.phone ?? '')

      const cp = party.controlPerson
      setCpFirstName(cp?.firstName ?? '')
      setCpLastName(cp?.lastName ?? '')
      setCpDob(cp?.dob ?? '')
      setCpSsn(cp?.ssn ?? '')
      setCpAddress(cp?.address ?? '')
      setCpRelationship(cp?.relationship ?? '')

      const bo = party.beneficialOwners
      setBeneficialOwners(bo && bo.length > 0 ? bo.map((o) => ({ ...o })) : [{ name: '', ownershipPercent: '' }])

      const bp = party.businessProfile
      setBizIndustry(bp?.industry ?? '')
      setBizSourceOfFunds(bp?.sourceOfFunds ?? '')
      setBizRevenueRange(bp?.annualRevenueRange ?? '')

      setSnapshot(JSON.stringify({
        legalName: party.organizationName ?? party.name ?? '',
        entityType: party.entityType ?? '',
        taxId: party.taxId ?? '',
        jurisdiction: party.jurisdiction ?? '',
        email: party.email ?? '',
        phone: party.phone ?? '',
        cp, bo, bp,
      }))
    }
  }, [party.id, open])

  const addOwner = () => setBeneficialOwners((prev) => [...prev, { name: '', ownershipPercent: '' }])
  const removeOwner = (idx: number) => setBeneficialOwners((prev) => prev.filter((_, i) => i !== idx))
  const updateOwner = (idx: number, field: 'name' | 'ownershipPercent', value: string) =>
    setBeneficialOwners((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)))

  const currentState = JSON.stringify({
    legalName, entityType, taxId, jurisdiction, email, phone,
    cp: { firstName: cpFirstName, lastName: cpLastName, dob: cpDob, ssn: cpSsn, address: cpAddress, relationship: cpRelationship },
    bo: beneficialOwners,
    bp: { industry: bizIndustry, sourceOfFunds: bizSourceOfFunds, annualRevenueRange: bizRevenueRange },
  })
  const isDirty = currentState !== snapshot

  const handleSave = () => {
    const validOwners = beneficialOwners.filter((o) => o.name.trim())
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId: party.id,
      updates: {
        name: legalName.trim() || party.name,
        organizationName: legalName.trim() || undefined,
        entityType: entityType || undefined,
        taxId: taxId || undefined,
        jurisdiction: jurisdiction || undefined,
        contactPerson: cpFirstName.trim() ? `${cpFirstName.trim()} ${cpLastName.trim()}` : undefined,
        email: email || undefined,
        phone: phone || undefined,
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
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{party.name}</SheetTitle>
          <SheetDescription>Edit legal entity details.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 1. Entity Information */}
          <section className="space-y-3">
            <h4 className={sectionCls}>1. Entity Information</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Legal name</Label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Entity type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                <Input value={cpRelationship} onChange={(e) => setCpRelationship(e.target.value)} placeholder="e.g. Trustee, Managing Member" />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* 3. Beneficial Owners */}
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

          {/* 4. Business Profile */}
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
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Contact edit (simple form) ───

function EditContactSheet({
  party,
  open,
  onOpenChange,
}: {
  party: RelatedParty
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()
  const [fields, setFields] = useState<ContactEditFields>({
    firstName: '', lastName: '', relationship: '',
    relationshipCategory: '', email: '', phone: '',
  })
  const [snapshot, setSnapshot] = useState<ContactEditFields>(fields)

  useEffect(() => {
    if (open) {
      const s: ContactEditFields = {
        firstName: party.firstName ?? '',
        lastName: party.lastName ?? '',
        relationship: party.relationship ?? '',
        relationshipCategory: party.relationshipCategory ?? '',
        email: party.email ?? '',
        phone: party.phone ?? '',
      }
      setFields(s)
      setSnapshot(s)
    }
  }, [party.id, open])

  const isDirty = Object.keys(snapshot).some(
    (k) => fields[k as keyof ContactEditFields] !== snapshot[k as keyof ContactEditFields]
  )

  const setField = (key: keyof ContactEditFields, value: string) => {
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
        relationshipCategory: fields.relationshipCategory || undefined,
        email: fields.email || undefined,
        phone: fields.phone || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{party.name}</SheetTitle>
          <SheetDescription>Edit contact details.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={fields.firstName} onChange={(e) => setField('firstName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={fields.lastName} onChange={(e) => setField('lastName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={fields.relationship} onValueChange={(v) => setField('relationship', v)}>
              <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {contactRelationships.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={fields.relationshipCategory} onValueChange={(v) => setField('relationshipCategory', v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {contactCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={fields.email} onChange={(e) => setField('email', e.target.value)} type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={fields.phone} onChange={(e) => setField('phone', e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty}>Save</Button>
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
  const [showAddRelatedIndividualSheet, setShowAddRelatedIndividualSheet] = useState(false)
  const [showAddTrustSheet, setShowAddTrustSheet] = useState(false)
  const [showAddOtherEntitySheet, setShowAddOtherEntitySheet] = useState(false)
  const [showAddProfessionalSheet, setShowAddProfessionalSheet] = useState(false)
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const allOrganizations = state.relatedParties.filter(
    (p) => !p.isHidden && (p.type === 'related_organization' || (p.type === 'related_contact' && Boolean(p.organizationName))),
  )
  const allContacts = state.relatedParties.filter(
    (p) => p.type === 'related_contact' && !p.isHidden && !p.organizationName,
  )
  const professionalContacts = allContacts.filter((p) => p.relationshipCategory === 'Professional')
  const relatedIndividuals = allContacts.filter((p) => p.relationshipCategory !== 'Professional')
  const trustOrganizations = allOrganizations.filter(isTrustEntityParty)
  const otherOrganizations = allOrganizations.filter((p) => !isTrustEntityParty(p))
  const editingParty = editingPartyId ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null : null

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Household</h3>
          <p className="text-base text-muted-foreground">
            People in the household you are onboarding - the primary contact and their family.
          </p>
        </div>

        <div className="rounded-lg border border-border p-1">
          <div>
            {householdMembers.length === 0 ? (
              <EmptyState message="No household members added yet. Start by adding the primary contact." />
            ) : (
              householdMembers.map((member) => (
                <HouseholdMemberCard key={member.id} party={member} onClick={() => setEditingPartyId(member.id)} />
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setShowAddHouseholdSheet(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add member
          </Button>
        </div>

        <AddHouseholdMemberSheet
          open={showAddHouseholdSheet}
          onOpenChange={setShowAddHouseholdSheet}
          individualCreateOnly
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Related Individuals</h3>
          <p className="text-base text-muted-foreground">
            Family and other non-professional individuals connected to this household.
          </p>
        </div>

        <div className="rounded-lg border border-border p-1">
          <div>
            {relatedIndividuals.length === 0 ? (
              <EmptyState message="No related individuals yet. Search your directory or create a new record." />
            ) : (
              relatedIndividuals.map((contact) => (
                <ContactCard key={contact.id} party={contact} onClick={() => setEditingPartyId(contact.id)} />
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setShowAddRelatedIndividualSheet(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add related individual
          </Button>
        </div>

        <AddClientInfoIndividualSheet
          open={showAddRelatedIndividualSheet}
          onOpenChange={setShowAddRelatedIndividualSheet}
          clientInfoMode="related-family"
          title="Add related individual"
          description="Search for someone in your directory or create a new individual profile."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Trusts</h3>
          <p className="text-base text-muted-foreground">
            Trust entities associated with this client.
          </p>
        </div>

        <div className="rounded-lg border border-border p-1">
          <div>
            {trustOrganizations.length === 0 ? (
              <EmptyState message="No trusts added yet." />
            ) : (
              trustOrganizations.map((org) => (
                <ContactCard key={org.id} party={org} onClick={() => setEditingPartyId(org.id)} />
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setShowAddTrustSheet(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add trust
          </Button>
        </div>

        <AddClientInfoLegalEntitySheet
          open={showAddTrustSheet}
          onOpenChange={setShowAddTrustSheet}
          variant="trust"
          title="Add trust"
          description="Search for an existing trust or create a new trust profile."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Other Entities</h3>
          <p className="text-base text-muted-foreground">
            Other legal entities such as LLCs, corporations, or partnerships.
          </p>
        </div>

        <div className="rounded-lg border border-border p-1">
          <div>
            {otherOrganizations.length === 0 ? (
              <EmptyState message="No other entities added yet." />
            ) : (
              otherOrganizations.map((org) => (
                <ContactCard key={org.id} party={org} onClick={() => setEditingPartyId(org.id)} />
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setShowAddOtherEntitySheet(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add entity
          </Button>
        </div>

        <AddClientInfoLegalEntitySheet
          open={showAddOtherEntitySheet}
          onOpenChange={setShowAddOtherEntitySheet}
          variant="other"
          title="Add legal entity"
          description="Search for an existing legal entity or create a new one."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Professional Contacts</h3>
          <p className="text-base text-muted-foreground">
            Attorneys, accountants, advisors, and other professional relationships.
          </p>
        </div>

        <div className="rounded-lg border border-border p-1">
          <div>
            {professionalContacts.length === 0 ? (
              <EmptyState message="No professional contacts yet." />
            ) : (
              professionalContacts.map((contact) => (
                <ContactCard key={contact.id} party={contact} onClick={() => setEditingPartyId(contact.id)} />
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setShowAddProfessionalSheet(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add professional
          </Button>
        </div>

        <AddClientInfoIndividualSheet
          open={showAddProfessionalSheet}
          onOpenChange={setShowAddProfessionalSheet}
          clientInfoMode="professional"
          title="Add professional contact"
          description="Search for a professional in your directory or create a new profile."
        />
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
