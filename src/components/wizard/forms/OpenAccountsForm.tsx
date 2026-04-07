import { useState, useMemo } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import type { ChildTask } from '@/types/workflow'
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
  ChevronRight,
  Minus,
  Plus,
  Shield,
  Wallet,
  FileText,
  FileSignature,
  ClipboardList,
  Upload,
  X,
  Paperclip,
  Trash2,
  Download,
  Pencil,
} from 'lucide-react'
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
  const children = openAccountsTask?.children ?? []
  const accountOpeningChildren = useMemo(
    () => children.filter((c) => c.childType === 'account-opening'),
    [children],
  )
  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)

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

  // Collect all owner party IDs across all child accounts for smart dedup
  const allOwnerPartyIds = useMemo(() => {
    const ids = new Set<string>()
    for (const c of accountOpeningChildren) {
      const ownerData = (state.taskData[`${c.id}-account-owners`] as Record<string, unknown> | undefined)
      const owners = (ownerData?.owners as { partyId?: string; type: string }[] | undefined) ?? []
      for (const o of owners) {
        if (o.type === 'existing' && o.partyId) ids.add(o.partyId)
      }
    }
    return ids
  }, [accountOpeningChildren, state.taskData])

  const defaultEnvelopeSigners = useMemo((): EsignEnvelopeSigner[] => {
    const rows: EsignEnvelopeSigner[] = []
    for (const id of allOwnerPartyIds) {
      const p = state.relatedParties.find((x) => x.id === id)
      if (p) rows.push({ id: `sig-${p.id}`, name: p.name, email: p.email ?? '' })
    }
    if (rows.length === 0) {
      for (const p of state.relatedParties) {
        if (p.type === 'household_member' && !p.isHidden) {
          rows.push({ id: `sig-${p.id}`, name: p.name, email: p.email ?? '' })
        }
      }
    }
    return rows
  }, [allOwnerPartyIds, state.relatedParties])

  const requiredEsignFormRows = useMemo(
    () => buildRequiredEsignFormRows(accountOpeningChildren, state.taskData),
    [accountOpeningChildren, state.taskData],
  )

  const esignEnvelopes = (data.esignEnvelopes as EsignEnvelope[] | undefined) ?? []

  const openNewEnvelopeDrawer = () => {
    setEnvelopeDraft(createNewEnvelope(requiredEsignFormRows, defaultEnvelopeSigners))
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
    if (envelopeDrawerCreate) {
      updateField('esignEnvelopes', [...esignEnvelopes, env])
    } else {
      updateField(
        'esignEnvelopes',
        esignEnvelopes.map((e) => (e.id === env.id ? env : e)),
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
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Existing Accounts
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These are the financial accounts currently held by the client, including brokerage, retirement, and trust accounts.
        </p>
        <FinancialAccountsForm />
      </section>

      {/* Additional Instructions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="additionalInstructions" className="text-sm font-medium text-muted-foreground">
            Additional Instructions
          </Label>
        </div>
        <textarea
          id="additionalInstructions"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter any special instructions for account opening..."
          value={(data.additionalInstructions as string) ?? ''}
          onChange={(e) => updateField('additionalInstructions', e.target.value)}
        />
      </section>

      {/* Section 3: Accounts to be Opened */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Accounts to be Opened
            </h3>
          </div>
          {accountOpeningChildren.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add More
            </Button>
          )}
        </div>

        {accountOpeningChildren.length > 0 ? (
          <div className="space-y-2">
            {topLevelChildren.map((child) => {
              const annuities = getAnnuities(child.name)
              return (
                <div key={child.id} className="space-y-1">
                  {/* Account row */}
                  <div className="group flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
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
                      <Badge
                        variant="secondary"
                        className={cn(
                          'capitalize text-xs group-hover:hidden',
                          child.status === 'complete' && 'bg-green-100 text-green-800 border-green-200',
                          child.status === 'in_progress' && 'bg-blue-100 text-blue-800 border-blue-200',
                          child.status === 'awaiting_review' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          child.status === 'rejected' && 'bg-red-100 text-red-800 border-red-200',
                          child.status === 'not_started' && 'bg-muted text-muted-foreground',
                        )}
                      >
                        {child.status.replace('_', ' ')}
                      </Badge>
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
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              No accounts to open yet. Add the types of accounts you want to open.
            </p>
            <Button onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Accounts
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
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Required Documents
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Firm and custodian forms are configured only under <span className="font-medium text-foreground">eSign envelopes</span>{' '}
          below. Use this section for items that need a file from the client (for example ID or trust pages), once per person
          where applicable.
        </p>
        {accountOpeningChildren.length > 0 && uploadDocs.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Uploads (client documents)
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Required once per person, even if they are owners on multiple accounts. For government ID, choose the ID type before uploading.
            </p>
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
                        {instances.map((inst, idx) => {
                          const memberName = state.relatedParties.find((m) => m.id === inst.assignedTo)?.name
                          const subTypes = getDocSubTypes(doc.id)
                          return (
                            <tr key={inst.id} className={idx < instances.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-4 py-2.5">
                                {subTypes.length > 0 ? (
                                  <Select
                                    value={inst.subType ?? ''}
                                    onValueChange={(v) => updateInstance(inst.id, { subType: v })}
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
                                {inst.assignedTo && memberName ? (
                                  <div className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-muted/30">
                                    <span className="text-xs text-foreground">{memberName}</span>
                                  </div>
                                ) : (
                                  <Select
                                    value={inst.assignedTo}
                                    onValueChange={(v) => updateInstance(inst.id, { assignedTo: v })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
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
                : 'No client uploads required for these accounts. Firm and custodian forms are configured under eSign envelopes below.'}
            </p>
          </div>
        )}
      </section>

      {/* eSign envelopes */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              eSign envelopes
            </h3>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={openNewEnvelopeDrawer}>
            <Plus className="h-3.5 w-3.5" />
            New envelope
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Create one or more signing envelopes for this application. Required firm and custodian forms are grouped by
          account number; add optional forms, signers, and extra files. Data captured in the wizard maps onto generated
          forms automatically—those forms are not uploaded as attachments.
        </p>
        {esignEnvelopes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileSignature className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No envelopes yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              Add an envelope to choose delivery method, template, and which generated forms to include.
            </p>
            <Button type="button" size="sm" onClick={openNewEnvelopeDrawer}>
              <Plus className="h-3.5 w-3.5 mr-1" />
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
                  <p className="text-xs text-muted-foreground mt-1">
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
