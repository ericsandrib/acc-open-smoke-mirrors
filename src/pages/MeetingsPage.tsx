import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useMeetings } from '@/stores/meetingsStore'

export function MeetingsPage() {
  const m = useMeetings()

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Meetings</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Native transcription → AI summary → attributed action items. The advisor approves before anything becomes final.
        </p>

        <div className="flex flex-col gap-2">
          {m.meetings.map((mtg) => {
            const dt = new Date(mtg.startTime)
            const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            const summary = m.summaries[mtg.id]
            return (
              <Link
                key={mtg.id}
                to={`/meetings/${mtg.id}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-[#0b4f9c66] transition-colors"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-foreground/60" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{mtg.subject}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {mtg.relationshipName} · {dateStr}, {timeStr}
                  </div>
                </div>
                {summary?.isAttested ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
                ) : summary?.isAiEnhanced ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#0b4f9c]"><Sparkles className="h-3.5 w-3.5" /> Summary ready</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{mtg.isHistorical ? 'Historical' : 'Upcoming'}</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
