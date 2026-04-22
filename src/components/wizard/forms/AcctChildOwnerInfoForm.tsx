import { useEffect, useMemo, useState } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AccountProfileSection,
  AccountAdditionalInformationSection,
} from '@/components/wizard/forms/AccountProfileSection'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import {
  getMaxAccountOwnersForRegistration,
  registrationAllowsLegalEntityAsAccountOwner,
} from '@/utils/registrationOwnerLimits'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import {
  AddClientInfoLegalEntitySheet,
  AddHouseholdMemberSheet,
  BENEFICIARY_RELATIONSHIP_TO_OWNER_OPTIONS,
  clampBeneficiaryAllocationInput,
} from '@/components/wizard/forms/AddPartySheet'
import { AccountOwnerPartySheet } from '@/components/wizard/forms/AccountOwnerPartySheet'
import { EditLegalEntitySheet } from '@/components/wizard/forms/EditLegalEntitySheet'
import { PartySlotCard } from '@/components/wizard/forms/PartySlotCard'
import { AccountFeatureRequestsSection } from '@/components/wizard/forms/AccountFeatureRequestsSection'
import { toast } from 'sonner'
import { isTrustEntityParty } from '@/utils/trustEntityParty'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type OwnerRow = { id: string; type: 'existing'; partyId?: string }
type BeneficiaryDesignationType = 'primary' | 'contingent'
type BeneficiaryRow = {
  id: string
  type: 'existing'
  partyId?: string
  designationType?: BeneficiaryDesignationType
  allocationPercent?: string
  relationshipIndicator?: string
  nameType?: 'I'
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  taxIdType?: string
  taxIdNumber?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function parsePercent(raw?: string): number {
  if (!raw) return 0
  const normalized = raw.replace(/[^0-9.]/g, '')
  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

export function AcctChildOwnerInfoForm() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)
  const [editingBeneficiaryId, setEditingBeneficiaryId] = useState<string | null>(null)
  const [addBeneficiarySheetOpen, setAddBeneficiarySheetOpen] = useState(false)
  const editingParty = editingPartyId
    ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null
    : null

  const childId = ctx?.child.id ?? ''
  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const childRegType = (childMeta?.registrationType as RegistrationType | undefined) ?? null
  const trustEntityOwnersOnly = childRegType === 'TRUST'
  const allowLegalEntityAsOwner =
    !trustEntityOwnersOnly && registrationAllowsLegalEntityAsAccountOwner(childRegType)

  const accountOwnerCandidates = useMemo(() => {
    if (trustEntityOwnersOnly) {
      return state.relatedParties.filter((p) => !p.isHidden && isTrustEntityParty(p))
    }
    if (allowLegalEntityAsOwner) {
      return state.relatedParties.filter(
        (p) =>
          !p.isHidden &&
          (p.type === 'household_member' || p.type === 'related_organization'),
      )
    }
    return state.relatedParties.filter((p) => !p.isHidden && p.type === 'household_member')
  }, [state.relatedParties, trustEntityOwnersOnly, allowLegalEntityAsOwner])
  const productAccountTypeOverride = (childMeta?.accountProductType as AccountType | undefined) ?? null

  const owners = useMemo(
    () => (data.owners as OwnerRow[] | undefined) ?? [],
    [data.owners],
  )
  const beneficiaries = useMemo(
    () =>
      ((data.beneficiaries as BeneficiaryRow[] | undefined) ?? []).map((b) => ({
        ...b,
        type: 'existing' as const,
        nameType: 'I' as const,
      })),
    [data.beneficiaries],
  )

  const maxOwners = getMaxAccountOwnersForRegistration(childRegType)
  const canAddMoreOwners = owners.length < maxOwners

  const [addMemberSheetOwnerId, setAddMemberSheetOwnerId] = useState<string | null>(null)
  const kycParentTask =
    state.tasks.find((t) => t.formKey === 'kyc')
    ?? state.tasks.find((t) => t.formKey === 'open-accounts')

  useEffect(() => {
    if (!ctx) return
    if (owners.length <= maxOwners) return
    updateField('owners', owners.slice(0, maxOwners))
    toast.info('Owner list was adjusted to match this registration type.', { duration: 4500 })
  }, [ctx, maxOwners, owners, updateField])

  useEffect(() => {
    if (!ctx || !trustEntityOwnersOnly) return
    let changed = false
    const next = owners.map((o) => {
      if (!o.partyId) return o
      const party = state.relatedParties.find((p) => p.id === o.partyId)
      if (!party || !isTrustEntityParty(party)) {
        changed = true
        return { ...o, partyId: undefined }
      }
      return o
    })
    if (changed) {
      updateField('owners', next)
      toast.info(
        'Account owner selections were cleared. Trust registrations may only include legal entities with entity type Trust.',
        { duration: 5000 },
      )
    }
  }, [ctx, trustEntityOwnersOnly, owners, state.relatedParties, updateField])

  useEffect(() => {
    if (!ctx || trustEntityOwnersOnly || allowLegalEntityAsOwner) return
    let changed = false
    const next = owners.map((o) => {
      if (!o.partyId) return o
      const party = state.relatedParties.find((p) => p.id === o.partyId)
      if (party?.type === 'related_organization') {
        changed = true
        return { ...o, partyId: undefined }
      }
      return o
    })
    if (changed) {
      updateField('owners', next)
      toast.info(
        'Account owner selections were updated. This registration only allows natural persons as owners.',
        { duration: 5000 },
      )
    }
  }, [ctx, trustEntityOwnersOnly, allowLegalEntityAsOwner, owners, state.relatedParties, updateField])

  const handleStartKyc = (partyId: string) => {
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party || !kycParentTask) return

    const linkedTrustPartyIds =
      party.type === 'related_organization'
        ? [
            ...(party.trustParties ?? []).map((t) => t.partyId).filter((id): id is string => Boolean(id)),
            ...(party.beneficialOwners ?? [])
              .map((b) =>
                state.relatedParties.find(
                  (p) => p.type !== 'related_organization' && p.name === b.name && !p.isHidden,
                )?.id,
              )
              .filter((id): id is string => Boolean(id)),
          ]
        : []
    const relatedSubjectPartyIds = Array.from(new Set(linkedTrustPartyIds))

    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: kycParentTask.id,
      childName: party.name,
      childType: 'kyc',
      metadata: {
        kycSubjectPartyId: party.id,
        kycSubjectType: party.type === 'related_organization' ? 'entity' : 'individual',
        ...(relatedSubjectPartyIds.length > 0 ? { kycRelatedSubjectPartyIds: relatedSubjectPartyIds } : {}),
      },
    })
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId,
      updates: { kycStatus: 'pending' },
    })

    toast(`KYC verification started for ${party.name}`, {
      description: 'Identity verification has been initiated. You can continue here or go to Open Accounts.',
      action: {
        label: 'Go to Open Accounts',
        onClick: () => {
          dispatch({ type: 'EXIT_CHILD_ACTION' })
          dispatch({ type: 'SET_ACTIVE_TASK', taskId: kycParentTask.id })
        },
      },
    })
  }

  const handleGoToKyc = (partyId: string) => {
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party || !kycParentTask) return
    const kycChild =
      kycParentTask.children?.find((c) => {
        if (c.childType !== 'kyc') return false
        const meta = state.taskData[c.id] as Record<string, unknown> | undefined
        if ((meta?.kycSubjectPartyId as string | undefined) === party.id) return true
        return c.name === party.name
      })
    dispatch({ type: 'EXIT_CHILD_ACTION' })
    dispatch({ type: 'SET_ACTIVE_TASK', taskId: kycParentTask.id })
    if (kycChild) {
      dispatch({ type: 'ENTER_CHILD_ACTION', childId: kycChild.id })
    }
  }

  const addOwnerSlot = () => {
    if (!canAddMoreOwners) return
    updateField('owners', [...owners, { id: `owner-${Date.now()}`, type: 'existing' }])
  }

  const removeOwner = (ownerId: string) => {
    updateField('owners', owners.filter((o) => o.id !== ownerId))
  }

  const updateOwner = (ownerId: string, updates: Record<string, unknown>) => {
    updateField(
      'owners',
      owners.map((o) => (o.id === ownerId ? { ...o, ...updates } : o)),
    )
  }

  const selectExistingOwner = (ownerId: string, partyId: string) => {
    updateOwner(ownerId, { partyId, type: 'existing' })
  }

  const ownerPartyIdsInUse = owners
    .map((o) => o.partyId)
    .filter((id): id is string => Boolean(id))

  const canDeleteOwnerCandidate = (partyId: string) => {
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party) return { allowed: false, reason: 'Party not found' }
    if (party.isPrimary) return { allowed: false, reason: 'Primary account holder cannot be deleted' }
    if (ownerPartyIdsInUse.includes(partyId)) {
      return { allowed: false, reason: 'Already selected as an account owner' }
    }
    return { allowed: true }
  }

  const deleteOwnerCandidate = (partyId: string) => {
    const rule = canDeleteOwnerCandidate(partyId)
    if (!rule.allowed) {
      toast.info(rule.reason ?? 'This party cannot be deleted.')
      return
    }
    dispatch({ type: 'REMOVE_RELATED_PARTY', partyId })
    toast.success('Removed from available owner candidates.')
  }

  const updateBeneficiaries = (next: BeneficiaryRow[]) => updateField('beneficiaries', next)

  const removeBeneficiary = (beneficiaryId: string) => {
    updateBeneficiaries(beneficiaries.filter((b) => b.id !== beneficiaryId))
    if (editingBeneficiaryId === beneficiaryId) setEditingBeneficiaryId(null)
  }

  const updateBeneficiary = (beneficiaryId: string, patch: Partial<BeneficiaryRow>) => {
    updateBeneficiaries(beneficiaries.map((b) => (b.id === beneficiaryId ? { ...b, ...patch } : b)))
  }

  const editingBeneficiary = editingBeneficiaryId
    ? beneficiaries.find((b) => b.id === editingBeneficiaryId) ?? null
    : null
  const editingBeneficiaryParty = editingBeneficiary?.partyId
    ? state.relatedParties.find((p) => p.id === editingBeneficiary.partyId) ?? null
    : null

  const primaryTotal = beneficiaries
    .filter((b) => b.designationType === 'primary')
    .reduce((sum, b) => sum + parsePercent(b.allocationPercent), 0)
  const contingentTotal = beneficiaries
    .filter((b) => b.designationType === 'contingent')
    .reduce((sum, b) => sum + parsePercent(b.allocationPercent), 0)

  if (!ctx) {
    return (
      <p className="text-sm text-muted-foreground">
        Open this task from Open Accounts to edit account information and owners.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4" />
            Owners & participants
          </h3>
          <p className="text-sm text-muted-foreground">
            {trustEntityOwnersOnly ? (
              <>
                Add the trust legal entity for this registration. Search for an existing trust or create one if needed.
                Individuals cannot be account owners on trust registrations.
              </>
            ) : allowLegalEntityAsOwner ? (
              <>
                Add the owner(s) for this account. You may assign natural persons or eligible legal entities from this
                client record.
              </>
            ) : (
              <>
                Add the owner(s) for this account. Only natural persons may be owners for this registration—select an
                existing household member or create a new individual.
              </>
            )}
          </p>
        </div>

        {owners.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <UserPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              No owners added yet.
            </p>
            <Button onClick={addOwnerSlot} disabled={!canAddMoreOwners}>
              <Plus className="h-4 w-4 mr-1" />
              Add Owner
            </Button>
          </div>
        )}

        {owners.map((owner, idx) => (
          <PartySlotCard
            key={owner.id}
            title={`Owner ${idx + 1}`}
            roleLabel="Account owner"
            selectLabel="Select account owner"
            partyId={owner.partyId}
            onPartyIdChange={(v) => selectExistingOwner(owner.id, v)}
            onRemove={() => removeOwner(owner.id)}
            parties={state.relatedParties}
            selectCandidates={accountOwnerCandidates}
            onOpenAddParty={() => setAddMemberSheetOwnerId(owner.id)}
            onEditParty={(id) => setEditingPartyId(id)}
            onDeleteCandidate={deleteOwnerCandidate}
            canDeleteCandidate={(party) => canDeleteOwnerCandidate(party.id)}
            addPartyItemLabel={
              trustEntityOwnersOnly
                ? 'Search for a trust or create a new trust profile'
                : allowLegalEntityAsOwner
                  ? 'Search for an existing client or add a new individual or legal entity'
                  : 'Search for an existing client or add a new individual'
            }
            addPartyItemDescription={
              trustEntityOwnersOnly
                ? 'Adds a trust legal entity to this household for use as account owner.'
                : allowLegalEntityAsOwner
                  ? 'Adds to this household for use as account owner.'
                  : 'Adds a person to this household for use as account owner.'
            }
            onStartKyc={handleStartKyc}
            onGoToKyc={handleGoToKyc}
          />
        ))}

        {owners.length > 0 && canAddMoreOwners && (
          <Button variant="outline" className="w-full" onClick={addOwnerSlot}>
            <Plus className="h-4 w-4 mr-1" />
            Add Another Owner
          </Button>
        )}

        {trustEntityOwnersOnly ? (
          <AddClientInfoLegalEntitySheet
            open={addMemberSheetOwnerId !== null}
            onOpenChange={(open) => {
              if (!open) setAddMemberSheetOwnerId(null)
            }}
            onPartyAdded={(partyId) => {
              if (addMemberSheetOwnerId) {
                selectExistingOwner(addMemberSheetOwnerId, partyId)
              }
              setAddMemberSheetOwnerId(null)
            }}
            variant="trust"
            title="Add trust account owner"
            description="Search for an existing trust or create a new trust profile to assign as account owner."
          />
        ) : (
          <AddHouseholdMemberSheet
            open={addMemberSheetOwnerId !== null}
            onOpenChange={(open) => {
              if (!open) setAddMemberSheetOwnerId(null)
            }}
            onPartyAdded={(partyId) => {
              if (addMemberSheetOwnerId) {
                selectExistingOwner(addMemberSheetOwnerId, partyId)
              }
              setAddMemberSheetOwnerId(null)
            }}
            title="Add account owner"
            description={
              allowLegalEntityAsOwner
                ? 'Search the directory for an existing client or add a new person or legal entity to assign as an account owner.'
                : 'Search the directory for an existing client or add a new individual to assign as an account owner.'
            }
            includeLegalEntityCreate={allowLegalEntityAsOwner}
            individualCreateOnly={!allowLegalEntityAsOwner}
            accountOwnerSearchFullForm
          />
        )}

        {editingParty?.type === 'related_organization' ? (
          <EditLegalEntitySheet
            party={editingParty}
            open={editingPartyId !== null}
            onOpenChange={(o) => {
              if (!o) setEditingPartyId(null)
            }}
          />
        ) : (
          <AccountOwnerPartySheet
            party={editingParty}
            open={editingPartyId !== null}
            onOpenChange={(o) => {
              if (!o) setEditingPartyId(null)
            }}
          />
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4" />
            Beneficiaries
          </h3>
          <p className="text-sm text-muted-foreground">
            Add beneficiaries from this client record, the directory, or a manual entry. Open a row to complete
            designation details.
          </p>
        </div>

        <div className="rounded-lg border border-border p-1">
          <div>
            {beneficiaries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">No beneficiaries added yet.</p>
              </div>
            ) : (
              beneficiaries.map((beneficiary) => {
                const party = beneficiary.partyId
                  ? state.relatedParties.find((p) => p.id === beneficiary.partyId)
                  : null
                const beneficiaryName = (party?.name ?? beneficiary.firstName?.trim()) || 'Beneficiary'
                const typeLabel =
                  beneficiary.designationType === 'contingent' ? 'Contingent' : 'Primary'
                const allocationLabel = beneficiary.allocationPercent?.trim()
                  ? `${beneficiary.allocationPercent}%`
                  : 'Not set'
                return (
                  <div key={beneficiary.id}>
                    <button
                      type="button"
                      onClick={() => setEditingBeneficiaryId(beneficiary.id)}
                      className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                          {getInitials(beneficiaryName)}
                        </div>
                        <span className="truncate text-sm font-medium">{beneficiaryName}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">{typeLabel}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{allocationLabel}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBeneficiary(beneficiary.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </button>
                  </div>
                )
              })
            )}
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setAddBeneficiarySheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add beneficiary
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Beneficiary allocation totals
          </p>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Primary total</p>
              <p className="font-medium tabular-nums">{primaryTotal.toFixed(2)}%</p>
              {primaryTotal !== 100 && (
                <p className="mt-1 text-xs text-muted-foreground">Primary beneficiaries should total 100%.</p>
              )}
            </div>
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Contingent total</p>
              <p className="font-medium tabular-nums">{contingentTotal.toFixed(2)}%</p>
              {contingentTotal !== 100 && (
                <p className="mt-1 text-xs text-muted-foreground">Contingent beneficiaries should total 100%.</p>
              )}
            </div>
          </div>
        </div>

        <AddHouseholdMemberSheet
          open={addBeneficiarySheetOpen}
          onOpenChange={(open) => {
            setAddBeneficiarySheetOpen(open)
          }}
          onPartyAdded={(partyId, fields) => {
            const party = state.relatedParties.find((p) => p.id === partyId)
            const beneficiaryId = `beneficiary-${Date.now()}`
            updateBeneficiaries([
              ...beneficiaries,
              {
                id: beneficiaryId,
                type: 'existing',
                partyId,
                nameType: 'I',
                designationType: fields?.designationType ?? 'primary',
                allocationPercent: fields?.allocationPercent,
                relationshipIndicator: fields?.relationshipIndicator,
                firstName: fields?.firstName ?? party?.firstName ?? '',
                lastName: fields?.lastName ?? party?.lastName ?? '',
                dateOfBirth: fields?.dateOfBirth ?? party?.dob ?? '',
                gender: fields?.gender,
                taxIdType: fields?.taxIdType,
                taxIdNumber: fields?.taxIdNumber ?? party?.taxId ?? '',
              },
            ])
            setAddBeneficiarySheetOpen(false)
          }}
          title="Add beneficiary"
          description="Choose someone already on this client, search the directory, or create a new beneficiary."
          beneficiaryCreateFields
          excludePartyIds={beneficiaries
            .map((b) => b.partyId)
            .filter((id): id is string => Boolean(id))}
        />

        <Sheet
          open={editingBeneficiaryId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingBeneficiaryId(null)
          }}
        >
          <SheetContent side="right" className="sm:max-w-[560px] flex flex-col gap-0 p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <SheetTitle>Beneficiary details</SheetTitle>
              <SheetDescription>
                Review or update beneficiary metadata for allocation and registration mapping.
              </SheetDescription>
            </SheetHeader>
            {editingBeneficiary && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{editingBeneficiaryParty?.name ?? 'Beneficiary'}</p>
                    <p className="text-xs text-muted-foreground">Name type defaults to Individual (I).</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Beneficiary type</Label>
                      <Select
                        value={editingBeneficiary.designationType ?? 'primary'}
                        onValueChange={(v) =>
                          updateBeneficiary(editingBeneficiary.id, {
                            designationType: v as BeneficiaryDesignationType,
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary (P)</SelectItem>
                          <SelectItem value="contingent">Contingent (C)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Allocation %</Label>
                      <Input
                        className="h-9 tabular-nums"
                        inputMode="decimal"
                        value={editingBeneficiary.allocationPercent ?? ''}
                        onChange={(e) =>
                          updateBeneficiary(editingBeneficiary.id, {
                            allocationPercent: clampBeneficiaryAllocationInput(e.target.value),
                          })
                        }
                        placeholder="e.g. 50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Relationship to account owner</Label>
                    <Select
                      value={editingBeneficiary.relationshipIndicator ?? ''}
                      onValueChange={(v) =>
                        updateBeneficiary(editingBeneficiary.id, { relationshipIndicator: v })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select relationship..." />
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">First name</Label>
                      <Input
                        className="h-9"
                        value={editingBeneficiary.firstName ?? ''}
                        onChange={(e) => updateBeneficiary(editingBeneficiary.id, { firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Last name</Label>
                      <Input
                        className="h-9"
                        value={editingBeneficiary.lastName ?? ''}
                        onChange={(e) => updateBeneficiary(editingBeneficiary.id, { lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date of birth</Label>
                      <Input
                        className="h-9"
                        type="date"
                        value={editingBeneficiary.dateOfBirth ?? ''}
                        onChange={(e) =>
                          updateBeneficiary(editingBeneficiary.id, { dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Gender</Label>
                      <Select
                        value={editingBeneficiary.gender ?? ''}
                        onValueChange={(v) => updateBeneficiary(editingBeneficiary.id, { gender: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select gender..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="X">Other / Unspecified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tax ID type</Label>
                      <Select
                        value={editingBeneficiary.taxIdType ?? ''}
                        onValueChange={(v) => updateBeneficiary(editingBeneficiary.id, { taxIdType: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select tax ID type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">Social Security Number (S)</SelectItem>
                          <SelectItem value="T">Taxpayer Identification Number (T)</SelectItem>
                          <SelectItem value="N">National Identification Number (N)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tax ID number</Label>
                      <Input
                        className="h-9"
                        value={editingBeneficiary.taxIdNumber ?? ''}
                        onChange={(e) =>
                          updateBeneficiary(editingBeneficiary.id, { taxIdNumber: e.target.value })
                        }
                        placeholder="Tax ID number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </section>

      <AccountProfileSection
        data={data}
        updateField={updateField}
        registrationType={childRegType}
        productAccountTypeOverride={productAccountTypeOverride}
        prefilledAccountNumber={(childMeta?.accountNumber as string) ?? ''}
      />

      {childId ? (
        <section className="space-y-6">
          <AccountFeatureRequestsSection accountChildId={childId} />
        </section>
      ) : null}

      <AccountAdditionalInformationSection data={data} updateField={updateField} />
    </div>
  )
}
