import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { TableHead } from './table'
import type { SortDirection } from '@/hooks/useSortableTable'

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string
  currentSortKey: string | null
  currentDirection: SortDirection
  onSort: (key: string) => void
  children: React.ReactNode
}

export function SortableTableHead({
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  children,
  className = '',
  ...props
}: SortableTableHeadProps) {
  const isActive = currentSortKey === sortKey

  const Icon = isActive
    ? currentDirection === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown

  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${className}`}
      onClick={() => onSort(sortKey)}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
        />
      </span>
    </TableHead>
  )
}
