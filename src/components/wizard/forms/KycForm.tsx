import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { FileUpload } from '@/components/ui/file-upload'
import { CheckCircle2, ShieldAlert, Info, UserPlus, Trash2 } from 'lucide-react'
import type { RelatedParty } from '@/types/workflow'
import { AddHouseholdMemberSheet } from './AddPartySheet'

const householdRelationships = ['Spouse', 'Child', 'Parent', 'Sibling']
const householdRoles = ['Client', 'Spouse', 'Dependent', 'Trustee', 'Beneficiary']

// --- KYC review side modal for individual ---

export function KycMemberSheet({
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
  const [lockedMemberId, setLockedMemberId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)

  const reviewMember = reviewMemberId ? state.relatedParties.find((p) => p.id === reviewMemberId) ?? null : null

  const lockedMember = lockedMemberId ? state.relatedParties.find((p) => p.id === lockedMemberId) ?? null : null
  const lockedChild = lockedMember ? children.find((c) => c.name === lockedMember.name) ?? null : null

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === needsKycMembers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(needsKycMembers.map((m) => m.id)))
    }
  }

  const handleBatchKyc = () => {
    if (!kycTask || selectedIds.size === 0) return
    for (const id of selectedIds) {
      const member = needsKycMembers.find((m) => m.id === id)
      if (!member) continue
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId: kycTask.id,
        childName: member.name,
        childType: 'kyc',
      })
      dispatch({
        type: 'UPDATE_RELATED_PARTY',
        partyId: member.id,
        updates: { kycStatus: 'pending' as const },
      })
    }
    setSelectedIds(new Set())
    setShowBatchConfirm(false)
  }

  const selectedMembers = needsKycMembers.filter((m) => selectedIds.has(m.id))
  const allVerified = needsKycMembers.length === 0

  const renderVerified = () =>
    verifiedMembers.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {children.length > 0 ? 'Previously Verified' : 'Already Verified'}
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs text-text-success-primary bg-fill-success-tertiary">
                Verified
              </Badge>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: member.id }) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: member.id }) } }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>
    )

  const renderPending = () =>
    pendingMembers.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pending Verification
        </h3>
        {pendingMembers.map((member) => {
          const child = children.find((c) => c.name === member.name)
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setLockedMemberId(member.id)}
              className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {member.name[0]}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-xs">
                  {child ? child.status.replace('_', ' ') : 'pending'}
                </Badge>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: member.id }) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: member.id }) } }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    )

  const renderNeedsKyc = () =>
    needsKycMembers.length > 0 && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Requires Verification
          </h3>
          {needsKycMembers.length > 1 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedIds.size === needsKycMembers.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
        {needsKycMembers.map((member) => {
          const isSelected = selectedIds.has(member.id)
          return (
            <div key={member.id} className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(member.id)}
              />
              <button
                type="button"
                onClick={() => setReviewMemberId(member.id)}
                className="flex-1 flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.name}</span>
                  {member.relationship && (
                    <span className="text-xs text-muted-foreground">{member.relationship}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] text-text-warning-primary bg-fill-warning-tertiary shrink-0">
                    Needs verification
                  </Badge>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: member.id }) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); dispatch({ type: 'REMOVE_RELATED_PARTY', partyId: member.id }) } }}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </div>
          )
        })}
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowBatchConfirm(true)}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Initiate KYC for {selectedIds.size} individual{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    )

  const renderSheets = () => (
    <>
      <AddHouseholdMemberSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
      />

      <KycMemberSheet
        member={reviewMember}
        open={!!reviewMemberId}
        onOpenChange={(open) => { if (!open) setReviewMemberId(null) }}
        onInitiateKyc={() => {}}
        showInitiateKyc={false}
      />

      {lockedMember && (
        <KycMemberSheet
          member={lockedMember}
          open={!!lockedMemberId}
          onOpenChange={(open) => { if (!open) setLockedMemberId(null) }}
          onInitiateKyc={() => {}}
          locked
          statusLabel={lockedChild?.status.replace('_', ' ')}
        />
      )}

      {showBatchConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowBatchConfirm(false)} />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-fill-warning-tertiary p-2 shrink-0">
                <ShieldAlert className="h-5 w-5 text-icon-warning-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold">Confirm Identity Verification</h3>
                <p className="text-sm text-muted-foreground">
                  You are about to initiate KYC verification for {selectedMembers.length} individual{selectedMembers.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm space-y-1">
                  {selectedMembers.map((m) => (
                    <li key={m.id} className="font-medium">{m.name}</li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  This will trigger background checks through our verification provider. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowBatchConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleBatchKyc}>
                Yes, Initiate KYC
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review household members and initiate identity verification. Select the individuals who require verification and kick off KYC for all of them at once.
      </p>

      <Button variant="outline" className="w-full" onClick={() => setShowAddSheet(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Add Individual for Verification
      </Button>

      {renderVerified()}
      {renderPending()}

      {allVerified && pendingMembers.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-text-success-primary" />
          <p className="text-sm font-medium">All household members have been previously verified.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No KYC action is required for this household. You may proceed to the next step.
          </p>
        </div>
      ) : (
        renderNeedsKyc()
      )}

      {renderSheets()}
    </div>
  )
}
