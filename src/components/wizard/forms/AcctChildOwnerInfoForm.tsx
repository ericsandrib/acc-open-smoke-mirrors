import { useMemo } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { getRegistrationDocumentsForType, getDocSubTypes } from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { Plus, Trash2, UserPlus, FileText, Paperclip, Upload, X } from 'lucide-react'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
  source?: 'upstream' | 'local'
}

export function AcctChildOwnerInfoForm() {
  const { state } = useWorkflow()

  const parsed = parseChildSubTaskId(
    `${state.activeChildActionId}-owner-info`
  )
  const taskId = parsed ? `${parsed.childId}-${parsed.suffix}` : `${state.activeChildActionId}-owner-info`
  const { data, updateField } = useTaskData(taskId)

  const { data: parentData, updateField: updateParentField } = useTaskData('open-accounts')

  const householdMembers = state.relatedParties.filter(
    (p) => p.type === 'household_member' && !p.isHidden,
  )

  const owners = (data.owners as { id: string; type: 'existing' | 'new'; partyId?: string; firstName?: string; lastName?: string }[] | undefined) ?? []

  const selectedOwnerPartyIds = useMemo(
    () => new Set(owners.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId!)),
    [owners],
  )

  const childId = state.activeChildActionId ?? ''
  const childMeta = state.taskData[childId] as Record<string, unknown> | undefined
  const childRegType = (childMeta?.registrationType as RegistrationType | undefined) ?? null

  const requiredDocs = useMemo(
    () => (childRegType ? getRegistrationDocumentsForType(childRegType) : []),
    [childRegType],
  )

  const allDocInstances = useMemo(() => {
    if (selectedOwnerPartyIds.size === 0 || requiredDocs.length === 0) return []
    const results: (DocInstance & { docLabel: string; ownerName: string })[] = []
    const ownerIds = Array.from(selectedOwnerPartyIds)

    for (const doc of requiredDocs) {
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
      const docDef = requiredDocs.find((d) => d.id === inst.docTypeId)
      const member = inst.assignedTo ? state.relatedParties.find((p) => p.id === inst.assignedTo) : null
      results.push({
        ...inst,
        source: 'local',
        docLabel: docDef?.label ?? (inst.docTypeId || 'Other'),
        ownerName: member?.name ?? '',
      })
    }
    return results
  }, [selectedOwnerPartyIds, requiredDocs, parentData, data, state.relatedParties])

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
    updateField('owners', [...owners, { id: `owner-${Date.now()}`, type: 'existing' as const }])
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

  const switchToCreateNew = (ownerId: string) => {
    updateOwner(ownerId, { type: 'new', partyId: undefined })
  }

  return (
    <div className="space-y-8">
      {/* Owners section */}
      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-1">
            <UserPlus className="h-4 w-4" />
            Account Owners
          </h3>
          <p className="text-sm text-muted-foreground">
            Add the owners for this account. You can select existing household members or create new individuals.
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

        {owners.map((owner, idx) => {
          const matchedParty = owner.partyId
            ? state.relatedParties.find((p) => p.id === owner.partyId)
            : null

          return (
            <div key={owner.id} className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Owner {idx + 1}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOwner(owner.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Select Individual</Label>
                <Select
                  value={owner.type === 'new' ? '__create_new__' : (owner.partyId ?? '')}
                  onValueChange={(v) => {
                    if (v === '__create_new__') {
                      switchToCreateNew(owner.id)
                    } else {
                      selectExistingOwner(owner.id, v)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select individual..." />
                  </SelectTrigger>
                  <SelectContent>
                    {householdMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create_new__">
                      Create New Individual
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {owner.type === 'existing' && matchedParty && (
                <div className="rounded-md bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{matchedParty.name}</span>
                    {matchedParty.isPrimary && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                    )}
                  </div>
                  {matchedParty.kycStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">KYC Status:</span>
                      <Badge
                        variant={matchedParty.kycStatus === 'verified' ? 'default' : 'outline'}
                        className={
                          matchedParty.kycStatus === 'verified'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : matchedParty.kycStatus === 'needs_kyc'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }
                      >
                        {matchedParty.kycStatus === 'verified'
                          ? 'Approved'
                          : matchedParty.kycStatus === 'needs_kyc'
                            ? 'Not Started'
                            : 'Pending'}
                      </Badge>
                      {matchedParty.kycStatus === 'needs_kyc' && (
                        <Button variant="outline" size="sm" className="h-6 text-xs">
                          Start
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {owner.type === 'new' && (
                <div className="space-y-3 rounded-md bg-muted/50 p-3">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={owner.firstName ?? ''}
                      onChange={(e) => updateOwner(owner.id, { firstName: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={owner.lastName ?? ''}
                      onChange={(e) => updateOwner(owner.id, { lastName: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!owner.firstName?.trim() || !owner.lastName?.trim()}
                    onClick={() => {
                      updateOwner(owner.id, { type: 'new' })
                    }}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {owners.length > 0 && (
          <Button variant="outline" className="w-full" onClick={addOwnerSlot}>
            <Plus className="h-4 w-4 mr-1" />
            Add Another Owner
          </Button>
        )}
      </section>

      {/* Documents section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" />
            Documents
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedOwnerPartyIds.size === 0
              ? 'Documents will appear here once account owners are selected above.'
              : 'Documents from Open Accounts are pre-filled below. Files already on record are shown automatically.'}
          </p>
        </div>

        {selectedOwnerPartyIds.size === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Select account owners to see pre-filled documents.
            </p>
          </div>
        ) : requiredDocs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No required documents for this registration type.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requiredDocs.map((doc) => {
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
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Assigned To</th>
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
