// Meeting Assistant types — Zions POC (Spec 007 Phase 6).
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

export interface Meeting {
  id: string
  subject: string
  relationshipName: string
  relationshipId?: string
  /** ISO datetimes. */
  startTime: string
  endTime: string
  isHistorical?: boolean
  hasTranscript?: boolean
  transcript?: string
  actionsSkipped?: boolean
  /** Advisor who owns the meeting. */
  owner?: string
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
