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
  /** Optional override label. Default is just the visual indicator. */
  label = 'Not in Stratos Orion',
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
        'inline-flex items-center gap-1 rounded-md border border-dashed border-amber-300 bg-amber-50/60 text-amber-900',
        compact ? 'h-5 px-1.5 text-[10px] font-medium' : 'h-6 px-2 text-xs font-medium',
        className,
      )}
    >
      <CircleSlash className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </span>
  )
}
