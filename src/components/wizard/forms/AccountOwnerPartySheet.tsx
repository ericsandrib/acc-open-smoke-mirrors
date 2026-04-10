import { useEffect, useState } from 'react'
import type { RelatedParty } from '@/types/workflow'
import { useWorkflow } from '@/stores/workflowStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SensitiveTaxIdInput } from '@/components/ui/sensitive-tax-id-input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { entityTypes } from '@/components/wizard/forms/AddPartySheet'
import {
  createEmptyIndividualAccountOwnerForm,
  hydrateIndividualFormFromParty,
  splitFormIntoPartyUpdate,
  type IndividualAccountOwnerFormState,
} from '@/types/accountOwnerIndividual'
import { AccountOwnerIndividualFormFields } from '@/components/wizard/forms/AccountOwnerIndividualFormFields'

type Props = {
  party: RelatedParty | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Beneficiaries / interested parties: identity & contact fields only. */
  detailTier?: 'full' | 'designation'
}

export function AccountOwnerPartySheet({ party, open, onOpenChange, detailTier = 'full' }: Props) {
  const { dispatch } = useWorkflow()

  const [individualForm, setIndividualForm] = useState<IndividualAccountOwnerFormState>(() =>
    createEmptyIndividualAccountOwnerForm(),
  )

  const [legalName, setLegalName] = useState('')
  const [entityType, setEntityType] = useState('')
  const [taxId, setTaxId] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [entityEmail, setEntityEmail] = useState('')
  const [entityPhone, setEntityPhone] = useState('')

  useEffect(() => {
    if (!open || !party) return
    if (party.type === 'related_organization') {
      setLegalName(party.organizationName ?? party.name ?? '')
      setEntityType(party.entityType ?? '')
      setTaxId(party.taxId ?? '')
      setJurisdiction(party.jurisdiction ?? '')
      setContactPerson(party.contactPerson ?? '')
      setEntityEmail(party.email ?? '')
      setEntityPhone(party.phone ?? '')
    } else {
      setIndividualForm(hydrateIndividualFormFromParty(party))
    }
  }, [open, party])

  const patchIndividual = (patch: Partial<IndividualAccountOwnerFormState>) => {
    setIndividualForm((prev) => ({ ...prev, ...patch }))
  }

  const handleSave = () => {
    if (!party) return
    if (party.type === 'related_organization') {
      const name = legalName.trim()
      if (!name) return
      dispatch({
        type: 'UPDATE_RELATED_PARTY',
        partyId: party.id,
        updates: {
          name,
          organizationName: name,
          entityType: entityType || undefined,
          taxId: taxId || undefined,
          jurisdiction: jurisdiction || undefined,
          contactPerson: contactPerson || undefined,
          email: entityEmail || undefined,
          phone: entityPhone || undefined,
        },
      })
    } else {
      const fn = individualForm.firstName.trim()
      const ln = individualForm.lastName.trim()
      if (!fn || !ln) return
      const { top, accountOwnerIndividual } = splitFormIntoPartyUpdate(individualForm)
      dispatch({
        type: 'UPDATE_RELATED_PARTY',
        partyId: party.id,
        updates: {
          ...top,
          accountOwnerIndividual,
        },
      })
    }
    onOpenChange(false)
  }

  const isOrg = party?.type === 'related_organization'
  const isDesignation = detailTier === 'designation'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-3 space-y-1 shrink-0">
          <SheetTitle>{isDesignation ? 'Party identity (designation)' : 'Account owner details'}</SheetTitle>
          <SheetDescription>
            {isDesignation
              ? isOrg
                ? 'KYC is not required for this role. Edit basic entity and contact details used on registration documents.'
                : 'KYC is not required for this role. Edit identity and contact details only—less than a full account owner file.'
              : isOrg
                ? 'View and edit information for this legal entity. Changes apply to this client record across the journey.'
                : 'View and edit information for this individual. Changes apply to this client record across the journey.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4 min-h-0">
          {!party ? null : isOrg ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Legal entity name</Label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entity type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tax ID / EIN</Label>
                <SensitiveTaxIdInput value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XX-XXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jurisdiction of formation</Label>
                <Input
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. Delaware, USA"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Authorized signatory</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Person authorized to act for this entity"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  value={entityEmail}
                  onChange={(e) => setEntityEmail(e.target.value)}
                  type="email"
                  placeholder="entity@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={entityPhone} onChange={(e) => setEntityPhone(e.target.value)} type="tel" />
              </div>
              {party.clientId && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Client ID: </span>
                  {party.clientId}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <AccountOwnerIndividualFormFields
                value={individualForm}
                onChange={patchIndividual}
                variant={isDesignation ? 'designation' : 'full'}
              />
              {(party.clientId || party.accountNumber) && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 space-y-1 text-xs text-muted-foreground">
                  {party.clientId && (
                    <div>
                      <span className="font-medium text-foreground">Client ID: </span>
                      {party.clientId}
                    </div>
                  )}
                  {party.accountNumber && (
                    <div>
                      <span className="font-medium text-foreground">Account number: </span>
                      {party.accountNumber}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border gap-2 flex-row justify-end shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              !party ||
              (isOrg ? !legalName.trim() : !individualForm.firstName.trim() || !individualForm.lastName.trim())
            }
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
