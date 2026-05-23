import type { EsignEnvelope } from '@/types/esignEnvelope'
import type { ChildTask, WorkflowState } from '@/types/workflow'
import { accountOpeningChildNameWithAccountTail } from '@/utils/openAccountsChildRowLabel'
import {
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'

export const DEMO_ACCOUNT_NUMBER_OVERRIDES_KEY = 'demo-account-number-overrides'

/** First brokerage account tail; each additional account on Open Accounts adds {@link DEMO_BROKERAGE_ACCOUNT_LAST4_STEP}. */
export const DEMO_BROKERAGE_ACCOUNT_LAST4_START = 9712
export const DEMO_BROKERAGE_ACCOUNT_LAST4_STEP = 2
/** Full number = prefix + 4-digit tail (10 digits total). */
export const DEMO_BROKERAGE_ACCOUNT_NUMBER_PREFIX = '100000'

export function demoBrokerageAccountLast4(index: number): string {
  const tail = DEMO_BROKERAGE_ACCOUNT_LAST4_START + index * DEMO_BROKERAGE_ACCOUNT_LAST4_STEP
  return String(tail).padStart(4, '0')
}

/** 0-based brokerage index on non-annuity Open Accounts → demo custodian number. */
export function demoAccountNumberForBrokerageIndex(index: number): string {
  return `${DEMO_BROKERAGE_ACCOUNT_NUMBER_PREFIX}${demoBrokerageAccountLast4(index)}`
}

export function demoScreenshotAccountNumbers(count: number): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) =>
    demoAccountNumberForBrokerageIndex(i),
  )
}

export type DemoAccountNumberOverrides = {
  version: 1
  /** Exact `acct-child-*` id → full custodian account number. */
  byChildId?: Record<string, string>
  /** Match current last-four (from stored number or row label) → full number. */
  byLast4?: Record<string, string>
  /**
   * Assign numbers to brokerage accounts on the non-annuity Open Accounts task, in UI order.
   * Use after recreating accounts (new child ids) while keeping screenshot tails.
   */
  byOrderOnOpenAccounts?: string[]
}

function stripAccountTailSuffix(name: string): string {
  return name.replace(/\s+\.\.\.\d{4}$/, '').trim()
}

function last4FromAccountNumber(value: string): string | undefined {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : undefined
}

function listBrokerageAccountChildren(state: WorkflowState): ChildTask[] {
  const primary = state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  return (primary?.children ?? []).filter(
    (c) => c.childType === 'account-opening' && !c.name.includes(' - Annuity'),
  )
}

function listAllAccountOpeningChildren(state: WorkflowState): ChildTask[] {
  return state.tasks.flatMap((t) =>
    (t.children ?? []).filter((c) => c.childType === 'account-opening'),
  )
}

function esignAccountNumberLabelForChild(meta: Record<string, unknown> | undefined): string {
  const acct = String(meta?.accountNumber ?? '').trim()
  const short = String(meta?.shortName ?? '').trim()
  return acct || short || 'Not assigned'
}

function resolveOverrideTargets(
  state: WorkflowState,
  overrides: DemoAccountNumberOverrides,
): Map<string, string> {
  const targets = new Map<string, string>()

  for (const [childId, accountNumber] of Object.entries(overrides.byChildId ?? {})) {
    const trimmed = accountNumber.trim()
    if (trimmed) targets.set(childId, trimmed)
  }

  const byLast4 = overrides.byLast4 ?? {}
  for (const child of listAllAccountOpeningChildren(state)) {
    if (targets.has(child.id)) continue
    const meta = state.taskData[child.id] as Record<string, unknown> | undefined
    const stored = typeof meta?.accountNumber === 'string' ? meta.accountNumber.trim() : ''
    const last4 =
      (stored && last4FromAccountNumber(stored)) ||
      child.name.match(/\.{3}(\d{4})\s*$/)?.[1]
    if (last4 && byLast4[last4]?.trim()) {
      targets.set(child.id, byLast4[last4].trim())
    }
  }

  const byOrder = overrides.byOrderOnOpenAccounts ?? []
  if (byOrder.length > 0) {
    const ordered = listBrokerageAccountChildren(state)
    for (let i = 0; i < byOrder.length && i < ordered.length; i++) {
      const child = ordered[i]
      const trimmed = byOrder[i]?.trim()
      if (!child || !trimmed || targets.has(child.id)) continue
      targets.set(child.id, trimmed)
    }
  }

  return targets
}

/**
 * Set explicit custodian account numbers (and derived labels) without replacing account rows.
 * Safe to run after migrations; only touches `taskData`, child `name` tails, and eSign labels.
 */
export function applyAccountNumbersByChildId(
  state: WorkflowState,
  targetByChildId: Map<string, string>,
): WorkflowState {
  if (targetByChildId.size === 0) return state

  let tasksChanged = false
  let taskDataChanged = false
  let tasks = state.tasks
  let taskData = state.taskData
  const childMetaById = new Map<string, Record<string, unknown>>()

  tasks = tasks.map((task) => {
    if (!task.children?.length) return task
    let rowChanged = false
    const children = task.children.map((child) => {
      const nextNumber = targetByChildId.get(child.id)
      if (child.childType !== 'account-opening' || !nextNumber) return child

      const meta = (taskData[child.id] as Record<string, unknown> | undefined) ?? {}
      const current =
        typeof meta.accountNumber === 'string' ? meta.accountNumber.trim() : ''
      const nextMeta = { ...meta, accountNumber: nextNumber }
      const nextName = accountOpeningChildNameWithAccountTail(
        stripAccountTailSuffix(child.name),
        nextNumber,
      )

      if (current !== nextNumber || nextName !== child.name) {
        taskData = { ...taskData, [child.id]: nextMeta }
        childMetaById.set(child.id, nextMeta)
        taskDataChanged = true
        rowChanged = true
        return { ...child, name: nextName }
      }
      return child
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
        if (!targetByChildId.has(row.accountChildId)) return row
        const child = tasks
          .flatMap((t) => t.children ?? [])
          .find((c) => c.id === row.accountChildId)
        if (!child || child.childType !== 'account-opening') return row
        const meta =
          childMetaById.get(row.accountChildId) ??
          (taskData[row.accountChildId] as Record<string, unknown> | undefined)
        const nextOpeningName = child.name
        const nextLabel = esignAccountNumberLabelForChild(meta)
        if (
          nextOpeningName === row.accountOpeningName &&
          nextLabel === row.accountNumberLabel
        ) {
          return row
        }
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

export function readDemoAccountNumberOverrides(): DemoAccountNumberOverrides | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DEMO_ACCOUNT_NUMBER_OVERRIDES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoAccountNumberOverrides
    if (parsed?.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function writeDemoAccountNumberOverrides(overrides: DemoAccountNumberOverrides): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    DEMO_ACCOUNT_NUMBER_OVERRIDES_KEY,
    JSON.stringify({ ...overrides, version: 1 as const }),
  )
}

export function clearDemoAccountNumberOverrides(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DEMO_ACCOUNT_NUMBER_OVERRIDES_KEY)
}

export function applyDemoAccountNumberOverrides(state: WorkflowState): WorkflowState {
  const overrides = readDemoAccountNumberOverrides()
  if (!overrides) return state
  const targets = resolveOverrideTargets(state, overrides)
  return applyAccountNumbersByChildId(state, targets)
}

/** Snapshot current numbers for backup / screenshot consistency. */
export function exportAccountNumbersSnapshot(state: WorkflowState): DemoAccountNumberOverrides {
  const byChildId: Record<string, string> = {}
  const byOrderOnOpenAccounts: string[] = []

  for (const child of listAllAccountOpeningChildren(state)) {
    const meta = state.taskData[child.id] as Record<string, unknown> | undefined
    const acct =
      typeof meta?.accountNumber === 'string' ? meta.accountNumber.trim() : ''
    if (acct) byChildId[child.id] = acct
  }

  for (const child of listBrokerageAccountChildren(state)) {
    const acct = byChildId[child.id]
    if (acct) byOrderOnOpenAccounts.push(acct)
  }

  return {
    version: 1,
    byChildId,
    ...(byOrderOnOpenAccounts.length > 0 ? { byOrderOnOpenAccounts } : {}),
  }
}

export const DEMO_ACCOUNT_NUMBER_OVERRIDES_EXAMPLE: DemoAccountNumberOverrides = {
  version: 1,
  byOrderOnOpenAccounts: demoScreenshotAccountNumbers(3),
}

/** Pin overrides after Settings → Reset so reloads keep screenshot tails. */
export function seedDefaultDemoAccountNumberOverrides(): void {
  writeDemoAccountNumberOverrides(DEMO_ACCOUNT_NUMBER_OVERRIDES_EXAMPLE)
}
