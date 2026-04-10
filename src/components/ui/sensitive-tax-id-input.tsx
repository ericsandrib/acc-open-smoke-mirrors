import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  capTaxIdDigits,
  maskTaxIdSensitiveDisplay,
  shouldMaskTaxIdInput,
} from '@/utils/taxIdMask'

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
  onFocus,
  onBlur,
  ...rest
}: SensitiveTaxIdInputProps) {
  const [showFull, setShowFull] = React.useState(false)
  const needsMask = shouldMaskTaxIdInput(value)
  const showMasked = needsMask && !showFull

  React.useEffect(() => {
    if (!needsMask) setShowFull(false)
  }, [needsMask, value])

  const displayValue = showMasked ? maskTaxIdSensitiveDisplay(value) : value

  const emitChange = (next: string, base: React.ChangeEvent<HTMLInputElement>) => {
    if (next === value) return
    const target = Object.assign({}, base.target, { value: next })
    onChange({ ...base, target, currentTarget: base.currentTarget } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showMasked) return
    const next = capTaxIdDigits(e.target.value)
    emitChange(next, e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (needsMask) setShowFull(true)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (needsMask) setShowFull(false)
    onBlur?.(e)
  }

  return (
    <div className="relative w-full">
      <Input
        {...rest}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={displayValue}
        onChange={showMasked ? undefined : handleChange}
        readOnly={showMasked}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        maxLength={32}
        className={cn(needsMask && 'pr-10', className)}
      />
      {needsMask && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 h-8 w-8 shrink-0 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => e.preventDefault()}
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
