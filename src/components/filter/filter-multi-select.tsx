import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilterOption, FilterState } from './filter-types'

interface FilterMultiSelectOptionsProps {
  options: FilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  state?: FilterState
  search: string
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="h-4 w-[60%] rounded bg-accent animate-pulse" />
      <div className="h-4 w-[45%] rounded bg-accent animate-pulse" />
      <div className="h-4 w-[70%] rounded bg-accent animate-pulse" />
    </div>
  )
}

function ErrorMessage() {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-6">
      <span className="text-sm font-medium text-destructive">Failed to load options</span>
      <span className="text-xs text-destructive">Try modifying your search query</span>
    </div>
  )
}

export function FilterMultiSelectOptions({
  options,
  value,
  onChange,
  state = 'default',
  search,
}: FilterMultiSelectOptionsProps) {
  const isDisabled = state === 'disabled'

  const filteredOptions = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const toggleOption = (optionValue: string) => {
    if (isDisabled) return
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    )
  }

  if (state === 'loading') return <SkeletonRows />
  if (state === 'error') return <ErrorMessage />

  return (
    <div className="border-t border-border p-1 flex flex-col gap-0.5 max-h-[172px] overflow-y-auto">
      {filteredOptions.map((option) => {
        const isSelected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            disabled={isDisabled}
            className={cn(
              'flex items-center w-full px-3 py-1.5 text-left transition-colors rounded-md',
              'hover:bg-accent',
              isDisabled && 'pointer-events-none opacity-60',
            )}
          >
            <span className="flex-1 text-sm text-foreground">{option.label}</span>
            <span
              className={cn(
                'size-4 rounded-full flex items-center justify-center shrink-0 transition-colors',
                isSelected
                  ? 'bg-primary'
                  : 'border-[1.33px] border-border',
              )}
            >
              {isSelected && <Check className="size-2.5 text-primary-foreground" strokeWidth={2.5} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
