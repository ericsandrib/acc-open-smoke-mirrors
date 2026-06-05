import { createContext, useContext, useState, type ReactNode } from 'react'
import type { MeetingSummary, ActionRecommendation, MeetingActionItem, MeetingEmail, EmailStatus } from '@/types/meeting'
import {
  MEETINGS,
  MEETING_SUMMARIES,
  ACTION_RECOMMENDATIONS,
  LINKED_ACTIONS,
  RELATIONSHIP_ACTIONS,
} from '@/data/zions/meetingsSeed'

/** Seed the mutable email map from whatever each meeting carries. */
function seedEmails(): Record<string, MeetingEmail> {
  const out: Record<string, MeetingEmail> = {}
  for (const m of MEETINGS) if (m.email) out[m.id] = { ...m.email, to: [...m.email.to], cc: [...m.email.cc] }
  return out
}
function seedPrepNotes(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of MEETINGS) if (m.prepNotesHtml) out[m.id] = m.prepNotesHtml
  return out
}

interface MeetingsCtxValue {
  meetings: typeof MEETINGS
  summaries: Record<string, MeetingSummary>
  recommendations: Record<string, ActionRecommendation[]>
  linkedActions: Record<string, MeetingActionItem[]>
  relationshipActions: Record<string, MeetingActionItem[]>
  actionsSkipped: Record<string, boolean>
  prepNotes: Record<string, string>
  emails: Record<string, MeetingEmail>
  feedback: Record<string, 'up' | 'down' | undefined>
  setSummaryContent: (meetingId: string, html: string) => void
  attestSummary: (meetingId: string, agent: string) => void
  unattestSummary: (meetingId: string) => void
  /** Meeting-to-action: turn an AI recommendation into a linked action. */
  acceptRecommendation: (meetingId: string, rec: ActionRecommendation) => MeetingActionItem
  deleteRecommendation: (meetingId: string, recId: string) => void
  linkAction: (meetingId: string, action: MeetingActionItem) => void
  unlinkAction: (meetingId: string, actionRunId: string) => void
  setActionsSkipped: (meetingId: string, skipped: boolean) => void
  setPrepNotes: (meetingId: string, html: string) => void
  setEmailContent: (meetingId: string, html: string) => void
  setEmailSubject: (meetingId: string, subject: string) => void
  setEmailStatus: (meetingId: string, status: EmailStatus) => void
  setFeedback: (key: string, v: 'up' | 'down' | undefined) => void
}

const MeetingsContext = createContext<MeetingsCtxValue | null>(null)

export function MeetingsProvider({ children }: { children: ReactNode }) {
  const [summaries, setSummaries] = useState<Record<string, MeetingSummary>>(() => ({ ...MEETING_SUMMARIES }))
  const [recommendations, setRecommendations] = useState<Record<string, ActionRecommendation[]>>(
    () => structuredClone(ACTION_RECOMMENDATIONS),
  )
  const [linkedActions, setLinkedActions] = useState<Record<string, MeetingActionItem[]>>(
    () => structuredClone(LINKED_ACTIONS),
  )
  const [relationshipActions, setRelationshipActions] = useState<Record<string, MeetingActionItem[]>>(
    () => structuredClone(RELATIONSHIP_ACTIONS),
  )
  const [actionsSkipped, setActionsSkippedState] = useState<Record<string, boolean>>({})
  const [prepNotes, setPrepNotesState] = useState<Record<string, string>>(() => seedPrepNotes())
  const [emails, setEmails] = useState<Record<string, MeetingEmail>>(() => seedEmails())
  const [feedback, setFeedbackState] = useState<Record<string, 'up' | 'down' | undefined>>({})

  const setSummaryContent = (meetingId: string, html: string) =>
    setSummaries((s) => ({ ...s, [meetingId]: { ...s[meetingId], meetingId, contentHtml: html } }))

  const attestSummary = (meetingId: string, agent: string) =>
    setSummaries((s) => ({
      ...s,
      [meetingId]: { ...s[meetingId], isAttested: true, attestedAt: '2026-06-05', attestingAgent: agent },
    }))

  const unattestSummary = (meetingId: string) =>
    setSummaries((s) => ({ ...s, [meetingId]: { ...s[meetingId], isAttested: false, attestedAt: undefined } }))

  const acceptRecommendation = (meetingId: string, rec: ActionRecommendation): MeetingActionItem => {
    const action: MeetingActionItem = {
      actionRunId: `run-${rec.id}`,
      name: rec.blueprintName,
      blueprintName: rec.blueprintCategory,
      status: 'todo',
      createdAt: '2026-06-05',
      sourceSystem: 'avantos',
      servicingJourneyId: rec.servicingJourneyId,
    }
    setLinkedActions((l) => ({ ...l, [meetingId]: [...(l[meetingId] ?? []), action] }))
    setRecommendations((r) => ({ ...r, [meetingId]: (r[meetingId] ?? []).filter((x) => x.id !== rec.id) }))
    return action
  }

  const deleteRecommendation = (meetingId: string, recId: string) =>
    setRecommendations((r) => ({ ...r, [meetingId]: (r[meetingId] ?? []).filter((x) => x.id !== recId) }))

  const linkAction = (meetingId: string, action: MeetingActionItem) => {
    setLinkedActions((l) => ({ ...l, [meetingId]: [...(l[meetingId] ?? []), action] }))
    setRelationshipActions((r) => ({
      ...r,
      [meetingId]: (r[meetingId] ?? []).filter((x) => x.actionRunId !== action.actionRunId),
    }))
  }

  const unlinkAction = (meetingId: string, actionRunId: string) => {
    setLinkedActions((l) => {
      const moved = (l[meetingId] ?? []).find((x) => x.actionRunId === actionRunId)
      if (moved) {
        setRelationshipActions((r) => ({ ...r, [meetingId]: [...(r[meetingId] ?? []), moved] }))
      }
      return { ...l, [meetingId]: (l[meetingId] ?? []).filter((x) => x.actionRunId !== actionRunId) }
    })
  }

  const setActionsSkipped = (meetingId: string, skipped: boolean) =>
    setActionsSkippedState((s) => ({ ...s, [meetingId]: skipped }))

  const setPrepNotes = (meetingId: string, html: string) =>
    setPrepNotesState((s) => ({ ...s, [meetingId]: html }))

  const setEmailContent = (meetingId: string, html: string) =>
    setEmails((e) => ({ ...e, [meetingId]: { ...e[meetingId], bodyHtml: html } }))

  const setEmailSubject = (meetingId: string, subject: string) =>
    setEmails((e) => ({ ...e, [meetingId]: { ...e[meetingId], subject } }))

  const setEmailStatus = (meetingId: string, status: EmailStatus) =>
    setEmails((e) => ({ ...e, [meetingId]: { ...e[meetingId], status } }))

  const setFeedback = (key: string, v: 'up' | 'down' | undefined) =>
    setFeedbackState((s) => ({ ...s, [key]: v }))

  return (
    <MeetingsContext.Provider
      value={{
        meetings: MEETINGS,
        summaries,
        recommendations,
        linkedActions,
        relationshipActions,
        actionsSkipped,
        prepNotes,
        emails,
        feedback,
        setSummaryContent,
        attestSummary,
        unattestSummary,
        acceptRecommendation,
        deleteRecommendation,
        linkAction,
        unlinkAction,
        setActionsSkipped,
        setPrepNotes,
        setEmailContent,
        setEmailSubject,
        setEmailStatus,
        setFeedback,
      }}
    >
      {children}
    </MeetingsContext.Provider>
  )
}

export function useMeetings() {
  const ctx = useContext(MeetingsContext)
  if (!ctx) throw new Error('useMeetings must be used within MeetingsProvider')
  return ctx
}
