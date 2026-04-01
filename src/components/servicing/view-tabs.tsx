import { cn } from '@/lib/utils'
import type { ViewPreset } from '@/types/view-preset'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ViewSelectorDropdown } from './view-selector-dropdown'

interface ViewTabsProps {
  presets: ViewPreset[]
  activeViewId: string
  onViewChange: (id: string) => void
  getRowCount: (preset: ViewPreset) => number
}

export function ViewTabs({ presets, activeViewId, onViewChange, getRowCount }: ViewTabsProps) {
  const pinned = presets.filter((p) => p.category === 'pinned')
  const hasMore = presets.length > pinned.length

  return (
    <div className="flex items-center gap-1 border-b border-border">
      {pinned.map((preset) => {
        const active = preset.id === activeViewId
        const count = getRowCount(preset)
        return (
          <button
            key={preset.id}
            onClick={() => onViewChange(preset.id)}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              'hover:text-foreground',
              active
                ? 'text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <span className="flex items-center gap-1.5">
              {preset.name}
              <span
                className={cn(
                  'text-xs tabular-nums rounded-full px-1.5 py-0.5',
                  active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
            </span>
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        )
      })}

      {hasMore && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <ViewSelectorDropdown
              presets={presets}
              activeViewId={activeViewId}
              onViewChange={onViewChange}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
