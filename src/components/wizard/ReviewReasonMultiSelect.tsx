import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getReasonLabels, type ReviewReasonOption } from '@/utils/reviewReasonSelection'

interface ReviewReasonMultiSelectProps {
  options: ReviewReasonOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

function getTriggerSummary(
  options: ReviewReasonOption[],
  value: string[],
  placeholder: string,
): { label: string; title?: string } {
  if (value.length === 0) return { label: placeholder }
  const fullLabels = getReasonLabels(options, value)
  if (value.length === 1) {
    const single =
      options.find((reason) => reason.value === value[0])?.label ?? value[0]
    return { label: single, title: single }
  }
  return {
    label: `${value.length} reasons selected`,
    title: fullLabels,
  }
}

export function ReviewReasonMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select reasons...',
  className,
}: ReviewReasonMultiSelectProps) {
  const triggerSummary = useMemo(
    () => getTriggerSummary(options, value, placeholder),
    [options, placeholder, value],
  )

  const selectedLabels = useMemo(
    () =>
      value.map((reasonValue) => ({
        value: reasonValue,
        label: options.find((reason) => reason.value === reasonValue)?.label ?? reasonValue,
      })),
    [options, value],
  )

  const toggleReason = (reasonValue: string) => {
    onChange(
      value.includes(reasonValue)
        ? value.filter((current) => current !== reasonValue)
        : [...value, reasonValue],
    )
  }

  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            title={triggerSummary.title}
            className={cn(
              'h-auto min-h-10 w-full min-w-0 max-w-full justify-between gap-2 overflow-hidden px-3 py-2 font-normal whitespace-normal',
              value.length === 0 && 'text-muted-foreground',
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left text-sm leading-snug">
              {triggerSummary.label}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[70] w-[var(--radix-popover-trigger-width)] p-2" align="start">
          <div className="max-h-60 space-y-0.5 overflow-y-auto">
            {options.map((reason) => {
              const checked = value.includes(reason.value)
              return (
                <label
                  key={reason.value}
                  className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleReason(reason.value)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug text-foreground">{reason.label}</span>
                </label>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {selectedLabels.length > 0 ? (
        <ul className="flex min-w-0 flex-wrap gap-1.5">
          {selectedLabels.map((reason) => (
            <li
              key={reason.value}
              className="max-w-full truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground"
              title={reason.label}
            >
              {reason.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
