import { FilterMultiSelectOptions } from './filter-multi-select'
import { FilterDateOptions } from './filter-date'
import type { FilterProps } from './filter-types'

interface FilterPanelProps {
  filterProps: FilterProps
  search: string
}

export function FilterPanel({ filterProps, search }: FilterPanelProps) {
  switch (filterProps.type) {
    case 'multi-select':
      return (
        <FilterMultiSelectOptions
          options={filterProps.options}
          value={filterProps.value}
          onChange={filterProps.onChange}
          state={filterProps.state}
          search={search}
        />
      )
    case 'free-text':
      return null
    case 'date':
      return (
        <FilterDateOptions
          value={filterProps.value}
          onChange={filterProps.onChange}
          state={filterProps.state}
        />
      )
    case 'date-range':
      return (
        <FilterDateOptions
          value={filterProps.value ? filterProps.value[0] : null}
          onChange={(v) => {
            if (v === null) {
              filterProps.onChange(null)
            } else {
              filterProps.onChange([v, v])
            }
          }}
          state={filterProps.state}
        />
      )
    default:
      return null
  }
}
