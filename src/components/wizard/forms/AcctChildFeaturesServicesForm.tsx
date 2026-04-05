import { useMemo, useState } from 'react'
import { useWorkflow, useChildActionContext, useTaskData } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { PartySlotCard } from '@/components/wizard/forms/PartySlotCard'
import { InterestedPartySlotFields, BeneficiarySlotFields } from '@/components/wizard/forms/PartySlotFooters'
import { AddHouseholdMemberSheet } from '@/components/wizard/forms/AddPartySheet'
import { AccountOwnerPartySheet } from '@/components/wizard/forms/AccountOwnerPartySheet'
import type { BeneficiarySlot, InterestedPartySlot } from '@/types/partySlot'
import { Plus, Users, HeartHandshake } from 'lucide-react'

function newRowId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function AcctChildFeaturesServicesForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)
  const editingParty = editingPartyId
    ? state.relatedParties.find((p) => p.id === editingPartyId) ?? null
    : null

  const [addPartyTarget, setAddPartyTarget] = useState<{
    kind: 'interested' | 'beneficiary'
    slotId: string
  } | null>(null)

  const partyPickerCandidates = useMemo(
    () =>
      state.relatedParties.filter(
        (p) =>
          !p.isHidden &&
          (p.type === 'household_member' ||
            p.type === 'related_contact' ||
            p.type === 'related_organization'),
      ),
    [state.relatedParties],
  )

  const interestedSlots = (data.interestedPartySlots as InterestedPartySlot[] | undefined) ?? []
  const beneficiarySlots = (data.beneficiarySlots as BeneficiarySlot[] | undefined) ?? []

  const setInterestedSlots = (next: InterestedPartySlot[]) => updateField('interestedPartySlots', next)
  const setBeneficiarySlots = (next: BeneficiarySlot[]) => updateField('beneficiarySlots', next)

  const addInterestedSlot = () => setInterestedSlots([...interestedSlots, { id: newRowId('ip') }])
  const addBeneficiarySlot = () => setBeneficiarySlots([...beneficiarySlots, { id: newRowId('ben') }])

  const removeInterested = (id: string) => setInterestedSlots(interestedSlots.filter((s) => s.id !== id))
  const removeBeneficiary = (id: string) => setBeneficiarySlots(beneficiarySlots.filter((s) => s.id !== id))

  const patchInterested = (id: string, patch: Partial<InterestedPartySlot>) =>
    setInterestedSlots(interestedSlots.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const patchBeneficiary = (id: string, patch: Partial<BeneficiarySlot>) =>
    setBeneficiarySlots(beneficiarySlots.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const onPartyAddedFromSheet = (partyId: string) => {
    if (!addPartyTarget) return
    if (addPartyTarget.kind === 'interested') {
      patchInterested(addPartyTarget.slotId, { partyId })
    } else {
      patchBeneficiary(addPartyTarget.slotId, { partyId })
    }
    setAddPartyTarget(null)
  }

  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/30 px-3 py-2">
        Beneficiaries and transfer-on-death designations are captured on this step (not on{' '}
        <span className="font-medium text-foreground">Account &amp; owners</span>). If you only see owners there, use the
        left-hand sub-steps and open <span className="font-medium text-foreground">Features &amp; services</span> (step
        3) for beneficiaries.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Trading & leverage
        </h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!data.marginRequested}
              onCheckedChange={(v) => updateField('marginRequested', v === true)}
            />
            Margin
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!data.optionsRequested}
              onCheckedChange={(v) => updateField('optionsRequested', v === true)}
            />
            Options
          </label>
        </div>
        {(Boolean(data.marginRequested) || Boolean(data.optionsRequested)) && (
          <div className="grid gap-4 sm:grid-cols-2 rounded-md border border-border p-4 bg-muted/20">
            <div className="space-y-2 sm:col-span-2">
              <Label>Experience / knowledge attestation</Label>
              <Input
                value={(data.tradingExperience as string) ?? ''}
                onChange={(e) => updateField('tradingExperience', e.target.value)}
                placeholder="Years traded, products, approvals"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Risk acknowledgments</Label>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={(data.riskAcknowledgments as string) ?? ''}
                onChange={(e) => updateField('riskAcknowledgments', e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cash & cards
        </h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!data.checkwriting}
              onCheckedChange={(v) => updateField('checkwriting', v === true)}
            />
            Checkwriting
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!data.debitCard}
              onCheckedChange={(v) => updateField('debitCard', v === true)}
            />
            Debit card
          </label>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Statements & parties
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Statement delivery</Label>
            <Select
              value={(data.statementDelivery as string) ?? ''}
              onValueChange={(v) => updateField('statementDelivery', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mail">Mail</SelectItem>
                <SelectItem value="electronic">Electronic only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h4 className="text-sm font-semibold">Beneficiaries & TOD</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Name beneficiaries where the registration supports designations. Full client KYC is not required—only identity
            and contact details sufficient for the filing, plus designation fields below. Use designation type,
            allocation, and per stirpes as applicable.
          </p>
          <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
            <span className="font-medium text-foreground">Joint accounts:</span> many joint registrations (especially with
            rights of survivorship) pass to the surviving owner(s) by law, so firms often do not offer primary or contingent
            beneficiaries on that registration. Beneficiary rows here are for products or state rules that allow TOD/POD or
            similar designations on top of joint ownership—skip this section when the registration does not support it.
          </p>
          {beneficiarySlots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No beneficiaries added.</p>
              <Button type="button" variant="outline" onClick={addBeneficiarySlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add beneficiary
              </Button>
            </div>
          ) : (
            <>
              {beneficiarySlots.map((slot, idx) => (
              <PartySlotCard
                key={slot.id}
                title={`Beneficiary ${idx + 1}`}
                roleLabel="Beneficiary"
                previewVariant="designation"
                selectLabel="Select beneficiary"
                  partyId={slot.partyId}
                  onPartyIdChange={(partyId) => patchBeneficiary(slot.id, { partyId })}
                  onRemove={() => removeBeneficiary(slot.id)}
                  parties={state.relatedParties}
                  selectCandidates={partyPickerCandidates}
                  onOpenAddParty={() => setAddPartyTarget({ kind: 'beneficiary', slotId: slot.id })}
                  onEditParty={(id) => setEditingPartyId(id)}
                  addPartyItemLabel="Search directory or add a new person or entity"
                  addPartyItemDescription="Adds to the household directory for use as a beneficiary."
                  footer={<BeneficiarySlotFields slot={slot} onChange={(p) => patchBeneficiary(slot.id, p)} />}
                />
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={addBeneficiarySlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add another beneficiary
              </Button>
            </>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h4 className="text-sm font-semibold">Interested parties</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Add parties who should receive copies or have a formal relationship to the account (e.g. CPA, attorney). KYC is
            not required; capture basic identity and contact details only when needed.
          </p>
          {interestedSlots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No interested parties added.</p>
              <Button type="button" variant="outline" onClick={addInterestedSlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add interested party
              </Button>
            </div>
          ) : (
            <>
              {interestedSlots.map((slot, idx) => (
                <PartySlotCard
                  key={slot.id}
                  title={`Interested party ${idx + 1}`}
                  roleLabel="Interested party"
                  previewVariant="designation"
                  selectLabel="Select party"
                  partyId={slot.partyId}
                  onPartyIdChange={(partyId) => patchInterested(slot.id, { partyId })}
                  onRemove={() => removeInterested(slot.id)}
                  parties={state.relatedParties}
                  selectCandidates={partyPickerCandidates}
                  onOpenAddParty={() => setAddPartyTarget({ kind: 'interested', slotId: slot.id })}
                  onEditParty={(id) => setEditingPartyId(id)}
                  addPartyItemLabel="Search directory or add a new person or entity"
                  addPartyItemDescription="Adds to the household directory for use on this account."
                  footer={<InterestedPartySlotFields slot={slot} onChange={(p) => patchInterested(slot.id, p)} />}
                />
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={addInterestedSlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add another
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Annuity & special services
        </h3>
        <p className="text-sm text-muted-foreground">
          Optional capabilities that may be additive to the base account open—capture details here if this account
          includes annuity or other special arrangements.
        </p>
        <div className="space-y-2">
          <Label>Annuity / special notes</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.annuitySpecialNotes as string) ?? ''}
            onChange={(e) => updateField('annuitySpecialNotes', e.target.value)}
            placeholder="Carrier, contract, payout preferences, or other special services"
          />
        </div>
      </section>

      <AddHouseholdMemberSheet
        open={addPartyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAddPartyTarget(null)
        }}
        onPartyAdded={onPartyAddedFromSheet}
        title={addPartyTarget?.kind === 'beneficiary' ? 'Add beneficiary' : 'Add interested party'}
        description="Search the directory for an existing client or add a new person or legal entity."
        includeLegalEntityCreate
      />

      <AccountOwnerPartySheet
        party={editingParty}
        open={editingPartyId !== null}
        onOpenChange={(o) => {
          if (!o) setEditingPartyId(null)
        }}
        detailTier="designation"
      />
    </div>
  )
}
