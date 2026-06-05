// Meeting Assistant types — Zions POC (Spec 007 Phase 6 + Spec 009 end-to-end build).
// Faithful to the Avantos meetings module field names so ported logic maps 1:1.

export type ActionStatus =
  | 'todo'
  | 'processing'
  | 'complete'
  | 'cancelled'
  | 'scheduled'
  | 'draft'
  | 'recommended'
  | 'rejected'
  | 'failed'
  | 'blocked_pending'

/** An action linked to (or linkable to) a meeting. */
export interface MeetingActionItem {
  actionRunId: string
  /** Display title. */
  name: string
  /** Blueprint/category shown under the title. */
  blueprintName: string
  status: ActionStatus
  createdAt?: string
  sourceSystem?: 'avantos' | 'salesforce'
  /** Deep-link to the servicing journey this action drives (meeting-to-action). */
  servicingJourneyId?: string
}

/** An AI-recommended action derived from the transcript. */
export interface ActionRecommendation {
  id: string
  /** Action title. */
  blueprintName: string
  blueprintCategory: string
  /** When accepted, the servicing journey it creates/links. */
  servicingJourneyId?: string
  /** Pre-fill copy shown to the advisor. */
  detail?: string
}

export interface MeetingSummary {
  meetingId: string
  /** HTML string (TipTap loads HTML directly). */
  contentHtml: string
  isAttested: boolean
  attestedAt?: string
  attestingAgent?: string
  isAiEnhanced: boolean
}

// --- Participants ----------------------------------------------------------

export type RsvpStatus = 'going' | 'maybe' | 'declined' | 'none'

export interface Participant {
  id: string
  name: string
  email?: string
  phone?: string
  /** External client contact vs. internal advisor team member. */
  kind: 'client' | 'advisor'
  /** Role/title shown under the name (e.g. "Trustee", "Sr. Advisor"). */
  title?: string
  rsvp?: RsvpStatus
}

// --- Follow-up email -------------------------------------------------------

export type EmailStatus = 'pre_meeting' | 'generating' | 'draft' | 'sent' | 'skipped'

export interface MeetingEmail {
  subject: string
  /** Client participant emails (To). */
  to: string[]
  /** Advisor participant emails (CC). */
  cc: string[]
  bodyHtml: string
  status: EmailStatus
  isAi: boolean
}

// --- Pre-Meeting Prep Report (roadmap headline) ----------------------------

export interface PrepEvidence {
  quote: string
  source: string
}

export interface PrepReportSection {
  id: string
  title: string
  /** lucide icon key resolved in the view. */
  icon?: string
  /** Scannable highlights — the "what matters most" layer. */
  highlights?: string[]
  /** Optional richer HTML body. */
  bodyHtml?: string
  /** Direct quotes / citations that build trust + verification. */
  evidence?: PrepEvidence[]
}

export interface PrepReport {
  generatedAt: string
  /** The advisor inbox the report was delivered to (the "emailed Monday" framing). */
  deliveredTo?: string
  sections: PrepReportSection[]
  recommendedTopics?: string[]
}

// --- Roadmap AI signals ----------------------------------------------------

export type ReferralTrigger =
  | 'positive_sentiment'
  | 'milestone'
  | 'network_mention'
  | 'explicit_offer'
  | 'coi_reference'

export interface ReferralMoment {
  id: string
  trigger: ReferralTrigger
  /** What was said. */
  snippet: string
  timestampRange?: string
  subjectName?: string
  /** family | friend | colleague | COI | unknown */
  relationship?: string
  inferredNeed?: string
  /** 0..1 */
  confidence: number
  suggestedNextStep: string
}

export interface LifeEvent {
  id: string
  /** liquidity_event | retirement | new_grandchild | home_purchase | ... */
  type: string
  label: string
  detail: string
  snippet?: string
}

export interface MeetingTopic {
  id: string
  label: string
}

// --- Meeting ---------------------------------------------------------------

export type MeetingVendor = 'zoom' | 'teams' | 'meet' | 'phone' | 'in_person'

/** Drives page-level content, AI activity, and guidance (per detail-page PRD). */
export type MeetingLifecycle =
  | 'upcoming'
  | 'live'
  | 'ended_pending'
  | 'ended_ready'
  | 'historical'
  | 'no_recording'

export type PrepStatus = 'not_started' | 'in_progress' | 'complete'

export interface Meeting {
  id: string
  subject: string
  relationshipName: string
  relationshipId?: string
  /** ISO datetimes. */
  startTime: string
  endTime: string
  meetingType?: 'periodic' | 'one_off'
  lifecycle?: MeetingLifecycle
  vendor?: MeetingVendor
  /** Virtual meeting URL / dial-in. Entry point for all AI features. */
  meetingLink?: string
  /** Physical address for in-person meetings. */
  location?: string
  /** Non-relationship / external meeting → external-link arrow + view-only. */
  isExternal?: boolean
  /** Whether the current advisor is on the attendee list (false → muted, view-only). */
  isAttendee?: boolean
  /** Current advisor's RSVP — drives the list accent bar. */
  myRsvp?: RsvpStatus
  isHistorical?: boolean
  hasTranscript?: boolean
  transcript?: string
  actionsSkipped?: boolean
  /** Advisor who owns/organizes the meeting. */
  owner?: string
  organizer?: Participant
  participants?: Participant[]
  /** Internal-use prep notes (HTML). */
  prepNotesHtml?: string
  prepStatus?: PrepStatus
  email?: MeetingEmail
  prepReport?: PrepReport
  referralMoments?: ReferralMoment[]
  lifeEvents?: LifeEvent[]
  topics?: MeetingTopic[]
}

// --- Ask Anything (scripted chat) ------------------------------------------

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  /** For assistant messages this is markdown; rendered via marked + DOMPurify. */
  text: string
  /** Historic messages skip the typewriter animation. */
  isHistoric?: boolean
}
