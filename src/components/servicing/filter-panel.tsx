import { useMemo, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColumnDef, ViewFilter } from '@/types/view-preset'

interface FilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef[]
  filters: ViewFilter[]
  onFiltersChange: (filters: ViewFilter[]) => void
  rows: Record<string, unknown>[]
}

export function FilterPanel({
  open,
  onOpenChange,
  columns,
  filters,
  onFiltersChange,
  rows,
}: FilterPanelProps) {
  const filterableColumns = columns.filter((c) => c.filterable)

  const uniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const col of filterableColumns) {
      if (col.filterable === 'multi-select') {
        const values = [...new Set(rows.map((r) => String(r[col.key] ?? '')))].filter(Boolean).sort()
        map[col.key] = values
      }
    }
    return map
  }, [rows, filterableColumns])

  const getFilterValue = (column: string): string | string[] => {
    const f = filters.find((f) => f.column === column)
    return f?.value ?? (uniqueValues[column] ? [] : '')
  }

  const updateFilter = (column: string, value: string | string[], operator: ViewFilter['operator']) => {
    const isEmpty = Array.isArray(value) ? value.length === 0 : value === ''
    const without = filters.filter((f) => f.column !== column)
    if (isEmpty) {
      onFiltersChange(without)
    } else {
      onFiltersChange([...without, { column, operator, value }])
    }
  }

  const clearAll = () => onFiltersChange([])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filters
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
                Clear all
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>Narrow down the table results.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          {filterableColumns.map((col) => (
            <FilterSection
              key={col.key}
              column={col}
              value={getFilterValue(col.key)}
              uniqueValues={uniqueValues[col.key]}
              onChange={(val, op) => updateFilter(col.key, val, op)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface FilterSectionProps {
  column: ColumnDef
  value: string | string[]
  uniqueValues?: string[]
  onChange: (value: string | string[], operator: ViewFilter['operator']) => void
}

function FilterSection({ column, value, uniqueValues, onChange }: FilterSectionProps) {
  const [open, setOpen] = useState(true)
  const activeCount = Array.isArray(value) ? value.length : value ? 1 : 0

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors">
        <span className="flex items-center gap-2">
          {column.label}
          {activeCount > 0 && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">
        {column.filterable === 'multi-select' && uniqueValues ? (
          <MultiSelectFilter values={uniqueValues} selected={value as string[]} onChange={(v) => onChange(v, 'includes')} />
        ) : (
          <TextFilter value={value as string} onChange={(v) => onChange(v, 'contains')} />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function MultiSelectFilter({
  values,
  selected,
  onChange,
}: {
  values: string[]
  selected: string[]
  onChange: (value: string[]) => void
}) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  return (
    <div className="space-y-1.5 pt-1">
      {values.map((val) => (
        <label key={val} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5">
          <Checkbox checked={selected.includes(val)} onCheckedChange={() => toggle(val)} />
          <span className="capitalize">{val.replace(/_/g, ' ')}</span>
        </label>
      ))}
    </div>
  )
}

function TextFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative pt-1">
      <Input
        placeholder="Type to filter…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm pr-8"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
