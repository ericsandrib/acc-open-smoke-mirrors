import { useState, useMemo } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AccountTypePickerDialog } from './AccountTypePickerDialog'
import type { Selection } from './AccountTypePickerDialog'
import { spawnOpenAccountChildrenFromSelections } from '@/utils/spawnOpenAccountChildrenFromSelections'
import { FinancialAccountsForm } from './FinancialAccountsForm'
import { getRegistrationDocuments, getDocSubTypes } from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import type { ChildTask } from '@/types/workflow'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  ChevronRight,
  Plus,
  Wallet,
  FileText,
  FileSignature,
  ClipboardList,
  Upload,
  X,
  Paperclip,
  Trash2,
} from 'lucide-react'

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

  const requiredDocs = useMemo(
    () => getRegistrationDocuments(childRegistrationTypes),
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

  const isAnnuity = (child: { name: string }) => child.name.includes(' - Annuity')

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
            {accountOpeningChildren.map((child) => {
              const hasAnnuity = isAnnuity(child)
              return (
                <div key={child.id} className="group flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                  <button
                    onClick={() => dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })}
                    className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">
                      {hasAnnuity ? child.name.replace(' - Annuity', '') : child.name}
                    </span>
                    {hasAnnuity && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                        Annuity
                      </Badge>
                    )}
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
          Documents are required once per person, even if they are owners on multiple accounts. Upload a file for each household member listed below.
        </p>
        {accountOpeningChildren.length > 0 && requiredDocs.length > 0 ? (
          <div className="space-y-4">
            {requiredDocs.map((doc) => {
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
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Owner</th>
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
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {accountOpeningChildren.length === 0
                ? 'Add accounts above to see required documents.'
                : 'No additional documents required.'}
            </p>
          </div>
        )}
      </section>

      {/* Aggregated eSign: single package across all accounts in this application */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <FileSignature className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            eSign package (all accounts)
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Forms and agreements from every account you open below are rolled into{' '}
          <span className="text-foreground font-medium">one</span> signing envelope for this application. Per-account
          document requirements while you work each account appear in the Documents panel inside that account’s
          workflow; final send and signature collection happen here.
        </p>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <FileSignature className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Envelope preview &amp; send
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            DocuSign (or your eSign provider) connects here: build the aggregated package from all open-account child
            workflows, then route for signature.
          </p>
        </div>
      </section>
    </div>
  )
}
