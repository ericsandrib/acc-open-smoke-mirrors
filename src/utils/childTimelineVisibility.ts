import type { ChildReviewState, ChildType, VerificationSnapshot } from '@/types/workflow'
import { dispositionSnapshotMessage, isMeaningfulReviewerMessage } from '@/utils/reviewerStageMessages'

export interface TimelineVisitedFlags {
  preSubmitted: boolean
  submitted: boolean
  clarification: boolean
  amlReview: boolean
  documentReview: boolean
  principalReview: boolean
  escalationHold: boolean
  complete: boolean
}

export interface TimelineDisplayStep {
  id: string
  label: string
  description: string
  matchStatuses: string[]
  sortKey: number
  messages: string[]
  atLabel?: string
  isClarification: boolean
  /** Completed audit visit (not the live in-progress step). */
  isHistorical: boolean
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  Draft: 'Capture client & account data, validate, and perform ID verification.',
  'Client Signature': 'Combined eSign package generated and sent to client for signature.',
  Submitted: 'Account application submitted to Home Office for review.',
  'Awaiting Review': 'Account application submitted to Home Office for review.',
  'Clarification / Document Required':
    'Review team requested clarification or additional documents from the advisor.',
  'AML Review':
    'AML compliance team screens each owner against sanctions, PEP, and watchlists.',
  'Document Review': 'Document Review Team verifies completeness of all account documents.',
  'Principal Review': 'Principal Review Team performs final approval and oversight.',
  'Escalation / Hold': 'Account placed on hold for compliance escalation.',
  'Pending Release': 'Both reviews passed — account approved (IGO). Preparing for release to Pershing.',
  Complete: 'Identity verified. No further KYC action required.',
  'ID Verification': 'Identity verification performed by Avantos.',
}

const ACCOUNT_PIPELINE = ['AML Review', 'Document Review', 'Principal Review', 'Pending Release'] as const

const DISPOSITION_KINDS = new Set<VerificationSnapshot['eventKind']>([
  'aml_approve',
  'aml_approve_reused',
  'aml_reject',
  'aml_request_info',
  'aml_escalate',
  'cip_approve',
  'cip_reject',
  'cip_request_info',
])

type EventBucket = 'aml' | 'clarification' | 'document' | 'principal' | 'escalation'

interface TimelineAuditEvent {
  id: string
  sortKey: number
  atLabel: string
  bucket: EventBucket
  label: string
  message?: string
}

function parseSortKey(isoOrLabel?: string, fallback = 0): number {
  if (isoOrLabel) {
    const d = new Date(isoOrLabel)
    if (!Number.isNaN(d.getTime())) return d.getTime()
  }
  return fallback
}

function formatAtLabel(isoOrLabel?: string): string | undefined {
  if (!isoOrLabel) return undefined
  const d = new Date(isoOrLabel)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  return isoOrLabel
}

function bucketForSnapshot(eventKind: VerificationSnapshot['eventKind']): EventBucket | null {
  switch (eventKind) {
    case 'aml_approve':
    case 'aml_approve_reused':
    case 'aml_reject':
    case 'aml_escalate':
      return 'aml'
    case 'aml_request_info':
    case 'cip_request_info':
      return 'clarification'
    case 'cip_approve':
    case 'cip_reject':
      return 'document'
    default:
      return null
  }
}

function labelForBucket(bucket: EventBucket, childType: ChildType): string {
  switch (bucket) {
    case 'aml':
      return 'AML Review'
    case 'clarification':
      return 'Clarification / Document Required'
    case 'document':
      return childType === 'kyc' ? 'Document Review' : 'Document Review'
    case 'principal':
      return 'Principal Review'
    case 'escalation':
      return 'Escalation / Hold'
  }
}

function collectAuditEvents(
  reviewState: ChildReviewState | undefined,
  childType: ChildType,
): TimelineAuditEvent[] {
  if (!reviewState) return []

  const deduped = new Map<string, TimelineAuditEvent>()

  const add = (event: TimelineAuditEvent) => {
    deduped.set(event.id, event)
  }

  for (const owner of Object.values(reviewState.ownerReviews ?? {})) {
    for (const snapshot of owner.verificationSnapshots ?? []) {
      if (!DISPOSITION_KINDS.has(snapshot.eventKind)) continue
      const bucket = bucketForSnapshot(snapshot.eventKind)
      if (!bucket) continue
      const message =
        snapshot.eventKind === 'aml_reject'
          ? dispositionSnapshotMessage(snapshot)
          : isMeaningfulReviewerMessage(snapshot.note)
            ? snapshot.note
            : undefined
      const dedupeKey = `${snapshot.eventKind}|${snapshot.ranAt}|${message ?? ''}`
      add({
        id: snapshot.id || dedupeKey,
        sortKey: parseSortKey(snapshot.ranAt),
        atLabel: formatAtLabel(snapshot.ranAt) ?? '',
        bucket,
        label: labelForBucket(bucket, childType),
        message,
      })
    }
  }

  if (childType === 'kyc') {
    const aml = reviewState.amlReview
    if (aml?.decidedAt && aml.status === 'cleared' && isMeaningfulReviewerMessage(aml.approvalReason)) {
      add({
        id: `legacy-aml-clear-${aml.decidedAt}`,
        sortKey: parseSortKey(aml.decidedAt),
        atLabel: formatAtLabel(aml.decidedAt) ?? '',
        bucket: 'aml',
        label: 'AML Review',
        message: aml.approvalReason,
      })
    }
    const ho = reviewState.hoKycReview
    if (ho?.decidedAt && ho.status === 'changes_requested' && isMeaningfulReviewerMessage(ho.comments)) {
      add({
        id: `legacy-ho-changes-${ho.decidedAt}`,
        sortKey: parseSortKey(ho.decidedAt),
        atLabel: formatAtLabel(ho.decidedAt) ?? '',
        bucket: 'clarification',
        label: 'Clarification / Document Required',
        message: ho.comments,
      })
    }
  } else {
    const doc = reviewState.documentReview
    if (doc?.decidedAt && doc.status === 'nigo') {
      const msg = [doc.nigoReason, doc.nigoFeedback].filter(isMeaningfulReviewerMessage).join(' — ')
      if (msg) {
        add({
          id: `legacy-doc-nigo-${doc.decidedAt}`,
          sortKey: parseSortKey(doc.decidedAt),
          atLabel: formatAtLabel(doc.decidedAt) ?? '',
          bucket: 'clarification',
          label: 'Clarification / Document Required',
          message: msg,
        })
      }
    }
    const principal = reviewState.principalReview
    if (principal?.decidedAt && principal.status === 'igo') {
      add({
        id: `legacy-principal-igo-${principal.decidedAt}`,
        sortKey: parseSortKey(principal.decidedAt),
        atLabel: formatAtLabel(principal.decidedAt) ?? '',
        bucket: 'principal',
        label: 'Principal Review',
      })
    }
    if (principal?.decidedAt && principal.status === 'nigo') {
      const msg = [principal.nigoReason, principal.nigoFeedback].filter(isMeaningfulReviewerMessage).join(' — ')
      if (msg) {
        add({
          id: `legacy-principal-nigo-${principal.decidedAt}`,
          sortKey: parseSortKey(principal.decidedAt),
          atLabel: formatAtLabel(principal.decidedAt) ?? '',
          bucket: 'clarification',
          label: 'Clarification / Document Required',
          message: msg,
        })
      }
    }
  }

  return [...deduped.values()].sort((a, b) => a.sortKey - b.sortKey)
}

function effectiveStatusMeta(
  effectiveStatus: string,
  childType: ChildType,
): { label: string; matchStatuses: string[]; bucket: EventBucket } | null {
  if (effectiveStatus === 'ao_clarification_required' || effectiveStatus === 'kyc_clarification_required') {
    return {
      label: 'Clarification / Document Required',
      matchStatuses: [effectiveStatus],
      bucket: 'clarification',
    }
  }
  if (effectiveStatus === 'aml_review_pending' || effectiveStatus === 'aml_pending' || effectiveStatus === 'aml_flagged') {
    return { label: 'AML Review', matchStatuses: [effectiveStatus], bucket: 'aml' }
  }
  if (effectiveStatus === 'doc_review_pending' || effectiveStatus === 'ho_kyc_pending') {
    return { label: 'Document Review', matchStatuses: [effectiveStatus], bucket: 'document' }
  }
  if (effectiveStatus === 'principal_review_pending') {
    return { label: 'Principal Review', matchStatuses: [effectiveStatus], bucket: 'principal' }
  }
  if (effectiveStatus === 'escalation_hold') {
    return { label: 'Escalation / Hold', matchStatuses: [effectiveStatus], bucket: 'escalation' }
  }
  if (effectiveStatus === 'complete' || effectiveStatus === 'pending_release') {
    return {
      label: childType === 'kyc' ? 'Complete' : 'Pending Release',
      matchStatuses: childType === 'kyc' ? ['complete'] : ['complete', 'pending_release'],
      bucket: 'principal',
    }
  }
  return null
}

function pipelineIndexForLabel(label: string): number {
  return ACCOUNT_PIPELINE.indexOf(label as (typeof ACCOUNT_PIPELINE)[number])
}

function sortKeyForPipelineGap(steps: TimelineDisplayStep[], pipelineIdx: number): number {
  let beforeKey = 0
  let afterKey = Number.POSITIVE_INFINITY
  for (const step of steps) {
    const idx = pipelineIndexForLabel(step.label)
    if (idx >= 0 && idx < pipelineIdx) beforeKey = Math.max(beforeKey, step.sortKey)
    if (idx >= 0 && idx > pipelineIdx) afterKey = Math.min(afterKey, step.sortKey)
  }
  if (!Number.isFinite(afterKey)) return beforeKey + 1
  return beforeKey + (afterKey - beforeKey) / 2
}

/** Fill missing AML → Document → Principal → Pending Release stages; append upcoming steps after active. */
function finalizeAccountOpeningPipelineSteps(
  steps: TimelineDisplayStep[],
  effectiveStatus: string,
  reviewState?: ChildReviewState,
): TimelineDisplayStep[] {
  const activeMeta = effectiveStatusMeta(effectiveStatus, 'account-opening')
  const activeLabel = activeMeta?.label ?? null
  const activeIdx = activeLabel ? pipelineIndexForLabel(activeLabel) : -1

  const presentIndices = new Set<number>()
  for (const step of steps) {
    const idx = pipelineIndexForLabel(step.label)
    if (idx >= 0) presentIndices.add(idx)
  }

  let throughIdx = activeIdx
  for (const idx of presentIndices) throughIdx = Math.max(throughIdx, idx)

  const result = [...steps]

  if (throughIdx >= 0 && presentIndices.size > 0) {
    const minIdx = Math.min(...presentIndices)
    for (let i = minIdx; i <= throughIdx; i++) {
      if (presentIndices.has(i)) continue
      const label = ACCOUNT_PIPELINE[i]
      const principalDone = reviewState?.principalReview?.status === 'igo'
      result.push({
        id: `pipeline-gap-${label}`,
        label,
        description: STAGE_DESCRIPTIONS[label] ?? '',
        matchStatuses: [],
        sortKey: sortKeyForPipelineGap(result, i),
        messages: [],
        atLabel:
          label === 'Principal Review' && principalDone && reviewState?.principalReview?.decidedAt
            ? `Recorded at ${formatAtLabel(reviewState.principalReview.decidedAt)}`
            : undefined,
        isClarification: false,
        isHistorical: label === 'Principal Review' && principalDone,
      })
      presentIndices.add(i)
    }
  }

  if (activeIdx >= 0) {
    let offset = 1
    const maxSort = result.reduce((m, s) => Math.max(m, s.sortKey), 0)
    for (let i = activeIdx + 1; i < ACCOUNT_PIPELINE.length; i++) {
      const label = ACCOUNT_PIPELINE[i]
      if (result.some((s) => s.label === label)) continue
      result.push({
        id: `future-pipeline-${label}`,
        label,
        description: STAGE_DESCRIPTIONS[label] ?? '',
        matchStatuses: [],
        sortKey: maxSort + offset++,
        messages: [],
        isClarification: false,
        isHistorical: false,
      })
    }
  }

  return result.sort((a, b) => a.sortKey - b.sortKey)
}

function isDocumentReReviewPass(
  reviewState: ChildReviewState,
  events: TimelineAuditEvent[],
  activeMeta: { label: string; bucket: EventBucket },
): boolean {
  return (
    activeMeta.label === 'Document Review' &&
    events.some((e) => e.bucket === 'document') &&
    reviewState.documentReview?.status === 'pending' &&
    reviewState.accountWorkflowPhase === 'document_review'
  )
}

function maxPipelineIndexFromEvents(
  events: TimelineAuditEvent[],
  effectiveStatus: string,
): number {
  let max = -1
  const bump = (label: string) => {
    const idx = ACCOUNT_PIPELINE.indexOf(label as (typeof ACCOUNT_PIPELINE)[number])
    if (idx >= 0) max = Math.max(max, idx)
  }
  for (const e of events) {
    if (e.bucket === 'aml') bump('AML Review')
    if (e.bucket === 'escalation') bump('Escalation / Hold')
    if (e.bucket === 'document') bump('Document Review')
    if (e.bucket === 'principal') bump('Principal Review')
  }
  const active = effectiveStatusMeta(effectiveStatus, 'account-opening')
  if (active?.label && ACCOUNT_PIPELINE.includes(active.label as (typeof ACCOUNT_PIPELINE)[number])) {
    bump(active.label)
  }
  return max
}

function presetPrefixSteps(
  childType: ChildType,
  reviewState: ChildReviewState | undefined,
  submitted: boolean,
): TimelineDisplayStep[] {
  const aoPre = reviewState?.accountOpeningPreReviewTimeline
  const kycPre = reviewState?.kycPreAmlTimeline
  const steps: TimelineDisplayStep[] = []

  if (childType === 'kyc') {
    steps.push({
      id: 'preset-draft',
      label: 'Draft',
      description: STAGE_DESCRIPTIONS.Draft,
      matchStatuses: ['not_started', 'in_progress'],
      sortKey: parseSortKey(kycPre?.draftAt, 0),
      messages: [],
      atLabel: kycPre?.draftAt ? `Completed at ${kycPre.draftAt} by Jane Advisor` : undefined,
      isClarification: false,
      isHistorical: Boolean(kycPre?.draftAt),
    })
    steps.push({
      id: 'preset-id-verification',
      label: 'ID Verification',
      description: STAGE_DESCRIPTIONS['ID Verification'],
      matchStatuses: [],
      sortKey: parseSortKey(kycPre?.idVerificationAt, 1),
      messages: [],
      atLabel: kycPre?.idVerificationAt ? `Completed at ${kycPre.idVerificationAt} by Jane Advisor` : undefined,
      isClarification: false,
      isHistorical: Boolean(kycPre?.idVerificationAt),
    })
    if (submitted) {
      steps.push({
        id: 'preset-submitted',
        label: 'Submitted',
        description: STAGE_DESCRIPTIONS.Submitted,
        matchStatuses: ['awaiting_review'],
        sortKey: parseSortKey(kycPre?.submittedForReviewAt, 2),
        messages: [],
        atLabel: kycPre?.submittedForReviewAt
          ? `Submitted for review at ${kycPre.submittedForReviewAt} by Jane Advisor`
          : undefined,
        isClarification: false,
        isHistorical: true,
      })
    }
    return steps
  }

  steps.push({
    id: 'preset-draft',
    label: 'Draft',
    description: STAGE_DESCRIPTIONS.Draft,
    matchStatuses: ['not_started', 'in_progress'],
    sortKey: parseSortKey(aoPre?.draftAt, 0),
    messages: [],
    atLabel: aoPre?.draftAt ? `Completed at ${aoPre.draftAt} by Jane Advisor` : undefined,
    isClarification: false,
    isHistorical: Boolean(aoPre?.draftAt),
  })
  steps.push({
    id: 'preset-client-signature',
    label: 'Client Signature',
    description: STAGE_DESCRIPTIONS['Client Signature'],
    matchStatuses: [],
    sortKey: parseSortKey(aoPre?.clientSignatureAt, 1),
    messages: [],
    atLabel: aoPre?.clientSignatureAt ? `Completed at ${aoPre.clientSignatureAt} by Jane Advisor` : undefined,
    isClarification: false,
    isHistorical: Boolean(aoPre?.clientSignatureAt),
  })
  if (submitted) {
    steps.push({
      id: 'preset-submitted',
      label: 'Awaiting Review',
      description: STAGE_DESCRIPTIONS['Awaiting Review'],
      matchStatuses: ['awaiting_review'],
      sortKey: parseSortKey(aoPre?.submittedForReviewAt, 2),
      messages: [],
      atLabel: aoPre?.submittedForReviewAt
        ? `Submitted for review at ${aoPre.submittedForReviewAt} by Jane Advisor`
        : undefined,
      isClarification: false,
      isHistorical: true,
    })
  }
  return steps
}

function liveClarificationMessages(reviewState: ChildReviewState, childType: ChildType): string[] {
  const messages: string[] = []
  const push = (text?: string) => {
    if (!isMeaningfulReviewerMessage(text)) return
    if (!messages.includes(text)) messages.push(text)
  }
  for (const owner of Object.values(reviewState.ownerReviews ?? {})) {
    if (owner.hoKycReview?.status === 'changes_requested') push(owner.hoKycReview.comments)
    if (owner.amlReview?.status === 'info_requested') push(owner.amlReview.infoRequestComments)
  }
  if (childType === 'kyc' && reviewState.hoKycReview?.status === 'changes_requested') {
    push(reviewState.hoKycReview.comments)
  }
  return messages
}

export function deriveTimelineVisitedFlags(
  childType: ChildType,
  rawStatus: string,
  effectiveStatus: string,
  reviewState?: ChildReviewState,
): TimelineVisitedFlags {
  const submitted =
    Boolean(reviewState?.accountOpeningPreReviewTimeline?.submittedForReviewAt) ||
    Boolean(reviewState?.kycPreAmlTimeline?.submittedForReviewAt) ||
    rawStatus === 'awaiting_review' ||
    rawStatus === 'rejected' ||
    effectiveStatus === 'aml_review_pending' ||
    effectiveStatus === 'doc_review_pending' ||
    effectiveStatus === 'principal_review_pending' ||
    effectiveStatus === 'pending_release' ||
    effectiveStatus === 'escalation_hold' ||
    effectiveStatus === 'complete' ||
    effectiveStatus === 'ao_clarification_required' ||
    effectiveStatus === 'kyc_clarification_required' ||
    effectiveStatus === 'aml_pending' ||
    effectiveStatus === 'aml_flagged' ||
    effectiveStatus === 'ho_kyc_pending'

  const events = collectAuditEvents(reviewState, childType)
  const clarification = events.some((e) => e.bucket === 'clarification') ||
    effectiveStatus === 'ao_clarification_required' ||
    effectiveStatus === 'kyc_clarification_required'

  const amlReview = events.some((e) => e.bucket === 'aml') ||
    effectiveStatus === 'aml_review_pending' ||
    effectiveStatus === 'aml_pending' ||
    effectiveStatus === 'aml_flagged'

  const documentReview = events.some((e) => e.bucket === 'document') ||
    effectiveStatus === 'doc_review_pending' ||
    effectiveStatus === 'ho_kyc_pending'

  const principalReview =
    childType === 'account-opening' &&
    (events.some((e) => e.bucket === 'principal') ||
      effectiveStatus === 'principal_review_pending' ||
      effectiveStatus === 'complete')

  return {
    preSubmitted: submitted || rawStatus === 'in_progress' || rawStatus === 'not_started',
    submitted,
    clarification,
    amlReview,
    documentReview,
    principalReview,
    escalationHold:
      effectiveStatus === 'escalation_hold' ||
      reviewState?.accountWorkflowPhase === 'escalation_hold' ||
      events.some((e) => e.bucket === 'escalation'),
    complete:
      effectiveStatus === 'complete' ||
      reviewState?.accountWorkflowPhase === 'complete' ||
      rawStatus === 'complete',
  }
}

/** Chronological timeline: preset steps, then audit events in order, then the live active step. */
export function buildTimelineDisplaySteps(
  childType: ChildType,
  status: string,
  effectiveStatus: string,
  reviewState?: ChildReviewState,
): TimelineDisplayStep[] {
  const visited = deriveTimelineVisitedFlags(childType, status, effectiveStatus, reviewState)
  const prefix = presetPrefixSteps(childType, reviewState, visited.submitted)
  const prefixMaxSort = prefix.reduce((m, s) => Math.max(m, s.sortKey), 0)

  const events = collectAuditEvents(reviewState, childType)
  const maxPipeline =
    childType === 'account-opening' ? maxPipelineIndexFromEvents(events, effectiveStatus) : 3

  const historical: TimelineDisplayStep[] = []
  let seq = 0
  for (const event of events) {
    if (childType === 'account-opening') {
      const pipelineIdx = ACCOUNT_PIPELINE.indexOf(
        event.label as (typeof ACCOUNT_PIPELINE)[number],
      )
      if (pipelineIdx >= 0 && pipelineIdx > maxPipeline) continue
    }

    const messages = event.message ? [event.message] : []
    historical.push({
      id: `history-${event.id}-${seq++}`,
      label: event.label,
      description: STAGE_DESCRIPTIONS[event.label] ?? '',
      matchStatuses: [],
      sortKey: Math.max(event.sortKey, prefixMaxSort + 1),
      messages,
      atLabel: event.atLabel ? `Recorded at ${event.atLabel}` : undefined,
      isClarification: event.bucket === 'clarification',
      isHistorical: true,
    })
  }

  const steps = [...prefix, ...historical]
  const activeMeta = effectiveStatusMeta(effectiveStatus, childType)
  if (activeMeta && reviewState) {
    const last = steps[steps.length - 1]
    const duplicatePipelineVisit =
      childType === 'account-opening' &&
      activeMeta.bucket !== 'clarification' &&
      last?.isHistorical &&
      last.label === activeMeta.label &&
      !isDocumentReReviewPass(reviewState, events, activeMeta)

    const needsLiveStep =
      !duplicatePipelineVisit &&
      (!last ||
        last.isHistorical ||
        last.label !== activeMeta.label ||
        !last.matchStatuses.some((s) => activeMeta.matchStatuses.includes(s)))

    if (needsLiveStep) {
      const messages =
        activeMeta.bucket === 'clarification' ? liveClarificationMessages(reviewState, childType) : []
      steps.push({
        id: `live-${activeMeta.bucket}-${Date.now()}`,
        label: activeMeta.label,
        description: STAGE_DESCRIPTIONS[activeMeta.label] ?? '',
        matchStatuses: activeMeta.matchStatuses,
        sortKey: Date.now(),
        messages,
        isClarification: activeMeta.bucket === 'clarification',
        isHistorical: false,
      })
    } else if (last && !last.isHistorical && activeMeta.bucket === 'clarification') {
      const live = liveClarificationMessages(reviewState, childType)
      if (live.length > 0) {
        last.messages = live
      }
    } else if (duplicatePipelineVisit) {
      // Stage already appears in history (e.g. Document Review completed) — attach active
      // matchStatuses to the latest historical row instead of duplicating the label.
      last.matchStatuses = activeMeta.matchStatuses
    }
  }

  if (childType === 'account-opening' && activeMeta && activeMeta.bucket !== 'clarification') {
    return finalizeAccountOpeningPipelineSteps(steps, effectiveStatus, reviewState)
  }

  return steps
}

export function getActiveDisplayStepIndex(
  steps: TimelineDisplayStep[],
  effectiveStatus: string,
): number {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].matchStatuses.includes(effectiveStatus)) return i
  }
  return Math.max(0, steps.length - 1)
}
