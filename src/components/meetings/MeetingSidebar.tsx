import { useState } from 'react'
import { toast } from 'sonner'
import {
  Info, FileText, MessageSquare, Video, Phone, MapPin, Copy, Plus, Link2, Check,
  Sparkles, Search, AtSign, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting, Participant, RsvpStatus } from '@/types/meeting'
import { fmtDate, fmtTime, vendorLabel, isVirtual } from './meetingUtils'

type Panel = 'details' | 'transcript' | 'comments'

const RSVP_DOT: Record<RsvpStatus, string> = {
  going: 'bg-emerald-500', maybe: 'bg-amber-500', declined: 'bg-red-500', none: 'bg-slate-300',
}
const RSVP_TEXT: Record<RsvpStatus, string> = { going: 'Going', maybe: 'Maybe', declined: 'Declined', none: 'No RSVP' }

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(value).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1200); toast.success(`${label} copied`) }}
      title={`Copy ${label.toLowerCase()}`}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function ParticipantRow({ p }: { p: Participant }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', p.kind === 'client' ? 'bg-[#0b4f9c] text-white' : 'bg-muted text-foreground/70')}>
        {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm text-foreground">{p.name}</span>
          {p.rsvp && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><span className={cn('h-1.5 w-1.5 rounded-full', RSVP_DOT[p.rsvp])} />{RSVP_TEXT[p.rsvp]}</span>}
        </div>
        <div className="text-[11px] text-muted-foreground">{p.title}{p.kind === 'advisor' ? ' · internal' : ''}</div>
        {p.email && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="truncate">{p.email}</span><CopyBtn value={p.email} label="Email" />
          </div>
        )}
        {p.phone && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="truncate">{p.phone}</span><CopyBtn value={p.phone} label="Phone" />
          </div>
        )}
      </div>
    </div>
  )
}

function MeetingLinkField({ meeting }: { meeting: Meeting }) {
  const [link, setLink] = useState(meeting.meetingLink ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(link)

  if (meeting.vendor === 'in_person') {
    return (
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-foreground"><MapPin className="h-4 w-4 text-muted-foreground" /> {meeting.location}</span>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(meeting.location ?? '')}`} target="_blank" rel="noopener" className="shrink-0 text-xs font-medium text-[#0b4f9c] hover:underline">View Map</a>
      </div>
    )
  }
  if (editing) {
    return (
      <input
        autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { setLink(draft); setEditing(false); toast.success('Meeting link saved — AI features enabled') } if (e.key === 'Escape') { setDraft(link); setEditing(false) } }}
        placeholder="Paste a Zoom / Teams / Meet link…"
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-[#0b4f9c]"
      />
    )
  }
  if (!link) {
    return (
      <button onClick={() => setEditing(true)} className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-[#0b4f9c66] bg-[#0b4f9c08] px-2 py-1.5 text-xs font-medium text-[#0b4f9c] hover:bg-[#0b4f9c14]">
        <Plus className="h-3.5 w-3.5" /> Enter a meeting link
      </button>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-foreground"><Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{link}</span></span>
      <div className="flex shrink-0 items-center gap-0.5">
        <CopyBtn value={link} label="Link" />
        <button onClick={() => { setDraft(link); setEditing(true) }} className="rounded p-1 text-[11px] text-muted-foreground hover:text-foreground">Edit</button>
      </div>
    </div>
  )
}

function DetailsPanel({ meeting, onOpenPrepReport }: { meeting: Meeting; onOpenPrepReport: () => void }) {
  const [q, setQ] = useState('')
  const participants = (meeting.participants ?? []).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.email ?? '').includes(q.toLowerCase()))
  const clients = participants.filter((p) => p.kind === 'client')
  const advisors = participants.filter((p) => p.kind === 'advisor')

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Relationship</p>
        <p className="text-sm font-medium text-foreground">{meeting.relationshipName}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">When</p>
        <p className="text-sm text-foreground">{fmtDate(meeting.startTime)}</p>
        <p className="text-xs text-muted-foreground">{fmtTime(meeting.startTime)} – {fmtTime(meeting.endTime)} · {vendorLabel(meeting.vendor)}</p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Meeting link</p>
        <MeetingLinkField meeting={meeting} />
        {isVirtual(meeting.vendor) && meeting.meetingLink && (
          <a href={meeting.meetingLink} target="_blank" rel="noopener" className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0b4f9c] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#0a4587]"><Video className="h-3.5 w-3.5" /> Join meeting</a>
        )}
        {meeting.vendor === 'phone' && (
          <a href="tel:" className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"><Phone className="h-3.5 w-3.5" /> Call</a>
        )}
      </div>

      {/* Prep report link */}
      {meeting.prepReport && (
        <button onClick={onOpenPrepReport} className="flex w-full items-center gap-2 rounded-lg border border-[#0b4f9c33] bg-[#0b4f9c0a] px-3 py-2 text-left hover:bg-[#0b4f9c14]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0b4f9c] text-white"><Sparkles className="h-4 w-4" /></span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-foreground">Pre-Meeting Prep Report</span>
            <span className="block text-[11px] text-muted-foreground">AI-generated · emailed ahead of the meeting</span>
          </span>
        </button>
      )}

      {meeting.organizer && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Organizer</p>
          <p className="text-sm text-foreground">{meeting.organizer.name}</p>
        </div>
      )}

      {(meeting.participants?.length ?? 0) > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Participants · {meeting.participants!.length}</p>
          </div>
          <div className="relative mb-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search participants" className="w-full rounded-md border border-input bg-background py-1.5 pl-7 pr-2 text-xs outline-none focus:border-[#0b4f9c]" />
          </div>
          {clients.length > 0 && <p className="pt-1 text-[10px] font-medium uppercase text-muted-foreground/70">Client</p>}
          {clients.map((p) => <ParticipantRow key={p.id} p={p} />)}
          {advisors.length > 0 && <p className="pt-1 text-[10px] font-medium uppercase text-muted-foreground/70">Advisor team</p>}
          {advisors.map((p) => <ParticipantRow key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}

function TranscriptPanel({ meeting }: { meeting: Meeting }) {
  if (!meeting.hasTranscript || !meeting.transcript) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{meeting.vendor === 'in_person' ? 'In-person meeting — no recording or transcript.' : 'No transcript available yet.'}</p>
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Attributed transcript · retained 30 days</p>
      <div className="space-y-2">
        {meeting.transcript.split('\n').filter(Boolean).map((line, i) => {
          const [speaker, ...rest] = line.split(':')
          const text = rest.join(':').trim()
          return (
            <div key={i} className="text-[13px] leading-snug">
              <span className="font-medium text-foreground">{speaker}</span>
              <span className="text-foreground/80">{text ? `: ${text}` : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CommentsPanel() {
  const [comments, setComments] = useState<{ who: string; text: string }[]>([
    { who: 'Marcus Bell', text: 'Flagging the LPL beneficiary change for compliance — looped in @Priya.' },
  ])
  const [draft, setDraft] = useState('')
  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 text-[11px] text-muted-foreground">Internal only · not visible to the client</p>
      <div className="flex-1 space-y-2">
        {comments.map((c, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-2.5">
            <p className="text-xs font-medium text-foreground">{c.who}</p>
            <p className="text-[13px] text-foreground/85">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-end gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5">
        <AtSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { setComments((c) => [...c, { who: 'Priya Raman', text: draft.trim() }]); setDraft('') } }} placeholder="Comment or @mention…" className="flex-1 bg-transparent text-xs outline-none" />
        <button onClick={() => { if (draft.trim()) { setComments((c) => [...c, { who: 'Priya Raman', text: draft.trim() }]); setDraft('') } }} className="text-muted-foreground hover:text-[#0b4f9c]"><Send className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}

const TABS: { id: Panel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'details', label: 'Details', icon: Info },
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
]

export function MeetingSidebar({ meeting, onOpenPrepReport }: { meeting: Meeting; onOpenPrepReport: () => void }) {
  const [panel, setPanel] = useState<Panel>('details')
  return (
    <aside className="w-[320px] shrink-0 rounded-xl border border-border bg-card/40">
      <div className="flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPanel(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors',
              panel === t.id ? 'border-b-2 border-[#0b4f9c] text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4">
        {panel === 'details' && <DetailsPanel meeting={meeting} onOpenPrepReport={onOpenPrepReport} />}
        {panel === 'transcript' && <TranscriptPanel meeting={meeting} />}
        {panel === 'comments' && <CommentsPanel />}
      </div>
    </aside>
  )
}
