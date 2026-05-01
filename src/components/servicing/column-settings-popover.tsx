import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'
import type { ColumnDef } from '@/types/view-preset'

interface ColumnSettingsPopoverProps {
  columns: ColumnDef[]
  visibleColumns: string[]
  onVisibleColumnsChange: (columns: string[]) => void
}

export function ColumnSettingsPopover({
  columns,
  visibleColumns,
  onVisibleColumnsChange,
}: ColumnSettingsPopoverProps) {
  const toggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      onVisibleColumnsChange(visibleColumns.filter((c) => c !== key))
    } else {
      onVisibleColumnsChange([...visibleColumns, key])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Display
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Toggle columns
        </div>
        <div className="space-y-0.5">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => toggle(col.key)}
                disabled={col.alwaysVisible}
              />
              {col.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
