import { useState, useMemo, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc' | null

interface SortState {
  key: string | null
  direction: SortDirection
}

export function useSortableTable<T>(
  rows: T[],
  comparators: Record<string, (a: T, b: T) => number>,
) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: null })

  const onSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return { key: null, direction: null }
    })
  }, [])

  const sortedRows = useMemo(() => {
    if (!sort.key || !sort.direction || !comparators[sort.key]) return rows
    const cmp = comparators[sort.key]
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => dir * cmp(a, b))
  }, [rows, sort, comparators])

  return {
    sortedRows,
    sortKey: sort.key,
    sortDirection: sort.direction,
    onSort,
  }
}
