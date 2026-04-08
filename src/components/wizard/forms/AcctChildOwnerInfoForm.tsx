import { useMemo, useState } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import {
  AccountProfileSection,
  AccountAdditionalInformationSection,
} from '@/components/wizard/forms/AccountProfileSection'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { Plus, UserPlus } from 'lucide-react'
import { AddHouseholdMemberSheet } from '@/components/wizard/forms/AddPartySheet'
import { AccountOwnerPartySheet } from '@/components/wizard/forms/AccountOwnerPartySheet'
import { PartySlotCard } from '@/components/wizard/forms/PartySlotCard'
import { toast } from 'sonner'

type OwnerRow = { id: string; type: 'existing'; partyId?: string }

export function AcctChildOwnerInfoForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)
  const editingParty = editingPartyId
    ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null
    : null

  const accountOwnerCandidates = state.relatedParties.filter(
    (p) =>
      !p.isHidden &&
      (p.type === 'household_member' || p.type === 'related_organization'),
  )

  const owners = (data.owners as OwnerRow[] | undefined) ?? []

  const [addMemberSheetOwnerId, setAddMemberSheetOwnerId] = useState<string | null>(null)

  const childId = ctx?.child.id ?? ''
  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const childRegType = (childMeta?.registrationType as RegistrationType | undefined) ?? null
  const productAccountTypeOverride = (childMeta?.accountProductType as AccountType | undefined) ?? null

  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')

  const handleStartKyc = (partyId: string) => {
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party || !kycTask) return

    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: kycTask.id,
      childName: party.name,
      childType: 'kyc',
    })
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId,
      updates: { kycStatus: 'pending' },
    })

    toast(`KYC verification started for ${party.name}`, {
      description: 'Identity verification has been initiated. You can continue here or go to the KYC Review task.',
      action: {
        label: 'Go to KYC Review',
        onClick: () => {
          dispatch({ type: 'EXIT_CHILD_ACTION' })
          dispatch({ type: 'SET_ACTIVE_TASK', taskId: kycTask.id })
        },
      },
    })
  }

  const handleGoToKyc = (partyId: string) => {
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party || !kycTask) return
    const kycChild = kycTask.children?.find((c) => c.name === party.name)
    dispatch({ type: 'EXIT_CHILD_ACTION' })
    dispatch({ type: 'SET_ACTIVE_TASK', taskId: kycTask.id })
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
      <AccountProfileSection
        data={data}
        updateField={updateField}
        registrationType={childRegType}
        productAccountTypeOverride={productAccountTypeOverride}
        prefilledShortName={(childMeta?.shortName as string) ?? ''}
        prefilledAccountNumber={(childMeta?.accountNumber as string) ?? ''}
      />

      {/* Owners section — above additional account fields so parties are picked before schema-style extras */}
      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4" />
            Owners & participants
          </h3>
          <p className="text-sm text-muted-foreground">
            Add everyone who will appear on the account registration. Ownership here sets verification scope and which
            documents each person must provide. Choose an existing household member from the list, or search and add someone new.{' '}
            Beneficiaries and duplicate-statement contacts belong in{' '}
            <span className="font-medium text-foreground">Account features &amp; services</span>, not on this step.
          </p>
        </div>

        {owners.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <UserPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              No owners added yet.
            </p>
            <Button onClick={addOwnerSlot}>
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
            addPartyItemLabel="Search for an existing client or add a new individual or entity"
            addPartyItemDescription="Adds to this household for use as an account owner."
            onStartKyc={handleStartKyc}
            onGoToKyc={handleGoToKyc}
          />
        ))}

        {owners.length > 0 && (
          <Button variant="outline" className="w-full" onClick={addOwnerSlot}>
            <Plus className="h-4 w-4 mr-1" />
            Add Another Owner
          </Button>
        )}

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

        <AccountOwnerPartySheet
          party={editingParty}
          open={editingPartyId !== null}
          onOpenChange={(o) => {
            if (!o) setEditingPartyId(null)
          }}
        />
      </section>

      <AccountAdditionalInformationSection data={data} updateField={updateField} />
    </div>
  )
}
