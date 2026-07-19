import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Video, MapPin, Users, Copy, ArrowUpRight, ExternalLink, Sparkles, CheckCircle2, Link2, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting, MeetingSummary, Participant } from '@/types/meeting'
import {
  fmtTime, vendorShort, rsvpAccent, RSVP_LABEL, isLive, vendorLabel,
} from './meetingUtils'
import { VendorMark } from './VendorMark'

function Avatars({ people, max = 3 }: { people: Participant[]; max?: number }) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p) => (
        <span
          key={p.id}
          title={p.name}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold ring-2 ring-card',
            p.kind === 'client' ? 'bg-[#0b4f9c] text-white' : 'bg-muted text-foreground/70',
          )}
        >
          {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </span>
      ))}
      {extra > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-foreground/60 ring-2 ring-card">
          +{extra}
        </span>
      )}
    </div>
  )
}

function StatusChip({ meeting, summary }: { meeting: Meeting; summary?: MeetingSummary }) {
  if (summary?.isAttested)
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
  if (meeting.lifecycle === 'ended_ready' && summary?.isAiEnhanced)
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#0b4f9c14] px-2 py-0.5 text-xs font-medium text-[#0b4f9c]"><Sparkles className="h-3 w-3" /> Summary ready</span>
  if (meeting.lifecycle === 'ended_pending')
    return <span className="text-xs text-muted-foreground">Generating…</span>
  return null
}

export function MeetingListItem({ meeting, summary, onPreview }: { meeting: Meeting; summary?: MeetingSummary; onPreview?: () => void }) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const live = isLive(meeting)
  const muted = meeting.isAttendee === false
  const accent = rsvpAccent(meeting.myRsvp, meeting.isAttendee)
  const clients = (meeting.participants ?? []).filter((p) => p.kind === 'client')
  const attendeeCount = (meeting.participants ?? []).length

  const open = () => {
    if (meeting.isExternal && meeting.meetingLink) { window.open(meeting.meetingLink, '_blank', 'noopener'); return }
    navigate(`/meetings/${meeting.id}`)
  }
  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (meeting.meetingLink) navigator.clipboard?.writeText(meeting.meetingLink).catch(() => {})
    toast.success('Meeting link copied')
  }
  const join = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (meeting.meetingLink) window.open(meeting.meetingLink, '_blank', 'noopener')
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(false) }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
        aria-label={`${meeting.subject}${meeting.isExternal ? ' — opens in new tab' : ''}`}
        className={cn(
          'group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border bg-card pl-4 pr-3 py-3 text-left transition-colors',
          live ? 'border-[#0b4f9c40] bg-[#0b4f9c08]' : 'border-border hover:border-[#0b4f9c66] hover:bg-muted/30',
          muted && 'opacity-60',
        )}
      >
        {/* accent bar */}
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l" style={{ background: accent }} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {live && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
              </span>
            )}
            <span className="truncate text-sm font-semibold text-foreground">{meeting.subject}</span>
            {meeting.isExternal && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <VendorMark vendor={meeting.vendor} className="h-4 w-4" />
            <span>{vendorShort(meeting.vendor)}</span>
            {meeting.relationshipName ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
                  <Users className="h-3 w-3" /> {meeting.relationshipName}
                </span>
              </>
            ) : !meeting.isExternal ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                  <Link2 className="h-3 w-3" /> No relationship connected
                </span>
              </>
            ) : null}
            {meeting.isAttendee !== false && (meeting.myRsvp === 'maybe' || meeting.myRsvp === 'declined') && (
              <>
                <span aria-hidden>·</span>
                <span className={cn('rounded-full px-1.5 py-0.5 font-medium', meeting.myRsvp === 'maybe' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600')}>
                  {meeting.myRsvp === 'maybe' ? 'You: Maybe' : 'You declined'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* right cluster */}
        <div className="flex shrink-0 items-center gap-3">
          {live && !muted && (
            <div className="flex items-center gap-1.5">
              <button onClick={copyLink} title="Copy link" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Copy className="h-4 w-4" /></button>
              <span onClick={join} className="inline-flex items-center gap-1.5 rounded-md bg-[#0b4f9c] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#0a4587]">
                <Video className="h-3.5 w-3.5" /> Join Meeting
              </span>
            </div>
          )}
          {onPreview && !muted && (
            <button
              onClick={(e) => { e.stopPropagation(); onPreview() }}
              title="Quick preview"
              aria-label="Quick preview"
              className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:inline-flex"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <StatusChip meeting={meeting} summary={summary} />
          <div className="flex flex-col items-end">
            <span className="text-sm tabular-nums text-foreground">{fmtTime(meeting.startTime)}</span>
            {attendeeCount > 0 && (
              <span className="mt-0.5"><Avatars people={meeting.participants ?? []} /></span>
            )}
          </div>
        </div>
      </div>

      {/* hover popover */}
      {hover && (
        <div className="absolute left-4 top-[calc(100%-4px)] z-50 w-80 rounded-xl border border-border bg-popover p-3 shadow-xl">
          <p className="text-sm font-semibold text-foreground">{meeting.subject}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{fmtTime(meeting.startTime)} – {fmtTime(meeting.endTime)} · {vendorLabel(meeting.vendor)}</p>

          {meeting.organizer && (
            <p className="mt-2 text-xs text-muted-foreground">Organizer: <span className="text-foreground">{meeting.organizer.name}</span></p>
          )}
          {clients.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Participants</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(meeting.participants ?? []).map((p) => (
                  <span key={p.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">{p.name}</span>
                ))}
              </div>
            </div>
          )}
          {meeting.isAttendee !== false && (
            <p className="mt-2 text-xs text-muted-foreground">Your RSVP: <span className="text-foreground">{RSVP_LABEL[meeting.myRsvp ?? 'none']}</span></p>
          )}
          {meeting.location && <p className="mt-2 text-xs text-muted-foreground">{meeting.location}</p>}

          {!muted && (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
              {meeting.vendor === 'in_person' ? (
                <a onClick={(e) => e.stopPropagation()} href={`https://maps.google.com/?q=${encodeURIComponent(meeting.location ?? '')}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-medium text-[#0b4f9c] hover:underline"><MapPin className="h-3.5 w-3.5" /> View Map</a>
              ) : (
                <>
                  <button onClick={join} className="inline-flex items-center gap-1 text-xs font-medium text-[#0b4f9c] hover:underline"><Video className="h-3.5 w-3.5" /> Join</button>
                  <button onClick={copyLink} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /> Copy link</button>
                </>
              )}
              <button onClick={open} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">Open <ExternalLink className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
