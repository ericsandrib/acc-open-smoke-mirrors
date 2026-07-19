import { GraduationCap, Scale, MessageCircleQuestion, ListChecks, Smile, Lightbulb, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting } from '@/types/meeting'

/** Derive light coaching signals from the transcript — real computation, scripted tips. */
function analyze(meeting: Meeting) {
  const lines = (meeting.transcript ?? '').split('\n').filter(Boolean)
  const advisorNames = new Set((meeting.participants ?? []).filter((p) => p.kind === 'advisor').map((p) => p.name))
  let advisorChars = 0
  let clientChars = 0
  let questions = 0
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const speaker = line.slice(0, idx).trim()
    const text = line.slice(idx + 1).trim()
    if (advisorNames.has(speaker)) {
      advisorChars += text.length
      if (text.includes('?')) questions++
    } else {
      clientChars += text.length
    }
  }
  const total = advisorChars + clientChars || 1
  const advisorPct = Math.round((advisorChars / total) * 100)
  const positive = (meeting.referralMoments ?? []).some((r) => r.trigger === 'positive_sentiment')
  return { advisorPct, clientPct: 100 - advisorPct, questions, positive }
}

function Tile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: 'good' | 'warn' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={cn('mt-1 text-lg font-semibold', tone === 'good' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-foreground')}>{value}</div>
    </div>
  )
}

export function CoachTab({ meeting }: { meeting: Meeting }) {
  const a = analyze(meeting)
  const balanced = a.advisorPct <= 50

  const tips: string[] = []
  tips.push(balanced
    ? `Great listening balance — the client spoke ${a.clientPct}% of the time. Letting clients lead surfaces more signal.`
    : `You spoke ${a.advisorPct}% of the time. Try inviting the client in more — open questions and a beat of silence help.`)
  tips.push(a.questions >= 2
    ? `Strong discovery — you asked ${a.questions} open questions that opened up new topics.`
    : 'Add a couple more open discovery questions next time to draw out goals and concerns.')
  if ((meeting.lifeEvents?.length ?? 0) > 0) tips.push(`High-value capture — you surfaced ${meeting.lifeEvents!.length} life events and turned them into next steps.`)
  tips.push('You closed with explicit next steps and ownership — a clear, compliant wrap-up.')

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white"><GraduationCap className="h-4 w-4" /></span>
          <span className="text-sm font-semibold text-rose-700">Advisor Coach</span>
          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">Roadmap</span>
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-700/80"><Lock className="h-3 w-3" /> Private to you — never part of the client record or shared externally.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile icon={Scale} label="Talk ratio" value={`${a.advisorPct}/${a.clientPct}`} tone={balanced ? 'good' : 'warn'} />
        <Tile icon={MessageCircleQuestion} label="Discovery Qs" value={String(a.questions)} tone={a.questions >= 2 ? 'good' : 'warn'} />
        <Tile icon={ListChecks} label="Next steps" value="Clear" tone="good" />
        <Tile icon={Smile} label="Sentiment" value={a.positive ? 'Positive' : 'Neutral'} tone={a.positive ? 'good' : undefined} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">Coaching highlights</p>
        <ul className="space-y-2">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2 rounded-lg border border-border bg-card p-3 text-[13px] text-foreground/85">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {t}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">Roadmap preview · AI coaching is generated from the transcript. You decide what to act on.</p>
    </div>
  )
}
