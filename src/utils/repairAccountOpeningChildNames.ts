import {
  JOHN_SMITH_ONBOARDING_JOURNEY_ID,
} from '@/data/defaultOnboardingJourney'
import { seedOpenAccountsAdditionalInstructions } from '@/data/seed'
import type { EsignEnvelope } from '@/types/esignEnvelope'
import type {
  Action,
  ChildReviewState,
  ChildTask,
  JourneyOnboardingConfig,
  TaskStatus,
  WorkflowState,
} from '@/types/workflow'
import { generateAccountOpenIdentifiers } from '@/utils/accountOpenIdentifiers'
import { getChildTypeConfig } from '@/utils/childTaskRegistry'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { hasOwnerLevelAmlFlag } from '@/utils/childStatusDisplay'
import {
  findLatestOwnerReviewForParty,
  hydrateAccountOwnerReviewsFromExisting,
  ownersPassedOwnerLevelKyc,
} from '@/utils/ownerKycReview'
import {
  isOpenAccountsFormKey,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { accountOpeningChildNameWithAccountTail } from '@/utils/openAccountsChildRowLabel'

function listAccountOpeningChildIds(state: WorkflowState): string[] {
  return state.tasks
    .flatMap((task) => task.children ?? [])
    .filter((child) => child.childType === 'account-opening')
    .map((child) => child.id)
}

function accountHasOwnerAmlFlag(
  state: WorkflowState,
  accountChildId: string,
  review: ChildReviewState,
): boolean {
  if (hasOwnerLevelAmlFlag(review)) return true
  if (review.amlFlagged) return true
  if (
    review.amlReview?.status === 'flagged' ||
    review.amlReview?.status === 'escalated'
  ) {
    return true
  }
  for (const party of getAccountPartiesRequiringKyc(state, accountChildId)) {
    const owner =
      review.ownerReviews?.[party.id] ??
      findLatestOwnerReviewForParty(state, party.id, accountChildId)
    if (
      owner?.amlReview?.status === 'flagged' ||
      owner?.amlReview?.status === 'escalated'
    ) {
      return true
    }
  }
  return false
}

function stripAccountTailSuffix(name: string): string {
  return name.replace(/\s+\.\.\.\d{4}$/, '').trim()
}

/** Remove legacy `Account 1` / `Account 2` suffixes from the registration label. */
function stripAccountTypeIndexFromBaseName(base: string): string {
  return base.replace(/(\s+Account)\s+\d+$/i, '$1').trim()
}

function normalizeLegacyAccountOpeningChildName(
  name: string,
  accountNumber?: string,
): string {
  const withoutIndex = stripAccountTypeIndexFromBaseName(stripAccountTailSuffix(name))
  if (accountNumber?.trim()) {
    return accountOpeningChildNameWithAccountTail(withoutIndex, accountNumber)
  }
  const tailMatch = name.match(/(\s+\.\.\.\d{4})$/)
  return tailMatch ? `${withoutIndex}${tailMatch[1]}` : withoutIndex
}

/**
 * Repair persisted workflow state: drop `Individual Account 1` style indexes and
 * normalize to `{Registration} Account ...{last4}` using each child's account number.
 */
export function repairIndexedAccountOpeningChildNames(state: WorkflowState): WorkflowState {
  const renameMap = new Map<string, string>()
  let tasksChanged = false

  let tasks = state.tasks.map((t) => {
    if (!t.children?.length) return t
    let rowChanged = false
    const children = t.children.map((c) => {
      if (c.childType !== 'account-opening') return c
      const taskMeta = state.taskData[c.id] as Record<string, unknown> | undefined
      const accountNumber =
        typeof taskMeta?.accountNumber === 'string' ? taskMeta.accountNumber : undefined
      const nextName = normalizeLegacyAccountOpeningChildName(c.name, accountNumber)
      if (nextName === c.name) return c
      rowChanged = true
      renameMap.set(c.name, nextName)
      return { ...c, name: nextName }
    })
    if (!rowChanged) return t
    tasksChanged = true
    return { ...t, children }
  })

  if (renameMap.size > 0) {
    tasks = tasks.map((t) => {
      if (!t.children?.length) return t
      let rowChanged = false
      const children = t.children.map((c) => {
        if (c.childType !== 'account-opening' || !c.name.includes(' - Annuity')) return c
        for (const [oldParent, newParent] of renameMap) {
          const prefix = `${oldParent} - Annuity`
          if (c.name.startsWith(prefix)) {
            const next = newParent + c.name.slice(oldParent.length)
            if (next !== c.name) {
              rowChanged = true
              renameMap.set(c.name, next)
              return { ...c, name: next }
            }
          }
        }
        return c
      })
      if (!rowChanged) return t
      tasksChanged = true
      return { ...t, children }
    })
  }

  const childNameById = new Map(
    tasks.flatMap((t) => t.children ?? []).map((c) => [c.id, c.name] as const),
  )

  let taskData = state.taskData
  let taskDataChanged = false
  for (const task of tasks) {
    if (
      task.formKey !== OPEN_ACCOUNTS_FORM_KEY &&
      task.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
    ) {
      continue
    }
    const data = taskData[task.id] as Record<string, unknown> | undefined
    if (!data) continue
    const envelopes = data.esignEnvelopes as EsignEnvelope[] | undefined
    if (!Array.isArray(envelopes) || envelopes.length === 0) continue

    let envelopesChanged = false
    const nextEnvelopes = envelopes.map((env) => {
      let selectionsChanged = false
      const formSelections = env.formSelections?.map((row) => {
        const fromChild = childNameById.get(row.accountChildId)
        const fromRename = row.accountOpeningName
          ? renameMap.get(row.accountOpeningName)
          : undefined
        const nextOpeningName = fromChild ?? fromRename ?? row.accountOpeningName
        if (nextOpeningName && nextOpeningName !== row.accountOpeningName) {
          selectionsChanged = true
          return { ...row, accountOpeningName: nextOpeningName }
        }
        return row
      })
      if (!selectionsChanged) return env
      envelopesChanged = true
      return { ...env, formSelections }
    })

    if (!envelopesChanged) continue
    taskDataChanged = true
    taskData = { ...taskData, [task.id]: { ...data, esignEnvelopes: nextEnvelopes } }
  }

  if (!tasksChanged && !taskDataChanged) return state
  return { ...state, tasks, taskData }
}

/**
 * Persisted workflow: copy person-level owner KYC onto each account child, then set
 * `accountWorkflowPhase` to `escalation_hold` when any owner has an AML flag and the
 * account is still in the AML queue (not document/principal/complete).
 */
export function repairAmlFlaggedAccountWorkflowPhase(state: WorkflowState): WorkflowState {
  let next = state
  for (const childId of listAccountOpeningChildIds(state)) {
    next = hydrateAccountOwnerReviewsFromExisting(next, childId)
  }

  const reviews = next.childReviewsByChildId
  if (!reviews) return next

  const statusByChildId = new Map(
    next.tasks
      .flatMap((task) => task.children ?? [])
      .map((child) => [child.id, child.status] as const),
  )

  let changed = false
  const nextReviews = { ...reviews }

  for (const childId of listAccountOpeningChildIds(next)) {
    const review = nextReviews[childId]
    if (!review) continue
    const rawStatus = statusByChildId.get(childId)
    if (rawStatus !== 'awaiting_review' && rawStatus !== 'rejected') continue
    if (!accountHasOwnerAmlFlag(next, childId, review)) continue

    const phase = review.accountWorkflowPhase
    if (phase === 'escalation_hold') continue
    if (
      phase === 'document_review' ||
      phase === 'principal_review' ||
      phase === 'complete' ||
      phase === 'pending_release'
    ) {
      continue
    }
    if (phase !== 'aml_review' && phase != null) continue

    nextReviews[childId] = { ...review, accountWorkflowPhase: 'escalation_hold' }
    changed = true
  }

  if (!changed) return next
  return { ...next, childReviewsByChildId: nextReviews }
}

/** Stale submits routed to principal while HO document review was still pending. */
export function repairPrematurePrincipalReviewPhase(state: WorkflowState): WorkflowState {
  const reviews = state.childReviewsByChildId
  if (!reviews) return state
  let changed = false
  const nextReviews = { ...reviews }
  for (const [childId, review] of Object.entries(reviews)) {
    if (review.accountWorkflowPhase !== 'principal_review') continue
    if (review.documentReview?.status === 'igo') continue
    if (!ownersPassedOwnerLevelKyc(review)) continue
    nextReviews[childId] = {
      ...review,
      accountWorkflowPhase: 'document_review',
      principalReview: review.principalReview?.status === 'igo' ? review.principalReview : undefined,
    }
    changed = true
  }
  if (!changed) return state
  return { ...state, childReviewsByChildId: nextReviews }
}

/**
 * Demo remap for John Smith onboarding (last four digits only).
 * Target custodian tails: 9712, 9714, 9716.
 */
export const DEMO_ACCOUNT_LAST4_REMAP: Record<string, string> = {
  '1002': '9712',
  '1004': '9714',
  '1006': '9716',
  '2282': '9712',
  '2284': '9714',
  '2286': '9716',
}

function remapAccountNumberLast4(
  accountNumber: string,
  map: Record<string, string> = DEMO_ACCOUNT_LAST4_REMAP,
): string | undefined {
  const digits = accountNumber.replace(/\D/g, '')
  if (digits.length < 4) return undefined
  const last4 = digits.slice(-4)
  const next4 = map[last4]
  if (!next4) return undefined
  const nextDigits = `${digits.slice(0, -4)}${next4}`
  if (/^\d+$/.test(accountNumber.trim())) return nextDigits
  return accountNumber.replace(/\d{4}(?!\d)/, next4)
}

function esignAccountNumberLabelForChild(
  meta: Record<string, unknown> | undefined,
): string {
  const acct = String(meta?.accountNumber ?? '').trim()
  const short = String(meta?.shortName ?? '').trim()
  return acct || short || 'Not assigned'
}

function last4FromDisplayTail(value: string): string | undefined {
  const tail = value.match(/(?:\.\.\.|#)(\d{4})\s*$/)?.[1]
  return tail
}

function remapDisplayTail(value: string, map: Record<string, string>): string | undefined {
  const last4 = last4FromDisplayTail(value)
  if (!last4 || !map[last4]) return undefined
  return value.replace(new RegExp(`${last4}(?=\\s*$)`), map[last4])
}

/** True when persisted workflow still shows the old demo account tails. */
export function stateHasRemappableDemoAccountLast4(state: WorkflowState): boolean {
  for (const child of state.tasks.flatMap((t) => t.children ?? [])) {
    if (child.childType !== 'account-opening') continue
    const meta = state.taskData[child.id] as Record<string, unknown> | undefined
    const acct = typeof meta?.accountNumber === 'string' ? meta.accountNumber.trim() : ''
    if (acct && remapAccountNumberLast4(acct)) return true
    const nameTail = last4FromDisplayTail(child.name)
    if (nameTail && DEMO_ACCOUNT_LAST4_REMAP[nameTail]) return true
  }
  for (const task of state.tasks) {
    if (
      task.formKey !== OPEN_ACCOUNTS_FORM_KEY &&
      task.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
    ) {
      continue
    }
    const data = state.taskData[task.id] as { esignEnvelopes?: EsignEnvelope[] } | undefined
    for (const env of data?.esignEnvelopes ?? []) {
      for (const row of env.formSelections ?? []) {
        if (row.accountNumberLabel && remapAccountNumberLast4(row.accountNumberLabel)) return true
        if (row.accountOpeningName && remapDisplayTail(row.accountOpeningName, DEMO_ACCOUNT_LAST4_REMAP)) {
          return true
        }
      }
    }
  }
  return false
}

function resolveAccountNumberForChild(
  child: ChildTask,
  meta: Record<string, unknown> | undefined,
  map: Record<string, string>,
): string {
  const stored =
    typeof meta?.accountNumber === 'string' ? meta.accountNumber.trim() : ''
  if (stored) {
    const remapped = remapAccountNumberLast4(stored, map)
    if (remapped) return remapped
    if (stored) return stored
  }
  const nameTail = last4FromDisplayTail(child.name)
  const baseName = stripAccountTailSuffix(child.name)
  const generated = generateAccountOpenIdentifiers(baseName, child.id).accountNumber
  if (nameTail && map[nameTail]) {
    return remapAccountNumberLast4(generated, map) ?? `${generated.slice(0, -4)}${map[nameTail]}`
  }
  return generated
}

function accountChildNeedsLast4Repair(
  child: ChildTask,
  meta: Record<string, unknown> | undefined,
  map: Record<string, string>,
): boolean {
  if (child.childType !== 'account-opening') return false
  const stored =
    typeof meta?.accountNumber === 'string' ? meta.accountNumber.trim() : ''
  if (stored && remapAccountNumberLast4(stored, map)) return true
  const nameTail = last4FromDisplayTail(child.name)
  if (nameTail && map[nameTail]) return true
  const nextNumber = resolveAccountNumberForChild(child, meta, map)
  const nextName = accountOpeningChildNameWithAccountTail(
    stripAccountTailSuffix(child.name),
    nextNumber,
  )
  return nextName !== child.name.trim() || stored !== nextNumber
}

/**
 * Rewrites persisted custodian account numbers (and all UI labels derived from them)
 * for the demo last-four remap above.
 */
export function repairAccountOpeningAccountNumberLast4(state: WorkflowState): WorkflowState {
  const map = DEMO_ACCOUNT_LAST4_REMAP
  let tasksChanged = false
  let taskDataChanged = false
  let tasks = state.tasks
  let taskData = state.taskData

  const childMetaById = new Map<string, Record<string, unknown>>()

  tasks = tasks.map((task) => {
    if (!task.children?.length) return task
    let rowChanged = false
    const children = task.children.map((child) => {
      if (child.childType !== 'account-opening') return child
      const meta = (taskData[child.id] as Record<string, unknown> | undefined) ?? {}
      if (!accountChildNeedsLast4Repair(child, meta, map)) return child

      const current =
        typeof meta.accountNumber === 'string' ? meta.accountNumber.trim() : ''
      const nextNumber = resolveAccountNumberForChild(child, meta, map)
      const nextMeta = { ...meta, accountNumber: nextNumber }
      taskData = { ...taskData, [child.id]: nextMeta }
      childMetaById.set(child.id, nextMeta)
      if (nextNumber !== current) taskDataChanged = true
      else if (nextMeta !== meta) taskDataChanged = true

      const nextName = accountOpeningChildNameWithAccountTail(
        stripAccountTailSuffix(child.name),
        nextNumber,
      )
      rowChanged = true
      return { ...child, name: nextName }
    })
    if (!rowChanged) return task
    tasksChanged = true
    return { ...task, children }
  })

  for (const task of tasks) {
    if (
      task.formKey !== OPEN_ACCOUNTS_FORM_KEY &&
      task.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
    ) {
      continue
    }
    const data = taskData[task.id] as Record<string, unknown> | undefined
    if (!data) continue
    const envelopes = data.esignEnvelopes as EsignEnvelope[] | undefined
    if (!Array.isArray(envelopes) || envelopes.length === 0) continue

    let envelopesChanged = false
    const nextEnvelopes = envelopes.map((env) => {
      let selectionsChanged = false
      const formSelections = env.formSelections?.map((row) => {
        const child = tasks
          .flatMap((t) => t.children ?? [])
          .find((c) => c.id === row.accountChildId)
        if (!child || child.childType !== 'account-opening') return row
        const meta =
          childMetaById.get(row.accountChildId) ??
          (taskData[row.accountChildId] as Record<string, unknown> | undefined)
        const nextOpeningName = child.name
        const nextLabel = esignAccountNumberLabelForChild(meta)
        const openingChanged = nextOpeningName !== row.accountOpeningName
        const labelChanged = nextLabel !== row.accountNumberLabel
        if (!openingChanged && !labelChanged) return row
        selectionsChanged = true
        return {
          ...row,
          accountOpeningName: nextOpeningName,
          accountNumberLabel: nextLabel,
        }
      })
      if (!selectionsChanged) return env
      envelopesChanged = true
      return { ...env, formSelections }
    })

    if (!envelopesChanged) continue
    taskDataChanged = true
    taskData = { ...taskData, [task.id]: { ...data, esignEnvelopes: nextEnvelopes } }
  }

  if (!tasksChanged && !taskDataChanged) return state
  return { ...state, tasks, taskData }
}

const ACCOUNT_CHILD_ID_RE = /^acct-child-\d+-\d+$/

/** IDs mistakenly injected by an earlier migration — never substitute for user-created accounts. */
export const ACCIDENTAL_DEMO_SEED_CHILD_IDS = new Set([
  'acct-child-9712-01',
  'acct-child-9714-02',
  'acct-child-9716-03',
])

function isAccidentalDemoSeedChildId(childId: string): boolean {
  return ACCIDENTAL_DEMO_SEED_CHILD_IDS.has(childId)
}

/** True when localStorage still holds account / eSign / review data but task `children` may be missing. */
export function hasDetachedAccountOpeningPersistenceEvidence(state: WorkflowState): boolean {
  const openTask = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  if (openTask?.edited) return true
  if (collectOrphanAccountOpeningChildIds(state).length > 0) return true
  if (
    Object.keys(state.childReviewsByChildId ?? {}).some((id) => ACCOUNT_CHILD_ID_RE.test(id))
  ) {
    return true
  }
  if (
    Object.keys(state.childReviewDecisionsByChildId ?? {}).some((id) =>
      ACCOUNT_CHILD_ID_RE.test(id),
    )
  ) {
    return true
  }
  const openData = state.taskData['open-accounts'] as
    | { esignEnvelopes?: EsignEnvelope[] }
    | undefined
  return (openData?.esignEnvelopes?.length ?? 0) > 0
}

function accountChildIdFromTaskDataKey(key: string): string | undefined {
  const match = key.match(/^(acct-child-\d+-\d+)/)
  return match?.[1]
}

/** IDs referenced by reviews, sub-task data, or eSign rows but missing from the Open Accounts task. */
export function collectOrphanAccountOpeningChildIds(state: WorkflowState): string[] {
  const ids = new Set<string>()

  for (const key of Object.keys(state.taskData)) {
    const childId = accountChildIdFromTaskDataKey(key)
    if (childId && ACCOUNT_CHILD_ID_RE.test(childId)) ids.add(childId)
  }

  for (const childId of Object.keys(state.childReviewsByChildId ?? {})) {
    if (ACCOUNT_CHILD_ID_RE.test(childId)) ids.add(childId)
  }

  for (const task of state.tasks) {
    if (
      task.formKey !== OPEN_ACCOUNTS_FORM_KEY &&
      task.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
    ) {
      continue
    }
    const data = state.taskData[task.id] as { esignEnvelopes?: EsignEnvelope[] } | undefined
    for (const env of data?.esignEnvelopes ?? []) {
      for (const row of env.formSelections ?? []) {
        if (row.accountChildId && ACCOUNT_CHILD_ID_RE.test(row.accountChildId)) {
          ids.add(row.accountChildId)
        }
      }
      for (const signer of env.signers ?? []) {
        for (const childId of signer.accountChildIds ?? []) {
          if (ACCOUNT_CHILD_ID_RE.test(childId)) ids.add(childId)
        }
      }
    }
  }

  return [...ids]
}

function findExistingAccountOpeningChild(
  state: WorkflowState,
  childId: string,
): ChildTask | undefined {
  for (const task of state.tasks) {
    const child = (task.children ?? []).find((c) => c.id === childId)
    if (child?.childType === 'account-opening') return child
  }
  return undefined
}

/**
 * Drop mistaken demo-seed account rows when real user-created account ids still exist in
 * taskData / eSign / reviews (from the Add accounts flow).
 */
export function removeAccidentalDemoSeedAccountChildren(state: WorkflowState): WorkflowState {
  const userOrphanIds = collectOrphanAccountOpeningChildIds(state).filter(
    (id) => !isAccidentalDemoSeedChildId(id),
  )
  if (userOrphanIds.length === 0) return state

  let tasksChanged = false
  let taskDataChanged = false
  let taskData = state.taskData

  const tasks = state.tasks.map((task) => {
    const children = task.children ?? []
    const nextChildren = children.filter((c) => !isAccidentalDemoSeedChildId(c.id))
    if (nextChildren.length === children.length) return task
    tasksChanged = true
    return { ...task, children: nextChildren }
  })

  for (const seedId of ACCIDENTAL_DEMO_SEED_CHILD_IDS) {
    if (taskData[seedId]) {
      if (!taskDataChanged) taskData = { ...taskData }
      delete taskData[seedId]
      taskDataChanged = true
    }
    for (const key of Object.keys(taskData)) {
      if (!key.startsWith(`${seedId}-`)) continue
      if (!taskDataChanged) taskData = { ...taskData }
      delete taskData[key]
      taskDataChanged = true
    }
  }

  if (!tasksChanged && !taskDataChanged) return state
  return { ...state, tasks, taskData }
}

function inferAccountChildDisplayName(state: WorkflowState, childId: string): string {
  for (const task of state.tasks) {
    if (
      task.formKey !== OPEN_ACCOUNTS_FORM_KEY &&
      task.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
    ) {
      continue
    }
    const data = state.taskData[task.id] as { esignEnvelopes?: EsignEnvelope[] } | undefined
    for (const env of data?.esignEnvelopes ?? []) {
      const row = env.formSelections?.find((r) => r.accountChildId === childId)
      if (row?.accountOpeningName?.trim()) {
        return row.accountOpeningName.trim()
      }
    }
  }
  return 'Individual Account'
}

function inferAccountChildStatus(review?: ChildReviewState): TaskStatus {
  if (review?.accountOpeningPreReviewTimeline?.submittedForReviewAt) return 'awaiting_review'
  if (
    review?.accountWorkflowPhase &&
    review.accountWorkflowPhase !== 'draft'
  ) {
    return 'awaiting_review'
  }
  return 'not_started'
}

function rebuildAccountOpeningChild(state: WorkflowState, childId: string): ChildTask {
  const cfg = getChildTypeConfig('account-opening')
  const existing = findExistingAccountOpeningChild(state, childId)
  const review = state.childReviewsByChildId?.[childId]
  const meta = state.taskData[childId] as Record<string, unknown> | undefined
  const accountNumber =
    typeof meta?.accountNumber === 'string'
      ? meta.accountNumber
      : generateAccountOpenIdentifiers('Individual Account', childId).accountNumber
  const displayName = inferAccountChildDisplayName(state, childId)
  const baseName =
    stripAccountTailSuffix(existing?.name ?? displayName) || 'Individual Account'
  const status = existing?.status ?? inferAccountChildStatus(review)
  return {
    id: childId,
    name: accountOpeningChildNameWithAccountTail(baseName, accountNumber),
    status,
    formKey: cfg.idPrefix,
    childType: 'account-opening',
  }
}

/**
 * Restore account-opening `children` when localStorage still has reviews / taskData / eSign
 * rows but the task list was cleared (e.g. after an accidental INITIALIZE_FROM_RELATIONSHIP).
 */
export function repairMissingAccountOpeningChildren(state: WorkflowState): WorkflowState {
  const orphanIds = collectOrphanAccountOpeningChildIds(state)
  if (orphanIds.length === 0) return state

  const openTask = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  if (!openTask) return state

  const existingIds = new Set((openTask.children ?? []).map((c) => c.id))
  const toAdd = orphanIds.filter((id) => !existingIds.has(id))
  if (toAdd.length === 0) return state

  const restored = toAdd.map((id) => rebuildAccountOpeningChild(state, id))
  const tasks = state.tasks.map((task) => {
    if (task.formKey !== OPEN_ACCOUNTS_FORM_KEY) return task
    return {
      ...task,
      edited: true,
      children: [...(task.children ?? []), ...restored],
    }
  })

  return {
    ...state,
    tasks,
    flatTaskOrder: state.flatTaskOrder,
  }
}

/**
 * Undo {@link repairMissingAccountOpeningChildren} attaching the same brokerage children to the
 * annuity-order task — breadcrumbs and GO_TO_TASK must resolve to `open-accounts`, not annuity.
 */
export function repairDuplicateAccountOpeningChildrenOnAnnuityTask(
  state: WorkflowState,
): WorkflowState {
  const primary = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  const annuity = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  if (!primary || !annuity) return state

  const primaryAccountChildIds = new Set(
    (primary.children ?? [])
      .filter((c) => c.childType === 'account-opening')
      .map((c) => c.id),
  )
  if (primaryAccountChildIds.size === 0) return state

  const annuityChildren = annuity.children ?? []
  const nextAnnuityChildren = annuityChildren.filter(
    (c) => c.childType !== 'account-opening' || !primaryAccountChildIds.has(c.id),
  )
  if (nextAnnuityChildren.length === annuityChildren.length) return state

  const tasks = state.tasks.map((task) =>
    task.id === annuity.id ? { ...task, children: nextAnnuityChildren } : task,
  )

  const activeTaskId =
    state.activeTaskId === annuity.id &&
    state.activeChildActionId != null &&
    primaryAccountChildIds.has(state.activeChildActionId)
      ? primary.id
      : state.activeTaskId

  return { ...state, tasks, activeTaskId }
}

/**
 * Gather non-annuity account-opening children from every open-accounts task onto the
 * primary `open-accounts` row (repairs split/migration states that stranded the list).
 */
export function consolidateAccountOpeningChildrenOnPrimaryTask(
  state: WorkflowState,
): WorkflowState {
  const primary = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  if (!primary) return state

  const brokerageById = new Map<string, ChildTask>()
  for (const task of state.tasks) {
    if (!isOpenAccountsFormKey(task.formKey)) continue
    for (const child of task.children ?? []) {
      if (child.childType !== 'account-opening') continue
      if (child.name.includes(' - Annuity')) continue
      brokerageById.set(child.id, child)
    }
  }

  const primaryIds = new Set((primary.children ?? []).map((c) => c.id))
  const missing = [...brokerageById.values()].filter((c) => !primaryIds.has(c.id))
  if (missing.length === 0) return state

  const moveIds = new Set(missing.map((c) => c.id))
  const tasks = state.tasks.map((task) => {
    if (task.id === primary.id) {
      return {
        ...task,
        edited: true,
        children: [...(task.children ?? []), ...missing],
      }
    }
    if (!isOpenAccountsFormKey(task.formKey)) return task
    const nextChildren = (task.children ?? []).filter((c) => !moveIds.has(c.id))
    if (nextChildren.length === (task.children ?? []).length) return task
    return { ...task, children: nextChildren }
  })

  let activeTaskId = state.activeTaskId
  if (
    state.activeChildActionId &&
    moveIds.has(state.activeChildActionId) &&
    state.activeTaskId !== primary.id
  ) {
    activeTaskId = primary.id
  }

  return { ...state, tasks, activeTaskId }
}

const DEFAULT_SPLIT_ONBOARDING_CONFIG: JourneyOnboardingConfig = {
  office: '',
  investmentProfessionalId: '',
  openMultipleAccounts: true,
  openAnnuityAccount: true,
}

function shouldHaveSplitOpenAccountsJourney(state: WorkflowState): boolean {
  if (state.journeyOnboardingConfig?.openAnnuityAccount === true) return true
  if (state.journeyId === JOHN_SMITH_ONBOARDING_JOURNEY_ID) return true
  return state.tasks.some((t) => t.id === 'open-accounts-annuity')
}

function isSplitOpenAccountsJourney(state: WorkflowState): boolean {
  return (
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  )
}

/**
 * Restore the v5/v6 split journey (Account Opening group + Forms Package rows) when localStorage
 * lost `open-accounts-annuity` or `journeyOnboardingConfig` after a partial init/migration.
 */
export function repairSplitOpenAccountsJourneyTasks(state: WorkflowState): WorkflowState {
  if (!shouldHaveSplitOpenAccountsJourney(state)) return state
  if (isSplitOpenAccountsJourney(state)) {
    let changed = false
    let tasks = state.tasks
    let actions = state.actions
    let journeyOnboardingConfig = state.journeyOnboardingConfig

    const openNo = tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
    const openWith = tasks.find((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
    if (openNo && openNo.order !== 2) {
      tasks = tasks.map((t) =>
        t.id === openNo.id ? { ...t, order: 2, actionId: 'account-opening' } : t,
      )
      changed = true
    }
    if (openWith && openWith.order !== 1) {
      tasks = tasks.map((t) =>
        t.id === openWith.id ? { ...t, order: 1, actionId: 'account-opening' } : t,
      )
      changed = true
    }
    if (!actions.some((a) => a.id === 'account-opening')) {
      actions = [
        ...actions.filter((a) => a.id !== 'account-opening'),
        { id: 'account-opening', title: 'Open Accounts', order: 2 },
      ]
      changed = true
    }
    if (!journeyOnboardingConfig?.openAnnuityAccount) {
      journeyOnboardingConfig = {
        ...DEFAULT_SPLIT_ONBOARDING_CONFIG,
        ...journeyOnboardingConfig,
        openAnnuityAccount: true,
        openMultipleAccounts: journeyOnboardingConfig?.openMultipleAccounts ?? true,
      }
      changed = true
    }
    if (!changed) return state
    return { ...state, tasks, actions, journeyOnboardingConfig }
  }

  const assignee =
    state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)?.assignedTo ??
    state.assignedTo ??
    'Unassigned'
  const status =
    state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)?.status ?? 'in_progress'

  let tasks = [...state.tasks]
  let taskData = { ...state.taskData }
  let actions: Action[] = state.actions.some((a) => a.id === 'account-opening')
    ? state.actions
    : [
        ...state.actions.filter((a) => a.id !== 'account-opening'),
        { id: 'account-opening', title: 'Open Accounts', order: 2 },
      ]

  const existingNo = tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  const existingWith = tasks.find((t) => t.id === 'open-accounts-annuity')

  if (!existingNo) {
    tasks.push({
      id: 'open-accounts',
      title: 'Open Accounts',
      actionId: 'account-opening',
      status,
      assignedTo: assignee,
      formKey: OPEN_ACCOUNTS_FORM_KEY,
      order: 2,
      unread: true,
      edited: false,
      children: [],
    })
    taskData = {
      ...taskData,
      'open-accounts': taskData['open-accounts'] ?? {
        additionalInstructions: seedOpenAccountsAdditionalInstructions,
      },
    }
  } else {
    tasks = tasks.map((t) =>
      t.formKey === OPEN_ACCOUNTS_FORM_KEY
        ? { ...t, actionId: 'account-opening', order: 2 }
        : t,
    )
  }

  if (!existingWith) {
    tasks.push({
      id: 'open-accounts-annuity',
      title: 'Open Accounts',
      actionId: 'account-opening',
      status,
      assignedTo: assignee,
      formKey: OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
      order: 1,
      unread: true,
      edited: false,
      children: [],
    })
    taskData = {
      ...taskData,
      'open-accounts-annuity': taskData['open-accounts-annuity'] ?? {
        additionalInstructions: seedOpenAccountsAdditionalInstructions,
      },
    }
  }

  const journeyOnboardingConfig: JourneyOnboardingConfig = {
    ...DEFAULT_SPLIT_ONBOARDING_CONFIG,
    ...state.journeyOnboardingConfig,
    openAnnuityAccount: true,
    openMultipleAccounts: state.journeyOnboardingConfig?.openMultipleAccounts ?? true,
  }

  return {
    ...state,
    tasks,
    actions,
    taskData,
    journeyOnboardingConfig,
  }
}

/** Default v6 Account Opening sub-page when split journey loads with a stale null page. */
export function repairV6SplitNavigationPage(state: WorkflowState): WorkflowState {
  if (!isSplitOpenAccountsJourney(state)) return state
  if (state.v5NoAnnuityOpenAccountsPage != null) return state
  return { ...state, v5NoAnnuityOpenAccountsPage: 'instructions' }
}

/**
 * Brokerage account-opening children belong on `open-accounts`, not the annuity-order task.
 * Repairs states where migration attached them only to `open-accounts-annuity`.
 */
export function relocateBrokerageAccountChildrenToPrimaryTask(
  state: WorkflowState,
): WorkflowState {
  const primary = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  const annuity = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  if (!primary || !annuity) return state

  const primaryIds = new Set((primary.children ?? []).map((c) => c.id))
  const toMove = (annuity.children ?? []).filter(
    (c) =>
      c.childType === 'account-opening' &&
      !c.name.includes(' - Annuity') &&
      !primaryIds.has(c.id),
  )
  if (toMove.length === 0) return state

  const moveIds = new Set(toMove.map((c) => c.id))
  const tasks = state.tasks.map((task) => {
    if (task.id === primary.id) {
      return {
        ...task,
        edited: true,
        children: [...(task.children ?? []), ...toMove],
      }
    }
    if (task.id === annuity.id) {
      return {
        ...task,
        children: (task.children ?? []).filter((c) => !moveIds.has(c.id)),
      }
    }
    return task
  })

  let activeTaskId = state.activeTaskId
  if (
    state.activeChildActionId &&
    moveIds.has(state.activeChildActionId) &&
    activeTaskId === annuity.id
  ) {
    activeTaskId = primary.id
  }

  return { ...state, tasks, activeTaskId }
}
