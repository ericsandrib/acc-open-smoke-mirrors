import * as React from 'react'
import { cn } from '@/lib/utils'

export type SegmentedOption<T extends string> = { value: T; label: string }

export type SegmentedControlProps<T extends string> = {
  /** Visible group label (referenced by aria-labelledby on the radiogroup). */
  label: string
  value: T
  options: readonly [SegmentedOption<T>, SegmentedOption<T>]
  onValueChange: (value: T) => void
  /** Optional id for the label element (for external references). */
  labelId?: string
  selectedStyle?: 'primary' | 'neutral'
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onValueChange,
  labelId: labelIdProp,
  selectedStyle = 'primary',
  className,
}: SegmentedControlProps<T>) {
  const autoLabelId = React.useId()
  const labelId = labelIdProp ?? autoLabelId
  const values = options.map((o) => o.value)

  const focusValue = (next: T) => {
    onValueChange(next)
    queueMicrotask(() =>
      document.getElementById(`${labelId}-${next}`)?.focus({ preventScroll: true }),
    )
  }

  const handleGroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const i = values.indexOf(value)
    if (i < 0) return
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const next = values[(i + delta + values.length) % values.length]
    focusValue(next)
  }

  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <div id={labelId} className="text-sm font-medium leading-snug text-foreground">
        {label}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={handleGroupKeyDown}
        className={cn(
          'flex w-full min-w-0 rounded-lg border border-input bg-muted/25 p-0.5 shadow-sm',
          'sm:inline-flex',
        )}
      >
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              id={`${labelId}-${opt.value}`}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(opt.value)}
              className={cn(
                'min-h-9 flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? selectedStyle === 'neutral'
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
