export type FilterType = 'multi-select' | 'free-text' | 'date' | 'date-range'
export type FilterState = 'default' | 'disabled' | 'loading' | 'error'

export interface FilterOption {
  value: string
  label: string
}

// ─── Shared base props ──────────────────────────────────────

interface FilterBaseProps {
  label: string
  state?: FilterState
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onRemove?: () => void
  className?: string
}

// ─── Discriminated union by type ────────────────────────────

export type FilterMultiSelectProps = FilterBaseProps & {
  type: 'multi-select'
  options: FilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  searchable?: boolean
}

export type FilterFreeTextProps = FilterBaseProps & {
  type: 'free-text'
  value: string[]
  onChange: (value: string[]) => void
}

export type FilterDateProps = FilterBaseProps & {
  type: 'date'
  value: string | null
  onChange: (value: string | null) => void
}

export type FilterDateRangeProps = FilterBaseProps & {
  type: 'date-range'
  value: [string, string] | null
  onChange: (value: [string, string] | null) => void
}

export type FilterProps =
  | FilterMultiSelectProps
  | FilterFreeTextProps
  | FilterDateProps
  | FilterDateRangeProps

// ─── Animation constants ────────────────────────────────────

export const MORPH_SPRING = {
  type: 'spring' as const,
  stiffness: 550,
  damping: 45,
  mass: 0.7,
}

// ─── Date presets ───────────────────────────────────────────

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'last-month', label: 'Last Month' },
] as const
