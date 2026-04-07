import { useMemo, useState } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  AccountProfileSection,
  AccountAdditionalInformationSection,
} from '@/components/wizard/forms/AccountProfileSection'
import type { AccountType } from '@/types/workflow'
import {
  getRegistrationDocumentsForType,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
} from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { Plus, Trash2, UserPlus, FileText, Paperclip, Upload, X } from 'lucide-react'
import { AddHouseholdMemberSheet } from '@/components/wizard/forms/AddPartySheet'
import { AccountOwnerPartySheet } from '@/components/wizard/forms/AccountOwnerPartySheet'
import { PartySlotCard } from '@/components/wizard/forms/PartySlotCard'
import { toast } from 'sonner'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
  source?: 'upstream' | 'local'
}

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

  const { data: parentData, updateField: updateParentField } = useTaskData('open-accounts')

  const accountOwnerCandidates = state.relatedParties.filter(
    (p) =>
      !p.isHidden &&
      (p.type === 'household_member' || p.type === 'related_organization'),
  )

  const owners = (data.owners as OwnerRow[] | undefined) ?? []

  const [addMemberSheetOwnerId, setAddMemberSheetOwnerId] = useState<string | null>(null)

  const selectedOwnerPartyIds = useMemo(
    () => new Set(owners.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId!)),
    [owners],
  )

  const childId = ctx?.child.id ?? ''
  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const childRegType = (childMeta?.registrationType as RegistrationType | undefined) ?? null
  const productAccountTypeOverride = (childMeta?.accountProductType as AccountType | undefined) ?? null

  const registrationDocs = useMemo(
    () => (childRegType ? getRegistrationDocumentsForType(childRegType) : []),
    [childRegType],
  )

  const { upload: uploadRequiredDocs } = useMemo(
    () => partitionRegistrationDocumentsByFulfillment(registrationDocs),
    [registrationDocs],
  )

  const allDocInstances = useMemo(() => {
    if (selectedOwnerPartyIds.size === 0 || uploadRequiredDocs.length === 0) return []
    const results: (DocInstance & { docLabel: string; ownerName: string })[] = []
    const ownerIds = Array.from(selectedOwnerPartyIds)

    for (const doc of uploadRequiredDocs) {
      const parentInstances = (parentData[`doc-instances-${doc.id}`] as DocInstance[] | undefined) ?? []

      for (const ownerId of ownerIds) {
        const member = state.relatedParties.find((p) => p.id === ownerId)
        const ownerName = member?.name ?? 'Unknown'
        const parentMatch = parentInstances.find((inst) => inst.assignedTo === ownerId)

        if (parentMatch) {
          results.push({ ...parentMatch, source: 'upstream', docLabel: doc.label, ownerName })
        } else {
          results.push({
            id: `auto-${doc.id}-${ownerId}`,
            docTypeId: doc.id,
            assignedTo: ownerId,
            source: 'upstream',
            docLabel: doc.label,
            ownerName,
          })
        }
      }
    }

    const local = (data['child-local-docs'] as (DocInstance & { docLabel?: string })[] | undefined) ?? []
    for (const inst of local) {
      const docDef = uploadRequiredDocs.find((d) => d.id === inst.docTypeId)
      const member = inst.assignedTo ? state.relatedParties.find((p) => p.id === inst.assignedTo) : null
      results.push({
        ...inst,
        source: 'local',
        docLabel: docDef?.label ?? (inst.docTypeId || 'Other'),
        ownerName: member?.name ?? '',
      })
    }
    return results
  }, [selectedOwnerPartyIds, uploadRequiredDocs, parentData, data, state.relatedParties])

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

  const updateParentDocInstance = (docTypeId: string, instanceId: string, updates: Partial<DocInstance>) => {
    const key = `doc-instances-${docTypeId}`
    const instances = (parentData[key] as DocInstance[] | undefined) ?? []
    const existing = instances.find((i) => i.id === instanceId)
    if (existing) {
      updateParentField(key, instances.map((i) => i.id === instanceId ? { ...i, ...updates } : i))
    } else {
      updateParentField(key, [...instances, { id: instanceId, docTypeId, assignedTo: '', ...updates }])
    }
  }

  const handleUpstreamFileSelect = (inst: DocInstance & { docLabel: string; ownerName: string }) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const key = `doc-instances-${inst.docTypeId}`
        const instances = (parentData[key] as DocInstance[] | undefined) ?? []
        const existing = instances.find((i) => i.id === inst.id)
        if (existing) {
          updateParentField(key, instances.map((i) => i.id === inst.id ? { ...i, fileName: file.name } : i))
        } else {
          updateParentField(key, [...instances, { id: inst.id, docTypeId: inst.docTypeId, assignedTo: inst.assignedTo, fileName: file.name }])
        }
      }
    }
    input.click()
  }

  const localDocs = (data['child-local-docs'] as DocInstance[] | undefined) ?? []

  const updateLocalDocs = (next: DocInstance[]) => {
    updateField('child-local-docs', next)
  }

  const removeLocalDoc = (docId: string) => {
    updateLocalDocs(localDocs.filter((d) => d.id !== docId))
  }

  const updateLocalDoc = (docId: string, updates: Partial<DocInstance>) => {
    updateLocalDocs(localDocs.map((d) => d.id === docId ? { ...d, ...updates } : d))
  }

  const handleLocalFileSelect = (docId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        updateLocalDoc(docId, { fileName: file.name })
      }
    }
    input.click()
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

      {/* Documents section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" />
            Documents
          </h3>
          <p className="text-sm text-muted-foreground">
            Firm and custodian forms are configured in <span className="font-medium text-foreground">eSign envelopes</span>{' '}
            on the Open Accounts task. Only items that need a client file (for example government ID) use the upload rows
            below. Requirements from Open Accounts carry in; files on the client record show when present.
          </p>
        </div>

        {uploadRequiredDocs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No file uploads required for this registration. Firm and custodian forms are configured in eSign envelopes on
              Open Accounts.
            </p>
          </div>
        ) : uploadRequiredDocs.length > 0 && selectedOwnerPartyIds.size === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Add owners above to manage upload items (for example government ID) for each person.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadRequiredDocs.map((doc) => {
              const instancesForDoc = allDocInstances.filter((inst) => inst.docTypeId === doc.id)
              const subTypes = getDocSubTypes(doc.id)

              const handleAddForDoc = () => {
                updateLocalDocs([
                  ...localDocs,
                  { id: `cld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, docTypeId: doc.id, assignedTo: '' },
                ])
              }

              return (
                <div key={doc.id} className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleAddForDoc}>
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>

                  {instancesForDoc.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Specification</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Owner</th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">File</th>
                          <th className="w-[40px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {instancesForDoc.map((inst, idx) => {
                          const isUpstream = inst.source === 'upstream'
                          return (
                            <tr key={inst.id} className={idx < instancesForDoc.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-4 py-2.5">
                                {subTypes.length > 0 ? (
                                  <Select
                                    value={inst.subType ?? ''}
                                    onValueChange={(v) => {
                                      if (isUpstream) {
                                        updateParentDocInstance(inst.docTypeId, inst.id, { subType: v, assignedTo: inst.assignedTo })
                                      } else {
                                        updateLocalDoc(inst.id, { subType: v })
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {subTypes.map((st) => (
                                        <SelectItem key={st.value} value={st.value}>
                                          {st.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-muted/30">
                                    <span className="text-xs text-foreground">{doc.label}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 w-[180px]">
                                <div className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-muted/30">
                                  <span className="text-xs text-foreground">{inst.ownerName || 'Unassigned'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                {inst.fileName ? (
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-foreground truncate max-w-[180px]">{inst.fileName}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isUpstream) {
                                          updateParentDocInstance(inst.docTypeId, inst.id, { fileName: undefined, assignedTo: inst.assignedTo })
                                        } else {
                                          updateLocalDoc(inst.id, { fileName: undefined })
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-destructive shrink-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 text-muted-foreground"
                                    onClick={() => {
                                      if (isUpstream) {
                                        handleUpstreamFileSelect(inst)
                                      } else {
                                        handleLocalFileSelect(inst.id)
                                      }
                                    }}
                                  >
                                    <Upload className="h-3 w-3" />
                                    Upload
                                  </Button>
                                )}
                              </td>
                              <td className="px-2 py-2.5">
                                {!isUpstream && (
                                  <button
                                    type="button"
                                    onClick={() => removeLocalDoc(inst.id)}
                                    className="text-muted-foreground hover:text-destructive p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        No documents added yet. Click &ldquo;Add&rdquo; to upload and assign to an owner.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
