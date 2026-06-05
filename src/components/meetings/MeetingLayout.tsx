import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, NotepadText, Workflow, Mail, ListTodo, CheckCircle2 } from 'lucide-react'
import { SummaryTab } from './SummaryTab'
import { MeetingActionsTab } from './MeetingActions'
import { EmailTab } from './EmailTab'
import { PrepTab } from './PrepTab'
import { MeetingSidebar } from './MeetingSidebar'
import { PrepReportView } from './PrepReportView'
import { AskAnything } from './AskAnything'
import type { Meeting } from '@/types/meeting'
import { useMeetings } from '@/stores/meetingsStore'
import { cn } from '@/lib/utils'
import { fmtDate, fmtTime, LIFECYCLE_LABEL, isLive } from './meetingUtils'

type TabId = 'prep' | 'summary' | 'actions' | 'email'

export function MeetingLayout({ meeting }: { meeting: Meeting }) {
  const navigate = useNavigate()
  const m = useMeetings()
  const summary = m.summaries[meeting.id]
  const email = m.emails[meeting.id]
  const actionCount = (m.linkedActions[meeting.id] ?? []).length + (m.recommendations[meeting.id] ?? []).length

  const defaultTab: TabId = summary?.contentHtml ? 'summary' : (meeting.lifecycle === 'upcoming' || meeting.lifecycle === 'live' ? 'prep' : 'summary')
  const [tab, setTab] = useState<TabId>(defaultTab)
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set([defaultTab]))
  const [prepReportOpen, setPrepReportOpen] = useState(false)

  const live = isLive(meeting)
  const isNew = meeting.lifecycle === 'ended_ready'

  type TabDef = {
    id: TabId
    label: string
    icon: React.ComponentType<{ className?: string }>
    done?: boolean
    hint?: string
    badge?: number
    isNew?: boolean
  }
  const tabs: TabDef[] = useMemo(() => [
    { id: 'prep', label: 'Prep', icon: ListTodo, done: meeting.prepStatus === 'complete', hint: meeting.prepStatus === 'in_progress' ? 'In progress' : undefined },
    { id: 'summary', label: 'Summary', icon: NotepadText, done: summary?.isAttested, isNew: isNew && !visited.has('summary') },
    { id: 'actions', label: 'Actions', icon: Workflow, badge: actionCount || undefined },
    { id: 'email', label: 'Email', icon: Mail, done: email?.status === 'sent', hint: email?.status === 'skipped' ? 'Skipped' : undefined, isNew: isNew && !visited.has('email') },
  ], [meeting.prepStatus, email?.status, summary?.isAttested, actionCount, isNew, visited])

  const go = (id: TabId) => { setTab(id); setVisited((v) => new Set(v).add(id)) }

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => navigate('/meetings')} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Meetings
      </button>

      <div className="flex items-start gap-6">
        {/* main column */}
        <div className="min-w-0 flex-1">
          {/* header */}
          <div className="relative mb-5 pl-4">
            <div className="absolute bottom-1 left-0 top-1 w-1 rounded bg-[#0b4f9c]" />
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{meeting.subject}</h1>
              {meeting.meetingType && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{meeting.meetingType === 'periodic' ? 'Periodic' : 'One-off'}</span>
              )}
              {live ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Now</span>
              ) : (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{LIFECYCLE_LABEL[meeting.lifecycle ?? 'upcoming']}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{meeting.relationshipName} · {fmtDate(meeting.startTime)}, {fmtTime(meeting.startTime)}</p>
          </div>

          {/* tabs */}
          <div className="mb-5 flex items-center gap-1 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
                  tab === t.id ? 'border-[#0b4f9c] font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                {t.hint && <span className="text-[10px] text-muted-foreground">· {t.hint}</span>}
                {t.badge ? (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] text-muted-foreground">{t.badge}</span>
                ) : null}
                {t.isNew && <span className="ml-0.5 rounded-full bg-[#0b4f9c] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">New</span>}
              </button>
            ))}
          </div>

          {/* content */}
          {tab === 'prep' && <PrepTab meeting={meeting} onOpenPrepReport={() => setPrepReportOpen(true)} />}
          {tab === 'summary' && <SummaryTab meeting={meeting} />}
          {tab === 'actions' && <MeetingActionsTab meetingId={meeting.id} />}
          {tab === 'email' && <EmailTab meeting={meeting} />}
        </div>

        {/* sidebar */}
        <MeetingSidebar meeting={meeting} onOpenPrepReport={() => setPrepReportOpen(true)} />
      </div>

      <PrepReportView meeting={meeting} open={prepReportOpen} onOpenChange={setPrepReportOpen} />
      <AskAnything meetingSubject={meeting.subject} />
    </div>
  )
}
