import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterTagProps {
  label: string
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

export function FilterTag({ label, onRemove, disabled, className }: FilterTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium',
        'bg-primary/10 text-primary',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="shrink-0 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
          aria-label={`Remove ${label}`}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
