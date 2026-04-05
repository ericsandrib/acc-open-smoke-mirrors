import { Button } from '@/components/ui/button'
import { Filter, RotateCcw, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableControlsProps {
  filterCount: number
  isDirty: boolean
  onFilterClick: () => void
  onSave: () => void
  onReset: () => void
}

export function TableControls({
  filterCount,
  isDirty,
  onFilterClick,
  onSave,
  onReset,
}: TableControlsProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onFilterClick} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {filterCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-medium rounded-full bg-primary text-primary-foreground">
              {filterCount}
            </span>
          )}
        </Button>
      </div>

      <div className={cn('flex items-center gap-1 transition-opacity', isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button size="sm" onClick={onSave} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
