import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { SensitiveTaxIdInput } from '@/components/ui/sensitive-tax-id-input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Plus, Trash2 } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { RelatedParty, TrustPartyRef } from '@/types/workflow'
import { AddHouseholdMemberSheet, entityTypes } from './AddPartySheet'

const REVENUE_RANGES = ['Under $500K', '$500K – $1M', '$1M – $5M', '$5M – $25M', '$25M+'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'

/** Trustee capacity on a trust entity (CIP modal). */
const trusteeRoles = [
  'Trustee',
  'Co-trustee',
  'Successor trustee',
  'Advisory trustee',
  'Trust protector',
] as const

function newTrusteeRefId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Full legal-entity editor (Client Info → Trusts / Other entities).
 * Use for account owners when the owner is a `related_organization` so trust trustees match Related parties.
 */
export function EditLegalEntitySheet({
  party,
  open,
  onOpenChange,
}: {
  party: RelatedParty
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch, state } = useWorkflow()

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

  const [trustParties, setTrustParties] = useState<TrustPartyRef[]>([])
  const [addTrusteeSheetOpen, setAddTrusteeSheetOpen] = useState(false)
  const [pendingTrusteeRow, setPendingTrusteeRow] = useState<number | null>(null)

  const [beneficialOwners, setBeneficialOwners] = useState<Array<{ name: string; ownershipPercent: string }>>([
    { name: '', ownershipPercent: '' },
  ])

  const [bizIndustry, setBizIndustry] = useState('')
  const [bizSourceOfFunds, setBizSourceOfFunds] = useState('')
  const [bizRevenueRange, setBizRevenueRange] = useState('')

  const [snapshot, setSnapshot] = useState('')

  const isTrustEntityEdit = (entityType || party.entityType || '').toLowerCase() === 'trust'

  const householdMembers = useMemo(
    () => state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden),
    [state.relatedParties],
  )

  useEffect(() => {
    if (!open || !isTrustEntityEdit) return
    setTrustParties((prev) => {
      let changed = false
      const next = prev.map((t) => {
        if (!t.partyId || t.displayName.trim()) return t
        const m = state.relatedParties.find((p) => p.id === t.partyId)
        if (m?.name?.trim()) {
          changed = true
          return { ...t, displayName: m.name.trim() }
        }
        return t
      })
      return changed ? next : prev
    })
  }, [state.relatedParties, open, isTrustEntityEdit])

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

      const isTrust = (party.entityType ?? '').toLowerCase() === 'trust'
      if (party.trustParties && party.trustParties.length > 0) {
        setTrustParties(party.trustParties.map((t) => ({ ...t })))
      } else if (isTrust) {
        setTrustParties([{ id: newTrusteeRefId(), displayName: '', role: 'Trustee' }])
      } else {
        setTrustParties([])
      }

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
        tp: party.trustParties ?? [],
      }))
    }
  }, [party.id, open])

  const addOwner = () => setBeneficialOwners((prev) => [...prev, { name: '', ownershipPercent: '' }])
  const removeOwner = (idx: number) => setBeneficialOwners((prev) => prev.filter((_, i) => i !== idx))
  const updateOwner = (idx: number, field: 'name' | 'ownershipPercent', value: string) =>
    setBeneficialOwners((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)))

  const addTrusteeRow = () => {
    setTrustParties((prev) => [...prev, { id: newTrusteeRefId(), displayName: '', role: 'Trustee' }])
  }
  const removeTrusteeRow = (idx: number) => {
    setTrustParties((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  }
  const updateTrusteeRole = (idx: number, role: string) => {
    setTrustParties((prev) => prev.map((t, i) => (i === idx ? { ...t, role } : t)))
  }
  const setTrusteeMember = (idx: number, memberId: string) => {
    if (memberId === '__create__') {
      setPendingTrusteeRow(idx)
      setAddTrusteeSheetOpen(true)
      return
    }
    if (memberId === '__none__') {
      setTrustParties((prev) =>
        prev.map((t, i) => (i === idx ? { ...t, partyId: undefined, displayName: '' } : t)),
      )
      return
    }
    const m = householdMembers.find((p) => p.id === memberId)
    setTrustParties((prev) =>
      prev.map((t, i) =>
        i === idx ? { ...t, partyId: memberId, displayName: m?.name?.trim() ?? t.displayName } : t,
      ),
    )
  }

  const handleTrusteeMemberAdded = (newPartyId: string) => {
    const row = pendingTrusteeRow
    setAddTrusteeSheetOpen(false)
    setPendingTrusteeRow(null)
    if (row === null) return
    const m = state.relatedParties.find((p) => p.id === newPartyId)
    setTrustParties((prev) =>
      prev.map((t, i) =>
        i === row ? { ...t, partyId: newPartyId, displayName: m?.name?.trim() ?? t.displayName } : t,
      ),
    )
  }

  const currentState = JSON.stringify({
    legalName, entityType, taxId, jurisdiction, email, phone,
    cp: { firstName: cpFirstName, lastName: cpLastName, dob: cpDob, ssn: cpSsn, address: cpAddress, relationship: cpRelationship },
    bo: beneficialOwners,
    bp: { industry: bizIndustry, sourceOfFunds: bizSourceOfFunds, annualRevenueRange: bizRevenueRange },
    tp: trustParties,
  })
  const isDirty = currentState !== snapshot

  const handleSave = () => {
    const validOwners = beneficialOwners.filter((o) => o.name.trim())
    const validTrustees = trustParties
      .map((t) => {
        const linked = t.partyId ? state.relatedParties.find((p) => p.id === t.partyId) : undefined
        const displayName = (linked?.name ?? t.displayName).trim()
        if (!t.partyId && !displayName) return null
        return { ...t, displayName: displayName || linked?.name || 'Trustee' }
      })
      .filter((t): t is TrustPartyRef => t !== null)

    const trustUpdates = (entityType || party.entityType || '').toLowerCase() === 'trust'
    const firstTrustee = validTrustees[0]
    const firstTrusteeParty = firstTrustee?.partyId
      ? state.relatedParties.find((p) => p.id === firstTrustee.partyId)
      : undefined

    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId: party.id,
      updates: {
        name: legalName.trim() || party.name,
        organizationName: legalName.trim() || undefined,
        entityType: entityType || undefined,
        taxId: taxId || undefined,
        jurisdiction: jurisdiction || undefined,
        contactPerson: trustUpdates
          ? firstTrusteeParty?.name ?? firstTrustee?.displayName
          : cpFirstName.trim()
            ? `${cpFirstName.trim()} ${cpLastName.trim()}`
            : undefined,
        email: email || undefined,
        phone: phone || undefined,
        controlPerson:
          trustUpdates
            ? undefined
            : cpFirstName.trim()
              ? {
                  firstName: cpFirstName.trim(),
                  lastName: cpLastName.trim(),
                  dob: cpDob || undefined,
                  ssn: cpSsn || undefined,
                  address: cpAddress || undefined,
                  relationship: cpRelationship || undefined,
                }
              : undefined,
        trustParties: trustUpdates ? (validTrustees.length > 0 ? validTrustees : undefined) : undefined,
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

  const membersAvailableForTrusteeRow = (rowIdx: number) => {
    const currentId = trustParties[rowIdx]?.partyId
    return householdMembers.filter(
      (m) =>
        m.id === currentId ||
        !trustParties.some((tp, i) => i !== rowIdx && tp.partyId === m.id),
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <SheetTitle>{party.name}</SheetTitle>
            <SheetDescription>Edit legal entity details.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <section className="space-y-3">
              <h4 className={sectionCls}>1. Entity Information</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Legal name</Label>
                  <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Entity type</Label>
                  <Select
                    value={entityType}
                    onValueChange={(v) => {
                      setEntityType(v)
                      if (v.toLowerCase() === 'trust' && trustParties.length === 0) {
                        setTrustParties([{ id: newTrusteeRefId(), displayName: '', role: 'Trustee' }])
                      }
                      if (v.toLowerCase() !== 'trust') {
                        setTrustParties([])
                      }
                    }}
                  >
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

            {isTrustEntityEdit ? (
              <>
                <hr className="border-border" />
                <section className="space-y-3">
                  <h4 className={sectionCls}>2. Trustees</h4>
                  <div className="space-y-3">
                    {trustParties.map((t, idx) => (
                      <div key={t.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1.5">
                            <Label className={fieldCls}>Trustee</Label>
                            <Select
                              value={t.partyId ?? '__none__'}
                              onValueChange={(v) => setTrusteeMember(idx, v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select household member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Select household member…</SelectItem>
                                {membersAvailableForTrusteeRow(idx).map((m) => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                                <SelectItem value="__create__">Create new individual…</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-[11.5rem] space-y-1.5 shrink-0">
                            <Label className={fieldCls}>Role</Label>
                            <Select
                              value={(trusteeRoles as readonly string[]).includes(t.role ?? '') ? (t.role ?? 'Trustee') : 'Trustee'}
                              onValueChange={(v) => updateTrusteeRole(idx, v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                {trusteeRoles.map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {trustParties.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-9 shrink-0"
                              onClick={() => removeTrusteeRow(idx)}
                              aria-label="Remove trustee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTrusteeRow}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add trustee
                    </Button>
                  </div>
                </section>
              </>
            ) : null}

            {!isTrustEntityEdit ? (
              <>
                <hr className="border-border" />
                <section className="space-y-3">
                  <h4 className={sectionCls}>2. Control Person (CIP)</h4>
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
                      <Input value={cpRelationship} onChange={(e) => setCpRelationship(e.target.value)} placeholder="e.g. Managing Member" />
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            <hr className="border-border" />

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
      <AddHouseholdMemberSheet
        open={addTrusteeSheetOpen}
        onOpenChange={(v) => {
          setAddTrusteeSheetOpen(v)
          if (!v) setPendingTrusteeRow(null)
        }}
        onPartyAdded={handleTrusteeMemberAdded}
        title="Add trustee"
        description="Search for someone already in the household directory, or create a new individual to link as trustee."
        individualCreateOnly
      />
    </>
  )
}
