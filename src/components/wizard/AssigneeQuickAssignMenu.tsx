import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { showAssigneeUpdatedToast } from '@/utils/assigneeAssignUndo'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { JOURNEY_BULK_ASSIGN_OPTIONS } from '@/data/journeyAssigneeDirectory'
import { cn } from '@/lib/utils'
import { AvatarGlyph, MultiAssigneeCountGlyph } from '@/components/wizard/AssigneeContactHover'

function stopRowActivation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

export function AssigneeSearchMenuContent({
  selectedAssignee,
  searchPlaceholder = 'Assign To...',
  onSelect,
}: {
  selectedAssignee?: string
  searchPlaceholder?: string
  onSelect: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const selected = (selectedAssignee ?? '').trim()

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? JOURNEY_BULK_ASSIGN_OPTIONS.filter((m) => m.name.toLowerCase().includes(q))
      : [...JOURNEY_BULK_ASSIGN_OPTIONS]

    if (!selected || selected === 'Unassigned') return filtered

    const selectedHit = filtered.find((m) => m.name === selected)
    const rest = filtered.filter((m) => m.name !== selected)
    return selectedHit ? [selectedHit, ...rest] : filtered
  }, [query, selected])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          autoComplete="off"
          autoFocus
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={stopRowActivation}
          onClick={stopRowActivation}
          className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Filter assignees"
        />
      </div>
      <div className="max-h-[220px] overflow-y-auto py-0.5">
        {options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
        ) : (
          options.map((m) => {
            const isSelected = selected === m.name
            return (
              <button
                key={m.id}
                type="button"
                className={cn(
                  'flex h-9 w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
                )}
                onClick={(e) => {
                  stopRowActivation(e)
                  onSelect(m.name)
                  setQuery('')
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-primary/5 text-[10px] font-semibold text-primary"
                  aria-hidden
                >
                  {m.initials}
                </span>
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                {isSelected ? (
                  <Check className="h-4 w-4 shrink-0 text-foreground" aria-label="Selected" />
                ) : (
                  <span className="h-4 w-4 shrink-0" aria-hidden />
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function AssigneeQuickAssignMenu({
  assigneeLabel,
  assigneeCount,
  assigneeNames,
  selectedAssignee,
  onAssign,
  size = 'compact',
  side = 'bottom',
  align = 'end',
  searchPlaceholder = 'Assign To...',
  successDescription,
  assignScopeLabel = 'action',
}: {
  assigneeLabel?: string
  /** When > 1, shows a count badge instead of a single avatar. */
  assigneeCount?: number
  /** Names behind the count badge (tooltip + aria). */
  assigneeNames?: string[]
  selectedAssignee?: string
  onAssign: (name: string) => void | (() => void)
  size?: 'default' | 'compact'
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  searchPlaceholder?: string
  successDescription?: (name: string) => string
  assignScopeLabel?: 'action' | 'journey'
}) {
  const [open, setOpen] = useState(false)
  const trimmed = (assigneeLabel ?? '').trim()
  const profileName = trimmed && trimmed !== 'Unassigned' ? trimmed : undefined
  const showCount = typeof assigneeCount === 'number' && assigneeCount > 1
  const countNames = assigneeNames?.filter(Boolean) ?? []
  const countTooltip =
    countNames.length > 0
      ? `${assigneeCount} assignees: ${countNames.join(', ')}`
      : `${assigneeCount} assignees`

  const triggerLabel = showCount
    ? `${countTooltip}. Click to assign entire ${assignScopeLabel} to one advisor.`
    : profileName
      ? `Assigned to ${profileName}. Click to change assignee.`
      : 'Unassigned. Click to assign.'

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={triggerLabel}
          title={showCount ? countTooltip : undefined}
          onPointerDown={stopRowActivation}
          onClick={stopRowActivation}
        >
          {showCount ? (
            <MultiAssigneeCountGlyph count={assigneeCount!} size={size} />
          ) : (
            <AvatarGlyph name={profileName} unassigned={!profileName} size={size} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={6}
        className="w-[min(280px,calc(100vw-1.5rem))] p-1 shadow-lg"
        onPointerDown={stopRowActivation}
        onClick={stopRowActivation}
      >
        {open ? (
          <AssigneeSearchMenuContent
            selectedAssignee={selectedAssignee ?? assigneeLabel}
            searchPlaceholder={searchPlaceholder}
            onSelect={(name) => {
              const undo = onAssign(name)
              setOpen(false)
              window.setTimeout(() => {
                showAssigneeUpdatedToast(
                  successDescription?.(name) ?? `Assigned to ${name}.`,
                  typeof undo === 'function' ? undo : undefined,
                )
              }, 0)
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
