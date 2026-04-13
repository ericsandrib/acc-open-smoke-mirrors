import { useState, useMemo, useRef, useEffect } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildTask, RelatedParty } from '@/types/workflow'
import { AccountTypePickerDialog } from './AccountTypePickerDialog'
import type { Selection } from './AccountTypePickerDialog'
import { spawnOpenAccountChildrenFromSelections } from '@/utils/spawnOpenAccountChildrenFromSelections'
import { FinancialAccountsForm } from './FinancialAccountsForm'
import {
  getRegistrationDocuments,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
} from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Minus,
  Plus,
  Shield,
  Wallet,
  FileSignature,
  Upload,
  X,
  Paperclip,
  Trash2,
  Download,
  Pencil,
  Clock,
  Play,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { AddHouseholdMemberSheet } from './AddPartySheet'
import type { EsignEnvelope, EsignEnvelopeSigner } from '@/types/esignEnvelope'
import { createNewEnvelope } from '@/utils/createEsignEnvelope'
import { buildRequiredEsignFormRows } from '@/utils/buildEsignEnvelopeFormRows'
import { downloadEnvelopeManifest } from '@/utils/downloadEsignEnvelopeManifest'
import { getEnvelopeDisplayName } from '@/utils/deriveEnvelopeDisplayName'
import { EsignEnvelopeDrawer } from '@/components/wizard/forms/EsignEnvelopeDrawer'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
}

type OwnerSlot = { partyId?: string; type: string }

export function OpenAccountsForm() {
  const { state, dispatch } = useWorkflow()
  const { data, updateField } = useTaskData('open-accounts')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)
  const [envelopeDrawerOpen, setEnvelopeDrawerOpen] = useState(false)
  const [envelopeDraft, setEnvelopeDraft] = useState<EsignEnvelope | null>(null)
  const [envelopeDrawerCreate, setEnvelopeDrawerCreate] = useState(true)
  /** Bumps when the drawer opens so the sheet remounts with fresh local state from `envelopeDraft`. */
  const [envelopeDrawerMountKey, setEnvelopeDrawerMountKey] = useState(0)

  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const kycParentTask = state.tasks.find((t) => t.formKey === 'kyc') ?? openAccountsTask
  const kycChildren = kycParentTask?.children?.filter((c) => c.childType === 'kyc') ?? []
  const [kycAddSheetOpen, setKycAddSheetOpen] = useState(false)
  const [kycTimelineChild, setKycTimelineChild] = useState<ChildTask | null>(null)
  const pendingKycPartyId = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingKycPartyId.current || !kycParentTask) return
    const partyId = pendingKycPartyId.current
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party) return
    pendingKycPartyId.current = null
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId,
      updates: { kycDirectAdd: true },
    })
    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: kycParentTask.id,
      childName: party.name,
      childType: 'kyc',
    })
  }, [state.relatedParties, kycParentTask, dispatch])

  const handleKycContactAdded = (partyId: string) => {
    pendingKycPartyId.current = partyId
  }
  const accountOpeningChildren = (openAccountsTask?.children ?? []).filter((c) => c.childType === 'account-opening')
  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)

  type OwnerRow = { id: string; type: string; partyId?: string }
  const kycOwnerParties = useMemo(() => {
    const seenIds = new Set<string>()
    const parties: RelatedParty[] = []
    for (const child of accountOpeningChildren) {
      const subTaskId = `${child.id}-account-owners`
      const td = state.taskData[subTaskId] as Record<string, unknown> | undefined
      const owners = (td?.owners as OwnerRow[] | undefined) ?? []
      for (const owner of owners) {
        if (owner.partyId && !seenIds.has(owner.partyId)) {
          seenIds.add(owner.partyId)
          const party = state.relatedParties.find((p) => p.id === owner.partyId)
          if (party) parties.push(party)
        }
      }
    }
    return parties
  }, [accountOpeningChildren, state.taskData, state.relatedParties])

  const childRegistrationTypes = useMemo<RegistrationType[]>(() => {
    const types: RegistrationType[] = []
    for (const c of accountOpeningChildren) {
      const rt = (state.taskData[c.id] as Record<string, unknown> | undefined)?.registrationType as RegistrationType | undefined
      if (rt) types.push(rt)
    }
    return types
  }, [accountOpeningChildren, state.taskData])

  const { upload: uploadDocs } = useMemo(
    () => partitionRegistrationDocumentsByFulfillment(getRegistrationDocuments(childRegistrationTypes)),
    [childRegistrationTypes],
  )

  const ownerPartyIdsByAccountChild = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of accountOpeningChildren) {
      const ownerData = (state.taskData[`${c.id}-account-owners`] as Record<string, unknown> | undefined)
      const owners = (ownerData?.owners as OwnerSlot[] | undefined) ?? []
      const ids = owners.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId as string)
      map.set(c.id, Array.from(new Set(ids)))
    }
    return map
  }, [accountOpeningChildren, state.taskData])

  // Collect all owner party IDs across all child accounts for smart dedup
  const allOwnerPartyIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ownerIds of ownerPartyIdsByAccountChild.values()) {
      for (const id of ownerIds) ids.add(id)
    }
    return ids
  }, [ownerPartyIdsByAccountChild])

  const requiredEsignFormRows = useMemo(
    () => buildRequiredEsignFormRows(accountOpeningChildren, state.taskData),
    [accountOpeningChildren, state.taskData],
  )

  const deriveEnvelopeSigners = (
    formSelections: EsignEnvelope['formSelections'],
    existingSigners: EsignEnvelopeSigner[] = [],
  ): EsignEnvelopeSigner[] => {
    const accountChildIds = new Set(formSelections.filter((r) => r.included).map((r) => r.accountChildId))
    const ownerToAccounts = new Map<string, Set<string>>()
    for (const accountChildId of accountChildIds) {
      const ownerIds = ownerPartyIdsByAccountChild.get(accountChildId) ?? []
      for (const ownerId of ownerIds) {
        if (!ownerToAccounts.has(ownerId)) ownerToAccounts.set(ownerId, new Set<string>())
        ownerToAccounts.get(ownerId)!.add(accountChildId)
      }
    }

    const existingByPartyId = new Map(
      existingSigners.map((s) => [s.partyId ?? s.id.replace(/^sig-/, ''), s]),
    )

    const rows: EsignEnvelopeSigner[] = []
    for (const [partyId, accounts] of ownerToAccounts) {
      const party = state.relatedParties.find((p) => p.id === partyId)
      const existing = existingByPartyId.get(partyId)
      rows.push({
        id: `sig-${partyId}`,
        partyId,
        name: party?.name ?? existing?.name ?? 'Account owner',
        email: existing?.email ?? party?.email ?? '',
        accountChildIds: Array.from(accounts),
      })
    }
    return rows
  }

  const esignEnvelopes = (data.esignEnvelopes as EsignEnvelope[] | undefined) ?? []

  const openNewEnvelopeDrawer = () => {
    setEnvelopeDraft(
      createNewEnvelope(requiredEsignFormRows, deriveEnvelopeSigners(requiredEsignFormRows)),
    )
    setEnvelopeDrawerCreate(true)
    setEnvelopeDrawerMountKey((k) => k + 1)
    setEnvelopeDrawerOpen(true)
  }

  const openEditEnvelopeDrawer = (env: EsignEnvelope) => {
    setEnvelopeDraft({
      ...env,
      formSelections: env.formSelections.map((r) => ({ ...r })),
      signers: env.signers.map((s) => ({ ...s })),
      uploadedFiles: env.uploadedFiles.map((f) => ({ ...f })),
      optionalFormIdsIncluded: [...env.optionalFormIdsIncluded],
    })
    setEnvelopeDrawerCreate(false)
    setEnvelopeDrawerMountKey((k) => k + 1)
    setEnvelopeDrawerOpen(true)
  }

  const saveEnvelopeFromDrawer = (env: EsignEnvelope) => {
    const normalized = {
      ...env,
      signers: deriveEnvelopeSigners(env.formSelections, env.signers),
    }
    if (envelopeDrawerCreate) {
      updateField('esignEnvelopes', [...esignEnvelopes, normalized])
    } else {
      updateField(
        'esignEnvelopes',
        esignEnvelopes.map((e) => (e.id === env.id ? normalized : e)),
      )
    }
    setEnvelopeDraft(null)
    setEnvelopeDrawerOpen(false)
  }

  const isAnnuity = (child: { name: string }) => child.name.includes(' - Annuity')
  const topLevelChildren = accountOpeningChildren.filter((c) => !isAnnuity(c))
  const getAnnuities = (parentName: string) =>
    accountOpeningChildren.filter((c) => c.name.startsWith(`${parentName} - Annuity`))

  const handleAddAnnuity = (parentName: string) => {
    const existing = getAnnuities(parentName)
    const nextNum = existing.length + 1
    const parentChild = accountOpeningChildren.find((c) => c.name === parentName && !isAnnuity(c))
    const reg = parentChild
      ? ((state.taskData[parentChild.id] as Record<string, unknown> | undefined)?.registrationType as
          | RegistrationType
          | undefined)
      : undefined
    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: openAccountsTask!.id,
      childName: `${parentName} - Annuity ${nextNum}`,
      childType: 'account-opening',
      metadata: {
        registrationType: reg ?? 'IND',
      },
    })
  }

  const handleRemoveLastAnnuity = (parentName: string) => {
    const existing = getAnnuities(parentName)
    if (existing.length === 0) return
    const last = existing[existing.length - 1]
    dispatch({
      type: 'REMOVE_CHILD',
      parentTaskId: openAccountsTask!.id,
      childId: last.id,
    })
  }

  const handlePickerConfirm = (selections: Selection[]) => {
    if (!openAccountsTask) return
    spawnOpenAccountChildrenFromSelections(dispatch, openAccountsTask.id, selections)
    setPickerOpen(false)
  }

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Existing Accounts
          </h3>
          <p className="text-base text-muted-foreground">
            These are the financial accounts currently held by the client, including brokerage, retirement, and trust accounts.
          </p>
        </div>
        <FinancialAccountsForm />
      </section>

      {/* Additional Instructions */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Additional Instructions</h3>
          <p className="text-base text-muted-foreground mt-2">
            Account opening and funding instructions for the new accounts to be opened.
          </p>
        </div>
        <textarea
          id="additionalInstructions"
          className="flex min-h-[18.67rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Account opening and funding notes for the new accounts (custodian, transfers, rollovers, timing, client requests)."
          value={(data.additionalInstructions as string) ?? ''}
          onChange={(e) => updateField('additionalInstructions', e.target.value)}
        />
      </section>

      {/* Section 3: Accounts to be Opened */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Accounts to be Opened
          </h3>
          <p className="text-base text-muted-foreground mt-2">
            New accounts to open at the custodian, with funding instructions for each row. Current holdings are listed in
            Existing Accounts above.
          </p>
        </div>

        {accountOpeningChildren.length > 0 ? (
          <div className="rounded-lg border border-border p-1">
            {topLevelChildren.map((child) => {
              const annuities = getAnnuities(child.name)
              return (
                <div key={child.id}>
                  {/* Account row */}
                  <div className="group flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })}
                      className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{child.name}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const displayStatus = deriveChildDisplayStatus(child.status)
                        const cfg = childStatusConfig[displayStatus]
                        return (
                          <Badge
                            variant="outline"
                            className={cn('text-xs group-hover:hidden', cfg.className)}
                          >
                            {cfg.label}
                          </Badge>
                        )
                      })()}
                      <div className="hidden group-hover:block">
                        <ChildActionKebabMenu
                          onViewDetails={() => setTimelineChild(child)}
                          onDelete={() => dispatch({ type: 'REMOVE_CHILD', parentTaskId: openAccountsTask!.id, childId: child.id })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Annuity row with +/- counter */}
                  {annuities.length > 0 && (
                    <div className="ml-8 flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Annuities</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveLastAnnuity(child.name)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums font-medium">
                          {annuities.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleAddAnnuity(child.name)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <Button variant="ghost" className="w-full" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add accounts
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-6 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              No accounts to open yet. Add the types of accounts you want to open.
            </p>
            <Button onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add accounts
            </Button>
          </div>
        )}

        <AccountTypePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onConfirm={handlePickerConfirm}
        />

        <ChildActionTimelineSheet
          open={!!timelineChild}
          onOpenChange={(o) => { if (!o) setTimelineChild(null) }}
          child={timelineChild}
        />
      </section>

      {/* Section 4: Required Documents */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Required Documents
          </h3>
          <p className="text-base text-muted-foreground">
            Client file uploads (for example ID or trust documents) go here. Firm and custodian forms are configured under{' '}
            <span className="font-medium text-foreground">eSign envelopes</span> below—not in this section.
          </p>
        </div>
        {accountOpeningChildren.length > 0 && uploadDocs.length > 0 ? (
          <div className="space-y-2">
            <div className="space-y-4">
            {uploadDocs.map((doc) => {
              const instances = ((data[`doc-instances-${doc.id}`] as DocInstance[] | undefined) ?? [])

              const updateInstances = (next: DocInstance[]) => {
                updateField(`doc-instances-${doc.id}`, next)
              }

              const updateInstance = (instanceId: string, updates: Partial<DocInstance>) => {
                updateInstances(instances.map((i) => i.id === instanceId ? { ...i, ...updates } : i))
              }

              const handleFileSelect = (instanceId: string) => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.jpg,.jpeg,.png'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    updateInstance(instanceId, { fileName: file.name })
                  }
                }
                input.click()
              }

              // Auto-generate one row per unique owner if not already present
              const ownerIds = Array.from(allOwnerPartyIds)
              const existingAssignees = new Set(instances.map((i) => i.assignedTo))
              const missing = ownerIds.filter((id) => !existingAssignees.has(id))
              if (missing.length > 0) {
                const newInstances = [
                  ...instances,
                  ...missing.map((pid) => ({
                    id: `di-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${pid.slice(-4)}`,
                    docTypeId: doc.id,
                    assignedTo: pid,
                  })),
                ]
                // Schedule the update (can't set state during render)
                setTimeout(() => updateInstances(newInstances), 0)
              }

              const addInstance = () => {
                updateInstances([
                  ...instances,
                  { id: `di-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, docTypeId: doc.id, assignedTo: '' },
                ])
              }

              const removeInstance = (instanceId: string) => {
                updateInstances(instances.filter((i) => i.id !== instanceId))
              }

              return (
                <div key={doc.id} className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addInstance}>
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>

                  {instances.length > 0 ? (
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs w-[36%]">
                            Specification
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs w-[11rem] max-w-[11rem]">
                            Assigned To
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">File</th>
                          <th className="w-[40px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {instances.map((inst, idx) => {
                          const memberName = state.relatedParties.find((m) => m.id === inst.assignedTo)?.name
                          const subTypes = getDocSubTypes(doc.id)
                          return (
                            <tr key={inst.id} className={idx < instances.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-4 py-2.5 min-w-0 align-top w-[36%] max-w-[36%] overflow-hidden">
                                {subTypes.length > 0 ? (
                                  <Select
                                    value={inst.subType ?? ''}
                                    onValueChange={(v) => updateInstance(inst.id, { subType: v })}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-full max-w-full min-w-0">
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
                                  <div className="flex min-w-0 max-w-full items-center h-8 px-3 rounded-md border border-border bg-muted/30">
                                    <span className="text-xs text-foreground truncate min-w-0" title={doc.label}>
                                      {doc.label}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 w-[11rem] max-w-[11rem] align-top">
                                {inst.assignedTo && memberName ? (
                                  <div className="flex min-w-0 items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-muted/30">
                                    <span className="text-xs text-foreground truncate min-w-0" title={memberName}>
                                      {memberName}
                                    </span>
                                  </div>
                                ) : (
                                  <Select
                                    value={inst.assignedTo}
                                    onValueChange={(v) => updateInstance(inst.id, { assignedTo: v })}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-full max-w-full min-w-0">
                                      <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {householdMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                          {member.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                {inst.fileName ? (
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-foreground truncate max-w-[180px]">{inst.fileName}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateInstance(inst.id, { fileName: undefined })}
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
                                    onClick={() => handleFileSelect(inst.id)}
                                  >
                                    <Upload className="h-3 w-3" />
                                    Upload
                                  </Button>
                                )}
                              </td>
                              <td className="px-2 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => removeInstance(inst.id)}
                                  className="text-muted-foreground hover:text-destructive p-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        No documents added yet. Click &ldquo;Add&rdquo; to upload and assign to a member.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {accountOpeningChildren.length === 0
                ? 'Add accounts above to see required documents.'
                : 'No client uploads required for these accounts. Use eSign envelopes below for firm and custodian forms.'}
            </p>
          </div>
        )}
      </section>

      {/* KYC Verification */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">KYC Verification</h3>
          <p className="text-base text-muted-foreground">
            Identity verification (KYC/KYB) must be completed by all account owners before accounts can be opened.
          </p>
        </div>

        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground">Account Owners</h4>
          <p className="text-sm text-muted-foreground mt-1">
            One row per owner from accounts. Start KYC initiation for each.
          </p>
        </div>
        {kycOwnerParties.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Member Name</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Relationship</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {kycOwnerParties.map((member, idx) => {
                  const matchingChild = kycChildren.find((c) => c.name === member.name)
                  const isVerified = !matchingChild && member.kycStatus === 'verified'
                  const hasChild = !!matchingChild
                  const isNotStarted = !hasChild && !isVerified

                  const relationship = member.type === 'related_organization'
                    ? (member.entityType ?? 'Entity')
                    : member.isPrimary ? 'Primary'
                    : member.relationship ?? member.role ?? '—'

                  return (
                    <tr key={member.id} className={cn('border-b border-border last:border-b-0', idx % 2 === 1 && 'bg-muted/20')}>
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{relationship}</td>
                      <td className="px-4 py-3">
                        {hasChild ? (() => {
                          const displayStatus = deriveChildDisplayStatus(matchingChild!.status)
                          const cfg = displayStatus === 'complete'
                            ? { label: 'Verified', className: 'text-emerald-600' }
                            : childStatusConfig[displayStatus]
                          return (
                            <Badge variant="outline" className={cn('text-xs', cfg.className)}>
                              {cfg.label}
                            </Badge>
                          )
                        })() : isVerified ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Verified
                          </Badge>
                        ) : isNotStarted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => {
                              dispatch({
                                type: 'SPAWN_CHILD',
                                parentTaskId: kycParentTask!.id,
                                childName: member.name,
                                childType: 'kyc',
                              })
                              dispatch({
                                type: 'UPDATE_RELATED_PARTY',
                                partyId: member.id,
                                updates: { kycStatus: 'pending' },
                              })
                            }}
                          >
                            <Play className="h-3 w-3" />
                            Start KYC initiation
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center mb-4">
            <p className="text-sm text-muted-foreground">
              No account owners added yet.
            </p>
          </div>
        )}

        <div className="mt-6">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-foreground">KYC Initiation</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Each row is one KYC initiation—open it to complete and submit for review.
            </p>
          </div>
          <div className="rounded-lg border border-border p-1">
          {kycChildren.map((child) => (
            <div
              key={child.id}
              className="group w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <button
                onClick={() => dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })}
                className="flex-1 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{child.name}</span>
              </button>
              <div className="flex items-center gap-2">
                {(() => {
                  const displayStatus = deriveChildDisplayStatus(child.status)
                  const cfg = childStatusConfig[displayStatus]
                  return (
                    <Badge
                      variant="outline"
                      className={cn('text-xs group-hover:hidden', cfg.className)}
                    >
                      {cfg.label}
                    </Badge>
                  )
                })()}
                <div className="hidden group-hover:block">
                  <ChildActionKebabMenu
                    onViewDetails={() => setKycTimelineChild(child)}
                    onDelete={() => dispatch({ type: 'REMOVE_CHILD', parentTaskId: kycParentTask!.id, childId: child.id })}
                  />
                </div>
              </div>
            </div>
          ))}

          {kycChildren.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {kycOwnerParties.length > 0
                  ? 'No initiations yet. Add a new contact if needed, then start KYC initiation from the Account Owners table above.'
                  : 'No KYC initiation started yet.'}
              </p>
              <Button type="button" className="mt-4" onClick={() => setKycAddSheetOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add contact
              </Button>
            </div>
          )}

          {kycChildren.length > 0 && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => setKycAddSheetOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add contact
            </Button>
          )}
          </div>
        </div>

        <AddHouseholdMemberSheet
          open={kycAddSheetOpen}
          onOpenChange={setKycAddSheetOpen}
          onPartyAdded={handleKycContactAdded}
          title="Add contact for verification"
          description="Search for an existing person or entity, or create a new contact to add for KYC/KYB verification."
        />

        <ChildActionTimelineSheet
          open={!!kycTimelineChild}
          onOpenChange={(o) => { if (!o) setKycTimelineChild(null) }}
          child={kycTimelineChild}
        />
      </section>

      {/* eSign envelopes */}
      <section>
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground">eSign Envelopes</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Create one or more signing envelopes for this application. Required firm and custodian forms are grouped by
            account number. Data captured in the wizard maps onto generated forms automatically—those forms are not uploaded
            as attachments.
          </p>
        </div>
        {esignEnvelopes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileSignature className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No envelopes yet</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Choose delivery, template, and which generated forms to include.
            </p>
            <Button type="button" onClick={openNewEnvelopeDrawer}>
              <Plus className="h-4 w-4 mr-2" />
              New envelope
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {esignEnvelopes.map((env) => (
              <li
                key={env.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{getEnvelopeDisplayName(env)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {env.formSelections.length} generated form{env.formSelections.length === 1 ? '' : 's'}
                    {env.optionalFormIdsIncluded.length > 0
                      ? ` · ${env.optionalFormIdsIncluded.length} optional`
                      : ''}
                    {env.uploadedFiles.length > 0 ? ` · ${env.uploadedFiles.length} uploaded` : ''} ·{' '}
                    {env.signers.length} signer{env.signers.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => downloadEnvelopeManifest(env)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    onClick={() => openEditEnvelopeDrawer(env)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {envelopeDraft ? (
        <EsignEnvelopeDrawer
          key={`${envelopeDraft.id}-${envelopeDrawerMountKey}`}
          open={envelopeDrawerOpen}
          onOpenChange={(o) => {
            setEnvelopeDrawerOpen(o)
            if (!o) setEnvelopeDraft(null)
          }}
          envelope={envelopeDraft}
          onSave={saveEnvelopeFromDrawer}
          isCreate={envelopeDrawerCreate}
        />
      ) : null}
    </div>
  )
}
