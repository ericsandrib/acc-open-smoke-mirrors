import { useState, useCallback, type ReactNode } from 'react'
import { useViewManager } from '@/hooks/useViewManager'
import type { ColumnDef, ViewPreset } from '@/types/view-preset'
import { ViewTabs } from './view-tabs'
import { TableControls, type QuickSortDirection, type QuickSortKey, type RelationshipScope } from './table-controls'
import { FilterSidebar } from './filter-sidebar'
import { ColumnSettingsPopover } from './column-settings-popover'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableViewWrapperProps<T> {
  tableId: string
  presets: ViewPreset[]
  columns: ColumnDef[]
  allRows: T[]
  defaultRelationshipScope?: RelationshipScope
  pinRowId?: string
  children: (props: { rows: T[]; visibleColumns: string[] }) => ReactNode
}

export function TableViewWrapper<T>({
  tableId,
  presets,
  columns,
  allRows,
  defaultRelationshipScope = 'my',
  pinRowId,
  children,
}: TableViewWrapperProps<T>) {
  const vm = useViewManager<T>(tableId, presets, columns)
  const [filterOpen, setFilterOpen] = useState(false)
  const [relationshipScope, setRelationshipScope] = useState<RelationshipScope>(defaultRelationshipScope)
  const [quickSortKey, setQuickSortKey] = useState<QuickSortKey>('ready_to_begin')
  const [quickSortDirection, setQuickSortDirection] = useState<QuickSortDirection>('asc')

  const scopedRows = allRows.filter((row) => {
    if (relationshipScope === 'all') return true
    const assignee = String((row as Record<string, unknown>).assignedTo ?? '')
    return assignee.includes('Alice Chen')
  })

  const filteredRows = vm.applyFilters(scopedRows)
  const sortedRows = [...filteredRows].sort((a, b) => {
    const ra = a as Record<string, unknown>
    const rb = b as Record<string, unknown>
    const dir = quickSortDirection === 'asc' ? 1 : -1
    if (quickSortKey === 'assigned_to') {
      return dir * String(ra.assignedTo ?? '').localeCompare(String(rb.assignedTo ?? ''))
    }
    if (quickSortKey === 'created_at') {
      return dir * String(ra.createdAt ?? '').localeCompare(String(rb.createdAt ?? ''))
    }
    const rank = (status: unknown) => {
      switch (String(status ?? '')) {
        case 'not_started': return 0
        case 'in_progress': return 1
        case 'awaiting_review': return 2
        case 'complete': return 3
        case 'blocked': return 4
        case 'rejected': return 5
        case 'canceled': return 6
        default: return 99
      }
    }
    return dir * (rank(ra.status) - rank(rb.status))
  })

  const withPinnedRow = (() => {
    if (!pinRowId) return sortedRows
    const hasPinned = sortedRows.some((r) => String((r as Record<string, unknown>).id ?? '') === pinRowId)
    if (hasPinned) return sortedRows
    const pinned = allRows.find((r) => String((r as Record<string, unknown>).id ?? '') === pinRowId)
    if (!pinned) return sortedRows
    return [pinned, ...sortedRows]
  })()

  const getRowCount = useCallback(
    (preset: ViewPreset) => {
      if (preset.filters.length === 0) return allRows.length
      return allRows.filter((row) => {
        const rec = row as Record<string, unknown>
        return preset.filters.every((f) => {
          const val = String(rec[f.column] ?? '')
          switch (f.operator) {
            case 'equals': return val === f.value
            case 'includes': return Array.isArray(f.value) && f.value.includes(val)
            case 'contains': return typeof f.value === 'string' && val.toLowerCase().includes(f.value.toLowerCase())
          }
        })
      }).length
    },
    [allRows],
  )

  return (
    <div className="space-y-0">
      <ViewTabs
        presets={presets}
        activeViewId={vm.activeViewId}
        onViewChange={vm.setActiveView}
        getRowCount={getRowCount}
      />

      <div className="flex items-center justify-between py-2">
        <TableControls
          filterCount={vm.activeFilters.length}
          isDirty={vm.isDirty}
          onFilterClick={() => setFilterOpen(!filterOpen)}
          onSave={vm.saveChanges}
          onReset={vm.resetToPreset}
          relationshipScope={relationshipScope}
          onRelationshipScopeChange={setRelationshipScope}
          quickSortKey={quickSortKey}
          quickSortDirection={quickSortDirection}
          onQuickSortChange={({ key, direction }) => {
            setQuickSortKey(key)
            setQuickSortDirection(direction)
          }}
        />
        <ColumnSettingsPopover
          columns={columns}
          visibleColumns={vm.visibleColumns}
          onVisibleColumnsChange={vm.setVisibleColumns}
        />
      </div>

      {withPinnedRow.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <SearchX className="h-8 w-8 mb-3" />
          <p className="text-sm font-medium">No results match your filters</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={vm.resetToPreset}>
            Clear filters
          </Button>
        </div>
      ) : (
        children({ rows: withPinnedRow, visibleColumns: vm.visibleColumns })
      )}

      {/* Sidebar renders via portal — DOM goes to AppShell level */}
      <FilterSidebar
        open={filterOpen}
        onOpenChange={setFilterOpen}
        columns={columns}
        filters={vm.activeFilters}
        onFiltersChange={vm.setFilters}
        rows={allRows as unknown as Record<string, unknown>[]}
      />
    </div>
  )
}
