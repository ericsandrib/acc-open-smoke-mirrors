import { useMemo } from 'react'
import { useChildActionContext, useTaskData, useWorkflow } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileText, FolderOpen } from 'lucide-react'
import { EsignFormPdfSampleActions } from '@/components/wizard/EsignFormPdfSampleActions'
import { EsignDocumentsBundleViewerButton } from '@/components/wizard/EsignDocumentsBundleViewer'
import type { RegistrationType } from '@/utils/registrationDocuments'
import {
  getRegistrationDocumentsForType,
  getOpenAccountsCoreSupportingDocumentSections,
  getDocSubTypes,
} from '@/utils/registrationDocuments'
import type { DocumentRequirementWithSubTypes } from '@/utils/registrationDocuments'
import { WetSignedFirmUploadsGroup } from '@/components/wizard/forms/WetSignedFirmUploadsGroup'
import {
  parseWetSignedFirmUploads,
  WET_SIGNED_FIRM_UPLOADS_KEY,
  type WetSignedFirmUpload,
} from '@/utils/wetSignedFirmUploads'
import { findParentTaskForChild } from '@/utils/openAccountsTaskContext'
import { useOpenAccountsVariant } from '@/components/wizard/openAccountsVariantContext'
import { cn } from '@/lib/utils'
import { DocumentUploadInstancesTable } from './DocumentUploadInstancesTable'
import {
  defaultSupportingDocumentStatus,
  nextStatusAfterUpload,
  type SupportingDocumentStatus,
} from '@/utils/supportingDocuments'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
  customSubTypeLabel?: string
  status?: SupportingDocumentStatus
  requestedBy?: string
}

interface ExecutedEsignForm {
  id: string
  envelopeId: string
  formId: string
  label: string
  fileName: string
  executedAt: string
}

export function AcctChildDocumentsReviewForm() {
  const { state } = useWorkflow()
  const variant = useOpenAccountsVariant()
  // v5/v6 intentionally render flat, with no section cards or card-only header strips.
  const isVersion2 = variant === 'v2'
  const isVersion3 = variant === 'v3'
  const isVersion4 = variant === 'v4'
  const isCardVariant = isVersion2 || isVersion3 || isVersion4
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
    if (!registrationType) return { firmCustodianEsign: [] }
    const docs = getRegistrationDocumentsForType(registrationType, { relatedParties: state.relatedParties })
    const esign = docs.filter((d) => d.fulfillment === 'esign')
    return {
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

  const supportingDocSections = useMemo<DocumentRequirementWithSubTypes[]>(
    () => getOpenAccountsCoreSupportingDocumentSections(),
    [],
  )
  const supportingDocumentAssignees = useMemo(
    () => [
      ...state.relatedParties
        .filter((p) => !p.isHidden)
        .map((p) => ({
          id: p.id,
          name: p.name?.trim() || p.organizationName?.trim() || p.role || 'Party',
        })),
      ...accountOpeningChildren.map((child) => ({
        id: `workflow:${child.id}`,
        name: `${child.name} workflow`,
      })),
      { id: 'workflow:kyc', name: 'KYC workflow' },
      { id: 'workflow:account-opening', name: 'Account Opening workflow' },
    ],
    [state.relatedParties, accountOpeningChildren],
  )

  const handleSupportingDocFileSelect = (docTypeId: string, instanceId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const key = `doc-instances-${docTypeId}`
        const instances = (openAccountsData[key] as DocInstance[] | undefined) ?? []
        const existing = instances.find((i) => i.id === instanceId)
        if (existing) {
          updateOpenAccountsField(
            key,
            instances.map((i) =>
              i.id === instanceId
                ? { ...i, fileName: file.name, status: nextStatusAfterUpload(i.status) }
                : i,
            ),
          )
        } else {
          updateOpenAccountsField(key, [
            ...instances,
            {
              id: instanceId,
              docTypeId,
              assignedTo: '',
              fileName: file.name,
              status: nextStatusAfterUpload(undefined),
            },
          ])
        }
      }
    }
    input.click()
  }
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


  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  return (
    <div className={variant === 'v5' || variant === 'v6' ? 'space-y-9' : 'space-y-7'}>
      <section id="acct-docs-forms" className="space-y-4 scroll-mt-16">
        <div
          className={cn(
            isCardVariant &&
              cn(
                'rounded-xl p-6 space-y-6 overflow-hidden',
                isVersion2 && 'border border-foreground/30 bg-background',
                isVersion3 && 'v3-card-inner-strokes border border-foreground/20 bg-[#fafafa]',
                isVersion4 && 'border border-foreground/30 bg-white',
              ),
          )}
        >
        <div
          className={cn(
            isCardVariant &&
              cn(
                '-mx-6 -mt-6 mb-8 px-6 py-4',
                isVersion2 && 'border-b border-border/60 bg-[#F5F5F4]',
                isVersion4 && 'border-b border-border/60',
                    isVersion3 && 'mx-0 mt-0 px-0 pt-0 pb-4 border-b border-border/60',
                isVersion4 && 'bg-[#F5F5F4]',
              ),
          )}
        >
          <h3 className={cn(isCardVariant ? 'text-sm font-semibold uppercase tracking-wide' : 'text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1')}>
            Forms for This Account
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
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
            list shows executed copies for this registration type. Paper or manually signed documents are added in the
            group below with document type, account, and notes; data is stored once on{' '}
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
                  Manual document uploads
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
            <p className="text-xs text-muted-foreground">
              No firm or custodian eSignature forms apply to this registration type.
            </p>
          )}
        </div>
        </div>
      </section>

      <section id="acct-docs-client-upload" className="space-y-4 scroll-mt-16">
        <div
          className={cn(
            isCardVariant &&
              cn(
                'rounded-xl p-6 space-y-6 overflow-hidden',
                isVersion2 && 'border border-foreground/30 bg-background',
                isVersion3 && 'v3-card-inner-strokes border border-foreground/20 bg-[#fafafa]',
                isVersion4 && 'border border-foreground/30 bg-white',
              ),
          )}
        >
          <div
            className={cn(
              isCardVariant &&
                cn(
                  '-mx-6 -mt-6 mb-4 px-6 py-4',
                  isVersion2 && 'border-b border-border/60 bg-[#F5F5F4]',
                  isVersion4 && 'border-b border-border/60 bg-[#F5F5F4]',
                  isVersion3 && 'mx-0 mt-0 px-0 pt-0 pb-4 border-b border-border/60',
                ),
            )}
          >
            <h3 className={cn(isCardVariant ? 'text-sm font-semibold uppercase tracking-wide' : 'text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1')}>
              Supporting Client Documents
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Upload client-provided documents that may support account opening, identity verification, or custodian
              review. Documents are optional unless requested during review.
            </p>
          </div>
          <div className="space-y-4">
            {supportingDocSections.map((doc) => {
              const key = `doc-instances-${doc.id}`
              const instances = (openAccountsData[key] as DocInstance[] | undefined) ?? []
              const subTypes = getDocSubTypes(doc.id)

              const addInstance = () => {
                updateOpenAccountsField(key, [
                  ...instances,
                  {
                    id: `di-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    docTypeId: doc.id,
                    assignedTo: '',
                    status: defaultSupportingDocumentStatus(),
                  },
                ])
              }

              const removeInstance = (instanceId: string) => {
                updateOpenAccountsField(
                  key,
                  instances.filter((i) => i.id !== instanceId),
                )
              }

              const updateInstance = (instanceId: string, updates: Partial<DocInstance>) => {
                updateOpenAccountsField(
                  key,
                  instances.map((i) => (i.id === instanceId ? { ...i, ...updates } : i)),
                )
              }

              return (
                <DocumentUploadInstancesTable
                  key={doc.id}
                  docLabel={doc.label}
                  docDescription={doc.description}
                  instances={instances}
                  subTypes={subTypes}
                  assignees={supportingDocumentAssignees}
                  emptyMessage="No documents added yet."
                  emptyHelper="Click Add to upload an optional document."
                  onAdd={addInstance}
                  onRemove={removeInstance}
                  onUpload={(instanceId) => handleSupportingDocFileSelect(doc.id, instanceId)}
                  onUpdate={updateInstance}
                  lockAssignedWhenPresent={false}
                />
              )
            })}
          </div>
        </div>
      </section>

      <section id="acct-docs-notes" className="space-y-4 scroll-mt-16">
        <div
          className={cn(
            isCardVariant &&
              cn(
                'rounded-xl p-6 space-y-4 overflow-hidden',
                isVersion2 && 'border border-foreground/30 bg-background',
                isVersion3 && 'v3-card-inner-strokes border border-foreground/20 bg-[#fafafa]',
                isVersion4 && 'border border-foreground/30 bg-white',
              ),
          )}
        >
          <div>
            <h3 className={cn(isCardVariant ? 'text-sm font-semibold uppercase tracking-wide' : 'text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1')}>
              Exceptions / notes
            </h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acct-docs-exceptions-notes">Exceptions / notes</Label>
            <textarea
              id="acct-docs-exceptions-notes"
              className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.exceptionsNotes as string) ?? ''}
              onChange={(e) => updateField('exceptionsNotes', e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
