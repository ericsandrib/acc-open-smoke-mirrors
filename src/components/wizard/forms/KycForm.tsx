import { useState, useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'
import { CheckCircle2, ShieldAlert, ArrowLeft, ChevronRight, Info, UserPlus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RelatedParty } from '@/types/workflow'
import { relationships } from '@/data/relationships'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']

function AddModeToggle({ mode, onModeChange }: { mode: 'new' | 'existing'; onModeChange: (m: 'new' | 'existing') => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
      <button
        type="button"
        className={cn(
          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'existing' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('existing')}
      >
        Search existing
      </button>
      <button
        type="button"
        className={cn(
          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'new' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('new')}
      >
        Create new
      </button>
    </div>
  )
}

function SearchExistingForKyc({
  existingIds,
  onAdd,
}: {
  existingIds: Set<string>
  onAdd: (parties: RelatedParty[]) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredHouseholds = useMemo(() => {
    const q = query.toLowerCase().trim()
    return relationships.filter((r) => {
      const members = r.relatedParties.filter((p) => p.type === 'household_member' && !existingIds.has(p.id))
      if (members.length === 0) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.primaryContact.firstName.toLowerCase().includes(q) ||
        r.primaryContact.lastName.toLowerCase().includes(q) ||
        members.some((m) => m.name.toLowerCase().includes(q))
      )
    })
  }, [query, existingIds])

  const selectedHousehold = selectedHouseholdId ? relationships.find((r) => r.id === selectedHouseholdId) : null
  const availableMembers = selectedHousehold
    ? selectedHousehold.relatedParties.filter((p) => p.type === 'household_member' && !existingIds.has(p.id))
    : []

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
          <p className="text-xs text-muted-foreground">Select individuals to add for KYC verification.</p>
        </div>
        {availableMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">All members from this household are already included.</p>
        ) : (
          <div className="space-y-2">
            {availableMembers.map((member) => (
              <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                <Checkbox checked={selectedIds.has(member.id)} onCheckedChange={() => toggle(member.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member.name}</span>
                    {member.role && <span className="text-xs text-muted-foreground">{member.role}</span>}
                  </div>
                  {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
                </div>
              </label>
            ))}
          </div>
        )}
        <Button
          className="w-full"
          onClick={() => {
            const parties = availableMembers.filter((m) => selectedIds.has(m.id))
            onAdd(parties)
          }}
          disabled={selectedIds.size === 0}
        >
          Add {selectedIds.size > 0 ? selectedIds.size : ''} individual{selectedIds.size !== 1 ? 's' : ''}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search households..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      </div>
      <div className="space-y-2">
        {filteredHouseholds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {query ? 'No matching households found.' : 'No households with available members.'}
          </p>
        ) : (
          filteredHouseholds.map((household) => {
            const members = household.relatedParties.filter((p) => p.type === 'household_member' && !existingIds.has(p.id))
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
                    {members.length} member{members.length !== 1 ? 's' : ''}
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

function CreateNewMemberForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')

  const handleAdd = () => {
    if (!firstName.trim() || !lastName.trim()) return
    dispatch({
      type: 'ADD_RELATED_PARTY',
      party: {
        id: `kyc-member-${Date.now()}`,
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        type: 'household_member',
        relationship: relationship || undefined,
        role: role || undefined,
        email: email || undefined,
        phone: phone || undefined,
        dob: dob || undefined,
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
      <div className="space-y-2">
        <Label>Date of birth</Label>
        <Input value={dob} onChange={(e) => setDob(e.target.value)} type="date" max={new Date().toISOString().split('T')[0]} />
      </div>
      <Button className="w-full" onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>Add individual</Button>
    </div>
  )
}

function AddIndividualSheet({
  open,
  onOpenChange,
  existingIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingIds: Set<string>
}) {
  const { dispatch } = useWorkflow()
  const [mode, setMode] = useState<'new' | 'existing'>('existing')

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setMode('existing')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Add Individual for Verification</SheetTitle>
          <SheetDescription>Search for an existing individual across households or create a new one.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <AddModeToggle mode={mode} onModeChange={setMode} />
          {mode === 'existing' ? (
            <SearchExistingForKyc
              existingIds={existingIds}
              onAdd={(parties) => {
                parties.forEach((p) =>
                  dispatch({
                    type: 'ADD_RELATED_PARTY',
                    party: { ...p, id: `imported-${p.id}-${Date.now()}`, isPrimary: false, kycStatus: p.kycStatus ?? 'needs_kyc' },
                  })
                )
                handleOpenChange(false)
              }}
            />
          ) : (
            <CreateNewMemberForm onDone={() => handleOpenChange(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// --- KYC review side modal for individual ---

function KycMemberSheet({
  member,
  open,
  onOpenChange,
  onInitiateKyc,
  showInitiateKyc = true,
  locked = false,
  statusLabel,
}: {
  member: RelatedParty | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onInitiateKyc: (member: RelatedParty) => void
  showInitiateKyc?: boolean
  locked?: boolean
  statusLabel?: string
}) {
  const { dispatch } = useWorkflow()
  const [fields, setFields] = useState({
    firstName: '', lastName: '', relationship: '', role: '', email: '', phone: '', dob: '',
  })
  const [snapshot, setSnapshot] = useState(fields)

  useState(() => {
    if (member && open) {
      const s = {
        firstName: member.firstName ?? '',
        lastName: member.lastName ?? '',
        relationship: member.relationship ?? '',
        role: member.role ?? '',
        email: member.email ?? '',
        phone: member.phone ?? '',
        dob: member.dob ?? '',
      }
      setFields(s)
      setSnapshot(s)
    }
  })

  const memberIdRef = useState<string | null>(null)
  if (member && open && memberIdRef[0] !== member.id) {
    memberIdRef[1](member.id)
    const s = {
      firstName: member.firstName ?? '',
      lastName: member.lastName ?? '',
      relationship: member.relationship ?? '',
      role: member.role ?? '',
      email: member.email ?? '',
      phone: member.phone ?? '',
      dob: member.dob ?? '',
    }
    setFields(s)
    setSnapshot(s)
  }
  if (!open && memberIdRef[0] !== null) {
    memberIdRef[1](null)
  }

  if (!member) return null

  const isDirty = Object.keys(snapshot).some(
    (k) => fields[k as keyof typeof fields] !== snapshot[k as keyof typeof snapshot]
  )

  const setField = (key: keyof typeof fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const name = `${fields.firstName} ${fields.lastName}`.trim()
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId: member.id,
      updates: {
        firstName: fields.firstName || undefined,
        lastName: fields.lastName || undefined,
        name: name || member.name,
        relationship: fields.relationship || undefined,
        role: fields.role || undefined,
        email: fields.email || undefined,
        phone: fields.phone || undefined,
        dob: fields.dob || undefined,
      },
    })
    setSnapshot(fields)
  }

  const descriptionText = locked
    ? 'This individual\'s verification is being handled by the compliance team.'
    : showInitiateKyc
      ? 'Review individual details and initiate identity verification.'
      : 'Review individual details.'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{member.name}</SheetTitle>
          <SheetDescription>{descriptionText}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {locked && (
            <div className="rounded-lg border border-border-category1-primary bg-fill-category1-tertiary p-3">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-icon-category1-primary" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-text-category1-primary">Handed off to compliance</p>
                  <p className="text-xs text-text-category1-primary">
                    KYC verification is {statusLabel ? statusLabel : 'in progress'}. Fields are locked while the review is underway.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={fields.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="e.g. Jane" disabled={locked} />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={fields.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="e.g. Doe" disabled={locked} />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={fields.relationship} onValueChange={(v) => setField('relationship', v)} disabled={locked}>
              <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={fields.role} onValueChange={(v) => setField('role', v)} disabled={locked}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={fields.email} onChange={(e) => setField('email', e.target.value)} type="email" placeholder="name@example.com" disabled={locked} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={fields.phone} onChange={(e) => setField('phone', e.target.value)} type="tel" placeholder="+1 (555) 000-0000" disabled={locked} />
          </div>
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input value={fields.dob} onChange={(e) => setField('dob', e.target.value)} type="date" max={new Date().toISOString().split('T')[0]} disabled={locked} />
          </div>

          {/* Document uploads */}
          <div className="pt-2 space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</h4>
            <FileUpload
              id={`kyc-gov-id-${member.id}`}
              label="Government ID"
              subtitle="Upload a passport, driver's license, or national ID card"
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              disabled={locked}
              onFilesChange={() => {}}
            />
            <FileUpload
              id={`kyc-proof-address-${member.id}`}
              label="Proof of Address"
              subtitle="Upload a utility bill, bank statement, or tax document"
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              disabled={locked}
              onFilesChange={() => {}}
            />
          </div>
        </div>
        {!locked && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleSave} disabled={!isDirty}>Save</Button>
            {showInitiateKyc && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (isDirty) handleSave()
                  onInitiateKyc(member)
                }}
              >
                <ShieldAlert className="h-4 w-4 mr-1.5" />
                Initiate KYC
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// --- KYC confirmation dialog ---

function KycConfirmationDialog({
  member,
  open,
  onConfirm,
  onCancel,
}: {
  member: RelatedParty | null
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!member || !open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-fill-warning-tertiary p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-icon-warning-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Confirm Identity Verification</h3>
            <p className="text-sm text-muted-foreground">
              You are about to initiate KYC verification for <strong>{member.name}</strong>.
              This will trigger a background check through our verification provider.
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>
            Yes, Initiate KYC
          </Button>
        </div>
      </div>
    </div>
  )
}

export function KycForm() {
  const { state, dispatch } = useWorkflow()
  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  const children = kycTask?.children ?? []

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const verifiedMembers = householdMembers.filter((m) => m.kycStatus === 'verified')
  const pendingMembers = householdMembers.filter((m) => m.kycStatus === 'pending')
  const needsKycMembers = householdMembers.filter((m) => m.kycStatus !== 'verified' && m.kycStatus !== 'pending')

  const [showAddSheet, setShowAddSheet] = useState(false)
  const [reviewMemberId, setReviewMemberId] = useState<string | null>(null)
  const [confirmMember, setConfirmMember] = useState<RelatedParty | null>(null)
  const [lockedMemberId, setLockedMemberId] = useState<string | null>(null)

  const existingMemberIds = useMemo(
    () => new Set(householdMembers.map((m) => m.id)),
    [householdMembers]
  )

  const reviewMember = reviewMemberId ? state.relatedParties.find((p) => p.id === reviewMemberId) ?? null : null

  const lockedMember = lockedMemberId ? state.relatedParties.find((p) => p.id === lockedMemberId) ?? null : null
  const lockedChild = lockedMember ? children.find((c) => c.name === lockedMember.name) ?? null : null

  const handleInitiateKyc = (member: RelatedParty) => {
    setReviewMemberId(null)
    setConfirmMember(member)
  }

  const handleConfirmKyc = () => {
    if (!confirmMember || !kycTask) return
    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: kycTask.id,
      childName: confirmMember.name,
      childType: 'kyc',
    })
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId: confirmMember.id,
      updates: { kycStatus: 'pending' as const },
    })
    setConfirmMember(null)
  }

  const hasChildren = children.length > 0
  const allVerified = needsKycMembers.length === 0

  // Phase 2: Post-spawn status dashboard
  if (hasChildren) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Review household members and initiate identity verification for each individual.
        </p>

        {/* Hero add button */}
        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          className="w-full rounded-lg border-2 border-dashed border-border p-6 flex flex-col items-center gap-3 text-center hover:bg-muted/50 hover:border-muted-foreground/40 transition-colors"
        >
          <div className="rounded-full bg-primary/10 p-3">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Add Individual for Verification</p>
            <p className="text-xs text-muted-foreground mt-1">Search for an existing individual or create a new one</p>
          </div>
        </button>

        {verifiedMembers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Previously Verified
            </h3>
            {verifiedMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setReviewMemberId(member.id)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-success-tertiary text-text-success-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{member.name}</span>
                    {member.relationship && (
                      <span className="ml-2 text-xs text-muted-foreground/70">{member.relationship}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs text-text-success-primary bg-fill-success-tertiary">
                  Verified
                </Badge>
              </button>
            ))}
          </div>
        )}

        {pendingMembers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending Verification
            </h3>
            {pendingMembers.map((member) => {
              const child = children.find((c) => c.name === member.name)
              return (
                <button
                  key={member.id}
                  onClick={() => setLockedMemberId(member.id)}
                  className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {member.name[0]}
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {child ? child.status.replace('_', ' ') : 'pending'}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}

        {needsKycMembers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Requires Verification
            </h3>
            {needsKycMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setReviewMemberId(member.id)}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.name}</span>
                  {member.relationship && (
                    <span className="text-xs text-muted-foreground">{member.relationship}</span>
                  )}
                </div>
                <Badge variant="secondary" className="text-[10px] text-text-warning-primary bg-fill-warning-tertiary shrink-0">Needs verification</Badge>
              </button>
            ))}
          </div>
        )}

        <AddIndividualSheet
          open={showAddSheet}
          onOpenChange={setShowAddSheet}
          existingIds={existingMemberIds}
        />

        <KycMemberSheet
          member={reviewMember}
          open={!!reviewMemberId}
          onOpenChange={(open) => { if (!open) setReviewMemberId(null) }}
          onInitiateKyc={handleInitiateKyc}
          showInitiateKyc={reviewMember?.kycStatus !== 'verified'}
        />

        <KycMemberSheet
          member={lockedMember}
          open={!!lockedMemberId}
          onOpenChange={(open) => { if (!open) setLockedMemberId(null) }}
          onInitiateKyc={() => {}}
          locked
          statusLabel={lockedChild?.status.replace('_', ' ')}
        />

        <KycConfirmationDialog
          member={confirmMember}
          open={!!confirmMember}
          onConfirm={handleConfirmKyc}
          onCancel={() => setConfirmMember(null)}
        />
      </div>
    )
  }

  // Phase 1: Review individuals
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review household members and initiate identity verification for each individual.
      </p>

      {/* Hero add button */}
      <button
        type="button"
        onClick={() => setShowAddSheet(true)}
        className="w-full rounded-lg border-2 border-dashed border-border p-6 flex flex-col items-center gap-3 text-center hover:bg-muted/50 hover:border-muted-foreground/40 transition-colors"
      >
        <div className="rounded-full bg-primary/10 p-3">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Add Individual for Verification</p>
          <p className="text-xs text-muted-foreground mt-1">Search for an existing individual or create a new one</p>
        </div>
      </button>

      {verifiedMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Already Verified
          </h3>
          {verifiedMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setReviewMemberId(member.id)}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-success-tertiary text-text-success-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{member.name}</span>
                  {member.relationship && (
                    <span className="ml-2 text-xs text-muted-foreground/70">{member.relationship}</span>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs text-text-success-primary bg-fill-success-tertiary">
                Verified
              </Badge>
            </button>
          ))}
        </div>
      )}

      {allVerified ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-text-success-primary" />
          <p className="text-sm font-medium">All household members have been previously verified.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No KYC action is required for this household. You may proceed to the next step.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Requires Verification
          </h3>
          {needsKycMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setReviewMemberId(member.id)}
              className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{member.name}</span>
                {member.relationship && (
                  <span className="text-xs text-muted-foreground">{member.relationship}</span>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] text-text-warning-primary bg-fill-warning-tertiary shrink-0">Needs verification</Badge>
            </button>
          ))}
        </div>
      )}

      <AddIndividualSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        existingIds={existingMemberIds}
      />

      <KycMemberSheet
        member={reviewMember}
        open={!!reviewMemberId}
        onOpenChange={(open) => { if (!open) setReviewMemberId(null) }}
        onInitiateKyc={handleInitiateKyc}
        showInitiateKyc={reviewMember?.kycStatus !== 'verified'}
      />

      <KycConfirmationDialog
        member={confirmMember}
        open={!!confirmMember}
        onConfirm={handleConfirmKyc}
        onCancel={() => setConfirmMember(null)}
      />
    </div>
  )
}
