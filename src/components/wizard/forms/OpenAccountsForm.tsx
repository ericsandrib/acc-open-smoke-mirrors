import { useState, useMemo, useRef, useEffect } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildTask, RelatedParty } from '@/types/workflow'
import { AccountTypePickerDialog } from './AccountTypePickerDialog'
import type { Selection } from './AccountTypePickerDialog'
import { spawnOpenAccountChildrenFromSelections } from '@/utils/spawnOpenAccountChildrenFromSelections'
import {
  getRegistrationDocuments,
  getDocSubTypes,
  partitionRegistrationDocumentsByFulfillment,
  sortUploadDocumentsForOpenAccounts,
  getAssigneePartyIdsForClientUploadDoc,
  getTrustOrganizationIdsForAccountOwners,
  TRUST_VERIFICATION_DOC_ID,
} from '@/utils/registrationDocuments'
import type { RegistrationType } from '@/utils/registrationDocuments'
import {
  Minus,
  Plus,
  Shield,
  Wallet,
  FileSignature,
  Trash2,
  Download,
  MoreVertical,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
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
import { getRegistrationTypesForOpenAccountsUploadSection } from '@/utils/openAccountsDocumentValidation'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import { getAccountOpeningChildSubmissionIssues } from '@/utils/accountOpeningChildProgress'
import {
  getRelevantOpenAccountsTask,
  isAnnuityExternalPlatformOpenAccountsTask,
} from '@/utils/openAccountsTaskContext'
import { mergeFeatureRequests } from '@/types/featureRequests'
import { getEsignEnvelopeStatus, ESIGN_ENVELOPE_STATUS_LABELS } from '@/utils/esignEnvelopeStatus'
import type { EsignEnvelopeHistoryEvent, EsignEnvelopeStatus, EsignSignerStatus } from '@/types/esignEnvelope'
import { CompleteAccountOpeningConfirmModal } from '@/components/wizard/WizardFooter'
import { DocumentUploadInstancesTable } from './DocumentUploadInstancesTable'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface DocInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
}

type OwnerSlot = { partyId?: string; type: string }
type ExecutedEsignForm = {
  id: string
  envelopeId: string
  formId: string
  label: string
  fileName: string
  executedAt: string
}

function EnvelopeKebabMenu({
  onDownload,
  onSimulateSigning,
  onViewHistory,
  onCancelEnvelope,
  onDeleteEnvelope,
  canCancelEnvelope = true,
  canDeleteEnvelope = false,
  triggerClassName,
  className,
}: {
  onDownload: () => void
  onSimulateSigning: () => void
  onViewHistory: () => void
  onCancelEnvelope: () => void
  onDeleteEnvelope: () => void
  canCancelEnvelope?: boolean
  canDeleteEnvelope?: boolean
  triggerClassName?: string
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            className,
            triggerClassName,
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="z-[200] min-w-[170px] rounded-lg border border-border bg-background shadow-lg py-1 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem className="gap-2.5 px-3 py-2 text-sm" onSelect={onViewHistory}>
          <Clock className="h-4 w-4" />
          History
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2.5 px-3 py-2 text-sm" onSelect={onDownload}>
          <Download className="h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2.5 px-3 py-2 text-sm" onSelect={onSimulateSigning}>
          <Play className="h-4 w-4" />
          Simulate signing
        </DropdownMenuItem>
        <div className="my-1 h-px bg-border" />
        <DropdownMenuItem
          className="gap-2.5 px-3 py-2 text-sm text-destructive focus:text-destructive"
          disabled={!canCancelEnvelope}
          onSelect={onCancelEnvelope}
        >
          <XCircle className="h-4 w-4" />
          Cancel envelope
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2.5 px-3 py-2 text-sm text-destructive focus:text-destructive"
          disabled={!canDeleteEnvelope}
          onSelect={onDeleteEnvelope}
        >
          <Trash2 className="h-4 w-4" />
          Delete envelope
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function OpenAccountsForm() {
  const { state, dispatch } = useWorkflow()
  const openAccountsTask = getRelevantOpenAccountsTask(state)
  const openAccountsTaskId = openAccountsTask?.id ?? 'open-accounts'
  const externalAnnuityPlatform = isAnnuityExternalPlatformOpenAccountsTask(openAccountsTask)
  const { data, updateField } = useTaskData(openAccountsTaskId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)
  const [envelopeDrawerOpen, setEnvelopeDrawerOpen] = useState(false)
  const [envelopeDraft, setEnvelopeDraft] = useState<EsignEnvelope | null>(null)
  const [envelopeDrawerCreate, setEnvelopeDrawerCreate] = useState(true)
  const [historyEnvelopeId, setHistoryEnvelopeId] = useState<string | null>(null)
  const [submitChildConfirmOpen, setSubmitChildConfirmOpen] = useState(false)
  const [submitChildWarnings, setSubmitChildWarnings] = useState<string[]>([])
  const [submitTargetChildId, setSubmitTargetChildId] = useState<string | null>(null)
  /** Bumps when the drawer opens so the sheet remounts with fresh local state from `envelopeDraft`. */
  const [envelopeDrawerMountKey, setEnvelopeDrawerMountKey] = useState(0)

  const kycParentTask = externalAnnuityPlatform
    ? state.tasks.find((t) => t.formKey === 'kyc')
    : (state.tasks.find((t) => t.formKey === 'kyc') ?? openAccountsTask)
  const kycChildren = kycParentTask?.children?.filter((c) => c.childType === 'kyc') ?? []
  const [kycAddSheetOpen, setKycAddSheetOpen] = useState(false)
  const [kycTimelineChild, setKycTimelineChild] = useState<ChildTask | null>(null)
  const pendingKycPartyId = useRef<string | null>(null)
  const [kycAddContactBump, setKycAddContactBump] = useState(0)

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
      childName:
        party.name?.trim() ||
        party.organizationName?.trim() ||
        (party.type === 'related_organization' ? 'Legal entity' : 'Contact'),
      childType: 'kyc',
    })
  }, [state.relatedParties, kycParentTask, dispatch, kycAddContactBump])

  const handleKycContactAdded = (partyId: string) => {
    pendingKycPartyId.current = partyId
    setKycAddContactBump((b) => b + 1)
  }
  const accountOpeningChildren = (openAccountsTask?.children ?? []).filter((c) => c.childType === 'account-opening')
  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)

  const kycOwnerParties = useMemo(() => {
    const byId = new Map<string, RelatedParty>()
    for (const child of accountOpeningChildren) {
      const ownerData = (state.taskData[`${child.id}-account-owners`] as Record<string, unknown> | undefined)
      const owners = (ownerData?.owners as OwnerSlot[] | undefined) ?? []
      for (const owner of owners) {
        if (owner.type !== 'existing' || !owner.partyId) continue
        const party = state.relatedParties.find((p) => p.id === owner.partyId)
        if (party) byId.set(party.id, party)
      }
    }
    return Array.from(byId.values())
  }, [accountOpeningChildren, state.relatedParties, state.taskData])

  const childRegistrationTypes = useMemo<RegistrationType[]>(
    () => getRegistrationTypesForOpenAccountsUploadSection(accountOpeningChildren, state.taskData),
    [accountOpeningChildren, state.taskData],
  )

  const registrationDocsBundle = useMemo(
    () => getRegistrationDocuments(childRegistrationTypes, state.relatedParties),
    [childRegistrationTypes, state.relatedParties],
  )

  const uploadDocs = useMemo(() => {
    const { upload } = partitionRegistrationDocumentsByFulfillment(registrationDocsBundle)
    return sortUploadDocumentsForOpenAccounts(upload)
  }, [registrationDocsBundle])

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

  /** Trust entity(ies) selected as owner(s)—assignee dropdown for trust verification uploads. */
  const trustVerificationAssigneeParties = useMemo(
    () =>
      getTrustOrganizationIdsForAccountOwners(state.relatedParties, allOwnerPartyIds)
        .map((id) => state.relatedParties.find((p) => p.id === id))
        .filter((p): p is RelatedParty => Boolean(p)),
    [state.relatedParties, allOwnerPartyIds],
  )

  const requiredEsignFormRows = useMemo(
    () => buildRequiredEsignFormRows(accountOpeningChildren, state.taskData, state.relatedParties),
    [accountOpeningChildren, state.taskData, state.relatedParties],
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
        phone: existing?.phone ?? party?.phone ?? '',
        accountChildIds: Array.from(accounts),
      })
    }
    return rows
  }

  const esignEnvelopes = (data.esignEnvelopes as EsignEnvelope[] | undefined) ?? []

  const deriveDefaultOptionalForms = () => {
    const ids = new Set<string>()
    for (const account of accountOpeningChildren) {
      const childMeta = (state.taskData[account.id] as Record<string, unknown> | undefined) ?? {}
      const fr = mergeFeatureRequests(childMeta.featureRequests)
      if (fr.margin?.requested) ids.add('opt-margin-supplement')
      if (fr.options?.requested) ids.add('opt-options-supplement')
      if (
        fr.alternativeStrategySelection?.requested &&
        fr.alternativeStrategySelection.includePdfInEsign !== false
      ) {
        ids.add('opt-alternative-strategy-selection')
      }
    }
    return Array.from(ids)
  }

  const openNewEnvelopeDrawer = () => {
    const base = createNewEnvelope(requiredEsignFormRows, deriveEnvelopeSigners(requiredEsignFormRows))
    setEnvelopeDraft(
      {
        ...base,
        optionalFormIdsIncluded: deriveDefaultOptionalForms(),
      },
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
    const now = new Date().toISOString()
    const normalized = {
      ...env,
      signers: deriveEnvelopeSigners(env.formSelections, env.signers).map((s) => ({
        ...s,
        signingStatus: s.signingStatus ?? 'pending',
      })),
      envelopeStatus: env.envelopeStatus ?? getEsignEnvelopeStatus(env),
      history:
        env.history && env.history.length > 0
          ? env.history
          : [
              {
                id: `evt-created-${now}`,
                occurredAt: now,
                source: 'advisor' as const,
                eventType: 'envelope_status' as const,
                envelopeStatus: env.envelopeStatus ?? 'draft',
                note: 'Envelope created',
              },
            ],
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

  const statusBadgeClass = (status: EsignEnvelopeStatus) => {
    if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200'
    if (status === 'declined' || status === 'voided' || status === 'canceled') return 'bg-red-50 text-red-700 border-red-200'
    if (status === 'delivered') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (status === 'sent') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-muted text-muted-foreground border-border'
  }

  const signerStatusLabel: Record<EsignSignerStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    delivered: 'Delivered',
    viewed: 'Viewed',
    signed: 'Signed',
    declined: 'Declined',
  }

  const simulateEnvelopeSigning = (envelopeId: string) => {
    const env = esignEnvelopes.find((e) => e.id === envelopeId)
    if (!env) return
    const includedAccountIds = Array.from(
      new Set(env.formSelections.filter((r) => r.included).map((r) => r.accountChildId)),
    )
    const ownersMissingKyc = Array.from(
      new Set(
        includedAccountIds.flatMap((accountChildId) =>
          getAccountOwnersMissingKyc(state, accountChildId).names,
        ),
      ),
    )
    if (ownersMissingKyc.length > 0) {
      window.alert(
        `Cannot simulate envelope signing until KYC is complete for: ${ownersMissingKyc.join(', ')}.`,
      )
      return
    }
    const now = new Date().toISOString()

    updateField(
      'esignEnvelopes',
      esignEnvelopes.map((current) => {
        if (current.id !== envelopeId) return current
        let history = current.history ?? []
        const push = (event: Omit<EsignEnvelopeHistoryEvent, 'id'>) => {
          const nextIndex = history.length + 1
          history = [
            ...history,
            {
              ...event,
              id: `evt-${event.occurredAt}-${event.eventType}-${event.signerId ?? 'env'}-${nextIndex}`,
            },
          ]
        }

        push({
          occurredAt: now,
          source: 'docusign',
          eventType: 'envelope_status',
          envelopeStatus: 'sent',
          note: 'Envelope sent to recipients',
        })
        push({
          occurredAt: now,
          source: 'docusign',
          eventType: 'envelope_status',
          envelopeStatus: 'delivered',
          note: 'Envelope delivered to recipients',
        })
        for (const signer of current.signers) {
          push({
            occurredAt: now,
            source: 'docusign',
            eventType: 'signer_status',
            signerId: signer.id,
            signerName: signer.name,
            signerStatus: 'signed',
            note: `${signer.name || 'Signer'} completed signing`,
          })
        }
        push({
          occurredAt: now,
          source: 'docusign',
          eventType: 'envelope_status',
          envelopeStatus: 'completed',
          note: 'Envelope completed',
        })

        return {
          ...current,
          sentToClient: true,
          clientSignaturesComplete: true,
          envelopeStatus: 'completed',
          signers: current.signers.map((s) => ({
            ...s,
            signingStatus: 'signed',
            signedAt: now,
          })),
          history,
        }
      }),
    )

    const rowsByChild = new Map<string, ExecutedEsignForm[]>()
    for (const row of env.formSelections) {
      if (!row.included) continue
      const next: ExecutedEsignForm = {
        id: `exec-${env.id}-${row.formId}`,
        envelopeId: env.id,
        formId: row.formId,
        label: row.label,
        fileName: `${row.label.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'signed-form'}.pdf`,
        executedAt: now,
      }
      const list = rowsByChild.get(row.accountChildId) ?? []
      const filtered = list.filter((d) => d.formId !== row.formId || d.envelopeId !== env.id)
      rowsByChild.set(row.accountChildId, [...filtered, next])
    }

    for (const [accountChildId, docs] of rowsByChild.entries()) {
      const taskId = `${accountChildId}-documents-review`
      const existing = ((state.taskData[taskId] as Record<string, unknown> | undefined)?.esignExecutedForms ??
        []) as ExecutedEsignForm[]
      const merged = [...existing]
      for (const doc of docs) {
        const idx = merged.findIndex((d) => d.formId === doc.formId && d.envelopeId === doc.envelopeId)
        if (idx >= 0) merged[idx] = doc
        else merged.push(doc)
      }
      dispatch({
        type: 'SET_TASK_DATA',
        taskId,
        fields: { esignExecutedForms: merged },
      })
    }
  }

  const cancelEnvelope = (envelopeId: string) => {
    const now = new Date().toISOString()
    updateField(
      'esignEnvelopes',
      esignEnvelopes.map((current) => {
        if (current.id !== envelopeId) return current
        const history = [
          ...(current.history ?? []),
          {
            id: `evt-${now}-envelope_status-canceled`,
            occurredAt: now,
            source: 'advisor' as const,
            eventType: 'envelope_status' as const,
            envelopeStatus: 'canceled' as const,
            note: 'Envelope canceled. Next send will create a new provider envelope while retaining this row.',
          },
        ]
        return {
          ...current,
          envelopeStatus: 'canceled' as const,
          sentToClient: false,
          clientSignaturesComplete: false,
          signers: current.signers.map((s) => ({
            ...s,
            signingStatus: 'pending' as const,
            signedAt: undefined,
          })),
          history,
        }
      }),
    )
  }

  const deleteEnvelope = (envelopeId: string) => {
    updateField(
      'esignEnvelopes',
      esignEnvelopes.filter((e) => e.id !== envelopeId),
    )
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

  const submitAccountChildForReview = (childId: string) => {
    setSubmitTargetChildId(childId)
    setSubmitChildWarnings([])
    setSubmitChildConfirmOpen(true)
  }

  return (
    <div className="space-y-12">
      <section id="oa-accounts" className="scroll-mt-16">
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Accounts
          </h3>
          <p className="text-base text-muted-foreground mt-2">
            Add the accounts you plan to open at the custodian, including funding details for each.
          </p>
        </div>

        {accountOpeningChildren.length > 0 ? (
          <div className="rounded-lg border border-border p-1">
            {topLevelChildren.map((child) => {
              const annuities = getAnnuities(child.name)
              const childMeta = state.taskData[child.id] as Record<string, unknown> | undefined
              const accountNumber =
                typeof childMeta?.accountNumber === 'string' && childMeta.accountNumber.trim()
                  ? childMeta.accountNumber.trim()
                  : undefined
              const acctDigits = (accountNumber ?? '').replace(/\D/g, '')
              const last4 = acctDigits.length ? acctDigits.slice(-4) : ''
              const rowLabel = last4 ? `${child.name} ...${last4}` : child.name
              return (
                <div key={child.id}>
                  {/* Account row */}
                  <div className="group flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })}
                      className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium truncate min-w-0" title={rowLabel}>
                        {rowLabel}
                      </span>
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
                          onSubmitForReview={() => submitAccountChildForReview(child.id)}
                          submitForReviewLabel={externalAnnuityPlatform ? 'Submit to NetX360' : 'Submit for Review'}
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
              No accounts added yet. Add the account types you want to open.
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

      {/* Section 4: Supporting Documents */}
      {!externalAnnuityPlatform ? (
      <section id="oa-documents" className="scroll-mt-16">
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Supporting Documents
          </h3>
          <p className="text-base text-muted-foreground">
            {externalAnnuityPlatform ? (
              <>
                Client file uploads (for example ID or trust documents) go here. Firm and custodian forms for this path
                are completed in your external platform—not in this demo.
              </>
            ) : (
              <>
                Upload client-provided documents (for example ID or trust documents). Firm and custodian forms are handled in{' '}
                <span className="font-medium text-foreground">Envelopes</span>, not here.
              </>
            )}
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

              // Auto-generate rows: same rules as account-opening Documents step (per doc type).
              const ownerIds = getAssigneePartyIdsForClientUploadDoc(
                doc.id,
                state.relatedParties,
                allOwnerPartyIds,
              )
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
              const subTypes = getDocSubTypes(doc.id)
              const assigneeParties =
                doc.id === TRUST_VERIFICATION_DOC_ID
                  ? trustVerificationAssigneeParties
                  : householdMembers

              return (
                <DocumentUploadInstancesTable
                  key={doc.id}
                  docLabel={doc.label}
                  docDescription={doc.description}
                  instances={instances}
                  subTypes={subTypes}
                  assignees={assigneeParties.map((p) => ({ id: p.id, name: p.name }))}
                  emptyMessage="No documents added yet. Click “Add” to upload and assign to a member."
                  onAdd={addInstance}
                  onRemove={removeInstance}
                  onUpload={handleFileSelect}
                  onUpdate={updateInstance}
                />
              )
            })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {accountOpeningChildren.length === 0
                ? 'Add accounts above to see required documents.'
                : externalAnnuityPlatform
                  ? 'No client uploads required for these accounts. Use your external platform for firm and custodian forms.'
                  : 'No client uploads required for these accounts. Use eSign envelopes below for firm and custodian forms.'}
            </p>
          </div>
        )}
      </section>
      ) : null}

      {/* KYC Verification — hidden on annuity path (KYC in external platform) */}
      {!externalAnnuityPlatform ? (
      <section id="oa-kyc" className="scroll-mt-16">
        <div className="mb-4">
          <h3 className="text-base font-semibold">KYC Verification</h3>
          <p className="text-base text-muted-foreground">
            Complete identity verification (KYC/KYB) before accounts can be opened. For trust accounts, include trustees
            and beneficial owners.
          </p>
        </div>

        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground">Account Owners</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Add all individuals who require identity verification.
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
                  const matchingChild = kycChildren.find((c) => {
                    if (c.childType !== 'kyc') return false
                    const meta = state.taskData[c.id] as Record<string, unknown> | undefined
                    if ((meta?.kycSubjectPartyId as string | undefined) === member.id) return true
                    return c.name === member.name
                  })
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
                          const reviewState = state.childReviewsByChildId?.[matchingChild!.id]
                          const displayStatus = deriveChildDisplayStatus(matchingChild!.status, reviewState)
                          const cfg = displayStatus === 'complete'
                            ? { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' }
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
                                metadata: {
                                  kycSubjectPartyId: member.id,
                                  kycSubjectType: member.type === 'related_organization' ? 'entity' : 'individual',
                                  ...(member.type === 'related_organization'
                                    ? {
                                        kycRelatedSubjectPartyIds: Array.from(
                                          new Set([
                                            ...(member.trustParties ?? [])
                                              .map((t) => t.partyId)
                                              .filter((id): id is string => Boolean(id)),
                                            ...(member.beneficialOwners ?? [])
                                              .map((b) =>
                                                state.relatedParties.find(
                                                  (p) =>
                                                    p.type !== 'related_organization' &&
                                                    !p.isHidden &&
                                                    p.name?.trim().toLowerCase() === b.name.trim().toLowerCase(),
                                                )?.id,
                                              )
                                              .filter((id): id is string => Boolean(id)),
                                          ]),
                                        ),
                                      }
                                    : {}),
                                },
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
            <h4 className="text-sm font-semibold text-foreground">KYC Cases</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Each row represents a KYC case. Open a case to complete and submit it for review.
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
                {(() => {
                  const reviewState = state.childReviewsByChildId?.[child.id]
                  const displayStatus = deriveChildDisplayStatus(child.status, reviewState)
                  if (displayStatus === 'complete') {
                    return (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )
                  }
                  if (
                    displayStatus === 'nigo' ||
                    displayStatus === 'nigo_document' ||
                    displayStatus === 'nigo_principal' ||
                    displayStatus === 'rejected_aml'
                  ) {
                    return (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 shrink-0">
                        <XCircle className="h-4 w-4" />
                      </div>
                    )
                  }
                  return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                  )
                })()}
                <span className="text-sm font-medium">{child.name}</span>
              </button>
              <div className="flex items-center gap-2">
                {(() => {
                  const reviewState = state.childReviewsByChildId?.[child.id]
                  const displayStatus = deriveChildDisplayStatus(child.status, reviewState)
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
                  ? 'No KYC cases started yet.'
                  : 'No KYC cases started yet.'}
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
          description="Search for an existing individual or legal entity, or create a new record. The form matches the type you select."
          includeLegalEntityCreate
        />

        <ChildActionTimelineSheet
          open={!!kycTimelineChild}
          onOpenChange={(o) => { if (!o) setKycTimelineChild(null) }}
          child={kycTimelineChild}
        />
      </section>
      ) : null}

      {!externalAnnuityPlatform ? (
      <>
      {/* Envelopes */}
      <section id="oa-esign" className="scroll-mt-16">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Envelopes</h3>
          <p className="text-base text-muted-foreground mt-2">
            Create eSign envelopes for client signatures. Required firm and custodian forms are automatically grouped by
            account. You can review generated forms when creating or editing an envelope. Wet-signed documents should
            be uploaded in each account&apos;s Documents step.
          </p>
        </div>
        {esignEnvelopes.length > 0 ? (
          <div className="mb-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={openNewEnvelopeDrawer}>
              <Plus className="h-3.5 w-3.5" />
              Add envelope
            </Button>
          </div>
        ) : null}
        {esignEnvelopes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileSignature className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No envelopes created yet.</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Select delivery method, template, and forms to include.
            </p>
            <Button type="button" onClick={openNewEnvelopeDrawer}>
              <Plus className="h-4 w-4 mr-2" />
              New envelope
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-1">
            <ul className="space-y-1">
              {esignEnvelopes.map((env) => (
                <li
                  key={env.id}
                  className="group flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditEnvelopeDrawer(env)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openEditEnvelopeDrawer(env)
                    }
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      <FileSignature className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground truncate">{getEnvelopeDisplayName(env)}</p>
                    </div>
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        statusBadgeClass(getEsignEnvelopeStatus(env)),
                      )}
                    >
                      {ESIGN_ENVELOPE_STATUS_LABELS[getEsignEnvelopeStatus(env)]}
                    </Badge>
                    <div className="shrink-0">
                      <EnvelopeKebabMenu
                        onDownload={() => downloadEnvelopeManifest(env)}
                        onSimulateSigning={() => simulateEnvelopeSigning(env.id)}
                        onViewHistory={() => setHistoryEnvelopeId(env.id)}
                        onCancelEnvelope={() => cancelEnvelope(env.id)}
                        onDeleteEnvelope={() => deleteEnvelope(env.id)}
                        canCancelEnvelope={!['completed', 'canceled', 'voided'].includes(getEsignEnvelopeStatus(env))}
                        canDeleteEnvelope={getEsignEnvelopeStatus(env) === 'canceled'}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Button type="button" variant="ghost" className="w-full gap-1.5" onClick={openNewEnvelopeDrawer}>
              <Plus className="h-4 w-4" />
              Add envelope
            </Button>
          </div>
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

      <Dialog open={historyEnvelopeId !== null} onOpenChange={(open) => !open && setHistoryEnvelopeId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envelope status history</DialogTitle>
            <DialogDescription>
              DocuSign envelope timeline and signer-level signing events.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const env = esignEnvelopes.find((e) => e.id === historyEnvelopeId)
            if (!env) return <p className="text-sm text-muted-foreground">Envelope not found.</p>
            const history = [...(env.history ?? [])].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
            return (
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="text-sm font-medium">{getEnvelopeDisplayName(env)}</p>
                  <p className="text-xs text-muted-foreground">
                    Current status: {ESIGN_ENVELOPE_STATUS_LABELS[getEsignEnvelopeStatus(env)]}
                  </p>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No status events recorded yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-[45vh] overflow-y-auto">
                    {history.map((event) => (
                      <li key={event.id} className="rounded-md border border-border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {event.eventType === 'envelope_status'
                              ? `Envelope ${event.envelopeStatus ? ESIGN_ENVELOPE_STATUS_LABELS[event.envelopeStatus] : 'Updated'}`
                              : `${event.signerName ?? 'Signer'} — ${event.signerStatus ? signerStatusLabel[event.signerStatus] : 'Updated'}`}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {event.source === 'docusign' ? 'DocuSign' : 'Advisor'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.occurredAt).toLocaleString()}
                        </p>
                        {event.note ? <p className="text-xs text-muted-foreground mt-1">{event.note}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
      </>
      ) : null}
      {submitChildConfirmOpen && (
        <CompleteAccountOpeningConfirmModal
          mode="submit-children"
          warnings={submitChildWarnings}
          onCancel={() => {
            setSubmitChildConfirmOpen(false)
            setSubmitChildWarnings([])
            setSubmitTargetChildId(null)
          }}
          onConfirm={() => {
            if (!submitTargetChildId) {
              setSubmitChildConfirmOpen(false)
              setSubmitChildWarnings([])
              return
            }
            const issues = getAccountOpeningChildSubmissionIssues(state, submitTargetChildId)
            if (issues.length > 0) {
              setSubmitChildWarnings(issues)
              return
            }
            dispatch({ type: 'ENTER_CHILD_ACTION', childId: submitTargetChildId })
            dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
            dispatch({ type: 'EXIT_CHILD_ACTION' })
            setSubmitChildConfirmOpen(false)
            setSubmitChildWarnings([])
            setSubmitTargetChildId(null)
          }}
        />
      )}
    </div>
  )
}
