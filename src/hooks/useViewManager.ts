import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef, ViewFilter, ViewPreset } from '@/types/view-preset'

interface StoredViewState {
  activeViewId: string
  filterOverrides?: ViewFilter[]
  columnOverrides?: string[]
}

function loadState(tableId: string): StoredViewState | null {
  try {
    const raw = localStorage.getItem(`servicing-views-${tableId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistState(tableId: string, state: StoredViewState) {
  localStorage.setItem(`servicing-views-${tableId}`, JSON.stringify(state))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchFilter(value: any, filter: ViewFilter): boolean {
  const str = String(value ?? '')
  switch (filter.operator) {
    case 'equals':
      return str === filter.value
    case 'includes':
      return Array.isArray(filter.value) && filter.value.includes(str)
    case 'contains':
      return typeof filter.value === 'string' && str.toLowerCase().includes(filter.value.toLowerCase())
  }
}

function filtersEqual(a: ViewFilter[], b: ViewFilter[]): boolean {
  if (a.length !== b.length) return false
  return a.every((af, i) => {
    const bf = b[i]
    return af.column === bf.column && af.operator === bf.operator && JSON.stringify(af.value) === JSON.stringify(bf.value)
  })
}

function columnsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((col, i) => col === b[i])
}

export function useViewManager<T>(
  tableId: string,
  presets: ViewPreset[],
  allColumns: ColumnDef[],
) {
  const stored = useMemo(() => loadState(tableId), [tableId])
  const defaultPreset = presets.find((p) => p.isDefault) ?? presets[0]
  const initialId = stored?.activeViewId ?? defaultPreset.id

  const [activeViewId, setActiveViewIdRaw] = useState(initialId)
  const [filterOverrides, setFilterOverrides] = useState<ViewFilter[] | null>(
    stored?.filterOverrides ?? null,
  )
  const [columnOverrides, setColumnOverrides] = useState<string[] | null>(
    stored?.columnOverrides ?? null,
  )

  const activePreset = presets.find((p) => p.id === activeViewId) ?? defaultPreset

  const activeFilters = filterOverrides ?? activePreset.filters
  const visibleColumns = columnOverrides ?? activePreset.visibleColumns

  const isDirty = useMemo(() => {
    const filtersDirty = filterOverrides !== null && !filtersEqual(filterOverrides, activePreset.filters)
    const columnsDirty = columnOverrides !== null && !columnsEqual(columnOverrides, activePreset.visibleColumns)
    return filtersDirty || columnsDirty
  }, [filterOverrides, columnOverrides, activePreset])

  const setActiveView = useCallback(
    (id: string) => {
      setActiveViewIdRaw(id)
      setFilterOverrides(null)
      setColumnOverrides(null)
      persistState(tableId, { activeViewId: id })
    },
    [tableId],
  )

  const setFilters = useCallback((filters: ViewFilter[]) => {
    setFilterOverrides(filters)
  }, [])

  const setVisibleColumns = useCallback((columns: string[]) => {
    setColumnOverrides(columns)
  }, [])

  const saveChanges = useCallback(() => {
    persistState(tableId, {
      activeViewId,
      filterOverrides: filterOverrides ?? undefined,
      columnOverrides: columnOverrides ?? undefined,
    })
  }, [tableId, activeViewId, filterOverrides, columnOverrides])

  const resetToPreset = useCallback(() => {
    setFilterOverrides(null)
    setColumnOverrides(null)
    persistState(tableId, { activeViewId })
  }, [tableId, activeViewId])

  const applyFilters = useCallback(
    (rows: T[]): T[] => {
      if (activeFilters.length === 0) return rows
      return rows.filter((row) =>
        activeFilters.every((filter) => matchFilter((row as Record<string, unknown>)[filter.column], filter)),
      )
    },
    [activeFilters],
  )

  return {
    activeViewId,
    activePreset,
    activeFilters,
    visibleColumns,
    isDirty,
    presets,
    allColumns,
    setActiveView,
    setFilters,
    setVisibleColumns,
    saveChanges,
    resetToPreset,
    applyFilters,
  }
}
