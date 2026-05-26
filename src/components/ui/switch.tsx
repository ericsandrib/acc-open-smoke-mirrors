import * as React from 'react'
import { cn } from '@/lib/utils'

export type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'type'> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      ref={ref}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
        if (!disabled) onCheckedChange?.(!checked)
      }}
      className={cn(
        'peer inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
          checked ? 'translate-x-3' : 'translate-x-0',
        )}
      />
    </button>
  ),
)
Switch.displayName = 'Switch'

export { Switch }
