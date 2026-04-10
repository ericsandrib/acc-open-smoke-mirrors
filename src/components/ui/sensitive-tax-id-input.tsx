import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { maskTaxIdSensitiveDisplay, shouldMaskTaxIdInput } from '@/utils/taxIdMask'

export type SensitiveTaxIdInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * SSN / Tax ID field: shows only last 4 digits when masked; eye toggles full value for edit/review.
 */
export function SensitiveTaxIdInput({
  value,
  onChange,
  className,
  disabled,
  ...rest
}: SensitiveTaxIdInputProps) {
  const [showFull, setShowFull] = React.useState(false)
  const needsMask = shouldMaskTaxIdInput(value)
  const showMasked = needsMask && !showFull

  React.useEffect(() => {
    if (!needsMask) setShowFull(false)
  }, [needsMask, value])

  const displayValue = showMasked ? maskTaxIdSensitiveDisplay(value) : value

  return (
    <div className="relative w-full">
      <Input
        {...rest}
        type="text"
        value={displayValue}
        onChange={showMasked ? undefined : onChange}
        readOnly={showMasked}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className={cn(needsMask && 'pr-10', className)}
      />
      {needsMask && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 h-8 w-8 shrink-0 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowFull((s) => !s)}
          disabled={disabled}
          tabIndex={-1}
          aria-label={showFull ? 'Hide full tax ID' : 'Show full tax ID'}
        >
          {showFull ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </Button>
      )}
    </div>
  )
}
