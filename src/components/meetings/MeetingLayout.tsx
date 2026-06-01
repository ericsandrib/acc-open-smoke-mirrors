import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, NotepadText, Workflow, Mail, ListTodo, CheckCircle2 } from 'lucide-react'
import { SummaryTab } from './SummaryTab'
import { MeetingActionsTab } from './MeetingActions'
import { AskAnything } from './AskAnything'
import type { Meeting } from '@/types/meeting'
import { useMeetings } from '@/stores/meetingsStore'
import { cn } from '@/lib/utils'

type TabId = 'prep' | 'summary' | 'actions' | 'email'
type TabDef = { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; done?: boolean; badge?: number }

function PrepTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Meeting transcript</h3>
        {meeting.transcript ? (
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground/80">{meeting.transcript}</pre>
        ) : (
          <p className="text-sm text-muted-foreground">No transcript captured.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Native transcription via the connected conferencing provider (Zoom / Teams). The advisor approves the AI summary before it becomes final.</p>
    </div>
  )
}

function EmailTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-1">Draft follow-up email</h3>
      <p className="text-xs text-muted-foreground mb-3">AI-drafted from the summary — review before sending.</p>
      <div className="prose prose-sm max-w-none text-[13px] text-foreground/85">
        <p>Hi Ralph and Diane,</p>
        <p>Thank you for the time today. To recap: we'll process the <strong>$120,000 distribution</strong> to your Amegy checking by mid-June, schedule your first RMD, send 529 options for your grandchild, and confirm Diane as primary beneficiary on the LPL accounts.</p>
        <p>I'll follow up in two weeks with the RMD calculation.</p>
        <p>Best,<br />Priya</p>
      </div>
    </div>
  )
}

export function MeetingLayout({ meeting }: { meeting: Meeting }) {
  const [tab, setTab] = useState<TabId>('summary')
  const navigate = useNavigate()
  const m = useMeetings()
  const summary = m.summaries[meeting.id]
  const actionCount = (m.linkedActions[meeting.id] ?? []).length + (m.recommendations[meeting.id] ?? []).length

  const dt = new Date(meeting.startTime)
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const tabs: TabDef[] = [
    { id: 'prep', label: 'Prep', icon: ListTodo },
    { id: 'summary', label: 'Summary', icon: NotepadText, done: summary?.isAttested },
    { id: 'actions', label: 'Actions', icon: Workflow, badge: actionCount || undefined },
    { id: 'email', label: 'Email', icon: Mail },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/meetings')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Meetings
      </button>

      {/* accent-bar heading */}
      <div className="relative pl-4 mb-5">
        <div className="absolute left-0 top-1 bottom-1 w-1 rounded bg-[#0b4f9c]" />
        <h1 className="text-xl font-semibold text-foreground">{meeting.subject}</h1>
        <p className="text-sm text-muted-foreground">
          {meeting.relationshipName} · {dateStr}, {timeStr}
        </p>
      </div>

      {/* rounded tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm -mb-px border-b-2 transition-colors',
              tab === t.id ? 'border-[#0b4f9c] text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            {t.badge ? (
              <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-muted px-1 text-[10px] text-muted-foreground">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* content */}
      {tab === 'summary' && <SummaryTab meetingId={meeting.id} />}
      {tab === 'actions' && <MeetingActionsTab meetingId={meeting.id} />}
      {tab === 'prep' && <PrepTab meeting={meeting} />}
      {tab === 'email' && <EmailTab meeting={meeting} />}

      <AskAnything meetingSubject={meeting.subject} />
    </div>
  )
}
