import { useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Filter as FilterIcon,
  LayoutGrid,
  RefreshCw,
  Workflow,
  CircleDot,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfigHotspot } from '@/components/config-overlay'
import { useActionRuns, useTasks } from '@/db/queries/detail'
import type { Relationship } from '@/data/relationshipsSeed'
import { cn } from '@/lib/utils'

type Mode = 'Actions' | 'Tasks'

type Chip = 'All' | 'All Open' | 'Drafts' | 'Recommended' | 'Snoozed' | 'More'
const CHIPS: Chip[] = ['All', 'All Open', 'Drafts', 'Recommended', 'Snoozed', 'More']

// Status taxonomy from the upstream action_runs / tasks tables.
function chipFilter(chip: Chip, status: string): boolean {
  if (chip === 'All' || chip === 'More') return true
  if (chip === 'Drafts') return status === 'draft'
  if (chip === 'Snoozed') return status === 'snoozed' || status === 'blocked'
  if (chip === 'Recommended') return false // illustrative
  if (chip === 'All Open')
    return status !== 'completed' && status !== 'cancelled' && status !== 'rejected'
  return true
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" />
  if (status === 'in_progress') return <Clock className="h-3.5 w-3.5" />
  if (status === 'blocked' || status === 'snoozed')
    return <AlertCircle className="h-3.5 w-3.5" />
  return <CircleDot className="h-3.5 w-3.5" />
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ')
  const color =
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'in_progress'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : status === 'draft'
      ? 'bg-stone-100 text-stone-700 border-stone-200'
      : 'bg-sky-50 text-sky-700 border-sky-200'
  return (
    <Badge
      variant="outline"
      className={cn('h-5 text-[10px] font-medium uppercase tracking-wide gap-1', color)}
    >
      <StatusIcon status={status} />
      {label}
    </Badge>
  )
}

export function ServicingTab({ r }: { r: Relationship }) {
  const [mode, setMode] = useState<Mode>('Actions')
  const [chip, setChip] = useState<Chip>('All Open')

  const { data: actions, loading: actionsLoading } = useActionRuns(r.id)
  const { data: tasks, loading: tasksLoading } = useTasks(r.id)
  const loading = mode === 'Actions' ? actionsLoading : tasksLoading

  const filteredActions = useMemo(
    () => (actions ?? []).filter((a) => chipFilter(chip, a.status)),
    [actions, chip],
  )
  const filteredTasks = useMemo(
    () => (tasks ?? []).filter((t) => chipFilter(chip, t.status)),
    [tasks, chip],
  )
  const rowCount = mode === 'Actions' ? filteredActions.length : filteredTasks.length

  return (
    <div className="relative rounded-xl border border-border bg-white">
      <ConfigHotspot
        knobId="relationships/detail/tabs/servicing"
        anchor="top-right"
        size="md"
        area="region"
        className="!top-2 !right-2"
      />

      <div className="px-5 pt-4 pb-3 flex items-center gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-foreground mr-2">Servicing</h2>
        <div className="relative inline-flex items-center">
          <ModeToggle value={mode} onChange={setMode} />
          <ConfigHotspot
            knobId="relationships/detail/tabs/servicing/mode"
            anchor="inline"
            size="sm"
            className="ml-1"
          />
        </div>
      </div>

      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap relative pr-12">
        <ConfigHotspot
          knobId="relationships/detail/tabs/servicing/filters"
          anchor="middle-right"
          size="sm"
          className="!right-3"
        />
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setChip(c)}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              chip === c
                ? 'bg-foreground text-background border-foreground'
                : 'bg-white text-foreground/80 border-border hover:bg-muted/40',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="px-5 flex items-center gap-2 border-y border-border py-2 bg-muted/20">
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort: Due
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <FilterIcon className="h-3.5 w-3.5" />
          Filter 1
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{rowCount} rows</span>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5" />
          Display
        </Button>
      </div>

      {loading && (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}

      {!loading && rowCount === 0 && (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          No {mode.toLowerCase()} matching the current filter.
        </div>
      )}

      {!loading && rowCount > 0 && mode === 'Actions' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-5 py-2.5 font-medium">Action</th>
              <th className="px-5 py-2.5 font-medium">Category</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{row.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground/85">
                  {row.category ?? '—'}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-3 text-foreground/80 tabular-nums">
                  {row.startedAt
                    ? new Date(row.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && rowCount > 0 && mode === 'Tasks' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-5 py-2.5 font-medium">Task</th>
              <th className="px-5 py-2.5 font-medium">Action</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-5 py-3 text-foreground">{row.name}</td>
                <td className="px-5 py-3 text-foreground/80">{row.blueprintName}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-3 text-foreground/80">
                  {row.deadline
                    ? new Date(row.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ModeToggle({
  value,
  onChange,
}: {
  value: Mode
  onChange: (v: Mode) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
      {(['Tasks', 'Actions'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            'rounded px-3 py-1 text-xs font-medium transition-colors',
            value === m
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
