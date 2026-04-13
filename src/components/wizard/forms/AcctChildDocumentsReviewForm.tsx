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
} from '@/utils/registrationDocuments'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
  source?: 'upstream' | 'local'
}

type OwnerRow = { id: string; type: 'existing'; partyId?: string }

export function AcctChildDocumentsReviewForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')
  const { data: openAccountsData, updateField: updateOpenAccountsField } = useTaskData('open-accounts')

  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  const childMeta = (state.taskData[ctx.child.id] as Record<string, unknown> | undefined) ?? undefined
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

  const ownersTaskId = `${ctx.child.id}-account-owners`
  const ownersData = state.taskData[ownersTaskId] as Record<string, unknown> | undefined
  const owners = (ownersData?.owners as OwnerRow[] | undefined) ?? []
  const selectedOwnerPartyIds = useMemo(
    () => new Set(owners.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId!)),
    [owners],
  )

  const allDocInstances = useMemo(() => {
    if (selectedOwnerPartyIds.size === 0 || ruleDrivenDocs.clientUpload.length === 0) return []
    const results: (DocInstance & { docLabel: string; ownerName: string })[] = []
    const ownerIds = Array.from(selectedOwnerPartyIds)

    for (const doc of ruleDrivenDocs.clientUpload) {
      const parentInstances = (openAccountsData[`doc-instances-${doc.id}`] as DocInstance[] | undefined) ?? []

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

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Forms for this account
        </h3>
        <p className="text-sm text-muted-foreground">
          These required forms are generated automatically from this account&apos;s registration type using the same rules
          as the Documents panel and eSign envelope builder.
        </p>

        <div className="rounded-md border border-border bg-card p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Firm / custodian forms (signed)
            </p>
            {ruleDrivenDocs.firmCustodianEsign.length > 0 ? (
              <EsignDocumentsBundleViewerButton
                items={ruleDrivenDocs.firmCustodianEsign.map((d) => ({ id: d.id, label: d.label }))}
              />
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            After the client completes eSign, use View / Download for each form, or open the bundle viewer to review the
            full signed package in one place. Demo PDFs are placeholders; drafts are edited in the eSign envelope step
            — this list shows executed copies only.
          </p>
          {ruleDrivenDocs.firmCustodianEsign.length > 0 ? (
            <ul className="space-y-2">
              {ruleDrivenDocs.firmCustodianEsign.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    aria-hidden
                  >
                    <FileText className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{doc.label}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      Fully executed · client eSign complete (demo PDF)
                    </p>
                  </div>
                  <EsignFormPdfSampleActions formIdOrDocId={doc.id} displayLabel={doc.label} viewMode="signed" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No eSign firm/custodian forms required for this registration type.</p>
          )}
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
                                  <div className="flex min-w-0 max-w-full items-center h-8 px-3 rounded-md border border-border bg-muted/30">
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

        <div className="space-y-2">
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
