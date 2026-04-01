import { useState, useCallback, type ReactNode } from 'react'
import { useViewManager } from '@/hooks/useViewManager'
import type { ColumnDef, ViewPreset } from '@/types/view-preset'
import { ViewTabs } from './view-tabs'
import { TableControls } from './table-controls'
import { FilterPanel } from './filter-panel'
import { ColumnSettingsPopover } from './column-settings-popover'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableViewWrapperProps<T> {
  tableId: string
  presets: ViewPreset[]
  columns: ColumnDef[]
  allRows: T[]
  children: (props: { rows: T[]; visibleColumns: string[] }) => ReactNode
}

export function TableViewWrapper<T>({
  tableId,
  presets,
  columns,
  allRows,
  children,
}: TableViewWrapperProps<T>) {
  const vm = useViewManager<T>(tableId, presets, columns)
  const [filterOpen, setFilterOpen] = useState(false)

  const filteredRows = vm.applyFilters(allRows)

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
        <div className="flex items-center gap-1">
          <TableControls
            filterCount={vm.activeFilters.length}
            isDirty={vm.isDirty}
            onFilterClick={() => setFilterOpen(true)}
            onColumnSettingsClick={() => {}}
            onSave={vm.saveChanges}
            onReset={vm.resetToPreset}
          />
        </div>
        <ColumnSettingsPopover
          columns={columns}
          visibleColumns={vm.visibleColumns}
          onVisibleColumnsChange={vm.setVisibleColumns}
        />
      </div>

      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <SearchX className="h-8 w-8 mb-3" />
          <p className="text-sm font-medium">No results match your filters</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={vm.resetToPreset}>
            Clear filters
          </Button>
        </div>
      ) : (
        children({ rows: filteredRows, visibleColumns: vm.visibleColumns })
      )}

      <FilterPanel
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
