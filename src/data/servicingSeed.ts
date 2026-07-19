import type { Journey, JourneyAction, JourneyStatus, JourneyTask } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { shiftDate } from '@/lib/demoClock'

/**
 * Servicing seed — Zions POC instance (Spec 007 Phase 5).
 *
 * Built on the canonical account-opening/servicing process. Task flows mirror:
 *   Configuration → Custodian form → Supporting documents → (SIM: Investment & Model)
 *   → KYC / Identity → Suitability & Supervision review → Generate & Submit (Quik + DocuSign)
 *   → Client signature → (SIM: Quality Control) → Verify complete (account status / NIGO).
 *
 * Move Money (Transfer of Assets, Contribution, Standing authorization, Distribution) and
 * Account Maintenance (Resolve Custodian Alert / NIGO) appear as their own actions.
 * The Whitmore "Distribution" is the meeting-to-action centerpiece (generated from the
 * Quarterly Review by the Meeting Assistant); Hargrove's is delayed beyond SLA.
 */

type Arch = 'open' | 'open-sim' | 'toa' | 'contribution' | 'standing' | 'alert' | 'distribution'

const TASK_TITLES: Record<Arch, string[]> = {
  open: [
    'Configuration',
    'Complete Custodian Form',
    'Upload Supporting Documents',
    'KYC / Identity Check',
    'Suitability & Supervision Review',
    'Generate & Submit Request',
    'Collect Client Signature',
    'Verify Complete',
  ],
  'open-sim': [
    'Configuration',
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
  distribution: [
    'Configuration',
    'Suitability & Supervision Review',
    'Generate & Submit Request',
    'Collect Client Signature',
    'Verify Complete',
  ],
}

const ARCH_META: Record<Arch, { title: string; category: string }> = {
  open: { title: 'Open Account', category: 'Account Opening' },
  'open-sim': { title: 'Open Account', category: 'Account Opening' },
  toa: { title: 'Transfer of Assets', category: 'Move Money' },
  contribution: { title: 'Contribution', category: 'Move Money' },
  standing: { title: 'Standing Money Movement Authorization', category: 'Move Money' },
  alert: { title: 'Resolve Custodian Alert', category: 'Account Maintenance' },
  distribution: { title: 'Distribution', category: 'Move Money' },
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
  // Slide the authored anchor date to the live demo clock (preserves relative spacing).
  const startDate = shiftDate(spec.startDate)

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
      readyToBegin: fmtDate(startDate),
      nextStep: fmtDate(addDays(startDate, i * 5)),
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
    name: `${spec.household} — ${actions[0]?.category ?? 'Servicing'}`,
    category: 'Onboarding',
    relationshipName: spec.relationship ?? spec.household,
    assignedTo: spec.owner,
    createdBy: spec.owner,
    createdAt: shiftDate(spec.createdAt),
    status,
    actions,
  }
}

// Zions advisors (Priya Raman = the signed-in advisor → "My Relationships").
const ME = 'Priya Raman'

const journeySpecs: JourneySpec[] = [
  // ── Meeting-to-action: the Whitmore distribution generated from the Quarterly Review ──
  {
    id: 'sv-whitmore', household: 'Whitmore Household', owner: ME, createdAt: '2026-06-05',
    actions: [
      { arch: 'distribution', description: 'ACH distribution $120,000 to client bank — life event (from the Quarterly Review)', short: 'Distribution · ACH $120K', code: '003841', owner: ME, done: 1, current: 'in_progress', startDate: '2026-06-05' },
    ],
  },
  // ── Distribution delayed beyond SLA (supports "which distributions are delayed beyond SLA?") ──
  {
    id: 'sv-hargrove', household: 'Hargrove Foundation', owner: 'Sofia Delgado', createdAt: '2026-05-18',
    actions: [
      { arch: 'distribution', description: 'Grant disbursement $250,000 — annual cycle', short: 'Distribution · Grant', code: '003802', owner: 'Sofia Delgado', done: 2, current: 'blocked', startDate: '2026-05-18' },
    ],
  },
  {
    id: 'sv-cedar-falls', household: 'City of Cedar Falls', owner: 'Daniel Okafor', createdAt: '2026-05-22',
    actions: [
      { arch: 'distribution', description: 'Corporate Trust bond disbursement — 2026 GO bond', short: 'Distribution · Bond', code: '003810', owner: 'Daniel Okafor', done: 1, current: 'awaiting_review', startDate: '2026-05-22' },
    ],
  },
  {
    id: 'sv-tran', household: 'Tran Family', owner: 'Marcus Webb', createdAt: '2026-05-26',
    actions: [
      { arch: 'open', description: 'Open Fi-Tek Managed Account — Individual', short: 'Fi-Tek Individual', code: '003815', owner: 'Marcus Webb', done: 3, current: 'in_progress', startDate: '2026-05-26' },
      { arch: 'toa', description: 'ACAT transfer from LPL', short: 'Transfer of Assets', code: '003816', owner: 'Marcus Webb', done: 0, current: 'not_started', startDate: '2026-06-02' },
    ],
  },
  {
    id: 'sv-sandoval', household: 'Sandoval Family', owner: ME, createdAt: '2026-05-29',
    actions: [
      { arch: 'open', description: 'Open Fi-Tek IRA — Roth', short: 'Fi-Tek Roth IRA', code: '003820', owner: ME, done: 3, current: 'in_progress', startDate: '2026-05-29' },
    ],
  },
  {
    id: 'sv-cedar-ridge', household: 'Cedar Ridge Holdings LLC', owner: 'Daniel Okafor', createdAt: '2026-05-30',
    actions: [
      { arch: 'open-sim', description: 'Open SEI Managed Account (native API) — entity', short: 'SEI Managed', code: '003824', owner: 'Daniel Okafor', done: 1, current: 'in_progress', startDate: '2026-05-30' },
    ],
  },
  {
    id: 'sv-nakamura', household: 'Nakamura Family', owner: ME, createdAt: '2026-05-12',
    actions: [
      { arch: 'open', description: 'Open Fi-Tek Brokerage — Joint (JTWROS)', short: 'Fi-Tek Joint', code: '003828', owner: ME, done: 8, startDate: '2026-05-12' },
      { arch: 'contribution', description: 'Initial cash contribution', short: 'Contribution', code: '003829', owner: ME, done: 1, current: 'in_progress', startDate: '2026-05-20' },
    ],
  },
  {
    id: 'sv-beckett', household: 'Beckett Living Trust', owner: 'Sofia Delgado', createdAt: '2026-05-15',
    actions: [
      { arch: 'standing', description: 'Standing money movement authorization — quarterly', short: 'Standing Authorization', code: '003833', owner: 'Sofia Delgado', done: 1, current: 'in_progress', startDate: '2026-05-15' },
    ],
  },
  {
    id: 'sv-vance', household: 'Vance Family Trust', owner: 'Marcus Webb', createdAt: '2026-05-10',
    actions: [
      { arch: 'alert', description: 'Resolve NIGO — missing trustee certification', short: 'Resolve Custodian Alert', code: '003837', owner: 'Marcus Webb', done: 0, current: 'blocked', startDate: '2026-05-10' },
    ],
  },
  {
    id: 'sv-pearson', household: 'Pearson, James R.', owner: ME, createdAt: '2026-05-24',
    actions: [
      { arch: 'open', description: 'Open LPL Brokerage — Individual', short: 'LPL Individual', code: '003840', owner: ME, done: 5, current: 'in_progress', startDate: '2026-05-24' },
    ],
  },
]

export const seededJourneys: Journey[] = journeySpecs.map(buildJourney)
