import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DATE_PRESETS, type FilterState } from './filter-types'

interface FilterDateOptionsProps {
  value: string | null
  onChange: (value: string | null) => void
  state?: FilterState
}

export function FilterDateOptions({
  value,
  onChange,
  state = 'default',
}: FilterDateOptionsProps) {
  const isDisabled = state === 'disabled'

  return (
    <div className="border-t border-border p-1 flex flex-col gap-0.5 max-h-[172px] overflow-y-auto">
      {DATE_PRESETS.map((preset) => {
        const isSelected = value === preset.value
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => {
              if (isDisabled) return
              onChange(isSelected ? null : preset.value)
            }}
            disabled={isDisabled}
            className={cn(
              'flex items-center w-full px-3 py-1.5 text-left transition-colors rounded-md',
              'hover:bg-accent',
              isDisabled && 'pointer-events-none opacity-60',
            )}
          >
            <span className="flex-1 text-sm text-foreground">{preset.label}</span>
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

      <button
        type="button"
        onClick={() => {
          if (isDisabled) return
          onChange('custom')
        }}
        disabled={isDisabled}
        className={cn(
          'flex items-center w-full px-3 py-1.5 text-left transition-colors rounded-md',
          'hover:bg-accent',
          isDisabled && 'pointer-events-none opacity-60',
        )}
      >
        <span className="text-sm text-foreground">Custom...</span>
      </button>
    </div>
  )
}
