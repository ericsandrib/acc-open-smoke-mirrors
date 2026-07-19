import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Info, FileText, MessageSquare, Video, Phone, MapPin, Copy, Plus, Link2, Check,
  Sparkles, Search, AtSign, Send, ShieldCheck, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import type { Meeting, Participant, RsvpStatus } from '@/types/meeting'
import { fmtDate, fmtTime, vendorLabel, isVirtual } from './meetingUtils'
import { VendorMark } from './VendorMark'

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

function RelationshipField({ meeting }: { meeting: Meeting }) {
  const [connected, setConnected] = useState<string | null>(meeting.relationshipName || null)
  if (connected) {
    return (
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Relationship</p>
        <p className="text-sm font-medium text-foreground">{connected}</p>
      </div>
    )
  }
  const candidates = ['Whitmore Household', 'Nakamura Family', 'City of Cedar Falls', '+ Create new relationship']
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Link2 className="h-3.5 w-3.5" /> No relationship connected</p>
      <p className="mt-0.5 text-[11px] text-amber-700/80">Link this meeting to a CRM relationship so its summary, actions, and AI signals route correctly.</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700"><Plus className="h-3.5 w-3.5" /> Connect relationship</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {candidates.map((c) => (
            <DropdownMenuItem
              key={c}
              onClick={() => {
                const isNew = c.startsWith('+')
                setConnected(isNew ? 'Carol Whitmore (new)' : c)
                toast.success(isNew ? 'Created and connected a new relationship' : `Connected to ${c}`)
              }}
            >
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function RecordingRetention({ meeting }: { meeting: Meeting }) {
  const [retention, setRetention] = useState('30 days')
  if (!isVirtual(meeting.vendor)) return null
  const opts = ['30 days', '90 days', '1 year', 'Until I delete it']
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Recording &amp; retention</p>
      <div className="mt-1 space-y-2 rounded-lg border border-border bg-card/60 p-2.5">
        <div className="flex items-center gap-1.5 text-xs text-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Consent on file · all participants</div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Transcript retention</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/50">{retention} <ChevronDown className="h-3 w-3 text-muted-foreground" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {opts.map((o) => (
                <DropdownMenuItem key={o} onClick={() => { setRetention(o); toast.success(`Transcript retention set to ${o.toLowerCase()}`) }}>{o}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
      <RelationshipField meeting={meeting} />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">When</p>
        <p className="text-sm text-foreground">{fmtDate(meeting.startTime)}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{fmtTime(meeting.startTime)} – {fmtTime(meeting.endTime)} · <VendorMark vendor={meeting.vendor} className="h-3.5 w-3.5" /> {vendorLabel(meeting.vendor)}</p>
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

      <RecordingRetention meeting={meeting} />

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

function LiveTranscriptPanel({ meeting }: { meeting: Meeting }) {
  const lines = (meeting.transcript ?? '').split('\n').filter(Boolean)
  const [revealed, setRevealed] = useState(1)
  useEffect(() => {
    if (revealed >= lines.length) return
    const id = setTimeout(() => setRevealed((n) => n + 1), 2200)
    return () => clearTimeout(id)
  }, [revealed, lines.length])
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#0b4f9c33] bg-[#0b4f9c0a] px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#0b4f9c]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Meeting Assistant is taking notes
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Recording with participant consent · transcript retained 30 days</p>
      </div>
      <div className="space-y-2">
        {lines.slice(0, revealed).map((line, i) => {
          const [speaker, ...rest] = line.split(':')
          const text = rest.join(':').trim()
          return (
            <div key={i} className="text-[13px] leading-snug">
              <span className="font-medium text-foreground">{speaker}</span>
              <span className="text-foreground/80">{text ? `: ${text}` : ''}</span>
            </div>
          )
        })}
        {revealed < lines.length && (
          <div className="flex items-center gap-1 py-1 pl-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TranscriptPanel({ meeting }: { meeting: Meeting }) {
  if (meeting.lifecycle === 'live' && meeting.transcript) return <LiveTranscriptPanel meeting={meeting} />
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
  const [panel, setPanel] = useState<Panel>(meeting.lifecycle === 'live' ? 'transcript' : 'details')
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
