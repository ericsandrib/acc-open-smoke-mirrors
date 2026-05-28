import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react'
import type {
  AccountWorkflowPhase,
  Action,
  WorkflowState,
  WorkflowAction,
  Task,
  ChildTask,
  ChildReviewState,
  ChildType,
  OwnerKycReviewState,
  RelatedParty,
  TaskStatus,
} from '@/types/workflow'
import {
  actions,
  tasks,
  initialRelatedParties,
  initialFinancialAccounts,
  seedOpenAccountsAdditionalInstructions,
} from '@/data/seed'
import { seededJourneys } from '@/data/servicingSeed'
import {
  isHoDemoServicingJourneyId,
  JOHN_SMITH_ONBOARDING_JOURNEY_ID,
  JOHN_SMITH_ONBOARDING_JOURNEY_NAME,
} from '@/data/defaultOnboardingJourney'
import type { JourneyAction, JourneyStatus } from '@/types/servicing'
import {
  getChildSubTaskIds,
  getChildTypeConfig,
  getVisibleChildSubTasks,
  parseChildSubTaskId,
} from '@/utils/childTaskRegistry'
import {
  findParentTaskForChild,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import {
  getV5NoAnnuityOpenAccountsNavPageOrder,
  normalizeV5NoAnnuityPageForNav,
} from '@/utils/hideKycChildWorkflows'
import { resolveJourneyEntryTaskIdAfterInit } from '@/utils/journeyEntryTask'
import { bumpChildHighWaterMark } from '@/utils/childSubTaskProgress'
import { generateAccountOpenIdentifiers } from '@/utils/accountOpenIdentifiers'
import { accountOpeningChildNameWithAccountTail } from '@/utils/openAccountsChildRowLabel'
import {
  applyWorkflowStorageMigrations,
  readWorkflowStorageSchemaVersion,
  WORKFLOW_STORAGE_SCHEMA_KEY,
  WORKFLOW_STORAGE_SCHEMA_VERSION,
} from '@/utils/workflowStorageMigration'
import {
  collectOrphanAccountOpeningChildIds,
  stateHasRemappableDemoAccountLast4,
} from '@/utils/repairAccountOpeningChildNames'
import { demoAccountNumberForBrokerageIndex } from '@/utils/demoAccountNumberOverrides'
import { hasAccountOpeningWorkflowEvidence } from '@/utils/seededJourneyWorkflow'
import { mergeFeatureRequests } from '@/types/featureRequests'
import {
  advisorIdentitySimPassDisplay,
  getAdvisorIdentitySimDisplay,
} from '@/utils/advisorIdentityVerificationSimDisplay'
import { getKycChildIdsForSignedAccountChildren } from '@/utils/postEnvelopeSignatureAml'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import {
  applyAutoRunOwnerKycToState,
  appendOwnerVerificationSnapshot,
  buildSingleFlowAccountOpeningReviewOnSubmit,
  hydrateAccountOwnerReviewsFromExisting,
  isEmbeddedAccountOwnerKycEnabled,
  isSingleFlowKycEnabled,
  mergeOwnerReviewPatch,
  propagateOwnerReviewAcrossAccounts,
} from '@/utils/ownerKycReview'
import type { VerificationSnapshot } from '@/types/workflow'
import { hasOwnerLevelAmlFlag, isAccountInAmlEscalationQueue } from '@/utils/childStatusDisplay'
import { isMeaningfulReviewerMessage } from '@/utils/reviewerStageMessages'
import { formatStructuredReviewText } from '@/utils/formatStructuredReviewText'
import {
  applyParticipantAmlApprovalForAccount,
  invalidateParticipantVerificationForParty,
} from '@/utils/participantVerification'

function defaultOwnerCipPass(): NonNullable<ChildReviewState['cipStatus']> {
  return {
    idVerification: 'pass',
    addressMatch: 'pass',
    dobMatch: 'pass',
    overallStatus: 'pass',
  }
}

/** Append a per-owner disposition event to the audit trail. */
function appendAccountDispositionSnapshots(
  state: WorkflowState,
  accountChildId: string,
  partyIds: string[],
  base: Omit<VerificationSnapshot, 'id'>,
): WorkflowState {
  let next = state
  for (const partyId of partyIds) {
    next = appendOwnerVerificationSnapshot(next, accountChildId, partyId, base)
  }
  return next
}

/** Propagate the updated ownerReviews entries to every other account where each party appears. */
function propagateOwnersAcrossAccounts(
  state: WorkflowState,
  sourceAccountChildId: string,
  partyIds: string[],
): WorkflowState {
  let next = state
  for (const partyId of partyIds) {
    next = propagateOwnerReviewAcrossAccounts(next, sourceAccountChildId, partyId)
  }
  return next
}

/** Update child.status for a single account-opening child so parent badges stay in sync. */
function setAccountChildStatus(
  tasks: WorkflowState['tasks'],
  accountChildId: string,
  status: TaskStatus,
): WorkflowState['tasks'] {
  return tasks.map((t) => {
    if (!t.children) return t
    return {
      ...t,
      children: t.children.map((c) =>
        c.id === accountChildId && c.childType === 'account-opening' ? { ...c, status } : c,
      ),
    }
  })
}

function patchAccountOwnerReviews(
  state: WorkflowState,
  accountChildId: string,
  partyId: string,
  ownerPatch: Partial<OwnerKycReviewState>,
  accountPatch?: Partial<ChildReviewState>,
): WorkflowState['childReviewsByChildId'] {
  const prev = state.childReviewsByChildId?.[accountChildId] ?? {}
  const merged = mergeOwnerReviewPatch(prev, partyId, ownerPatch)
  return {
    ...state.childReviewsByChildId,
    [accountChildId]: { ...merged, ...accountPatch },
  }
}

/** Dev-only simulation keys must not be persisted with workflow localStorage. */
function stripAdvisorIdentityDemoSimulationForStorage(state: WorkflowState): WorkflowState {
  const reviews = state.childReviewsByChildId
  if (!reviews) return state
  let touched = false
  const nextReviews = { ...reviews }
  for (const key of Object.keys(nextReviews)) {
    const rev = nextReviews[key]
    if (rev?.demoAdvisorIdentitySimulation != null) {
      touched = true
      const copy = { ...rev }
      delete copy.demoAdvisorIdentitySimulation
      nextReviews[key] = copy
    }
  }
  return touched ? { ...state, childReviewsByChildId: nextReviews } : state
}

export function getChildReviewState(state: WorkflowState, childId: string | undefined): ChildReviewState | undefined {
  if (!childId) return undefined
  return state.childReviewsByChildId?.[childId]
}

export function getChildReviewDecision(state: WorkflowState, childId: string | undefined) {
  if (!childId) return undefined
  return state.childReviewDecisionsByChildId?.[childId]
}

let childIdCounter = 0

function buildKycPreAmlTimeline(): NonNullable<ChildReviewState['kycPreAmlTimeline']> {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const now = Date.now()
  return {
    draftAt: fmt(new Date(now - 5 * 60 * 1000)),
    idVerificationAt: fmt(new Date(now - 3 * 60 * 1000)),
    submittedForReviewAt: fmt(new Date(now)),
  }
}

function buildAccountOpeningPreReviewTimeline(): NonNullable<ChildReviewState['accountOpeningPreReviewTimeline']> {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const now = Date.now()
  return {
    draftAt: fmt(new Date(now - 8 * 60 * 1000)),
    clientSignatureAt: fmt(new Date(now - 5 * 60 * 1000)),
    submittedForReviewAt: fmt(new Date(now)),
  }
}

/** Sets `lastAmlRunAt` on the KYC subject when AML screening is cleared (local calendar date, YYYY-MM-DD). */
function stampLastAmlRunForKycChild(state: WorkflowState, childId: string): WorkflowState['relatedParties'] | null {
  const child = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === childId)
  if (!child || child.childType !== 'kyc') return null
  const meta = state.taskData[childId] as Record<string, unknown> | undefined
  const partyId = meta?.kycSubjectPartyId as string | undefined
  if (!partyId) return null
  const n = new Date()
  const isoDate = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  return state.relatedParties.map((p) => (p.id === partyId ? { ...p, lastAmlRunAt: isoDate } : p))
}

/** Account HO demo views — preserved when drilling into account-opening family children. */
const ACCOUNT_HO_DEMO_VIEW_MODES = new Set(['ho-documents', 'ho-principal'])

function sanitizeDemoViewModeForChild(
  mode: WorkflowState['demoViewMode'] | undefined,
  childType: ChildType | undefined,
): WorkflowState['demoViewMode'] | undefined {
  if (childType == null || mode == null) return mode
  /** Legacy sessions: Principal KYC reviewer tab removed — map to Document Review (ho-kyc) or advisor. */
  if ((mode as string) === 'ho-principal-kyc') {
    return childType === 'kyc' ? 'ho-kyc' : 'advisor'
  }
  if (childType === 'kyc') {
    /** Account-opening HO lanes map to the KYC document-review shell; keep principal label in the demo card. */
    if (mode === 'ho-documents') return 'ho-kyc'
    if (mode === 'ho-principal') return 'ho-principal'
    return mode
  }
  if (
    childType === 'account-opening' ||
    childType === 'funding-line' ||
    childType === 'feature-service-line'
  ) {
    if (ACCOUNT_HO_DEMO_VIEW_MODES.has(mode)) return mode
    /** KYC document-review lane → account document-review lane (not advisor). */
    if (mode === 'ho-kyc') return 'ho-documents'
    // Single-flow KYC: AML team operates on account-opening children too, so preserve the
    // AML view when drilling into the child. Legacy behavior mapped 'aml' → 'advisor'.
    if (mode === 'aml' && isEmbeddedAccountOwnerKycEnabled()) return 'aml'
    if (mode === 'aml') return 'advisor'
    return mode
  }
  return mode
}

function computeFlatTaskOrder(allTasks: Task[], allActions: readonly Action[]): string[] {
  const order: string[] = []
  const sortedActions = [...allActions].sort((a, b) => a.order - b.order)

  for (const action of sortedActions) {
    const actionTasks = allTasks
      .filter((t) => t.actionId === action.id)
      .sort((a, b) => a.order - b.order)

    for (const task of actionTasks) {
      order.push(task.id)
    }
  }

  return order
}

const initialState: WorkflowState = {
  actions,
  tasks: tasks.map((t) => ({
    ...t,
    children: t.children ? [...t.children] : undefined,
    status: 'in_progress' as const,
    unread: true,
    edited: false,
  })),
  relatedParties: [...initialRelatedParties],
  financialAccounts: [...initialFinancialAccounts],
  activeTaskId: tasks[0].id,
  flatTaskOrder: computeFlatTaskOrder(tasks, actions),
  taskData: {
    'open-accounts': {
      additionalInstructions: seedOpenAccountsAdditionalInstructions,
    },
  },
  submittedTaskIds: [],
  ...(() => {
    const journeyDue = new Date(2026, 9, 8)
    return {
      journeyDueAt: journeyDue.toISOString(),
      journeyDateLabel: journeyDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })(),
  assignedTo: 'Sarah Chen',
  journeyId: JOHN_SMITH_ONBOARDING_JOURNEY_ID,
  journeyName: JOHN_SMITH_ONBOARDING_JOURNEY_NAME,
  journeyStartedAt: '2026-05-15T12:00:00.000Z',
  v5NoAnnuityOpenAccountsPage: null,
  v6IncludeAnnuityAccounts: false,
}

function isJohnSmithPrimaryHousehold(state: WorkflowState): boolean {
  const primary =
    state.relatedParties.find((p) => p.isPrimary) ??
    state.relatedParties.find((p) => p.type === 'household_member') ??
    state.relatedParties[0]
  if (!primary) return false
  if (primary.id === 'member-1') return true
  const name = `${primary.firstName ?? ''} ${primary.lastName ?? ''}`.trim() || primary.name
  return name.toLowerCase() === 'john smith'
}

/**
 * Stale localStorage sometimes kept a Document Review demo `journeyId` while related parties
 * still reflected the default John Smith household — the onboarding list then showed John Smith
 * in Relationship but opened the wrong journey template on click.
 */
function repairJohnSmithDefaultJourney(state: WorkflowState): WorkflowState {
  if (!isJohnSmithPrimaryHousehold(state)) return state
  if (state.journeyId === JOHN_SMITH_ONBOARDING_JOURNEY_ID) return state
  if (state.journeyId && !isHoDemoServicingJourneyId(state.journeyId)) return state
  return {
    ...state,
    journeyId: JOHN_SMITH_ONBOARDING_JOURNEY_ID,
    journeyName: JOHN_SMITH_ONBOARDING_JOURNEY_NAME,
    journeyStartedAt: state.journeyStartedAt ?? '2026-05-15T12:00:00.000Z',
  }
}

const WORKFLOW_STORAGE_KEY = 'demo-workflow-state'

function getInitialWorkflowState(): WorkflowState {
  if (typeof window === 'undefined') return initialState
  try {
    const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as WorkflowState
    if (
      !parsed ||
      !Array.isArray(parsed.actions) ||
      !Array.isArray(parsed.tasks) ||
      typeof parsed.activeTaskId !== 'string'
    ) {
      return initialState
    }
    const variant = getPersistedOpenAccountsVariant()
    const merged: WorkflowState = {
      ...parsed,
      /**
       * v6: always start with No for the annuity gate on each page load (ignore stale localStorage).
       * Other variants: only explicit `true` in storage selects Yes.
       */
      v6IncludeAnnuityAccounts:
        variant === 'v6' ? false : parsed.v6IncludeAnnuityAccounts === true,
      /** Recompute so split-journey tasks (e.g. `open-accounts-annuity`) are never missing vs stale `flatTaskOrder`. */
      flatTaskOrder: computeFlatTaskOrder(parsed.tasks, parsed.actions),
    }
    const rehydrated = rehydrateOpenAccountsChildrenForServicingSeedJourney(merged)
    const repairedJourney = repairJohnSmithDefaultJourney(rehydrated)
    const migrated = applyWorkflowStorageMigrations(repairedJourney)
    const normalized = normalizeV6AnnuityActiveTask(migrated)
    const finalState: WorkflowState = {
      ...normalized,
      flatTaskOrder: computeFlatTaskOrder(normalized.tasks, normalized.actions),
    }
    const countAccountChildren = (s: WorkflowState) =>
      s.tasks
        .filter((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
        .reduce(
          (n, t) => n + (t.children?.filter((c) => c.childType === 'account-opening').length ?? 0),
          0,
        )
    const restoredAccounts =
      countAccountChildren(finalState) > countAccountChildren(parsed)
    const remappedAccountNumbers = stateHasRemappableDemoAccountLast4(parsed)
    const storedSchemaVersion = readWorkflowStorageSchemaVersion()
    if (
      storedSchemaVersion < WORKFLOW_STORAGE_SCHEMA_VERSION ||
      restoredAccounts ||
      remappedAccountNumbers
    ) {
      const storable = stripAdvisorIdentityDemoSimulationForStorage(finalState)
      window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(storable))
      window.localStorage.setItem(
        WORKFLOW_STORAGE_SCHEMA_KEY,
        String(WORKFLOW_STORAGE_SCHEMA_VERSION),
      )
    }
    return finalState
  } catch {
    return initialState
  }
}

function markTaskEdited(allTasks: Task[], formKey: string): Task[] {
  return allTasks.map((t) => (t.formKey === formKey ? { ...t, edited: true } : t))
}

type V5NoAnnuityPage = 'instructions' | 'kyc' | 'documents' | 'envelopes'

/** Account Opening demo is locked to v6; ignore stored variant for workflow behavior. */
function getPersistedOpenAccountsVariant(): 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' {
  return 'v6'
}

function isSplitOpenAccountsJourney(state: WorkflowState): boolean {
  return (
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  )
}

function shouldSkipAnnuityTaskInV6Split(): boolean {
  return false
}

function nextVisibleFlatTaskId(state: WorkflowState, fromTaskId: string): string | null {
  const idx = state.flatTaskOrder.indexOf(fromTaskId)
  if (idx < 0) return null
  for (let i = idx + 1; i < state.flatTaskOrder.length; i++) {
    const id = state.flatTaskOrder[i]
    if (!shouldSkipAnnuityTaskInV6Split()) return id
  }
  return null
}

function prevVisibleFlatTaskId(state: WorkflowState, fromTaskId: string): string | null {
  const idx = state.flatTaskOrder.indexOf(fromTaskId)
  if (idx <= 0) return null
  for (let i = idx - 1; i >= 0; i--) {
    const id = state.flatTaskOrder[i]
    if (!shouldSkipAnnuityTaskInV6Split()) return id
  }
  return null
}

/** Next task in flat order, skipping the v6 hidden annuity task when applicable. */
export function getNextVisibleFlatTaskId(state: WorkflowState): string | null {
  return nextVisibleFlatTaskId(state, state.activeTaskId)
}

function redirectActiveIfV6AnnuityHidden(state: WorkflowState, taskId: string): string {
  if (!shouldSkipAnnuityTaskInV6Split()) return taskId
  const noAnnuity = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  return noAnnuity?.id ?? taskId
}

function normalizeV6AnnuityActiveTask(state: WorkflowState): WorkflowState {
  return state
}

function journeyStatusToTaskStatus(s: JourneyStatus): TaskStatus {
  switch (s) {
    case 'cancelled':
      return 'canceled'
    case 'complete':
    case 'in_progress':
    case 'not_started':
    case 'awaiting_review':
    case 'rejected':
      return s
    default:
      return 'in_progress'
  }
}

function findServicingGrandchildren(journeyId: string | undefined): JourneyAction[] {
  if (!journeyId) return []
  const j = seededJourneys.find((x) => x.id === journeyId)
  if (!j) return []
  return j.actions.filter(
    (a) =>
      Boolean(a.childId) &&
      Boolean(a.parentActionId) &&
      (a.parentActionId!.endsWith('-kyc-child-actions') ||
        a.parentActionId!.endsWith('-account-opening-child')),
  )
}

/**
 * Queue/table opens use {@link INITIALIZE_FROM_RELATIONSHIP}, which clears task `children` before
 * this helper runs.
 *
 * When the journey exists in {@link seededJourneys} with nested servicing actions that carry
 * {@link JourneyAction.childId}, those lines are copied onto the in-app (non-annuity) Open Accounts
 * task so `?childId=` deep links from the Document Review table resolve via {@link ENTER_CHILD_ACTION}.
 *
 * For journeys **not** in that seed (e.g. a newly created onboarding relationship), Open Accounts
 * starts with **no** child workflows until the advisor adds accounts from the picker.
 */
function seedDemoOpenAccountsChildrenForRelationshipInit(
  tasks: Task[],
  relatedParties: RelatedParty[],
  journeyId?: string,
): { tasks: Task[]; taskDataPatch: Record<string, Record<string, unknown>> } {
  const primary =
    relatedParties.find((p) => p.isPrimary) ??
    relatedParties.find((p) => p.type === 'household_member') ??
    relatedParties[0]
  const partyId = primary?.id ?? 'member-1'
  const kycSubjectType = primary?.type === 'related_organization' ? 'entity' : 'individual'

  const slug = (journeyId ?? 'seed').replace(/[^a-zA-Z0-9]+/g, '-')
  const acctCfg = getChildTypeConfig('account-opening')
  const taskDataPatch: Record<string, Record<string, unknown>> = {}

  const servicingGrandchildren = findServicingGrandchildren(journeyId)

  const buildNonAnnuityChildren = (): ChildTask[] => {
    if (servicingGrandchildren.length > 0) {
      for (const a of servicingGrandchildren) {
        const cid = a.childId!
        const isKyc = a.parentActionId!.endsWith('-kyc-child-actions')
        if (isKyc) {
          taskDataPatch[cid] = {
            kycSubjectPartyId: partyId,
            kycSubjectType,
          }
        } else {
          const gen = generateAccountOpenIdentifiers(a.title, cid)
          taskDataPatch[cid] = {
            accountNumber: gen.accountNumber,
            shortName: gen.shortName,
            featureRequests: mergeFeatureRequests(undefined),
          }
        }
      }
      return servicingGrandchildren.map((a) => {
        const isKyc = a.parentActionId!.endsWith('-kyc-child-actions')
        const cfg = getChildTypeConfig(isKyc ? 'kyc' : 'account-opening')
        return {
          id: a.childId!,
          name: a.title,
          status: journeyStatusToTaskStatus(a.status),
          formKey: cfg.idPrefix,
          childType: isKyc ? 'kyc' : 'account-opening',
        }
      })
    }

    return []
  }

  const nonAnnuityChildren = buildNonAnnuityChildren()

  const next = tasks.map((t) => {
    if (t.formKey === OPEN_ACCOUNTS_FORM_KEY) {
      return {
        ...t,
        children: nonAnnuityChildren,
      }
    }
    if (t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) {
      const existing = t.children ?? []
      if (existing.some((c) => c.childType === 'account-opening')) return t
      if (servicingGrandchildren.length === 0) {
        return { ...t, children: [] }
      }
      const acctChildId = `${acctCfg.idPrefix}-annuity-rel-${slug}`
      const gen = generateAccountOpenIdentifiers('Annuity contract account', acctChildId)
      taskDataPatch[acctChildId] = {
        accountNumber: gen.accountNumber,
        shortName: gen.shortName,
        featureRequests: mergeFeatureRequests(undefined),
      }
      return {
        ...t,
        children: [
          {
            id: acctChildId,
            name: 'Annuity contract account',
            status: 'not_started' as const,
            formKey: acctCfg.idPrefix,
            childType: 'account-opening' as const,
          },
        ],
      }
    }
    return t
  })

  return { tasks: next, taskDataPatch }
}

/**
 * Some refreshes left Open Accounts with no `children` while `journeyId` still matches a servicing
 * document-review seed (nested KYC / account lines). Graft children + taskData from the same helper
 * used at journey init so AML/KYC rows resolve again.
 */
function rehydrateOpenAccountsChildrenForServicingSeedJourney(state: WorkflowState): WorkflowState {
  const journeyId = state.journeyId
  if (!journeyId) return state
  if (findServicingGrandchildren(journeyId).length === 0) return state

  const openTask = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  if (!openTask || (openTask.children?.length ?? 0) > 0) return state

  const { tasks, taskDataPatch } = seedDemoOpenAccountsChildrenForRelationshipInit(
    state.tasks,
    state.relatedParties,
    journeyId,
  )
  return {
    ...state,
    tasks,
    taskData: { ...state.taskData, ...taskDataPatch },
    flatTaskOrder: computeFlatTaskOrder(tasks, state.actions),
  }
}

function nextV5NoAnnuityPageForActiveTask(
  state: WorkflowState,
  newTaskId: string,
  opts?: { enteringOpenAccountsFromAnnuity?: boolean },
): V5NoAnnuityPage | null {
  const variant = getPersistedOpenAccountsVariant()
  if (variant !== 'v5' && variant !== 'v6') {
    return null
  }
  const task = state.tasks.find((t) => t.id === newTaskId)
  if (!task) return null
  if (task.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) return null
  if (task.formKey !== OPEN_ACCOUNTS_FORM_KEY) return null
  if (opts?.enteringOpenAccountsFromAnnuity) return 'envelopes'
  return state.v5NoAnnuityOpenAccountsPage ?? 'instructions'
}

function findActiveChild(state: WorkflowState): ChildTask | undefined {
  if (!state.activeChildActionId) return undefined
  return state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)
}

/** Keep sidebar + main pane aligned when reviewer demo mode changes (suffix-based). */
function remapChildSubTaskIndexForDemoView(
  state: WorkflowState,
  nextDemoViewMode: WorkflowState['demoViewMode'],
): number | undefined {
  const child = findActiveChild(state)
  if (!child) return undefined

  const phase =
    child.childType === 'account-opening'
      ? state.childReviewsByChildId?.[child.id]?.accountWorkflowPhase
      : undefined
  const nextVisible = getVisibleChildSubTasks(child.childType, nextDemoViewMode, child.status, {
    accountWorkflowPhase: phase,
  })
  if (nextVisible.length === 0) return undefined

  const prevVisible = getVisibleChildSubTasks(child.childType, state.demoViewMode, child.status, {
    accountWorkflowPhase: phase,
  })
  const raw = state.activeChildSubTaskIndex ?? 0
  const clampedPrev = Math.min(Math.max(0, raw), Math.max(prevVisible.length - 1, 0))
  const suffix = prevVisible[clampedPrev]?.suffix

  let idx = suffix != null ? nextVisible.findIndex((s) => s.suffix === suffix) : clampedPrev
  if (idx < 0) {
    if (suffix === 'aml-review' || suffix === 'aml-results') {
      const supportingIdx = nextVisible.findIndex((s) => s.suffix === 'supporting-documents')
      idx = supportingIdx >= 0 ? supportingIdx : 0
    } else if (suffix === 'documents-review' || suffix === 'supporting-documents') {
      const targetSuffix =
        nextDemoViewMode === 'aml'
          ? 'supporting-documents'
          : nextDemoViewMode === 'ho-principal'
            ? 'account-owners'
            : 'forms-package'
      const docIdx = nextVisible.findIndex((s) => s.suffix === targetSuffix)
      idx = docIdx >= 0 ? docIdx : 0
    } else if (nextDemoViewMode === 'aml' && child.childType === 'account-opening') {
      const amlIdx = nextVisible.findIndex((s) => s.suffix === 'aml-review')
      idx = amlIdx >= 0 ? amlIdx : 0
    } else {
      idx = Math.min(clampedPrev, nextVisible.length - 1)
    }
  }

  return Math.min(Math.max(0, idx), nextVisible.length - 1)
}

function clampChildSubTaskIndex(state: WorkflowState, index: number): number | undefined {
  const child = findActiveChild(state)
  if (!child) return undefined
  const phase =
    child.childType === 'account-opening'
      ? state.childReviewsByChildId?.[child.id]?.accountWorkflowPhase
      : undefined
  const visible = getVisibleChildSubTasks(child.childType, state.demoViewMode, child.status, {
    accountWorkflowPhase: phase,
  })
  if (visible.length === 0) return undefined
  return Math.min(Math.max(0, index), visible.length - 1)
}

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_ACTIVE_TASK': {
      const redirectedId = redirectActiveIfV6AnnuityHidden(state, action.taskId)
      const blockedAnnuityNavigation =
        redirectedId !== action.taskId &&
        state.tasks.find((t) => t.id === action.taskId)?.formKey ===
          OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
      const taskInGraph = state.tasks.some((t) => t.id === redirectedId)
      if (!taskInGraph) return state
      const reconciledOrder = computeFlatTaskOrder(state.tasks, state.actions)
      if (!reconciledOrder.includes(redirectedId)) return state
      const newTasks = state.tasks.map((t) =>
        t.id === redirectedId ? { ...t, unread: false } : t
      )
      return {
        ...state,
        activeTaskId: redirectedId,
        tasks: newTasks,
        flatTaskOrder: reconciledOrder,
        /** Match {@link GO_TO_TASK}: picking a top-level journey task always exits a child workflow. */
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
        /** v6: do not set {@link WorkflowState.v6IncludeAnnuityAccounts} here — the annuity-order task defaults to No until the advisor chooses Yes in {@link OpenAccountsForm}. */
        v5NoAnnuityOpenAccountsPage: blockedAnnuityNavigation
          ? 'envelopes'
          : nextV5NoAnnuityPageForActiveTask(state, redirectedId),
      }
    }

    case 'SET_V5_NO_ANNUITY_OPEN_ACCOUNTS_PAGE': {
      return { ...state, v5NoAnnuityOpenAccountsPage: action.page }
    }

    case 'SET_V6_INCLUDE_ANNUITY_ACCOUNTS': {
      return { ...state, v6IncludeAnnuityAccounts: action.include === true }
    }

    case 'FOCUS_PARENT_TASK_SECTION': {
      return { ...state, parentSectionFocusId: action.sectionId }
    }

    case 'CLEAR_PARENT_SECTION_FOCUS': {
      if (state.parentSectionFocusId == null) return state
      return { ...state, parentSectionFocusId: undefined }
    }

    case 'FOCUS_OWNER_FIELDS': {
      return {
        ...state,
        ownerFieldFocus: {
          accountChildId: action.accountChildId,
          partyId: action.partyId,
          fieldHint: action.fieldHint,
          requestedAt: new Date().toISOString(),
        },
      }
    }

    case 'CLEAR_OWNER_FIELD_FOCUS': {
      if (!state.ownerFieldFocus) return state
      return { ...state, ownerFieldFocus: undefined }
    }

    case 'GO_TO_TASK': {
      const redirectedId = redirectActiveIfV6AnnuityHidden(state, action.taskId)
      const blockedAnnuityNavigation =
        redirectedId !== action.taskId &&
        state.tasks.find((t) => t.id === action.taskId)?.formKey ===
          OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
      if (!state.tasks.some((t) => t.id === redirectedId)) return state
      const reconciledGoOrder = computeFlatTaskOrder(state.tasks, state.actions)
      if (!reconciledGoOrder.includes(redirectedId)) return state
      const goToTasks = state.tasks.map((t) =>
        t.id === redirectedId ? { ...t, unread: false } : t
      )
      return {
        ...state,
        activeTaskId: redirectedId,
        tasks: goToTasks,
        flatTaskOrder: reconciledGoOrder,
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
        v5NoAnnuityOpenAccountsPage: blockedAnnuityNavigation
          ? 'envelopes'
          : nextV5NoAnnuityPageForActiveTask(state, redirectedId),
      }
    }

    case 'SET_TASK_STATUS': {
      const parsed = parseChildSubTaskId(action.taskId)
      const childId = parsed?.childId ?? action.taskId
      const newTasks = state.tasks.map((t) => {
        if (t.id === childId) {
          return { ...t, status: action.status }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === childId ? { ...c, status: action.status } : c
          )
          return { ...t, children: newChildren }
        }
        return t
      })
      return { ...state, tasks: newTasks }
    }

    case 'SET_CHILD_TASK_STATUS': {
      const newTasks = state.tasks.map((t) => {
        if (!t.children) return t
        const newChildren = t.children.map((c) =>
          c.id === action.childId ? { ...c, status: action.status } : c,
        )
        return { ...t, children: newChildren }
      })
      return { ...state, tasks: newTasks }
    }

    case 'CONFIRM_TASK': {
      const newSubmitted = state.submittedTaskIds.includes(action.taskId)
        ? state.submittedTaskIds
        : [...state.submittedTaskIds, action.taskId]

      // Last task in journey flat order (Open Accounts) completes the onboarding submission
      const lastTaskId = state.flatTaskOrder[state.flatTaskOrder.length - 1]
      const isFinalTask = action.taskId === lastTaskId

      if (isFinalTask) {
        // Journey complete — transition all tasks to awaiting_review
        const newTasks = state.tasks.map((t) => {
          const updatedTask = { ...t, status: 'awaiting_review' as const }
          if (updatedTask.children) {
            const newChildren = updatedTask.children.map((c) => ({
              ...c,
              status: 'awaiting_review' as const,
            }))
            return { ...updatedTask, children: newChildren }
          }
          return updatedTask
        })
        return {
          ...state,
          tasks: newTasks,
          submittedTaskIds: [],
          reviewState: {
            reviewStatus: 'pending',
            assignedTo: 'Home Office Review Team',
          },
          submittedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          demoViewMode: 'advisor',
        }
      }

      // Not the final task — just record the submission
      return { ...state, submittedTaskIds: newSubmitted }
    }

    case 'REOPEN_TASK': {
      const parsedReopen = parseChildSubTaskId(action.taskId)
      const reopenChildId = parsedReopen?.childId ?? action.taskId
      const newTasks = state.tasks.map((t) => {
        if (t.id === reopenChildId && t.status === 'complete') {
          return { ...t, status: 'in_progress' as const }
        }
        if (t.children) {
          const newChildren = t.children.map((c) =>
            c.id === reopenChildId && c.status === 'complete'
              ? { ...c, status: 'in_progress' as const }
              : c
          )
          return { ...t, children: newChildren }
        }
        return t
      })
      return {
        ...state,
        tasks: newTasks,
        submittedTaskIds: state.submittedTaskIds.filter((id) => id !== action.taskId),
      }
    }

    case 'SYNC_SEEDED_JOURNEY_METADATA': {
      return {
        ...state,
        journeyId: action.journeyId,
        journeyName: action.journeyName,
        ...(action.assignedTo != null ? { assignedTo: action.assignedTo } : {}),
      }
    }

    case 'SET_JOURNEY_ASSIGNEE': {
      const newTasks = state.tasks.map((t) => ({
        ...t,
        assignedTo: action.assignee,
      }))
      return { ...state, tasks: newTasks, assignedTo: action.assignee }
    }

    case 'SET_TASKS_ASSIGNEE': {
      const idSet = new Set(action.taskIds)
      const newTasks = state.tasks.map((t) =>
        idSet.has(t.id) ? { ...t, assignedTo: action.assignee } : t,
      )
      return { ...state, tasks: newTasks }
    }

    case 'RESTORE_ASSIGNEE_SNAPSHOT': {
      const newTasks = state.tasks.map((t) =>
        action.taskAssignees[t.id] != null
          ? { ...t, assignedTo: action.taskAssignees[t.id] }
          : t,
      )
      return { ...state, tasks: newTasks, assignedTo: action.journeyAssignee }
    }

    case 'SPAWN_CHILD': {
      const config = getChildTypeConfig(action.childType)
      let spawnedChildId = ''
      let spawnedAccountGen: ReturnType<typeof generateAccountOpenIdentifiers> | undefined
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId) {
          const priorChildren = t.children ?? []
          const childId = `${config.idPrefix}-${Date.now()}-${++childIdCounter}`
          spawnedChildId = childId
          let childName = action.childName
          if (action.childType === 'account-opening') {
            const parentTask = state.tasks.find((t) => t.id === action.parentTaskId)
            const priorBrokerage = priorChildren.filter(
              (c) =>
                c.childType === 'account-opening' && !c.name.includes(' - Annuity'),
            ).length
            spawnedAccountGen = generateAccountOpenIdentifiers(action.childName, childId)
            if (parentTask?.formKey === OPEN_ACCOUNTS_FORM_KEY) {
              spawnedAccountGen = {
                ...spawnedAccountGen,
                accountNumber: demoAccountNumberForBrokerageIndex(priorBrokerage),
              }
            }
            childName = accountOpeningChildNameWithAccountTail(
              action.childName,
              spawnedAccountGen.accountNumber,
            )
          }
          return {
            ...t,
            edited: true,
            children: [
              ...priorChildren,
              {
                id: childId,
                name: childName,
                status: 'not_started' as const,
                formKey: config.idPrefix,
                childType: action.childType,
              },
            ],
          }
        }
        return t
      })
      const newOrder = computeFlatTaskOrder(newTasks, state.actions)
      let newTaskData = state.taskData
      if (spawnedChildId) {
        const merged = {
          ...(state.taskData[spawnedChildId] ?? {}),
          ...(action.metadata ?? {}),
        }
        if (action.childType === 'account-opening' && spawnedAccountGen) {
          merged.accountNumber =
            (merged.accountNumber as string | undefined) ?? spawnedAccountGen.accountNumber
          merged.shortName = (merged.shortName as string | undefined) ?? spawnedAccountGen.shortName
          merged.featureRequests = mergeFeatureRequests(merged.featureRequests)
          newTaskData = { ...state.taskData, [spawnedChildId]: merged }
        } else {
          newTaskData = { ...state.taskData, [spawnedChildId]: merged }
        }
      }
      const next: WorkflowState = { ...state, tasks: newTasks, flatTaskOrder: newOrder, taskData: newTaskData }
      // KYC is intentionally NOT auto-run on account spawn — it triggers only when the
      // advisor sends the forms package envelope.
      return next
    }

    case 'SPAWN_AND_ENTER_CHILD': {
      const spawnConfig = getChildTypeConfig(action.childType)
      let newChildId = ''
      let newChildName = action.childName
      const spawnTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId) {
          const priorChildren = t.children ?? []
          const childId = `${spawnConfig.idPrefix}-${Date.now()}-${++childIdCounter}`
          newChildId = childId
          if (action.childType === 'account-opening') {
            const gen = generateAccountOpenIdentifiers(action.childName, childId)
            newChildName = accountOpeningChildNameWithAccountTail(action.childName, gen.accountNumber)
          }
          return {
            ...t,
            edited: true,
            children: [
              ...priorChildren,
              {
                id: childId,
                name: newChildName,
                status: 'not_started' as const,
                formKey: spawnConfig.idPrefix,
                childType: action.childType,
              },
            ],
          }
        }
        return t
      })
      const spawnOrder = computeFlatTaskOrder(spawnTasks, state.actions)
      const spawnHwm = { ...(state.childHighWaterMark ?? {}), [newChildId]: 0 }
      let spawnTaskData = state.taskData
      if (newChildId && action.childType === 'account-opening') {
        const gen = generateAccountOpenIdentifiers(action.childName, newChildId)
        const merged = {
          ...(state.taskData[newChildId] ?? {}),
          accountNumber: gen.accountNumber,
          shortName: gen.shortName,
          featureRequests: mergeFeatureRequests(
            (state.taskData[newChildId] as Record<string, unknown> | undefined)?.featureRequests,
          ),
        }
        spawnTaskData = { ...state.taskData, [newChildId]: merged }
      }
      const next: WorkflowState = {
        ...state,
        tasks: spawnTasks,
        flatTaskOrder: spawnOrder,
        taskData: spawnTaskData,
        activeChildActionId: newChildId,
        activeChildSubTaskIndex: 0,
        demoViewMode: sanitizeDemoViewModeForChild(state.demoViewMode ?? 'advisor', action.childType),
        childHighWaterMark: spawnHwm,
      }
      // KYC is intentionally NOT auto-run on spawn-and-enter — it triggers only when
      // the advisor sends the forms package envelope.
      return next
    }

    case 'REMOVE_CHILD': {
      let removedChildType: import('@/types/workflow').ChildType | null = null
      const newTasks = state.tasks.map((t) => {
        if (t.id === action.parentTaskId && t.children) {
          const child = t.children.find((c) => c.id === action.childId)
          if (child) removedChildType = child.childType
          return {
            ...t,
            edited: true,
            children: t.children.filter((c) => c.id !== action.childId),
          }
        }
        return t
      })
      const newOrder = computeFlatTaskOrder(newTasks, state.actions)
      const activeStillExists = newOrder.includes(state.activeTaskId)
      // Clean up all sub-task data keys for the removed child
      const remainingTaskData = { ...state.taskData }
      if (removedChildType) {
        const subTaskIds = getChildSubTaskIds(action.childId, removedChildType)
        for (const id of subTaskIds) {
          delete remainingTaskData[id]
        }
        delete remainingTaskData[action.childId]
      }
      const removedWasActiveChild = state.activeChildActionId === action.childId
      return {
        ...state,
        tasks: newTasks,
        flatTaskOrder: newOrder,
        activeTaskId: activeStillExists ? state.activeTaskId : action.parentTaskId,
        taskData: remainingTaskData,
        ...(removedWasActiveChild
          ? {
              activeChildActionId: undefined,
              activeChildSubTaskIndex: undefined,
              childActionResume: undefined,
            }
          : {}),
      }
    }

    case 'ADD_RELATED_PARTY': {
      return {
        ...state,
        relatedParties: [...state.relatedParties, action.party],
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'UPDATE_RELATED_PARTY': {
      // KYC is intentionally NOT auto-re-run when party fields change. Reviewers re-run
      // explicitly via the AML / CIP review task's "Re-run" action; advisors re-run on
      // envelope send. Identity changes invalidate reusable participant AML dispositions.
      const withParty = {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.id === action.partyId ? { ...p, ...action.updates } : p,
        ),
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
      return invalidateParticipantVerificationForParty(withParty, action.partyId, action.updates)
    }

    case 'SET_PRIMARY_MEMBER': {
      const target = state.relatedParties.find((p) => p.id === action.partyId)
      if (!target || target.type !== 'household_member') return state
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.type === 'household_member'
            ? { ...p, isPrimary: p.id === action.partyId }
            : p
        ),
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'REMOVE_RELATED_PARTY': {
      const party = state.relatedParties.find((p) => p.id === action.partyId)
      if (party?.isPrimary) return state
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          p.id === action.partyId ? { ...p, isHidden: true } : p
        ),
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'RESTORE_RELATED_PARTIES': {
      return {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          action.partyIds.includes(p.id) ? { ...p, isHidden: false } : p
        ),
        tasks: markTaskEdited(state.tasks, 'related-parties'),
      }
    }

    case 'ADD_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: [...state.financialAccounts, action.account],
        tasks: markTaskEdited(state.tasks, 'existing-accounts'),
      }
    }

    case 'UPDATE_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: state.financialAccounts.map((a) =>
          a.id === action.accountId ? { ...a, ...action.updates } : a
        ),
        tasks: markTaskEdited(state.tasks, 'existing-accounts'),
      }
    }

    case 'REMOVE_FINANCIAL_ACCOUNT': {
      return {
        ...state,
        financialAccounts: state.financialAccounts.filter((a) => a.id !== action.accountId),
        tasks: markTaskEdited(state.tasks, 'existing-accounts'),
      }
    }

    case 'SET_TASK_DATA': {
      const parsedData = parseChildSubTaskId(action.taskId)
      const dataChildId = parsedData?.childId ?? action.taskId
      const newTasks = state.tasks.map((t) => {
        // Direct task match — mark edited
        if (t.id === dataChildId) {
          return { ...t, edited: true }
        }
        // Child match — mark parent edited + transition child not_started → in_progress
        if (t.children) {
          const hasChild = t.children.some((c) => c.id === dataChildId)
          const newChildren = t.children.map((c) =>
            c.id === dataChildId && c.status === 'not_started'
              ? { ...c, status: 'in_progress' as const }
              : c
          )
          return hasChild
            ? { ...t, edited: true, children: newChildren }
            : { ...t, children: newChildren }
        }
        return t
      })
      let next: WorkflowState = {
        ...state,
        tasks: newTasks,
        taskData: {
          ...state.taskData,
          [action.taskId]: {
            ...state.taskData[action.taskId],
            ...action.fields,
          },
        },
      }
      // KYC is intentionally NOT auto-run when the owners list changes; it triggers
      // only when the advisor sends the forms package envelope. However, when an owner
      // is added to a new account, copy any prior person-level KYC state from another
      // account so the new account reflects Jane's existing flagged/verified status.
      if (parsedData?.suffix === 'account-owners') {
        next = hydrateAccountOwnerReviewsFromExisting(next, parsedData.childId)
      }
      return next
    }

    case 'INITIALIZE_FROM_RELATIONSHIP': {
      const assignee = action.assignedTo ?? state.assignedTo ?? 'Unassigned'
      const initJourneyId = action.journeyId ?? `journey-${Date.now()}`

      /** Never wipe user-created accounts, envelopes, or reviews when re-opening the same journey. */
      if (
        action.journeyId &&
        state.journeyId === action.journeyId &&
        hasAccountOpeningWorkflowEvidence(state)
      ) {
        return {
          ...state,
          relatedParties: structuredClone(action.relatedParties),
          financialAccounts: structuredClone(action.financialAccounts),
          journeyName: action.journeyName ?? state.journeyName,
          assignedTo: assignee,
          journeyOnboardingConfig:
            action.journeyOnboardingConfig ?? state.journeyOnboardingConfig,
          taskData: {
            ...state.taskData,
            'client-info': structuredClone(action.clientInfo),
          },
        }
      }

      // Default client onboarding no longer includes a top-level KYC action/task.
      // Keep childType='kyc' support for account-opening or future standalone flows.
      const baseActions = actions.filter((a) => a.id !== 'kyc')
      const baseTasks = tasks.filter((t) => t.id !== 'kyc-review' && t.formKey !== 'kyc' && t.actionId !== 'kyc')

      const collectDataAction = baseActions.find((a) => a.id === 'collect-client-data')!

      const hasAnnuity = action.journeyOnboardingConfig?.openAnnuityAccount === true

      const mkFresh = (t: Task): Task => ({
        ...t,
        status: 'in_progress' as const,
        assignedTo: assignee,
        children: t.children ? [] : undefined,
        unread: true,
        edited: false,
      })

      let actionsForState: Action[]
      let tasksForState: Task[]
      let extraTaskData: Record<string, Record<string, unknown>> = {}

      const collect = baseTasks.filter((t) => t.actionId === 'collect-client-data').map(mkFresh)
      const oaSeed = baseTasks.find((t) => t.id === 'open-accounts')!

      if (hasAnnuity) {
        // Both paths under one Open Accounts action: with-annuity first, then without.
        // Always create both tasks when annuity is enabled so v5/v6 sidebar split nav
        // (Account Opening + Account Opening + Annuity Order) can resolve `isSplit`.
        actionsForState = [collectDataAction, { id: 'account-opening', title: 'Open Accounts', order: 2 }]
        const openWith: Task = {
          id: 'open-accounts-annuity',
          title: 'Open Accounts',
          actionId: 'account-opening',
          status: 'in_progress' as const,
          assignedTo: assignee,
          formKey: 'open-accounts-with-annuity',
          order: 1,
          unread: true,
          edited: false,
          children: [],
        }
        const openNo: Task = { ...mkFresh(oaSeed), actionId: 'account-opening', order: 2 }
        tasksForState = [...collect, openWith, openNo]
        extraTaskData = { 'open-accounts-annuity': { additionalInstructions: seedOpenAccountsAdditionalInstructions } }
      } else {
        // Multiple accounts, no annuity: standard flow
        actionsForState = [...baseActions]
        tasksForState = baseTasks.map(mkFresh)
      }

      const seeded = seedDemoOpenAccountsChildrenForRelationshipInit(
        tasksForState,
        action.relatedParties,
        action.journeyId,
      )
      tasksForState = seeded.tasks

      const newOrder = computeFlatTaskOrder(tasksForState, actionsForState)
      const openAccountsDataShell = { additionalInstructions: seedOpenAccountsAdditionalInstructions }
      const hasStandardOpenAccounts = tasksForState.some((t) => t.id === 'open-accounts')
      const entryTaskId = resolveJourneyEntryTaskIdAfterInit(
        tasksForState,
        state.demoViewMode,
        tasksForState[0].id,
      )
      return {
        actions: actionsForState,
        tasks: tasksForState,
        relatedParties: structuredClone(action.relatedParties),
        financialAccounts: structuredClone(action.financialAccounts),
        activeTaskId: entryTaskId,
        /** Preserve reviewer/advisor perspective while navigating between journeys and workflows. */
        demoViewMode: state.demoViewMode ?? 'advisor',
        flatTaskOrder: newOrder,
        taskData: {
          'client-info': structuredClone(action.clientInfo),
          ...(hasStandardOpenAccounts ? { 'open-accounts': openAccountsDataShell } : {}),
          ...extraTaskData,
          ...seeded.taskDataPatch,
        },
        journeyName: action.journeyName,
        journeyId: initJourneyId,
        journeyStartedAt: new Date().toISOString(),
        ...(() => {
          const journeyDue = new Date()
          journeyDue.setDate(journeyDue.getDate() + 30)
          return {
            journeyDueAt: journeyDue.toISOString(),
            journeyDateLabel: journeyDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }
        })(),
        assignedTo: assignee,
        journeyOnboardingConfig: action.journeyOnboardingConfig,
        submittedTaskIds: [],
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
        v5NoAnnuityOpenAccountsPage: null,
        v6IncludeAnnuityAccounts: false,
      }
    }

    case 'GO_NEXT': {
      const variant = getPersistedOpenAccountsVariant()
      const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
      if (
        (variant === 'v5' || variant === 'v6') &&
        isSplitOpenAccountsJourney(state) &&
        activeTask?.formKey === OPEN_ACCOUNTS_FORM_KEY &&
        state.v5NoAnnuityOpenAccountsPage != null
      ) {
        const order = getV5NoAnnuityOpenAccountsNavPageOrder()
        const current = normalizeV5NoAnnuityPageForNav(state.v5NoAnnuityOpenAccountsPage)
        const i = order.indexOf(current)
        if (i >= 0 && i < order.length - 1) {
          return { ...state, v5NoAnnuityOpenAccountsPage: order[i + 1] }
        }
      }

      const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
      if (idx >= state.flatTaskOrder.length - 1) return state

      const nextId = nextVisibleFlatTaskId(state, state.activeTaskId)
      if (!nextId) return state
      const goNextTasks = state.tasks.map((t) =>
        t.id === nextId ? { ...t, unread: false } : t
      )
      return {
        ...state,
        activeTaskId: nextId,
        tasks: goNextTasks,
        v5NoAnnuityOpenAccountsPage: nextV5NoAnnuityPageForActiveTask(state, nextId),
      }
    }

    case 'GO_BACK': {
      const variant = getPersistedOpenAccountsVariant()
      const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
      if (
        (variant === 'v5' || variant === 'v6') &&
        isSplitOpenAccountsJourney(state) &&
        activeTask?.formKey === OPEN_ACCOUNTS_FORM_KEY &&
        state.v5NoAnnuityOpenAccountsPage != null
      ) {
        const order = getV5NoAnnuityOpenAccountsNavPageOrder()
        const current = normalizeV5NoAnnuityPageForNav(state.v5NoAnnuityOpenAccountsPage)
        const i = order.indexOf(current)
        if (i > 0) {
          return { ...state, v5NoAnnuityOpenAccountsPage: order[i - 1] }
        }
      }

      const prevId = prevVisibleFlatTaskId(state, state.activeTaskId)
      if (prevId == null) return state
      const goBackTasks = state.tasks.map((t) =>
        t.id === prevId ? { ...t, unread: false } : t
      )
      const fromTask = state.tasks.find((t) => t.id === state.activeTaskId)
      const enteringFromAnnuity =
        fromTask?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
      return {
        ...state,
        activeTaskId: prevId,
        tasks: goBackTasks,
        v5NoAnnuityOpenAccountsPage: nextV5NoAnnuityPageForActiveTask(state, prevId, {
          enteringOpenAccountsFromAnnuity: enteringFromAnnuity,
        }),
      }
    }

    case 'ENTER_CHILD_ACTION': {
      const parentForEnter = findParentTaskForChild(state, action.childId)
      const enteredChild = state.tasks
        .flatMap((t) => t.children ?? [])
        .find((c) => c.id === action.childId)
      const childInReviewerPipeline =
        !!enteredChild &&
        (enteredChild.status === 'awaiting_review' ||
          enteredChild.status === 'complete' ||
          enteredChild.status === 'canceled' ||
          enteredChild.status === 'rejected')
      const seedTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const sanitizedEnterMode = sanitizeDemoViewModeForChild(
        state.demoViewMode ?? 'advisor',
        enteredChild?.childType,
      )
      const enterVisible =
        enteredChild != null
          ? getVisibleChildSubTasks(enteredChild.childType, sanitizedEnterMode, enteredChild.status, {
              accountWorkflowPhase:
                enteredChild.childType === 'account-opening'
                  ? state.childReviewsByChildId?.[enteredChild.id]?.accountWorkflowPhase
                  : undefined,
            })
          : []
      let enterIdx = action.subTaskIndex ?? 0
      if (enterVisible.length > 0) {
        if (
          sanitizedEnterMode === 'aml' &&
          enteredChild?.childType === 'account-opening' &&
          action.subTaskIndex == null
        ) {
          const amlIdx = enterVisible.findIndex((s) => s.suffix === 'aml-review')
          if (amlIdx >= 0) enterIdx = amlIdx
        }
        enterIdx = Math.min(Math.max(0, enterIdx), enterVisible.length - 1)
      }
      const enterHwm = state.childHighWaterMark ?? {}
      const enterNewHwm = bumpChildHighWaterMark(
        { ...state, childHighWaterMark: enterHwm },
        action.childId,
        enterIdx,
      )
      let next: WorkflowState = {
        ...state,
        activeTaskId: parentForEnter?.id ?? state.activeTaskId,
        activeChildActionId: action.childId,
        activeChildSubTaskIndex: enterIdx,
        childActionResume: action.resumeAfterExit,
        demoViewMode: sanitizedEnterMode,
        childHighWaterMark: enterNewHwm,
        submittedAt:
          childInReviewerPipeline
            ? (state.submittedAt ?? seedTime)
            : state.submittedAt,
      }
      // KYC is intentionally NOT auto-run on child-enter; it triggers only when the
      // advisor sends the forms package envelope.
      return next
    }

    case 'EXIT_CHILD_ACTION': {
      const exitingChild = state.activeChildActionId
        ? state.tasks
            .flatMap((t) => t.children ?? [])
            .find((c) => c.id === state.activeChildActionId)
        : undefined
      const parentForExit = exitingChild
        ? findParentTaskForChild(state, exitingChild.id)
        : undefined
      const demoViewAfterChildExit =
        exitingChild?.childType === 'kyc' && state.demoViewMode === 'ho-kyc'
          ? 'ho-documents'
          : state.demoViewMode

      if (state.childActionResume) {
        const { accountChildId, subTaskIndex } = state.childActionResume
        const resumeChild = state.tasks
          .flatMap((t) => t.children ?? [])
          .find((c) => c.id === accountChildId)
        const resumeParent = findParentTaskForChild(state, accountChildId)
        return {
          ...state,
          activeTaskId: resumeParent?.id ?? parentForExit?.id ?? state.activeTaskId,
          activeChildActionId: accountChildId,
          activeChildSubTaskIndex: subTaskIndex,
          childActionResume: undefined,
          demoViewMode: sanitizeDemoViewModeForChild(demoViewAfterChildExit, resumeChild?.childType),
        }
      }
      return {
        ...state,
        activeTaskId: parentForExit?.id ?? state.activeTaskId,
        activeChildActionId: undefined,
        activeChildSubTaskIndex: undefined,
        childActionResume: undefined,
        demoViewMode: demoViewAfterChildExit,
      }
    }

    case 'SET_CHILD_SUB_TASK': {
      const idx = clampChildSubTaskIndex(state, action.index)
      if (idx == null || !state.activeChildActionId) return state
      return {
        ...state,
        activeChildSubTaskIndex: idx,
        childHighWaterMark: bumpChildHighWaterMark(state, state.activeChildActionId, idx),
      }
    }

    case 'MARK_CHILD_SUB_TASK_VISITED': {
      if (!state.activeChildActionId) return state
      const idx = clampChildSubTaskIndex(state, action.index)
      if (idx == null) return state
      return {
        ...state,
        childHighWaterMark: bumpChildHighWaterMark(state, state.activeChildActionId, idx),
      }
    }

    case 'CHILD_GO_NEXT': {
      if (state.activeChildActionId == null || state.activeChildSubTaskIndex == null) return state
      const child = state.tasks
        .flatMap((t) => t.children ?? [])
        .find((c) => c.id === state.activeChildActionId)
      if (!child) return state
      const maxIndex = getVisibleChildSubTasks(child.childType, state.demoViewMode, child.status).length - 1
      if (state.activeChildSubTaskIndex >= maxIndex) return state
      const nextIdx = state.activeChildSubTaskIndex + 1
      const prevHwm = state.childHighWaterMark ?? {}
      const curHwm = prevHwm[state.activeChildActionId] ?? 0
      const newHwm = bumpChildHighWaterMark(state, state.activeChildActionId, nextIdx)
      return { ...state, activeChildSubTaskIndex: nextIdx, childHighWaterMark: newHwm }
    }

    case 'CHILD_GO_BACK': {
      if (state.activeChildActionId == null || state.activeChildSubTaskIndex == null) return state
      if (state.activeChildSubTaskIndex <= 0) {
        if (state.childActionResume) {
          const { accountChildId, subTaskIndex } = state.childActionResume
          return {
            ...state,
            activeChildActionId: accountChildId,
            activeChildSubTaskIndex: subTaskIndex,
            childActionResume: undefined,
          }
        }
        return {
          ...state,
          activeChildActionId: undefined,
          activeChildSubTaskIndex: undefined,
          childActionResume: undefined,
        }
      }
      return { ...state, activeChildSubTaskIndex: state.activeChildSubTaskIndex - 1 }
    }

    case 'SUBMIT_FOR_REVIEW': {
      const reviewTasks = state.tasks.map((t) => {
        const updated = { ...t, status: 'awaiting_review' as const }
        if (updated.children) {
          return { ...updated, children: updated.children.map((c) => ({ ...c, status: 'awaiting_review' as const })) }
        }
        return updated
      })
      return {
        ...state,
        tasks: reviewTasks,
        submittedTaskIds: [],
        reviewState: {
          reviewStatus: 'pending',
          assignedTo: 'Home Office Review Team',
        },
      }
    }

    case 'SUBMIT_ALL_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW': {
      const openAccountsTask = state.tasks.find((t) => t.id === action.openAccountsTaskId)
      if (!openAccountsTask?.children?.length) return state
      const isAnnuityExternalSubmission =
        openAccountsTask.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY

      const accountOpeningIds = new Set(
        openAccountsTask.children
          .filter((c) => c.childType === 'account-opening')
          .map((c) => c.id),
      )
      if (accountOpeningIds.size === 0) return state

      const updatedTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            accountOpeningIds.has(c.id)
              ? { ...c, status: isAnnuityExternalSubmission ? 'in_progress' as const : 'awaiting_review' as const }
              : c,
          ),
        }
      })

      const nextChildReviews = { ...(state.childReviewsByChildId ?? {}) }
      const submittedAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      if (!isAnnuityExternalSubmission) {
        for (const childId of accountOpeningIds) {
          const prev = nextChildReviews[childId] ?? {}
          nextChildReviews[childId] = {
            ...prev,
            documentReview: prev.documentReview ?? { status: 'pending' },
            principalReview: prev.principalReview ?? { status: 'pending' },
            accountOpeningPreReviewTimeline:
              prev.accountOpeningPreReviewTimeline ?? buildAccountOpeningPreReviewTimeline(),
          }
        }
      }

      const nextTaskData = { ...state.taskData }
      if (isAnnuityExternalSubmission) {
        for (const childId of accountOpeningIds) {
          const ownersTaskId = `${childId}-account-owners`
          nextTaskData[ownersTaskId] = {
            ...(nextTaskData[ownersTaskId] ?? {}),
            submittedToNetX360: true,
            submittedToNetX360At: submittedAt,
          }
        }
      }

      return {
        ...state,
        tasks: updatedTasks,
        childReviewsByChildId: nextChildReviews,
        childReviewDecisionsByChildId: Object.fromEntries(
          Object.entries(state.childReviewDecisionsByChildId ?? {}).filter(
            ([childId]) => !accountOpeningIds.has(childId),
          ),
        ),
        taskData: nextTaskData,
      }
    }

    case 'SUBMIT_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW': {
      const childIds = new Set(action.childIds)
      if (childIds.size === 0) return state

      const updatedTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            childIds.has(c.id) && c.childType === 'account-opening'
              ? { ...c, status: 'awaiting_review' as const }
              : c,
          ),
        }
      })

      const stateWithUpdatedTasks = { ...state, tasks: updatedTasks }
      const nextChildReviews = { ...(state.childReviewsByChildId ?? {}) }
      for (const childId of childIds) {
        if (isSingleFlowKycEnabled(state)) {
          nextChildReviews[childId] = buildSingleFlowAccountOpeningReviewOnSubmit(
            stateWithUpdatedTasks,
            childId,
            'awaiting_review',
          )
          continue
        }
        const prev = nextChildReviews[childId] ?? {}
        const ownerReviews = prev.ownerReviews ?? {}
        const ownerStatuses = Object.values(ownerReviews).map((o) => o.amlReview?.status)
        const derivedPhase = hasOwnerLevelAmlFlag(prev)
          ? 'escalation_hold'
          : ownerStatuses.some((s) => s === 'pending' || s === 'info_requested')
            ? 'aml_review'
            : 'document_review'
        nextChildReviews[childId] = {
          ...prev,
          documentReview: prev.documentReview ?? { status: 'pending' },
          principalReview: prev.principalReview ?? { status: 'pending' },
          accountOpeningPreReviewTimeline:
            prev.accountOpeningPreReviewTimeline ?? buildAccountOpeningPreReviewTimeline(),
          accountWorkflowPhase: prev.accountWorkflowPhase ?? derivedPhase,
        }
      }

      const activeSubmitted =
        state.activeChildActionId != null && childIds.has(state.activeChildActionId)

      return {
        ...state,
        tasks: updatedTasks,
        childReviewsByChildId: nextChildReviews,
        childReviewDecisionsByChildId: Object.fromEntries(
          Object.entries(state.childReviewDecisionsByChildId ?? {}).filter(
            ([childId]) => !childIds.has(childId),
          ),
        ),
        /** Parent Open Accounts “simulate signing” / batch submit is an advisor journey action; stay out of HO reviewer shell so sidebar tasks (Client Setup, annuity row) remain available. */
        demoViewMode: 'advisor',
        ...(activeSubmitted
          ? {
              activeChildActionId: undefined,
              activeChildSubTaskIndex: undefined,
              childActionResume: undefined,
            }
          : {}),
      }
    }

    case 'POST_ENVELOPE_SIGNATURE_AML_FOR_OWNERS': {
      const accountChildIds = new Set(action.accountChildIds)
      if (accountChildIds.size === 0) return state

      const kycIdsAll = getKycChildIdsForSignedAccountChildren(
        state,
        accountChildIds,
        action.supplementalOwnerPartyIds,
      )
      const kycIds = kycIdsAll.filter((id) => {
        const child = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === id)
        if (child?.childType !== 'kyc') return false
        return (
          child.status === 'awaiting_review' ||
          child.status === 'in_progress' ||
          child.status === 'not_started'
        )
      })
      if (kycIds.length === 0) return state

      const kycIdSet = new Set(kycIds)
      const defaultKycCip: NonNullable<ChildReviewState['cipStatus']> = {
        idVerification: 'pass' as const,
        addressMatch: 'pass' as const,
        dobMatch: 'pass' as const,
        overallStatus: 'pass' as const,
      }

      const nextTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) => {
            if (!kycIdSet.has(c.id) || c.childType !== 'kyc') return c
            if (c.status === 'complete' || c.status === 'canceled') return c
            if (c.status === 'awaiting_review') return c
            if (c.status === 'in_progress' || c.status === 'not_started') {
              return { ...c, status: 'awaiting_review' as const }
            }
            return c
          }),
        }
      })

      const nextChildReviews = { ...state.childReviewsByChildId }
      for (const kid of kycIds) {
        const prev = nextChildReviews[kid] ?? {}
        nextChildReviews[kid] = {
          ...prev,
          amlReview: { status: 'pending' as const },
          hoKycReview: prev.hoKycReview ?? { status: 'pending' as const },
          cipStatus: prev.cipStatus ?? defaultKycCip,
          kycPreAmlTimeline: prev.kycPreAmlTimeline ?? buildKycPreAmlTimeline(),
        }
      }

      return {
        ...state,
        tasks: nextTasks,
        childReviewsByChildId: nextChildReviews,
        childReviewDecisionsByChildId: Object.fromEntries(
          Object.entries(state.childReviewDecisionsByChildId ?? {}).filter(([id]) => !kycIdSet.has(id)),
        ),
      }
    }

    case 'ACCEPT_REVIEW': {
      const acceptedTasks = state.tasks.map((t) => {
        const updated = { ...t, status: 'complete' as const }
        if (updated.children) {
          return { ...updated, children: updated.children.map((c) => ({ ...c, status: 'complete' as const })) }
        }
        return updated
      })
      return {
        ...state,
        tasks: acceptedTasks,
        reviewState: {
          ...state.reviewState!,
          reviewStatus: 'accepted',
        },
      }
    }

    case 'REJECT_REVIEW': {
      const rejectedTasks = state.tasks.map((t) => {
        const updated = { ...t, status: 'rejected' as const }
        if (updated.children) {
          return { ...updated, children: updated.children.map((c) => ({ ...c, status: 'rejected' as const })) }
        }
        return updated
      })
      return {
        ...state,
        tasks: rejectedTasks,
        reviewState: {
          ...state.reviewState!,
          reviewStatus: 'rejected',
          rejectionReason: action.reason,
          rejectionFeedback: action.feedback,
        },
      }
    }

    case 'RUN_ADVISOR_KYC_VERIFICATION': {
      const cid = action.childId
      const info = (state.taskData[`${cid}-info`] as Record<string, unknown> | undefined) ?? {}
      const root = (state.taskData[cid] as Record<string, unknown> | undefined) ?? {}
      const subjectIsEntity = root.kycSubjectType === 'entity'
      const s = (k: string) => (typeof info[k] === 'string' ? (info[k] as string).trim() : '')

      const nameOk = subjectIsEntity ? Boolean(s('legalName')) : Boolean(s('firstName') && s('lastName'))
      const tinOk = Boolean(s('taxId'))
      const dobOk = subjectIsEntity ? true : Boolean(s('dob'))
      const addrOk = subjectIsEntity
        ? Boolean(s('registeredStreet') || s('principalStreet'))
        : Boolean(s('legalStreet'))

      const pass = nameOk && tinOk && dobOk && addrOk

      const idVerification: 'pass' | 'fail' | 'pending' = nameOk && tinOk ? 'pass' : 'fail'
      const addressMatch: 'pass' | 'fail' | 'pending' = addrOk ? 'pass' : 'fail'
      const dobMatch: 'pass' | 'fail' | 'pending' = subjectIsEntity ? 'pass' : dobOk ? 'pass' : 'fail'

      const nowIso = new Date().toISOString()
      const cipStatus: NonNullable<ChildReviewState['cipStatus']> = pass
        ? {
            idVerification: 'pass',
            addressMatch: 'pass',
            dobMatch: 'pass',
            overallStatus: 'pass',
          }
        : {
            idVerification,
            addressMatch,
            dobMatch,
            overallStatus: 'fail',
          }
      const kycVerificationResultSummary = pass
        ? 'Identity successfully verified.'
        : 'Some details need attention before identity can be verified.'
      const prev = state.childReviewsByChildId?.[cid] ?? {}
      return {
        ...state,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [cid]: {
            ...prev,
            demoAdvisorIdentitySimulation: undefined,
            cipStatus,
            kycVerificationLastCheckedAt: nowIso,
            kycVerificationResultSummary,
          },
        },
      }
    }

    case 'SIMULATE_ADVISOR_IDENTITY_VERIFICATION': {
      if (import.meta.env.PROD) return state
      const cid = action.childId
      const prev = state.childReviewsByChildId?.[cid] ?? {}
      const nowIso = new Date().toISOString()

      if (action.preset === 'reset') {
        const pass = advisorIdentitySimPassDisplay()
        return {
          ...state,
          childReviewsByChildId: {
            ...state.childReviewsByChildId,
            [cid]: {
              ...prev,
              demoAdvisorIdentitySimulation: undefined,
              cipStatus: pass.cipStatus,
              kycVerificationLastCheckedAt: nowIso,
              kycVerificationResultSummary: pass.resultSummary ?? undefined,
            },
          },
        }
      }

      const root = (state.taskData[cid] as Record<string, unknown> | undefined) ?? {}
      const subjectIsEntity = root.kycSubjectType === 'entity'
      const overlay = getAdvisorIdentitySimDisplay(action.preset, subjectIsEntity)
      const kycVerificationResultSummary =
        overlay.cipStatus.overallStatus === 'pass'
          ? 'Identity successfully verified.'
          : overlay.cipStatus.overallStatus === 'pending'
            ? 'Verification is still in progress.'
            : 'Some details need attention before identity can be verified.'

      return {
        ...state,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [cid]: {
            ...prev,
            demoAdvisorIdentitySimulation: action.preset,
            cipStatus: overlay.cipStatus,
            kycVerificationLastCheckedAt: nowIso,
            kycVerificationResultSummary,
          },
        },
      }
    }

    case 'SUBMIT_CHILD_FOR_REVIEW': {
      if (!state.activeChildActionId) return state
      const cid = state.activeChildActionId
      const submittedChild = state.tasks
        .flatMap((t) => t.children ?? [])
        .find((c) => c.id === cid)
      const isKycChild = submittedChild?.childType === 'kyc'
      const isAccountOpeningChild = submittedChild?.childType === 'account-opening'
      const existingKycReview = isKycChild ? state.childReviewsByChildId?.[cid] : undefined
      const updTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === cid ? { ...c, status: 'awaiting_review' as const } : c,
          ),
        }
      })
      const defaultKycCip: NonNullable<ChildReviewState['cipStatus']> = {
        idVerification: 'pass' as const,
        addressMatch: 'pass' as const,
        dobMatch: 'pass' as const,
        overallStatus: 'pass' as const,
      }
      const initialForChild: ChildReviewState = isKycChild
        ? {
            amlReview: { status: 'pending' as const },
            cipStatus: existingKycReview?.cipStatus ?? defaultKycCip,
            hoKycReview: { status: 'pending' as const },
            validationErrors: [],
            kycPreAmlTimeline: buildKycPreAmlTimeline(),
            ...(existingKycReview?.kycVerificationLastCheckedAt
              ? {
                  kycVerificationLastCheckedAt: existingKycReview.kycVerificationLastCheckedAt,
                  kycVerificationResultSummary: existingKycReview.kycVerificationResultSummary,
                }
              : {}),
          }
        : isAccountOpeningChild
          ? isSingleFlowKycEnabled()
            ? buildSingleFlowAccountOpeningReviewOnSubmit(
                state,
                cid,
                submittedChild?.status ?? 'in_progress',
              )
            : {
                documentReview: { status: 'pending' },
                principalReview: { status: 'pending' },
                accountOpeningPreReviewTimeline: buildAccountOpeningPreReviewTimeline(),
              }
          : {
              amlReview: { status: 'pending' as const },
              documentReview: { status: 'pending' },
              principalReview: { status: 'pending' },
              accountOpeningPreReviewTimeline: buildAccountOpeningPreReviewTimeline(),
            }

      return {
        ...state,
        tasks: updTasks,
        activeChildSubTaskIndex: 0,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [cid]: initialForChild,
        },
        childReviewDecisionsByChildId: Object.fromEntries(
          Object.entries(state.childReviewDecisionsByChildId ?? {}).filter(
            ([childId]) => childId !== cid,
          ),
        ),
      }
    }

    case 'ACCEPT_CHILD_REVIEW': {
      if (!state.activeChildActionId) return state
      const acId = state.activeChildActionId
      const decidedAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const acTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === acId ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: acTasks,
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [acId]: { outcome: 'approved', decidedAt },
        },
      }
    }

    case 'REJECT_CHILD_REVIEW': {
      if (!state.activeChildActionId) return state
      const rcId = state.activeChildActionId
      const decidedAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const rcTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === rcId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: rcTasks,
        taskData: {
          ...state.taskData,
          [`${rcId}-review`]: {
            rejectionReason: action.reason,
            rejectionFeedback: action.feedback,
          },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [rcId]: { outcome: 'rejected', decidedAt },
        },
      }
    }

    case 'SET_AML_FLAG': {
      const cid = state.activeChildActionId
      if (!cid) return state
      const prev = state.childReviewsByChildId?.[cid] ?? {}
      return {
        ...state,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [cid]: { ...prev, amlFlagged: action.flagged, amlNotes: action.notes },
        },
      }
    }

    case 'DOCUMENT_REVIEW_IGO': {
      const cid = state.activeChildActionId
      if (!cid) return state
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const prev = state.childReviewsByChildId?.[cid] ?? {}
      return {
        ...state,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [cid]: {
            ...prev,
            documentReview: { status: 'igo', decidedAt: ts },
            accountWorkflowPhase: 'principal_review',
          },
        },
      }
    }

    case 'DOCUMENT_REVIEW_NIGO': {
      if (!state.activeChildActionId) return state
      const dnigoId = state.activeChildActionId
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const dnigoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === dnigoId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      const prevDnigo = state.childReviewsByChildId?.[dnigoId] ?? {}
      return {
        ...state,
        tasks: dnigoTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [dnigoId]: {
            ...prevDnigo,
            documentReview: { status: 'nigo', decidedAt: ts, nigoReason: action.reason, nigoFeedback: action.feedback },
          },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [dnigoId]: { outcome: 'rejected', decidedAt: ts },
        },
        taskData: {
          ...state.taskData,
          [`${dnigoId}-review`]: {
            rejectionReason: action.reason,
            rejectionFeedback: action.feedback,
            rejectedBy: 'Document Review Team',
          },
        },
      }
    }

    case 'PRINCIPAL_REVIEW_IGO': {
      if (!state.activeChildActionId) return state
      const pigoId = state.activeChildActionId
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const prevPigo = state.childReviewsByChildId?.[pigoId] ?? {}
      const docIgo = prevPigo.documentReview?.status === 'igo'
      const pigoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === pigoId && docIgo ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: pigoTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [pigoId]: { ...prevPigo, principalReview: { status: 'igo', decidedAt: ts } },
        },
        childReviewDecisionsByChildId: docIgo
          ? { ...state.childReviewDecisionsByChildId, [pigoId]: { outcome: 'approved', decidedAt: ts } }
          : state.childReviewDecisionsByChildId,
      }
    }

    case 'PRINCIPAL_REVIEW_NIGO': {
      if (!state.activeChildActionId) return state
      const pnigoId = state.activeChildActionId
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const prevPnigo = state.childReviewsByChildId?.[pnigoId] ?? {}
      const pnigoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === pnigoId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: pnigoTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [pnigoId]: {
            ...prevPnigo,
            principalReview: { status: 'nigo', decidedAt: ts, nigoReason: action.reason, nigoFeedback: action.feedback },
          },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [pnigoId]: { outcome: 'rejected', decidedAt: ts },
        },
        taskData: {
          ...state.taskData,
          [`${pnigoId}-review`]: {
            rejectionReason: action.reason,
            rejectionFeedback: action.feedback,
            rejectedBy: 'Principal Review Team',
          },
        },
      }
    }

    case 'AML_REVIEW_CLEAR': {
      if (!state.activeChildActionId) return state
      const amlClearTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const cid = state.activeChildActionId
      const prev = state.childReviewsByChildId?.[cid] ?? {}
      const nextParties = stampLastAmlRunForKycChild(state, cid)
      return {
        ...state,
        ...(nextParties ? { relatedParties: nextParties } : {}),
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [cid]: {
            ...prev,
            amlReview: {
              status: 'cleared',
              decidedAt: amlClearTs,
              ...(action.approvalReason ? { approvalReason: action.approvalReason } : {}),
            },
          },
        },
      }
    }

    case 'AML_REVIEW_FLAG': {
      if (!state.activeChildActionId) return state
      const amlFlagTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const amlFlagId = state.activeChildActionId
      const prevFlag = state.childReviewsByChildId?.[amlFlagId] ?? {}
      const amlFlagTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === amlFlagId ? { ...c, status: 'in_progress' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: amlFlagTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [amlFlagId]: {
            ...prevFlag,
            amlReview: { status: 'flagged', decidedAt: amlFlagTs, findings: action.findings },
          },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [amlFlagId]: { outcome: 'rejected', decidedAt: amlFlagTs },
        },
      }
    }

    case 'HO_KYC_APPROVE': {
      if (!state.activeChildActionId) return state
      const hoApproveTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const hoApproveId = state.activeChildActionId
      const prevHo = state.childReviewsByChildId?.[hoApproveId] ?? {}
      const hoApproveTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === hoApproveId ? { ...c, status: 'complete' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: hoApproveTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [hoApproveId]: { ...prevHo, hoKycReview: { status: 'approved', decidedAt: hoApproveTs } },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [hoApproveId]: { outcome: 'approved', decidedAt: hoApproveTs },
        },
      }
    }

    case 'HO_KYC_REQUEST_CHANGES': {
      if (!state.activeChildActionId) return state
      const hoReqTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const hoReqId = state.activeChildActionId
      const prevReq = state.childReviewsByChildId?.[hoReqId] ?? {}
      const hoReqTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === hoReqId ? { ...c, status: 'in_progress' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: hoReqTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [hoReqId]: {
            ...prevReq,
            hoKycReview: { status: 'changes_requested', decidedAt: hoReqTs, comments: action.comments },
          },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [hoReqId]: { outcome: 'rejected', decidedAt: hoReqTs },
        },
      }
    }

    case 'AML_REQUEST_MORE_INFO': {
      if (!state.activeChildActionId) return state
      const amlInfoTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const amlInfoId = state.activeChildActionId
      const prevInfo = state.childReviewsByChildId?.[amlInfoId] ?? {}
      const amlInfoTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === amlInfoId ? { ...c, status: 'in_progress' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: amlInfoTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [amlInfoId]: {
            ...prevInfo,
            amlReview: {
              ...prevInfo.amlReview,
              status: 'info_requested' as const,
              decidedAt: amlInfoTs,
              infoRequestComments: action.comments,
            },
          },
        },
      }
    }

    case 'AML_ESCALATE_SAR': {
      if (!state.activeChildActionId) return state
      const sarTs = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const sarId = state.activeChildActionId
      const prevSar = state.childReviewsByChildId?.[sarId] ?? {}
      const sarTasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === sarId ? { ...c, status: 'rejected' as const } : c,
          ),
        }
      })
      return {
        ...state,
        tasks: sarTasks,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [sarId]: {
            ...prevSar,
            amlReview: {
              ...prevSar.amlReview,
              status: 'escalated' as const,
              decidedAt: sarTs,
              reason: action.reason,
            },
          },
        },
        childReviewDecisionsByChildId: {
          ...state.childReviewDecisionsByChildId,
          [sarId]: { outcome: 'rejected', decidedAt: sarTs },
        },
      }
    }

    case 'AUTO_RUN_OWNER_KYC': {
      return applyAutoRunOwnerKycToState(state, action.accountChildId, action.partyId, {
        reRunReason: action.reRunReason,
        runBy: action.runBy,
      })
    }

    case 'LOG_FORMS_PACKAGE_KYC_ACK': {
      const acknowledgedAt = new Date().toISOString()
      const ack = {
        id: `fpka-${Date.now()}`,
        acknowledgedAt,
        acknowledgedBy: action.acknowledgedBy,
        envelopeId: action.envelopeId,
        participants: action.participants,
      }
      let next: WorkflowState = {
        ...state,
        formsPackageKycAcknowledgments: [...(state.formsPackageKycAcknowledgments ?? []), ack],
      }
      for (const participant of action.participants) {
        const ownerOnFirstAccount =
          next.childReviewsByChildId?.[participant.accountChildIds[0]]?.ownerReviews?.[
            participant.partyId
          ]
        for (const accountChildId of participant.accountChildIds) {
          next = appendOwnerVerificationSnapshot(next, accountChildId, participant.partyId, {
            ranAt: acknowledgedAt,
            eventKind: 'forms_package_kyc_ack',
            runBy: action.acknowledgedBy,
            triggerSource: 'Send forms package',
            amlOutcome: ownerOnFirstAccount?.amlReview?.status,
            cipOutcome: ownerOnFirstAccount?.cipStatus?.overallStatus,
            note: `Advisor acknowledged KYC review warning (AML: ${participant.amlLabel}, CIP: ${participant.cipLabel}).`,
          })
        }
      }
      return next
    }

    case 'OWNER_AML_REVIEW_CLEAR': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      let next = patchAccountOwnerReviews(state, action.accountChildId, action.partyId, {
        amlReview: {
          status: 'cleared',
          decidedAt: ts,
          ...(action.approvalReason ? { approvalReason: action.approvalReason } : {}),
        },
      })
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const allCleared = owners.every(
        (p) => next?.[action.accountChildId]?.ownerReviews?.[p.id]?.amlReview?.status === 'cleared',
      )
      if (allCleared) {
        next = {
          ...next,
          [action.accountChildId]: {
            ...next![action.accountChildId],
            accountWorkflowPhase: 'document_review',
          },
        }
      }
      return { ...state, childReviewsByChildId: next }
    }

    case 'OWNER_AML_REVIEW_FLAG': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const next = patchAccountOwnerReviews(
        state,
        action.accountChildId,
        action.partyId,
        {
          amlReview: { status: 'flagged', decidedAt: ts, findings: action.findings },
          amlPayloadDemo: {
            ofacMatches: 1,
            watchlistHits: ['Potential PEP match (demo)'],
            summary: action.findings,
          },
        },
        { accountWorkflowPhase: 'aml_review' },
      )
      return { ...state, childReviewsByChildId: next }
    }

    case 'OWNER_AML_REQUEST_INFO': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const next = patchAccountOwnerReviews(
        state,
        action.accountChildId,
        action.partyId,
        {
          amlReview: {
            status: 'info_requested',
            decidedAt: ts,
            infoRequestComments: action.comments,
          },
        },
        { accountWorkflowPhase: 'aml_review' },
      )
      const tasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === action.accountChildId ? { ...c, status: 'in_progress' as const } : c,
          ),
        }
      })
      return { ...state, tasks, childReviewsByChildId: next }
    }

    case 'OWNER_CIP_APPROVE': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const next = patchAccountOwnerReviews(state, action.accountChildId, action.partyId, {
        hoKycReview: { status: 'approved', decidedAt: ts },
        cipStatus: defaultOwnerCipPass(),
      })
      const party = state.relatedParties.find((p) => p.id === action.partyId)
      const nextParties = party
        ? state.relatedParties.map((p) =>
            p.id === party.id ? { ...p, kycStatus: 'verified' as const } : p,
          )
        : state.relatedParties
      return { ...state, relatedParties: nextParties, childReviewsByChildId: next }
    }

    case 'OWNER_CIP_REQUEST_CHANGES': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const next = patchAccountOwnerReviews(
        state,
        action.accountChildId,
        action.partyId,
        {
          hoKycReview: { status: 'changes_requested', decidedAt: ts, comments: action.comments },
          cipStatus: {
            idVerification: 'pass',
            addressMatch: 'fail',
            dobMatch: 'pass',
            overallStatus: 'fail',
          },
          cipPayloadDemo: {
            identityProvider: 'LexisNexis InstantID',
            mismatches: ['Address does not match utility bill on file'],
          },
        },
        { accountWorkflowPhase: 'document_review' },
      )
      const tasks = state.tasks.map((t) => {
        if (!t.children) return t
        return {
          ...t,
          children: t.children.map((c) =>
            c.id === action.accountChildId ? { ...c, status: 'in_progress' as const } : c,
          ),
        }
      })
      return { ...state, tasks, childReviewsByChildId: next }
    }

    case 'SET_ACCOUNT_WORKFLOW_PHASE': {
      const prev = state.childReviewsByChildId?.[action.accountChildId] ?? {}
      return {
        ...state,
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [action.accountChildId]: {
            ...prev,
            accountWorkflowPhase: action.phase,
          },
        },
      }
    }

    case 'ACCOUNT_AML_APPROVE_ALL': {
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      return applyParticipantAmlApprovalForAccount(state, action.accountChildId, partyIds, {
        approvalReason: action.approvalReason,
        runBy: state.demoViewMode ?? 'aml',
      })
    }

    case 'ACCOUNT_AML_REJECT_ALL': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const nowIso = new Date().toISOString()
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      const structuredReason = action.rejectionReason.trim()
      const reviewerNotes = action.reviewerNotes?.trim() ?? ''
      const combinedNote = formatStructuredReviewText(structuredReason, reviewerNotes)
      let next = state.childReviewsByChildId ?? {}
      for (const p of owners) {
        next = patchAccountOwnerReviews({ ...state, childReviewsByChildId: next }, action.accountChildId, p.id, {
          amlReview: {
            status: 'flagged',
            decidedAt: ts,
            ...(isMeaningfulReviewerMessage(combinedNote) ? { findings: combinedNote } : {}),
          },
          ...(structuredReason
            ? {
                amlPayloadDemo: {
                  ofacMatches: 1,
                  watchlistHits: ['Reviewer-flagged after AML screening (demo)'],
                  summary: structuredReason,
                },
              }
            : {}),
        }) ?? next
      }
      const prev = next[action.accountChildId] ?? {}
      let out: WorkflowState = {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'rejected'),
        childReviewsByChildId: {
          ...next,
          [action.accountChildId]: { ...prev, accountWorkflowPhase: 'escalation_hold' },
        },
      }
      out = appendAccountDispositionSnapshots(out, action.accountChildId, partyIds, {
        ranAt: nowIso,
        eventKind: 'aml_reject',
        runBy: state.demoViewMode ?? 'aml',
        amlOutcome: 'flagged',
        rejectionReasonCode: action.rejectionReasonCode,
        rejectionReason: structuredReason,
        ...(isMeaningfulReviewerMessage(reviewerNotes) ? { reviewerNotes } : {}),
        ...(isMeaningfulReviewerMessage(combinedNote) ? { note: combinedNote } : {}),
      })
      return propagateOwnersAcrossAccounts(out, action.accountChildId, partyIds)
    }

    case 'ACCOUNT_AML_REQUEST_INFO': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const nowIso = new Date().toISOString()
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      let next = state.childReviewsByChildId ?? {}
      for (const p of owners) {
        next = patchAccountOwnerReviews({ ...state, childReviewsByChildId: next }, action.accountChildId, p.id, {
          amlReview: {
            status: 'info_requested',
            decidedAt: ts,
            ...(isMeaningfulReviewerMessage(action.comments)
              ? { infoRequestComments: action.comments }
              : {}),
          },
        }) ?? next
      }
      const prev = next[action.accountChildId] ?? {}
      let out: WorkflowState = {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'rejected'),
        childReviewsByChildId: {
          ...next,
          [action.accountChildId]: { ...prev, accountWorkflowPhase: 'draft' },
        },
      }
      out = appendAccountDispositionSnapshots(out, action.accountChildId, partyIds, {
        ranAt: nowIso,
        eventKind: 'aml_request_info',
        runBy: state.demoViewMode ?? 'aml',
        amlOutcome: 'info_requested',
        ...(isMeaningfulReviewerMessage(action.comments) ? { note: action.comments } : {}),
      })
      return propagateOwnersAcrossAccounts(out, action.accountChildId, partyIds)
    }

    case 'ACCOUNT_AML_ESCALATE': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const nowIso = new Date().toISOString()
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      let next = state.childReviewsByChildId ?? {}
      for (const p of owners) {
        next = patchAccountOwnerReviews({ ...state, childReviewsByChildId: next }, action.accountChildId, p.id, {
          amlReview: { status: 'escalated', decidedAt: ts, reason: action.reason },
        }) ?? next
      }
      const prev = next[action.accountChildId] ?? {}
      let out: WorkflowState = {
        ...state,
        childReviewsByChildId: {
          ...next,
          [action.accountChildId]: { ...prev, accountWorkflowPhase: 'escalation_hold' },
        },
      }
      out = appendAccountDispositionSnapshots(out, action.accountChildId, partyIds, {
        ranAt: nowIso,
        eventKind: 'aml_escalate',
        runBy: state.demoViewMode ?? 'aml',
        amlOutcome: 'escalated',
        note: action.reason,
      })
      return propagateOwnersAcrossAccounts(out, action.accountChildId, partyIds)
    }

    case 'ACCOUNT_CIP_APPROVE_ALL': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const nowIso = new Date().toISOString()
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      let next = state.childReviewsByChildId ?? {}
      for (const p of owners) {
        next = patchAccountOwnerReviews({ ...state, childReviewsByChildId: next }, action.accountChildId, p.id, {
          hoKycReview: { status: 'approved', decidedAt: ts },
          cipStatus: defaultOwnerCipPass(),
        }) ?? next
      }
      const prev = next[action.accountChildId] ?? {}
      const verifiedPartyIds = new Set(partyIds)
      let out: WorkflowState = {
        ...state,
        relatedParties: state.relatedParties.map((p) =>
          verifiedPartyIds.has(p.id) ? { ...p, kycStatus: 'verified' as const } : p,
        ),
        childReviewsByChildId: {
          ...next,
          [action.accountChildId]: {
            ...prev,
            // Cascade to legacy timeline so Document Review stage marks completed.
            documentReview: { status: 'igo', decidedAt: ts },
            accountWorkflowPhase: 'principal_review',
          },
        },
      }
      out = appendAccountDispositionSnapshots(out, action.accountChildId, partyIds, {
        ranAt: nowIso,
        eventKind: 'cip_approve',
        runBy: state.demoViewMode ?? 'ho-documents',
        cipOutcome: 'pass',
      })
      return propagateOwnersAcrossAccounts(out, action.accountChildId, partyIds)
    }

    case 'ACCOUNT_CIP_REJECT_ALL': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const nowIso = new Date().toISOString()
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      let next = state.childReviewsByChildId ?? {}
      for (const p of owners) {
        next = patchAccountOwnerReviews({ ...state, childReviewsByChildId: next }, action.accountChildId, p.id, {
          hoKycReview: {
            status: 'changes_requested',
            decidedAt: ts,
            ...(isMeaningfulReviewerMessage(action.comments) ? { comments: action.comments } : {}),
          },
          cipStatus: {
            idVerification: 'fail',
            addressMatch: 'pass',
            dobMatch: 'pass',
            overallStatus: 'fail',
          },
        }) ?? next
      }
      const prev = next[action.accountChildId] ?? {}
      let out: WorkflowState = {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'rejected'),
        childReviewsByChildId: {
          ...next,
          [action.accountChildId]: { ...prev, accountWorkflowPhase: 'escalation_hold' },
        },
      }
      out = appendAccountDispositionSnapshots(out, action.accountChildId, partyIds, {
        ranAt: nowIso,
        eventKind: 'cip_reject',
        runBy: state.demoViewMode ?? 'ho-documents',
        cipOutcome: 'fail',
        ...(isMeaningfulReviewerMessage(action.comments) ? { note: action.comments } : {}),
      })
      return propagateOwnersAcrossAccounts(out, action.accountChildId, partyIds)
    }

    case 'ACCOUNT_CIP_REQUEST_INFO': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const nowIso = new Date().toISOString()
      const owners = getAccountPartiesRequiringKyc(state, action.accountChildId)
      const partyIds = owners.map((p) => p.id)
      let next = state.childReviewsByChildId ?? {}
      for (const p of owners) {
        next = patchAccountOwnerReviews({ ...state, childReviewsByChildId: next }, action.accountChildId, p.id, {
          hoKycReview: {
            status: 'changes_requested',
            decidedAt: ts,
            ...(isMeaningfulReviewerMessage(action.comments) ? { comments: action.comments } : {}),
          },
        }) ?? next
      }
      const prev = next[action.accountChildId] ?? {}
      let out: WorkflowState = {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'rejected'),
        childReviewsByChildId: {
          ...next,
          [action.accountChildId]: { ...prev, accountWorkflowPhase: 'draft' },
        },
      }
      out = appendAccountDispositionSnapshots(out, action.accountChildId, partyIds, {
        ranAt: nowIso,
        eventKind: 'cip_request_info',
        runBy: state.demoViewMode ?? 'ho-documents',
        ...(isMeaningfulReviewerMessage(action.comments) ? { note: action.comments } : {}),
      })
      return propagateOwnersAcrossAccounts(out, action.accountChildId, partyIds)
    }

    case 'ACCOUNT_PRINCIPAL_APPROVE': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const prev = state.childReviewsByChildId?.[action.accountChildId] ?? {}
      return {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'complete'),
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [action.accountChildId]: {
            ...prev,
            // Cascade to legacy timeline: ensure both Document Review and Principal Review stages
            // mark completed on approval (defensive in case Document Review wasn't explicitly set).
            documentReview:
              prev.documentReview?.status === 'igo'
                ? prev.documentReview
                : { status: 'igo', decidedAt: prev.documentReview?.decidedAt ?? ts },
            principalReview: { status: 'igo', decidedAt: ts },
            accountWorkflowPhase: 'complete',
          },
        },
      }
    }

    case 'ACCOUNT_PRINCIPAL_REJECT': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const prev = state.childReviewsByChildId?.[action.accountChildId] ?? {}
      return {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'rejected'),
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [action.accountChildId]: {
            ...prev,
            principalReview: {
              status: 'nigo',
              decidedAt: ts,
              ...(isMeaningfulReviewerMessage(action.reason) ? { nigoReason: action.reason } : {}),
            },
            accountWorkflowPhase: 'escalation_hold',
          },
        },
      }
    }

    case 'ACCOUNT_PRINCIPAL_REQUEST_INFO': {
      const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const prev = state.childReviewsByChildId?.[action.accountChildId] ?? {}
      return {
        ...state,
        tasks: setAccountChildStatus(state.tasks, action.accountChildId, 'rejected'),
        childReviewsByChildId: {
          ...state.childReviewsByChildId,
          [action.accountChildId]: {
            ...prev,
            principalReview: {
              status: 'nigo',
              decidedAt: ts,
              ...(isMeaningfulReviewerMessage(action.comments) ? { nigoFeedback: action.comments } : {}),
            },
            accountWorkflowPhase: 'draft',
          },
        },
      }
    }

    case 'SET_DEMO_VIEW': {
      const remappedIdx = remapChildSubTaskIndexForDemoView(state, action.mode)
      return {
        ...state,
        demoViewMode: action.mode,
        submittedAt: state.submittedAt ?? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        ...(remappedIdx != null ? { activeChildSubTaskIndex: remappedIdx } : {}),
      }
    }

    default:
      return state
  }
}

const WorkflowContext = createContext<{
  state: WorkflowState
  dispatch: React.Dispatch<WorkflowAction>
} | null>(null)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, undefined, getInitialWorkflowState)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storable = stripAdvisorIdentityDemoSimulationForStorage(state)
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(storable))
  }, [state])

  return (
    <WorkflowContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider')
  return context
}

export function useTaskData(taskId: string) {
  const { state, dispatch } = useWorkflow()
  const data = state.taskData[taskId] ?? {}

  const updateField = useCallback(
    (field: string, value: unknown) => {
      dispatch({ type: 'SET_TASK_DATA', taskId, fields: { [field]: value } })
    },
    [dispatch, taskId]
  )

  const updateFields = useCallback(
    (fields: Record<string, unknown>) => {
      dispatch({ type: 'SET_TASK_DATA', taskId, fields })
    },
    [dispatch, taskId]
  )

  return { data, updateField, updateFields }
}

export function useChildActionContext() {
  const { state } = useWorkflow()
  if (!state.activeChildActionId) return null

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)
  if (!child) return null

  const baseConfig = getChildTypeConfig(child.childType)
  const parentTask = state.tasks.find((t) =>
    t.children?.some((c) => c.id === child.id)
  )
  const baseSubTasks = getVisibleChildSubTasks(child.childType, state.demoViewMode, child.status, {
    accountWorkflowPhase:
      child.childType === 'account-opening'
        ? state.childReviewsByChildId?.[child.id]?.accountWorkflowPhase
        : undefined,
  })
  const subTasks =
    child.childType === 'account-opening' && parentTask?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
      ? baseSubTasks.filter((s) => s.suffix === 'account-owners')
      : baseSubTasks
  const config = {
    ...baseConfig,
    subTasks,
  }
  const n = config.subTasks.length
  if (n === 0) return null

  const raw = state.activeChildSubTaskIndex
  const subTaskIndex =
    raw == null || Number.isNaN(Number(raw)) ? 0 : Math.min(Math.max(0, raw), n - 1)

  const currentSubTask = config.subTasks[subTaskIndex]
  if (!currentSubTask) return null

  const subTaskId = `${child.id}-${currentSubTask.suffix}`

  return {
    child,
    config,
    currentSubTask,
    subTaskId,
    subTaskIndex,
    totalSubTasks: config.subTasks.length,
    isFirst: subTaskIndex === 0,
    isLast: subTaskIndex === config.subTasks.length - 1,
    parentTask,
  }
}

/**
 * In advisor demo view: `true` when the active child’s forms should be editable.
 * Draft children (`not_started` / `in_progress`) are always editable; after submit,
 * editing re-opens only when a reviewer returns the case (NIGO / info requested / etc.).
 */
export function useAdvisorFormsEditable(): boolean {
  const { state } = useWorkflow()
  if (state.demoViewMode !== 'advisor') return false

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)
  if (!child) return false

  const inReviewerPipeline =
    child.status === 'awaiting_review' ||
    child.status === 'complete' ||
    child.status === 'canceled' ||
    child.status === 'rejected'

  if (!inReviewerPipeline) return true
  if (child.status === 'rejected') return true

  const rs = getChildReviewState(state, state.activeChildActionId)
  if (!rs) return false

  if (child.childType === 'kyc') {
    return (
      rs.amlReview?.status === 'info_requested' ||
      rs.amlReview?.status === 'flagged' ||
      rs.hoKycReview?.status === 'changes_requested' ||
      false
    )
  }

  if (
    rs.documentReview?.status === 'nigo' ||
    rs.principalReview?.status === 'nigo' ||
    rs.amlReview?.status === 'info_requested' ||
    rs.amlReview?.status === 'flagged'
  ) {
    return true
  }

  const owners = rs.ownerReviews
  if (!owners) return false
  return Object.values(owners).some(
    (owner) =>
      owner.amlReview?.status === 'info_requested' ||
      owner.amlReview?.status === 'flagged' ||
      owner.hoKycReview?.status === 'changes_requested',
  )
}

/**
 * Document Review (ho-kyc) demo: `true` when the reviewer may edit KYC intake fields inline.
 * Demo defaults to editable when AML has cleared and HO KYC review is pending.
 */
export function useHoKycFormsEditable(): boolean {
  const { state } = useWorkflow()
  const mode = state.demoViewMode
  if (mode !== 'ho-kyc' && mode !== 'ho-principal' && mode !== 'ho-documents') return false

  const childId = state.activeChildActionId
  if (!childId) return false

  const child = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === childId)
  if (!child || child.childType !== 'kyc' || child.status !== 'awaiting_review') return false

  const rights = (state.taskData[`${childId}-ho-rights`] as Record<string, unknown> | undefined) ?? {}
  if (rights.canEditKycFields === false) return false

  const rs = getChildReviewState(state, childId)
  if (!rs) return false

  return rs.amlReview?.status === 'cleared' && rs.hoKycReview?.status === 'pending'
}

/**
 * Advisor demo: `true` when the child has been through review and needs correction / resubmit.
 * First-time drafts (no review state) are `false` so the footer shows Next / Submit, not Resubmit.
 */
export function useAdvisorResubmitEligible(): boolean {
  const { state } = useWorkflow()
  if (state.demoViewMode !== 'advisor') return false

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeChildActionId)
  if (!child) return false

  if (
    child.childType === 'account-opening' &&
    (child.status === 'not_started' || child.status === 'in_progress')
  ) {
    return false
  }

  const rs = getChildReviewState(state, state.activeChildActionId)

  if (child.childType === 'account-opening' && rs && isAccountInAmlEscalationQueue(rs)) {
    return false
  }

  if (child.status === 'rejected') return true

  if (!rs) return false

  if (child.childType === 'kyc') {
    return (
      rs.amlReview?.status === 'info_requested' ||
      rs.amlReview?.status === 'flagged' ||
      rs.hoKycReview?.status === 'changes_requested' ||
      false
    )
  }

  if (
    rs.documentReview?.status === 'nigo' ||
    rs.principalReview?.status === 'nigo' ||
    rs.amlReview?.status === 'info_requested' ||
    rs.amlReview?.status === 'flagged'
  ) {
    return true
  }

  const owners = rs.ownerReviews
  if (!owners) return false
  return Object.values(owners).some(
    (owner) =>
      owner.amlReview?.status === 'info_requested' ||
      owner.amlReview?.status === 'flagged' ||
      owner.hoKycReview?.status === 'changes_requested',
  )
}
