import type { Journey, JourneyAction, JourneyStatus, JourneyTask } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'

/**
 * Account-opening servicing seed (Stratos × Avantos).
 *
 * Pre-filled actions and tasks for the Servicing dashboard, aligned to the
 * Stratos account-opening use case. The task flows mirror the canonical
 * Schwab/Fidelity/SEI account-opening process:
 *   Configuration → Custodian form → Supporting documents → (SIM: Investment & Model)
 *   → KYC / Identity → Suitability & Supervision review → Generate & Submit (Quik + DocuSign)
 *   → Client signature → (SIM: Quality Control) → Verify complete (account status / NIGO).
 *
 * Funding (Transfer of Assets, Contribution, Standing authorization) and
 * Account Maintenance (Resolve Custodian Alert / NIGO) appear as their own actions.
 */

type Arch = 'open' | 'open-sim' | 'toa' | 'contribution' | 'standing' | 'alert'

const TASK_TITLES: Record<Arch, string[]> = {
  open: [
    'Complete Custodian Form',
    'Upload Supporting Documents',
    'KYC / Identity Check',
    'Suitability & Supervision Review',
    'Generate & Submit Request',
    'Collect Client Signature',
    'Verify Complete',
  ],
  'open-sim': [
    'Complete Custodian Form',
    'Upload Supporting Documents',
    'Investment & Model Selection',
    'KYC / Identity Check',
    'Suitability & Supervision Review',
    'Generate & Submit Request',
    'Collect Client Signature',
    'Complete Quality Control Review',
    'Verify Complete',
  ],
  toa: ['Configuration', 'Generate & Submit Request', 'Verify Complete'],
  contribution: ['Configuration', 'Generate & Submit Request', 'Verify Complete'],
  standing: ['Configuration', 'Collect Client Signature', 'Verify Complete'],
  alert: ['Review Alert', 'Generate & Submit Request', 'Verify Complete'],
}

const ARCH_META: Record<Arch, { title: string; category: string }> = {
  open: { title: 'Open Account', category: 'Account Opening' },
  'open-sim': { title: 'Open Account', category: 'Account Opening' },
  toa: { title: 'Transfer of Assets', category: 'Move Money' },
  contribution: { title: 'Contribution', category: 'Move Money' },
  standing: { title: 'Standing Money Movement Authorization', category: 'Move Money' },
  alert: { title: 'Resolve Custodian Alert', category: 'Account Maintenance' },
}

interface ActionSpec {
  arch: Arch
  /** Action Description column — custodian / registration detail. */
  description: string
  /** Nickname suffix (Action Nickname column = "{household} – {short}"). */
  short: string
  /** Action ID column. */
  code: string
  owner: string
  /** Number of leading tasks that are complete. */
  done: number
  /** Status of the current (first not-complete) task. Defaults to 'in_progress'. */
  current?: TaskStatus
  /** ISO date anchoring the task next-step dates. */
  startDate: string
}

interface JourneySpec {
  id: string
  household: string
  /** Relationship column override (defaults to household). */
  relationship?: string
  owner: string
  createdAt: string
  actions: ActionSpec[]
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function deriveActionStatus(tasks: JourneyTask[]): JourneyStatus {
  if (tasks.length === 0) return 'not_started'
  if (tasks.every((t) => t.status === 'complete')) return 'complete'
  if (tasks.some((t) => t.status === 'awaiting_review')) return 'awaiting_review'
  if (tasks.some((t) => t.status !== 'not_started')) return 'in_progress'
  return 'not_started'
}

function buildAction(journeyId: string, household: string, spec: ActionSpec): JourneyAction {
  const meta = ARCH_META[spec.arch]
  const titles = TASK_TITLES[spec.arch]
  const actionId = `${journeyId}-${spec.arch}-${spec.code}`

  const tasks: JourneyTask[] = titles.map((title, i): JourneyTask => {
    let status: TaskStatus
    if (i < spec.done) status = 'complete'
    else if (i === spec.done) status = spec.current ?? 'in_progress'
    else status = 'not_started'

    return {
      id: `${actionId}-t${i}`,
      actionId,
      journeyId,
      title,
      status,
      assignedTo: spec.owner,
      taskOwner: spec.owner,
      readyToBegin: fmtDate(spec.startDate),
      nextStep: fmtDate(addDays(spec.startDate, i * 5)),
      due: fmtDate(addDays(spec.startDate, i * 5 + 4)),
      nickname: `${household} – ${spec.short}`,
    }
  })

  return {
    id: actionId,
    journeyId,
    title: meta.title,
    category: meta.category,
    actionCode: spec.code,
    description: spec.description,
    nickname: `${household} – ${spec.short}`,
    status: deriveActionStatus(tasks),
    tasks,
  }
}

function buildJourney(spec: JourneySpec): Journey {
  const actions = spec.actions.map((a) => buildAction(spec.id, spec.household, a))
  const status: JourneyStatus = actions.every((a) => a.status === 'complete')
    ? 'complete'
    : actions.some((a) => a.status !== 'not_started')
      ? 'in_progress'
      : 'not_started'

  return {
    id: spec.id,
    name: `${spec.household} Account Opening`,
    category: 'Onboarding',
    relationshipName: spec.relationship ?? spec.household,
    assignedTo: spec.owner,
    createdBy: spec.owner,
    createdAt: spec.createdAt,
    status,
    actions,
  }
}

// Stratos advisors (Alice Chen = the signed-in advisor → "My Relationships").
const ME = 'Alice Chen'

const journeySpecs: JourneySpec[] = [
  {
    id: 'ao-patel', household: 'Anita Patel', owner: ME, createdAt: '2025-11-03',
    actions: [
      { arch: 'open', description: 'Open Fidelity Premiere Select IRA – Roth', short: 'Fidelity Roth IRA', code: '002401', owner: ME, done: 3, current: 'in_progress', startDate: '2025-11-12' },
      { arch: 'toa', description: 'ACAT transfer from Vanguard', short: 'Transfer of Assets', code: '002402', owner: ME, done: 0, current: 'not_started', startDate: '2025-11-20' },
    ],
  },
  {
    id: 'ao-johnson', household: 'Johnson Trust', owner: ME, createdAt: '2025-10-21',
    actions: [
      { arch: 'open', description: 'Open Schwab One Trust Account', short: 'Schwab Trust', code: '002403', owner: ME, done: 2, current: 'blocked', startDate: '2025-10-28' },
    ],
  },
  {
    id: 'ao-davis', household: 'Davis Household', owner: 'Bob Martinez', createdAt: '2025-10-29',
    actions: [
      { arch: 'open', description: 'Open Schwab Brokerage – Joint (JTWROS)', short: 'Schwab Joint', code: '002404', owner: 'Bob Martinez', done: 5, current: 'awaiting_review', startDate: '2025-11-05' },
      { arch: 'contribution', description: 'Initial cash contribution', short: 'Contribution', code: '002405', owner: 'Bob Martinez', done: 0, current: 'not_started', startDate: '2025-11-18' },
    ],
  },
  {
    id: 'ao-garcia', household: 'The Garcia Family', owner: 'Diana Torres', createdAt: '2025-11-24',
    actions: [
      { arch: 'open-sim', description: 'Open SIM Managed Account (SMA) – Fidelity', short: 'Fidelity SMA (SIM)', code: '002406', owner: 'Diana Torres', done: 4, current: 'in_progress', startDate: '2025-12-01' },
    ],
  },
  {
    id: 'ao-kim', household: 'Daniel Kim', owner: ME, createdAt: '2025-10-02',
    actions: [
      { arch: 'open', description: 'Open Fidelity Brokerage – Individual', short: 'Fidelity Individual', code: '002407', owner: ME, done: 8, startDate: '2025-10-10' },
      { arch: 'toa', description: 'ACAT transfer from E*TRADE', short: 'Transfer of Assets', code: '002408', owner: ME, done: 1, current: 'in_progress', startDate: '2025-10-22' },
    ],
  },
  {
    id: 'ao-thompson', household: 'Laura Thompson', owner: 'Carol Williams', createdAt: '2025-11-10',
    actions: [
      { arch: 'open', description: 'Open Schwab IRA – Traditional', short: 'Schwab Traditional IRA', code: '002409', owner: 'Carol Williams', done: 6, current: 'in_progress', startDate: '2025-11-18' },
    ],
  },
  {
    id: 'ao-nakamura', household: 'Kenji Nakamura', owner: 'Diana Torres', createdAt: '2025-11-28',
    actions: [
      { arch: 'open-sim', description: 'Open SEI Managed Account (Native API)', short: 'SEI Managed', code: '002410', owner: 'Diana Torres', done: 1, current: 'in_progress', startDate: '2025-12-05' },
    ],
  },
  {
    id: 'ao-oconnor', household: "Bridget O'Connor", owner: ME, createdAt: '2025-11-07',
    actions: [
      { arch: 'open', description: 'Open Fidelity Trust Account', short: 'Fidelity Trust', code: '002411', owner: ME, done: 7, current: 'in_progress', startDate: '2025-11-15' },
      { arch: 'alert', description: 'Resolve NIGO – missing trustee certification', short: 'Resolve Custodian Alert', code: '002412', owner: ME, done: 0, current: 'blocked', startDate: '2025-11-25' },
    ],
  },
  {
    id: 'ao-brooks', household: 'Hannah Brooks', owner: 'Bob Martinez', createdAt: '2025-12-02',
    actions: [
      { arch: 'open-sim', description: 'Open SIM Managed Account (SMA) – Schwab', short: 'Schwab SMA (SIM)', code: '002413', owner: 'Bob Martinez', done: 2, current: 'in_progress', startDate: '2025-12-10' },
    ],
  },
  // ── End-to-end demo case: Begin → Claim → straight into the Schwab custodian form ──
  // Journey advisor is Alice Chen (shows under "My Relationships"); the first task is
  // unassigned + Ready to Begin so Begin surfaces the Claim modal, then the form.
  {
    id: 'ao-ferfecki', household: 'George and Patricia Ferfecki', owner: ME, createdAt: '2026-05-04',
    actions: [
      { arch: 'open', description: 'Open Schwab Brokerage – Individual', short: 'Schwab Individual', code: '002414', owner: 'Unassigned', done: 0, current: 'not_started', startDate: '2026-05-06' },
    ],
  },
  {
    id: 'ao-raj-patel', household: 'Raj Patel', owner: ME, createdAt: '2025-11-20',
    actions: [
      { arch: 'open', description: 'Open Fidelity Premiere Select IRA – Traditional', short: 'Fidelity Traditional IRA', code: '002415', owner: ME, done: 4, current: 'in_progress', startDate: '2025-11-30' },
    ],
  },
  {
    id: 'ao-wei-chen', household: 'Wei Chen', owner: 'Bob Martinez', createdAt: '2025-11-25',
    actions: [
      { arch: 'open', description: 'Open Schwab IRA – Roth (Conversion)', short: 'Schwab Roth IRA', code: '002416', owner: 'Bob Martinez', done: 3, current: 'in_progress', startDate: '2025-12-03' },
      { arch: 'standing', description: 'Standing money movement authorization', short: 'Standing Authorization', code: '002417', owner: 'Bob Martinez', done: 0, current: 'not_started', startDate: '2025-12-12' },
    ],
  },
  {
    id: 'ao-anderson', household: 'The Anderson Family', owner: 'Carol Williams', createdAt: '2025-12-30',
    actions: [
      { arch: 'open', description: 'Open Schwab Brokerage – Individual', short: 'Schwab Individual', code: '002418', owner: 'Carol Williams', done: 0, current: 'not_started', startDate: '2026-01-06' },
    ],
  },
  {
    id: 'ao-nguyen', household: 'Nguyen Trust', owner: ME, createdAt: '2025-12-01',
    actions: [
      { arch: 'open', description: 'Open Fidelity Entity Account – Trust', short: 'Fidelity Trust (Entity)', code: '002419', owner: ME, done: 2, current: 'blocked', startDate: '2025-12-08' },
    ],
  },
]

export const seededJourneys: Journey[] = journeySpecs.map(buildJourney)
