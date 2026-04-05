import { useState, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Filter } from '@/components/filter'
import type { FilterOption } from '@/components/filter/filter-types'
import { MORPH_SPRING } from '@/components/filter/filter-types'
import type { ColumnDef, ViewFilter } from '@/types/view-preset'

interface FilterSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef[]
  filters: ViewFilter[]
  onFiltersChange: (filters: ViewFilter[]) => void
  rows: Record<string, unknown>[]
}

// ─── Adapter: derive options from row data for multi-select columns ────

function deriveOptions(rows: Record<string, unknown>[], columnKey: string): FilterOption[] {
  const values = [...new Set(rows.map((r) => String(r[columnKey] ?? '')))].filter(Boolean).sort()
  return values.map((v) => ({
    value: v,
    label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
}

// ─── Adapter: extract current filter value for a column ────

function getMultiSelectValue(filters: ViewFilter[], column: string): string[] {
  const f = filters.find((f) => f.column === column)
  if (!f) return []
  if (Array.isArray(f.value)) return f.value
  if (f.value) return [f.value]
  return []
}

function getFreeTextValue(filters: ViewFilter[], column: string): string[] {
  const f = filters.find((f) => f.column === column)
  if (!f) return []
  if (typeof f.value === 'string' && f.value) return [f.value]
  if (Array.isArray(f.value)) return f.value
  return []
}

// ─── Adapter: update filters when a filter component changes ────

function updateMultiSelectFilter(
  filters: ViewFilter[],
  column: string,
  value: string[],
): ViewFilter[] {
  const without = filters.filter((f) => f.column !== column)
  if (value.length === 0) return without
  return [...without, { column, operator: 'includes', value }]
}

function updateFreeTextFilter(
  filters: ViewFilter[],
  column: string,
  value: string[],
): ViewFilter[] {
  const without = filters.filter((f) => f.column !== column)
  if (value.length === 0) return without
  // Store as single contains filter using first value, or join for multi
  return [...without, { column, operator: 'contains', value: value.join(' ') }]
}

// ─── Component ──────────────────────────────────────────────

export function FilterSidebar({
  open,
  onOpenChange,
  columns,
  filters,
  onFiltersChange,
  rows,
}: FilterSidebarProps) {
  const filterableColumns = useMemo(() => columns.filter((c) => c.filterable), [columns])

  const [visibleFilters, setVisibleFilters] = useState<Set<string>>(
    () => new Set(filterableColumns.map((c) => c.key)),
  )
  const freshlyAdded = useRef<Set<string>>(new Set())

  const addFilter = useCallback((key: string) => {
    freshlyAdded.current.add(key)
    setVisibleFilters((prev) => new Set(prev).add(key))
  }, [])

  const removeFilter = useCallback(
    (key: string) => {
      setVisibleFilters((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      // Clear the filter value
      onFiltersChange(filters.filter((f) => f.column !== key))
    },
    [filters, onFiltersChange],
  )

  const shouldExpandOnMount = (key: string) => {
    if (freshlyAdded.current.has(key)) {
      freshlyAdded.current.delete(key)
      return true
    }
    return false
  }

  const availableFilters = filterableColumns.filter((c) => !visibleFilters.has(c.key))

  const clearAll = () => {
    onFiltersChange([])
  }

  const optionsCache = useMemo(() => {
    const cache: Record<string, FilterOption[]> = {}
    for (const col of filterableColumns) {
      if (col.filterable === 'multi-select') {
        cache[col.key] = deriveOptions(rows, col.key)
      }
    }
    return cache
  }, [rows, filterableColumns])

  const portalTarget = document.getElementById('filter-sidebar-portal')
  if (!portalTarget) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0 }}
          animate={{ width: 380 }}
          exit={{ width: 0 }}
          transition={MORPH_SPRING}
          className="shrink-0 h-screen sticky top-0 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, delay: 0.08 }}
            className="w-[380px] h-full border-l border-border bg-background flex flex-col"
          >
            {/* Header */}
            <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border">
              <span className="text-sm font-medium text-foreground">Filters</span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center size-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Group header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium text-muted-foreground">Active Filters</span>
              <div className="flex items-center gap-1">
                {filters.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  >
                    Clear all
                  </button>
                )}
                {availableFilters.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-center size-7 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Add filter"
                      >
                        <Plus className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {availableFilters.map((col) => (
                        <DropdownMenuItem key={col.key} onClick={() => addFilter(col.key)}>
                          {col.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Filter list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2">
              {filterableColumns.map((col) => {
                if (!visibleFilters.has(col.key)) return null

                if (col.filterable === 'multi-select') {
                  return (
                    <Filter
                      key={col.key}
                      type="multi-select"
                      label={col.label}
                      options={optionsCache[col.key] ?? []}
                      value={getMultiSelectValue(filters, col.key)}
                      onChange={(v) => onFiltersChange(updateMultiSelectFilter(filters, col.key, v))}
                      onRemove={() => removeFilter(col.key)}
                      defaultExpanded={shouldExpandOnMount(col.key)}
                    />
                  )
                }

                if (col.filterable === 'text') {
                  return (
                    <Filter
                      key={col.key}
                      type="free-text"
                      label={col.label}
                      value={getFreeTextValue(filters, col.key)}
                      onChange={(v) => onFiltersChange(updateFreeTextFilter(filters, col.key, v))}
                      onRemove={() => removeFilter(col.key)}
                      defaultExpanded={shouldExpandOnMount(col.key)}
                    />
                  )
                }

                return null
              })}

              {visibleFilters.size === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No filters added. Click + to add one.
                </p>
              )}
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>,
    portalTarget,
  )
}
