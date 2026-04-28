import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, ChevronDown, Filter, RotateCcw, Save, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RelationshipScope = 'my' | 'all'
export type QuickSortKey = 'ready_to_begin' | 'created_at' | 'assigned_to'
export type QuickSortDirection = 'asc' | 'desc'

interface TableControlsProps {
  filterCount: number
  isDirty: boolean
  onFilterClick: () => void
  onSave: () => void
  onReset: () => void
  relationshipScope: RelationshipScope
  onRelationshipScopeChange: (scope: RelationshipScope) => void
  quickSortKey: QuickSortKey
  quickSortDirection: QuickSortDirection
  onQuickSortChange: (next: { key: QuickSortKey; direction: QuickSortDirection }) => void
}

export function TableControls({
  filterCount,
  isDirty,
  onFilterClick,
  onSave,
  onReset,
  relationshipScope,
  onRelationshipScopeChange,
  quickSortKey,
  quickSortDirection,
  onQuickSortChange,
}: TableControlsProps) {
  const sortLabel =
    quickSortKey === 'ready_to_begin'
      ? 'Ready to Begin'
      : quickSortKey === 'created_at'
        ? 'Created'
        : 'Assigned To'

  return (
    <div className="flex items-center justify-between py-2 gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              {relationshipScope === 'my' ? 'My Relationships' : 'All Relationships'}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onRelationshipScopeChange('my')}>
              {relationshipScope === 'my' ? <Check className="h-3.5 w-3.5 mr-1" /> : <span className="w-4 mr-1" />}
              My Relationships
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRelationshipScopeChange('all')}>
              {relationshipScope === 'all' ? <Check className="h-3.5 w-3.5 mr-1" /> : <span className="w-4 mr-1" />}
              All Relationships
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort
              <span className="text-muted-foreground">{sortLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 space-y-2">
            <Select
              value={quickSortKey}
              onValueChange={(v) =>
                onQuickSortChange({ key: v as QuickSortKey, direction: quickSortDirection })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sort field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready_to_begin">Ready to Begin</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="assigned_to">Assigned To</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={quickSortDirection}
              onValueChange={(v) =>
                onQuickSortChange({ key: quickSortKey, direction: v as QuickSortDirection })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={onFilterClick} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filter
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
