import { useMemo } from 'react'
import { useChildActionContext, useTaskData, useWorkflow } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Plus, Trash2, FileText, Paperclip, Upload, X } from 'lucide-react'
import { EsignFormPdfSampleActions } from '@/components/wizard/EsignFormPdfSampleActions'
import { EsignDocumentsBundleViewerButton } from '@/components/wizard/EsignDocumentsBundleViewer'
import type { RegistrationType } from '@/utils/registrationDocuments'
import {
  getRegistrationDocumentsForType,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
  getAssigneePartyIdsForClientUploadDoc,
} from '@/utils/registrationDocuments'
import { WetSignedFirmUploadsGroup } from '@/components/wizard/forms/WetSignedFirmUploadsGroup'
import {
  parseWetSignedFirmUploads,
  WET_SIGNED_FIRM_UPLOADS_KEY,
  type WetSignedFirmUpload,
} from '@/utils/wetSignedFirmUploads'
import { findParentTaskForChild } from '@/utils/openAccountsTaskContext'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
  source?: 'upstream' | 'local'
}

interface ExecutedEsignForm {
  id: string
  envelopeId: string
  formId: string
  label: string
  fileName: string
  executedAt: string
}

type OwnerRow = { id: string; type: 'existing'; partyId?: string }

export function AcctChildDocumentsReviewForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')
  const openAccountsParentId = ctx
    ? findParentTaskForChild(state, ctx.child.id)?.id ?? 'open-accounts'
    : 'open-accounts'
  const { data: openAccountsData, updateField: updateOpenAccountsField } = useTaskData(openAccountsParentId)

  const childMeta = ctx
    ? ((state.taskData[ctx.child.id] as Record<string, unknown> | undefined) ?? undefined)
    : undefined
  const registrationType = (childMeta?.registrationType as RegistrationType | undefined) ?? undefined

  const ruleDrivenDocs = useMemo(() => {
    if (!registrationType) return { clientUpload: [], firmCustodianEsign: [] }
    const docs = getRegistrationDocumentsForType(registrationType, { relatedParties: state.relatedParties })
    const { upload, esign } = partitionRegistrationDocumentsByFulfillment(docs)
    return {
      clientUpload: upload,
      firmCustodianEsign: esign,
    }
  }, [registrationType, state.relatedParties])

  const openAccountsTask = ctx ? findParentTaskForChild(state, ctx.child.id) : undefined
  const accountOpeningChildren = (openAccountsTask?.children ?? []).filter((c) => c.childType === 'account-opening')

  const wetSignedAccountOptions = useMemo(() => {
    return accountOpeningChildren.map((c) => {
      const childMeta = state.taskData[c.id] as Record<string, unknown> | undefined
      const accountNumber =
        typeof childMeta?.accountNumber === 'string' && childMeta.accountNumber.trim()
          ? childMeta.accountNumber.trim()
          : undefined
      const acctDigits = (accountNumber ?? '').replace(/\D/g, '')
      const last4 = acctDigits.length ? acctDigits.slice(-4) : ''
      const label = last4 ? `${c.name} …${last4}` : c.name
      return { childId: c.id, label, accountNumber }
    })
  }, [accountOpeningChildren, state.taskData])

  const wetSignedFirmUploads = useMemo(
    () => parseWetSignedFirmUploads(openAccountsData as Record<string, unknown>),
    [openAccountsData],
  )

  const wetSignedFirmUploadsForChild = useMemo(() => {
    if (!ctx) return []
    const cid = ctx.child.id
    return wetSignedFirmUploads.filter((u) => !u.accountChildId || u.accountChildId === cid)
  }, [wetSignedFirmUploads, ctx])

  const mergeWetSignedFirmUploadsForChild = (next: WetSignedFirmUpload[]) => {
    if (!ctx) return
    const cid = ctx.child.id
    const taggedOtherAccounts = wetSignedFirmUploads.filter(
      (u) => u.accountChildId != null && u.accountChildId !== cid,
    )
    updateOpenAccountsField(WET_SIGNED_FIRM_UPLOADS_KEY, [...taggedOtherAccounts, ...next])
  }

  const ownersTaskId = ctx ? `${ctx.child.id}-account-owners` : ''
  const ownersData = state.taskData[ownersTaskId] as Record<string, unknown> | undefined
  const owners = useMemo(
    () => (ownersData?.owners as OwnerRow[] | undefined) ?? [],
    [ownersData?.owners],
  )
  const selectedOwnerPartyIds = useMemo(
    () => new Set(owners.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId!)),
    [owners],
  )

  const allDocInstances = useMemo(() => {
    if (selectedOwnerPartyIds.size === 0 || ruleDrivenDocs.clientUpload.length === 0) return []
    const results: (DocInstance & { docLabel: string; ownerName: string })[] = []

    for (const doc of ruleDrivenDocs.clientUpload) {
      const parentInstances = (openAccountsData[`doc-instances-${doc.id}`] as DocInstance[] | undefined) ?? []
      const assigneeIds = getAssigneePartyIdsForClientUploadDoc(
        doc.id,
        state.relatedParties,
        selectedOwnerPartyIds,
      )

      for (const ownerId of assigneeIds) {
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
      const docDef = ruleDrivenDocs.clientUpload.find((d) => d.id === inst.docTypeId)
      const member = inst.assignedTo ? state.relatedParties.find((p) => p.id === inst.assignedTo) : null
      results.push({
        ...inst,
        source: 'local',
        docLabel: docDef?.label ?? (inst.docTypeId || 'Other'),
        ownerName: member?.name ?? '',
      })
    }
    return results
  }, [selectedOwnerPartyIds, ruleDrivenDocs.clientUpload, openAccountsData, data, state.relatedParties])

  const updateOpenAccountDocInstance = (docTypeId: string, instanceId: string, updates: Partial<DocInstance>) => {
    const key = `doc-instances-${docTypeId}`
    const instances = (openAccountsData[key] as DocInstance[] | undefined) ?? []
    const existing = instances.find((i) => i.id === instanceId)
    if (existing) {
      updateOpenAccountsField(key, instances.map((i) => (i.id === instanceId ? { ...i, ...updates } : i)))
    } else {
      updateOpenAccountsField(key, [...instances, { id: instanceId, docTypeId, assignedTo: '', ...updates }])
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
        const instances = (openAccountsData[key] as DocInstance[] | undefined) ?? []
        const existing = instances.find((i) => i.id === inst.id)
        if (existing) {
          updateOpenAccountsField(
            key,
            instances.map((i) => (i.id === inst.id ? { ...i, fileName: file.name } : i)),
          )
        } else {
          updateOpenAccountsField(key, [
            ...instances,
            { id: inst.id, docTypeId: inst.docTypeId, assignedTo: inst.assignedTo, fileName: file.name },
          ])
        }
      }
    }
    input.click()
  }

  const localDocs = (data['child-local-docs'] as DocInstance[] | undefined) ?? []
  const executedEsignForms = useMemo(
    () => (data.esignExecutedForms as ExecutedEsignForm[] | undefined) ?? [],
    [data.esignExecutedForms],
  )
  const executedFormsByFormId = useMemo(
    () => new Map(executedEsignForms.map((f) => [f.formId, f])),
    [executedEsignForms],
  )
  /** Envelope rows and executed-form records use `${accountChildId}::${documentId}` (see buildRequiredEsignFormRows). */
  const accountChildId = ctx?.child.id ?? ''
  const executedRequiredForms = useMemo(() => {
    if (!accountChildId) return []
    return ruleDrivenDocs.firmCustodianEsign.filter((doc) =>
      executedFormsByFormId.has(`${accountChildId}::${doc.id}`),
    )
  }, [ruleDrivenDocs.firmCustodianEsign, executedFormsByFormId, accountChildId])

  const updateLocalDocs = (next: DocInstance[]) => {
    updateField('child-local-docs', next)
  }

  const removeLocalDoc = (docId: string) => {
    updateLocalDocs(localDocs.filter((d) => d.id !== docId))
  }

  const updateLocalDoc = (docId: string, updates: Partial<DocInstance>) => {
    updateLocalDocs(localDocs.map((d) => (d.id === docId ? { ...d, ...updates } : d)))
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

  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  return (
    <div className="space-y-8">
      <section id="acct-docs-forms" className="space-y-4 scroll-mt-16">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Forms for This Account
          </h3>
          <p className="text-sm text-muted-foreground">
            These required forms are generated automatically from this account&apos;s registration type using the same rules
            as the Documents panel and eSign envelope builder.
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Firm / custodian forms (signed)
            </p>
            {executedRequiredForms.length > 0 ? (
              <EsignDocumentsBundleViewerButton
                items={executedRequiredForms.map((d) => ({
                  id: `${ctx.child.id}::${d.id}`,
                  label: d.label,
                }))}
              />
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            After the client completes eSign, use View / Download for each form, or open the bundle viewer to review the
            full signed package in one place. Demo PDFs are placeholders; drafts are edited in the eSign envelope step—this
            list shows executed copies for this registration type. Wet-signed scans are added in the group below with
            document type, account, and notes; data is stored once on{' '}
            <span className="font-medium text-foreground">Open accounts</span> for the whole application.
          </p>
          {ruleDrivenDocs.firmCustodianEsign.length > 0 ? (
            <>
              {executedRequiredForms.length > 0 ? (
                <ul className="space-y-2">
                  {executedRequiredForms.map((doc) => (
                    <li
                      key={doc.id}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                          aria-hidden
                        >
                          <FileText className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{doc.label}</p>
                          {(() => {
                            const executed = executedFormsByFormId.get(`${ctx.child.id}::${doc.id}`)
                            if (!executed) return null
                            return (
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                Fully executed · {new Date(executed.executedAt).toLocaleString()}
                              </p>
                            )
                          })()}
                        </div>
                        <EsignFormPdfSampleActions
                          formIdOrDocId={`${ctx.child.id}::${doc.id}`}
                          displayLabel={doc.label}
                          viewMode="signed"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No executed forms yet. Send and complete an eSign envelope to populate this section.
                  </p>
                </div>
              )}
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Wet-signed document uploads
                </p>
                <WetSignedFirmUploadsGroup
                  documentTypes={ruleDrivenDocs.firmCustodianEsign.map((d) => ({ id: d.id, label: d.label }))}
                  accountOptions={wetSignedAccountOptions}
                  uploads={wetSignedFirmUploadsForChild}
                  onChange={mergeWetSignedFirmUploadsForChild}
                  defaultAccountChildId={ctx.child.id}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No eSign firm/custodian forms required for this registration type.</p>
          )}
        </div>

        <section id="acct-docs-client-upload" className="space-y-4 scroll-mt-16">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Supporting Client Documents
            </h3>
            <p className="text-sm text-muted-foreground">
              End-client uploads such as government-issued ID, trust documents, and other supporting files.
            </p>
          </div>

        {ruleDrivenDocs.clientUpload.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No client-upload documents are required for this registration type.
            </p>
          </div>
        ) : selectedOwnerPartyIds.size === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Add owners in <span className="font-medium text-foreground">Account &amp; owners</span> to manage document
              uploads by person.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ruleDrivenDocs.clientUpload.map((doc) => {
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
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs w-[36%]">
                            Specification
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs w-[11rem] max-w-[11rem]">
                            Owner
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">File</th>
                          <th className="w-[40px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {instancesForDoc.map((inst, idx) => {
                          const isUpstream = inst.source === 'upstream'
                          return (
                            <tr key={inst.id} className={idx < instancesForDoc.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-4 py-2.5 min-w-0 align-top w-[36%] max-w-[36%] overflow-hidden">
                                {subTypes.length > 0 ? (
                                  <Select
                                    value={inst.subType ?? ''}
                                    onValueChange={(v) => {
                                      if (isUpstream) {
                                        updateOpenAccountDocInstance(inst.docTypeId, inst.id, {
                                          subType: v,
                                          assignedTo: inst.assignedTo,
                                        })
                                      } else {
                                        updateLocalDoc(inst.id, { subType: v })
                                      }
                                    }}
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
                                  <div className="flex min-w-0 max-w-full cursor-default items-center h-8 px-3 rounded-md border border-border bg-muted/30">
                                    <span className="text-xs text-foreground truncate min-w-0" title={doc.label}>
                                      {doc.label}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 w-[11rem] max-w-[11rem] align-top">
                                <div className="flex min-w-0 items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-muted/30">
                                  <span
                                    className="text-xs text-foreground truncate min-w-0"
                                    title={inst.ownerName || 'Unassigned'}
                                  >
                                    {inst.ownerName || 'Unassigned'}
                                  </span>
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
                                          updateOpenAccountDocInstance(inst.docTypeId, inst.id, {
                                            fileName: undefined,
                                            assignedTo: inst.assignedTo,
                                          })
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
                                {!isUpstream ? (
                                  <button
                                    type="button"
                                    onClick={() => removeLocalDoc(inst.id)}
                                    className="text-muted-foreground hover:text-destructive p-1"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
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

        <div id="acct-docs-notes" className="space-y-2 scroll-mt-16">
          <Label>Exceptions / notes</Label>
          <textarea
            className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.exceptionsNotes as string) ?? ''}
            onChange={(e) => updateField('exceptionsNotes', e.target.value)}
          />
        </div>
      </section>
    </div>
  )
}
