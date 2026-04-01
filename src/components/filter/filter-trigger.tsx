import { ChevronRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterState } from './filter-types'

interface FilterTriggerProps {
  label: string
  expanded: boolean
  state?: FilterState
  onToggle: () => void
  onRemove?: () => void
}

export function FilterTrigger({
  label,
  expanded,
  state = 'default',
  onToggle,
  onRemove,
}: FilterTriggerProps) {
  const isDisabled = state === 'disabled'

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'flex items-center w-full text-left cursor-pointer select-none',
        'transition-colors',
        'pl-1 pr-2 py-1',
        isDisabled && 'cursor-default opacity-60 pointer-events-none',
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <span className="flex items-center justify-center size-8 shrink-0">
          <ChevronRight
            className={cn(
              'size-3 text-muted-foreground group-hover/filter:text-foreground shrink-0 transition-all duration-200',
              expanded && 'rotate-90',
            )}
          />
        </span>
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          disabled={isDisabled}
          className="shrink-0 flex items-center justify-center size-8 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover/filter:opacity-100"
          aria-label={`Remove ${label} filter`}
        >
          <Minus className="size-3.5" />
        </button>
      )}
    </div>
  )
}
