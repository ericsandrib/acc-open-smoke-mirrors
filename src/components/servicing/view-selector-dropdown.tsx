import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ViewPreset } from '@/types/view-preset'
import { Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ViewSelectorDropdownProps {
  presets: ViewPreset[]
  activeViewId: string
  onViewChange: (id: string) => void
}

const categoryLabels: Record<string, string> = {
  pinned: 'Pinned',
  personal: 'Personal',
  global: 'Global',
}

export function ViewSelectorDropdown({
  presets,
  activeViewId,
  onViewChange,
}: ViewSelectorDropdownProps) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? presets.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : presets

  const categories = ['pinned', 'personal', 'global'] as const
  const grouped = categories
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: filtered.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search views…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {grouped.map((group) => (
          <div key={group.category}>
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onViewChange(preset.id)}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-1.5 text-sm text-left',
                  'hover:bg-accent transition-colors',
                  preset.id === activeViewId && 'bg-accent/50',
                )}
              >
                <span className="flex items-center gap-2">
                  {preset.name}
                  {preset.isDefault && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-1 py-0.5">
                      Default
                    </span>
                  )}
                </span>
                {preset.id === activeViewId && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No views found
          </div>
        )}
      </div>
    </div>
  )
}
