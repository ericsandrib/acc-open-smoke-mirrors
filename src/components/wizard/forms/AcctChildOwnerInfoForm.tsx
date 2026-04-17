import { useEffect, useMemo, useState } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import {
  AccountProfileSection,
  AccountAdditionalInformationSection,
} from '@/components/wizard/forms/AccountProfileSection'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import {
  getMaxAccountOwnersForRegistration,
} from '@/utils/registrationOwnerLimits'
import { Plus, UserPlus } from 'lucide-react'
import {
  AddClientInfoLegalEntitySheet,
  AddHouseholdMemberSheet,
} from '@/components/wizard/forms/AddPartySheet'
import { AccountOwnerPartySheet } from '@/components/wizard/forms/AccountOwnerPartySheet'
import { EditLegalEntitySheet } from '@/components/wizard/forms/EditLegalEntitySheet'
import { PartySlotCard } from '@/components/wizard/forms/PartySlotCard'
import { AccountFeatureRequestsSection } from '@/components/wizard/forms/AccountFeatureRequestsSection'
import { toast } from 'sonner'
import { isTrustEntityParty } from '@/utils/trustEntityParty'

type OwnerRow = { id: string; type: 'existing'; partyId?: string }

export function AcctChildOwnerInfoForm() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)
  const editingParty = editingPartyId
    ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null
    : null

  const childId = ctx?.child.id ?? ''
  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const childRegType = (childMeta?.registrationType as RegistrationType | undefined) ?? null
  const trustEntityOwnersOnly = childRegType === 'TRUST'

  const accountOwnerCandidates = useMemo(() => {
    if (trustEntityOwnersOnly) {
      return state.relatedParties.filter((p) => !p.isHidden && isTrustEntityParty(p))
    }
    return state.relatedParties.filter(
      (p) =>
        !p.isHidden &&
        (p.type === 'household_member' || p.type === 'related_organization'),
    )
  }, [state.relatedParties, trustEntityOwnersOnly])
  const productAccountTypeOverride = (childMeta?.accountProductType as AccountType | undefined) ?? null

  const owners = useMemo(
    () => (data.owners as OwnerRow[] | undefined) ?? [],
    [data.owners],
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

  const handleStartKyc = (partyId: string) => {
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party || !kycParentTask) return

    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: kycParentTask.id,
      childName: party.name,
      childType: 'kyc',
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
    const kycChild = kycParentTask.children?.find((c) => c.name === party.name && c.childType === 'kyc')
    dispatch({ type: 'EXIT_CHILD_ACTION' })
    dispatch({ type: 'SET_ACTIVE_TASK', taskId: kycParentTask.id })
    if (kycChild) {
      dispatch({ type: 'ENTER_CHILD_ACTION', childId: kycChild.id })
    }
  }

  if (!ctx) {
    return (
      <p className="text-sm text-muted-foreground">
        Open this task from Open Accounts to edit account information and owners.
      </p>
    )
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
            ) : (
              <>
                Add the owner(s) for this account. Select an existing person or entity, or add someone new.
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
            addPartyItemLabel={
              trustEntityOwnersOnly
                ? 'Search for a trust or create a new trust profile'
                : 'Search for an existing client or add a new individual or entity'
            }
            addPartyItemDescription={
              trustEntityOwnersOnly
                ? 'Adds a trust legal entity to this household for use as account owner.'
                : 'Adds to this household for use as an account owner.'
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
            description="Search the directory for an existing client or add a new person or legal entity to assign as an account owner."
            includeLegalEntityCreate
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
