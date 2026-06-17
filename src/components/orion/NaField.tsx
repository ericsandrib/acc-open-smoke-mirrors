import { CircleSlash } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Renders a visually distinct "not in Stratos Orion" indicator.
 *
 * Used in place of a regular value when the underlying Orion field has the
 * Y/N flag set to N in the Stratos data model. Distinct from a generic "-"
 * dash so reviewers can immediately see "this is a gap" during a live
 * walkthrough.
 *
 * Pair with src/data/orionFieldMap.ts to decide when to render this.
 */
export function NaField({
  className,
  /** Optional override label. Default reads "N/A — Not in Stratos Orion". */
  label = 'N/A — Not in Stratos Orion',
  /** When true, render as a tiny inline chip rather than a row-spanning pill. */
  compact = false,
}: {
  className?: string
  label?: string
  compact?: boolean
}) {
  return (
    <span
      title={label + ' — this field is not currently populated in Stratos\'s Orion instance.'}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-red-400 bg-red-50 text-red-700 font-semibold',
        compact ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-xs',
        className,
      )}
    >
      <CircleSlash className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </span>
  )
}
