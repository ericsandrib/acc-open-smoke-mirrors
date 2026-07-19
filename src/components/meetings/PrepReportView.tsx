import { History, User, Users, Workflow, TrendingUp, Sparkles, Mail, FileText, Quote, ListChecks, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Meeting, PrepReportSection } from '@/types/meeting'
import { fmtDate } from './meetingUtils'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  history: History, user: User, users: Users, workflow: Workflow, trending: TrendingUp, sparkles: Sparkles,
}

function Section({ s }: { s: PrepReportSection }) {
  const Icon = ICONS[s.icon ?? ''] ?? FileText
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b4f9c14] text-[#0b4f9c]"><Icon className="h-4 w-4" /></span>
        <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
      </div>
      {s.highlights && (
        <ul className="ml-1 space-y-1.5">
          {s.highlights.map((h, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-snug text-foreground/85">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0b4f9c]" />{h}
            </li>
          ))}
        </ul>
      )}
      {s.bodyHtml && <div className="prose prose-sm mt-2 max-w-none text-[13px] text-foreground/85" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />}
      {s.evidence && s.evidence.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-2">
          {s.evidence.map((e, i) => (
            <div key={i} className="flex gap-2 text-xs text-muted-foreground">
              <Quote className="h-3.5 w-3.5 shrink-0 text-[#0b4f9c]" />
              <span><span className="italic text-foreground/80">{e.quote}</span> <span className="whitespace-nowrap">— {e.source}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** The report body — shared by the modal and the inline Prep-tab render. */
export function PrepReportBody({ meeting, onAddAgenda }: { meeting: Meeting; onAddAgenda?: () => void }) {
  const r = meeting.prepReport
  if (!r) return null
  return (
    <div>
      {/* delivery banner */}
      <div className="flex items-start gap-2 rounded-lg border border-[#0b4f9c33] bg-[#0b4f9c0a] px-3 py-2 text-xs text-foreground/80">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4f9c]" />
        <span>
          Generated automatically for <strong>{meeting.subject}</strong> ({fmtDate(meeting.startTime)}).
          Delivered to {r.deliveredTo ?? 'your inbox'} on the Monday of the meeting week, and available here in Meetings AI.
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">Standard report · {r.sections.length} of 13 topics · review, personalize, and enrich before the meeting.</p>

      <div className="mt-3 space-y-3">
        {r.sections.map((s) => <Section key={s.id} s={s} />)}
      </div>

      {r.recommendedTopics && r.recommendedTopics.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[#0b4f9c]" />
              <h3 className="text-sm font-semibold text-foreground">Recommended discussion agenda</h3>
            </div>
            {onAddAgenda && (
              <button onClick={onAddAgenda} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                <Plus className="h-3.5 w-3.5 text-[#0b4f9c]" /> Add to prep notes
              </button>
            )}
          </div>
          <ol className="ml-4 list-decimal space-y-1 text-[13px] text-foreground/85">
            {r.recommendedTopics.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>
      )}

      <p className="pt-3 text-center text-[11px] text-muted-foreground">Roadmap preview · AI-generated. Advisor reviews before the meeting.</p>
    </div>
  )
}

export function PrepReportView({ meeting, open, onOpenChange }: { meeting: Meeting; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!meeting.prepReport) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b4f9c] text-white"><Sparkles className="h-4 w-4" /></span>
            Pre-Meeting Prep Report
          </DialogTitle>
        </DialogHeader>
        <PrepReportBody meeting={meeting} />
      </DialogContent>
    </Dialog>
  )
}
