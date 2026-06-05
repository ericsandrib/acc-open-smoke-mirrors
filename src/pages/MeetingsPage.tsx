import { useMemo, useState } from 'react'
import { Calendar, Users, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useMeetings } from '@/stores/meetingsStore'
import { MeetingListItem } from '@/components/meetings/MeetingListItem'
import {
  type DateWindow, DATE_WINDOW_LABEL, inDateWindow, dayGroupLabel, startMs, isLive,
} from '@/components/meetings/meetingUtils'
import { cn } from '@/lib/utils'

type RelScope = 'all' | 'mine' | 'non_rel'
const REL_SCOPE_LABEL: Record<RelScope, string> = {
  all: 'All Relationships',
  mine: 'My Relationships',
  non_rel: 'Non-Relationship',
}
const CURRENT_ADVISOR = 'Priya Raman'

function FilterButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground" /> {label} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  )
}

export function MeetingsPage() {
  const m = useMeetings()
  const [dateWindow, setDateWindow] = useState<DateWindow>('coming_up')
  const [relScope, setRelScope] = useState<RelScope>('all')
  const [mineOnly, setMineOnly] = useState(true)

  const groups = useMemo(() => {
    const filtered = m.meetings.filter((mtg) => {
      if (!inDateWindow(mtg, dateWindow)) return false
      if (relScope === 'mine' && !(mtg.owner === CURRENT_ADVISOR || (mtg.participants ?? []).some((p) => p.name === CURRENT_ADVISOR))) return false
      if (relScope === 'non_rel' && mtg.relationshipId && !mtg.isExternal) return false
      if (mineOnly && mtg.isAttendee === false) return false
      return true
    })
    const sorted = [...filtered].sort((a, b) => {
      if (isLive(a) !== isLive(b)) return isLive(a) ? -1 : 1
      return startMs(a) - startMs(b)
    })
    const byDay = new Map<string, typeof sorted>()
    for (const mtg of sorted) {
      const k = dayGroupLabel(mtg.startTime)
      if (!byDay.has(k)) byDay.set(k, [])
      byDay.get(k)!.push(mtg)
    }
    return Array.from(byDay.entries())
  }, [m.meetings, dateWindow, relScope, mineOnly])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-foreground">Meetings</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Native transcription → AI summary → attributed action items. The advisor approves before anything becomes final.
        </p>

        {/* filter row */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button"><FilterButton icon={Calendar} label={DATE_WINDOW_LABEL[dateWindow]} /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(DATE_WINDOW_LABEL) as DateWindow[]).map((w) => (
                <DropdownMenuItem key={w} onClick={() => setDateWindow(w)}>{DATE_WINDOW_LABEL[w]}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button"><FilterButton icon={Users} label={REL_SCOPE_LABEL[relScope]} /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(REL_SCOPE_LABEL) as RelScope[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setRelScope(s)}>{REL_SCOPE_LABEL[s]}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* My / All toggle */}
          <div className="ml-auto inline-flex rounded-lg border border-border bg-muted/25 p-0.5">
            {([['mine', 'My Meetings'], ['all', 'All Meetings']] as const).map(([k, label]) => {
              const active = (k === 'mine') === mineOnly
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMineOnly(k === 'mine')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* grouped list */}
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No meetings in this view.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(([day, items]) => (
              <section key={day}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h2>
                <div className="flex flex-col gap-2">
                  {items.map((mtg) => (
                    <MeetingListItem key={mtg.id} meeting={mtg} summary={m.summaries[mtg.id]} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
