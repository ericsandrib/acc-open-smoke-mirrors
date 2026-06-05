import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, ThumbsUp, ThumbsDown, Link2, Loader2, Tag, CalendarHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AITextEditor } from './AITextEditor'
import { useMeetings } from '@/stores/meetingsStore'
import type { Meeting } from '@/types/meeting'
import { cn } from '@/lib/utils'

const GENERATED_AFTER_LINK = `<h2>Meeting summary</h2>
<p>AI-generated from the linked recording. Review for accuracy before approving.</p>
<ul><li>Key points and decisions from the conversation are captured here.</li></ul>`

function TopicsAndEvents({ meeting }: { meeting: Meeting }) {
  if (!meeting.topics?.length && !meeting.lifeEvents?.length) return null
  return (
    <div className="flex flex-col gap-2">
      {meeting.topics && meeting.topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Topics</span>
          {meeting.topics.map((t) => <span key={t.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/80">{t.label}</span>)}
        </div>
      )}
      {meeting.lifeEvents && meeting.lifeEvents.length > 0 && (
        <div className="rounded-lg border border-[#0b4f9c33] bg-[#0b4f9c0a] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#0b4f9c]">
            <CalendarHeart className="h-4 w-4" /> Life events detected
            <span className="rounded-full bg-[#0b4f9c14] px-1.5 py-0.5 text-[10px] font-medium">Roadmap</span>
          </div>
          <ul className="space-y-1">
            {meeting.lifeEvents.map((e) => (
              <li key={e.id} className="text-[13px] text-foreground/85"><span className="font-medium text-foreground">{e.label}.</span> {e.detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function SummaryTab({ meeting }: { meeting: Meeting }) {
  const m = useMeetings()
  const meetingId = meeting.id
  const summary = m.summaries[meetingId]
  const [busy, setBusy] = useState(false)
  const [linking, setLinking] = useState(false)
  const [aiBadge, setAiBadge] = useState(false)
  const fb = m.feedback[`summary-${meetingId}`]

  // Generating (ended, AI still processing).
  if (meeting.lifecycle === 'ended_pending') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-[#0b4f9c]" /> Generating AI summary…
      </div>
    )
  }

  // No recording linked yet → transcript-link banner (recovery path).
  if (!summary && (meeting.lifecycle === 'no_recording' || !meeting.hasTranscript)) {
    return (
      <div className="flex flex-col gap-3">
        {linking ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-[#0b4f9c]" /> Generating AI summary…
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-lg border border-[#0b4f9c33] bg-[#0b4f9c0a] px-3 py-2.5 text-sm">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4f9c]" />
              <div className="flex-1">
                <p className="text-foreground">Link a virtual meeting to generate an AI summary.</p>
                <p className="text-xs text-muted-foreground">This meeting had no recording attached. Connect one to get an AI summary, email draft, and action suggestions.</p>
              </div>
              <Button size="sm" className="shrink-0" onClick={() => { setLinking(true); toast.success('Recording linked — generating…'); setTimeout(() => { m.setSummaryContent(meetingId, GENERATED_AFTER_LINK); setAiBadge(true); setLinking(false) }, 1600) }}>Link meeting…</Button>
            </div>
            <p className="text-xs text-muted-foreground">…or write the summary manually below.</p>
            <AITextEditor title="Summary" placeholder="Write the meeting summary…" showAiHint={false} content="" bottomText="Review for accuracy before approving." onChange={(html) => m.setSummaryContent(meetingId, html)} />
          </>
        )}
      </div>
    )
  }

  if (!summary) {
    return <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No summary for this meeting yet.</div>
  }

  const attested = summary.isAttested
  const showAi = summary.isAiEnhanced || aiBadge

  const toggle = () => {
    setBusy(true)
    setTimeout(() => {
      if (attested) m.unattestSummary(meetingId)
      else m.attestSummary(meetingId, 'Priya Raman')
      setBusy(false)
    }, 300)
  }

  const footer = (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', attested ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
          {attested ? `Summary approved${summary.attestingAgent ? ` · by ${summary.attestingAgent}` : ''}` : 'Pending approval'}
        </span>
        {showAi && !attested && (
          <span className="inline-flex items-center gap-0.5">
            <button onClick={() => m.setFeedback(`summary-${meetingId}`, fb === 'up' ? undefined : 'up')} className={cn('rounded p-1 hover:bg-muted', fb === 'up' ? 'text-emerald-600' : 'text-muted-foreground')}><ThumbsUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => m.setFeedback(`summary-${meetingId}`, fb === 'down' ? undefined : 'down')} className={cn('rounded p-1 hover:bg-muted', fb === 'down' ? 'text-red-600' : 'text-muted-foreground')}><ThumbsDown className="h-3.5 w-3.5" /></button>
          </span>
        )}
      </div>
      <Button size="sm" disabled={busy} onClick={toggle}>{attested ? 'Undo approval' : 'Approve'}</Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {showAi && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#0b4f9c14] px-2 py-0.5 text-xs font-medium text-[#0b4f9c]"><Sparkles className="h-3 w-3" /> AI-generated summary</span>
      )}
      <AITextEditor
        content={summary.contentHtml}
        disabled={attested}
        bottomText={attested ? 'Approved — read only. The advisor remains accountable for the final summary.' : 'AI-generated draft. Review for accuracy before approving.'}
        footer={footer}
        onChange={(html) => m.setSummaryContent(meetingId, html)}
      />
      <TopicsAndEvents meeting={meeting} />
    </div>
  )
}
