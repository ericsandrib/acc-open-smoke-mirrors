// Account lifecycle state machine — Appendix C of the V2 spec.
//
// Pure functions over V2LifecycleState. No persistence layer; the workflow
// state machine is a reference for the prototype to demonstrate the model.
// Production implementation would back this with the PGlite DB (or the real
// Avantos schema) and record every transition to an audit log.

import type {
  V2LifecycleState,
  V2LifecycleEvent,
  V2Transition,
} from '@/types/workflow-v2'

// ─── Transition table ──────────────────────────────────────────────────

export const V2_TRANSITIONS: V2Transition[] = [
  // From Draft
  { from: 'draft', to: 'submitted', trigger: 'advisor submits form (all guardrails pass)', actorRole: 'advisor' },
  { from: 'draft', to: 'closed', trigger: 'advisor abandons', actorRole: 'advisor' },

  // From Submitted (rules engine evaluates and routes)
  { from: 'submitted', to: 'in_review', trigger: 'rules engine produced one or more tags', actorRole: 'system' },
  { from: 'submitted', to: 'approved', trigger: 'rules engine produced zero tags → bypass review', actorRole: 'system' },

  // From In Review
  { from: 'in_review', to: 'nigo', trigger: 'any reviewer NIGOs', actorRole: 'reviewer' },
  { from: 'in_review', to: 'approved', trigger: 'all required reviews complete with approval', actorRole: 'reviewer' },

  // From NIGO
  { from: 'nigo', to: 'draft', trigger: 'advisor opens for major revision', actorRole: 'advisor' },
  { from: 'nigo', to: 'in_review', trigger: 'minor revision auto-re-enters review (RIA-configurable)', actorRole: 'advisor' },
  { from: 'nigo', to: 'de_linked', trigger: 'operations reviewer de-links for missing documentation', actorRole: 'reviewer' },

  // De-Linked is reversible
  { from: 'de_linked', to: 'in_review', trigger: 'documentation arrives; operations re-links', actorRole: 'reviewer' },
  { from: 'de_linked', to: 'closed', trigger: 'abandoned after extended hold', actorRole: 'advisor' },

  // From Approved → eSign
  { from: 'approved', to: 'awaiting_signature', trigger: 'eSign envelope generated', actorRole: 'system' },

  // From Awaiting Signature
  { from: 'awaiting_signature', to: 'signed', trigger: 'client signs and returns envelope', actorRole: 'client' },
  { from: 'awaiting_signature', to: 'closed', trigger: 'envelope expires / advisor cancels', actorRole: 'advisor' },

  // From Signed → operations docs gate
  { from: 'signed', to: 'pending_documentation', trigger: 'operations validates documentation completeness', actorRole: 'system' },

  // From Pending Documentation
  { from: 'pending_documentation', to: 'submitted_to_custodian', trigger: 'docs complete + licensing recheck + AML 90d check pass', actorRole: 'system' },
  { from: 'pending_documentation', to: 'nigo', trigger: 'documentation deficiency surfaced post-eSign', actorRole: 'reviewer' },

  // From Submitted to Custodian
  { from: 'submitted_to_custodian', to: 'opened', trigger: 'custodian confirms account opening', actorRole: 'custodian' },
  { from: 'submitted_to_custodian', to: 'closed', trigger: 'custodian rejects submission (rare)', actorRole: 'custodian' },

  // Universal: any state → Closed
  // (Modelled below as the canTerminate helper rather than per-state edges.)
]

// ─── Helpers ───────────────────────────────────────────────────────────

const TERMINAL: V2LifecycleState[] = ['opened', 'closed']

/** Set of states reachable from `from` in one step. */
export function nextStates(from: V2LifecycleState): V2Transition[] {
  return V2_TRANSITIONS.filter((t) => t.from === from)
}

/** Whether the proposed transition is allowed. */
export function canTransition(
  from: V2LifecycleState,
  to: V2LifecycleState,
): boolean {
  if (to === 'closed' && !TERMINAL.includes(from)) {
    // Universal abandon edge — supported per spec ("Any → Closed").
    return true
  }
  return V2_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

/** Apply a transition. Returns the new state or throws. */
export function transition(
  from: V2LifecycleState,
  to: V2LifecycleState,
  ctx: { actor: string; trigger: string; reason?: string },
): { state: V2LifecycleState; event: V2LifecycleEvent } {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }
  const event: V2LifecycleEvent = {
    at: new Date().toISOString(),
    from,
    to,
    actor: ctx.actor,
    trigger: ctx.trigger,
    reason: ctx.reason,
  }
  return { state: to, event }
}

/** Reduce a transition history into a current state. */
export function replay(
  initial: V2LifecycleState,
  events: V2LifecycleEvent[],
): V2LifecycleState {
  let state = initial
  for (const ev of events) {
    if (!canTransition(state, ev.to)) {
      throw new Error(`Replay failed at ${ev.at}: ${state} → ${ev.to}`)
    }
    state = ev.to
  }
  return state
}

/** Sample history fixtures for the lifecycle viewer. */
export const V2_SAMPLE_HISTORIES: Array<{
  label: string
  accountId: string
  events: V2LifecycleEvent[]
  currentState: V2LifecycleState
}> = [
  {
    label: 'Robert Whitfield — clean bypass to Opened',
    accountId: 'sample-clean',
    events: [
      { at: '2026-05-01T09:14:00Z', from: 'draft', to: 'submitted', actor: 'Greta Friedrichs', trigger: 'form submitted' },
      { at: '2026-05-01T09:14:01Z', from: 'submitted', to: 'approved', actor: 'rules-engine', trigger: 'no tags produced (bypass review)' },
      { at: '2026-05-01T09:15:00Z', from: 'approved', to: 'awaiting_signature', actor: 'eSign service', trigger: 'envelope generated' },
      { at: '2026-05-01T14:22:00Z', from: 'awaiting_signature', to: 'signed', actor: 'Robert Whitfield', trigger: 'client signed' },
      { at: '2026-05-01T14:22:30Z', from: 'signed', to: 'pending_documentation', actor: 'operations', trigger: 'docs check started' },
      { at: '2026-05-01T15:01:00Z', from: 'pending_documentation', to: 'submitted_to_custodian', actor: 'system', trigger: 'docs + licensing + AML pass' },
      { at: '2026-05-02T08:33:00Z', from: 'submitted_to_custodian', to: 'opened', actor: 'SEI', trigger: 'custodian confirmation' },
    ],
    currentState: 'opened',
  },
  {
    label: 'Olivia Reyes — NIGO loop, recovered, Opened',
    accountId: 'sample-multi-suit',
    events: [
      { at: '2026-05-03T10:00:00Z', from: 'draft', to: 'submitted', actor: 'Greta Friedrichs', trigger: 'form submitted' },
      { at: '2026-05-03T10:00:01Z', from: 'submitted', to: 'in_review', actor: 'rules-engine', trigger: '3 suitability tags: R-1, R-3, R-4' },
      { at: '2026-05-03T16:42:00Z', from: 'in_review', to: 'nigo', actor: 'Compliance', trigger: 'consolidated NIGO — objective mismatch needs documentation' },
      { at: '2026-05-04T09:15:00Z', from: 'nigo', to: 'in_review', actor: 'Greta Friedrichs', trigger: 'updated suitability narrative + re-submitted' },
      { at: '2026-05-04T14:00:00Z', from: 'in_review', to: 'approved', actor: 'Compliance', trigger: 'all reviews cleared' },
      { at: '2026-05-04T14:05:00Z', from: 'approved', to: 'awaiting_signature', actor: 'eSign service', trigger: 'envelope generated' },
      { at: '2026-05-04T17:30:00Z', from: 'awaiting_signature', to: 'signed', actor: 'Olivia Reyes', trigger: 'client signed' },
      { at: '2026-05-04T17:31:00Z', from: 'signed', to: 'pending_documentation', actor: 'operations', trigger: 'docs check started' },
      { at: '2026-05-05T08:00:00Z', from: 'pending_documentation', to: 'submitted_to_custodian', actor: 'system', trigger: 'docs + licensing + AML pass' },
      { at: '2026-05-05T11:42:00Z', from: 'submitted_to_custodian', to: 'opened', actor: 'SEI', trigger: 'custodian confirmation' },
    ],
    currentState: 'opened',
  },
  {
    label: 'Henry Foster — de-linked, awaiting documentation',
    accountId: 'sample-multi-comp',
    events: [
      { at: '2026-05-06T10:00:00Z', from: 'draft', to: 'submitted', actor: 'Greta Friedrichs', trigger: 'form submitted' },
      { at: '2026-05-06T10:00:01Z', from: 'submitted', to: 'in_review', actor: 'rules-engine', trigger: 'compliance + suitability tags' },
      { at: '2026-05-06T14:22:00Z', from: 'in_review', to: 'nigo', actor: 'Operations', trigger: 'missing OBA verification' },
      { at: '2026-05-06T14:23:00Z', from: 'nigo', to: 'de_linked', actor: 'Operations', trigger: 'de-link pending OBA verification record' },
    ],
    currentState: 'de_linked',
  },
]
