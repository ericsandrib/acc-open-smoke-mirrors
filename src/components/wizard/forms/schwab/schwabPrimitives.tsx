import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Shared visual primitives for Schwab native forms. */

interface SchwabSectionProps {
  number?: string
  title: string
  description?: ReactNode
  children: ReactNode
  conditional?: boolean
}

export function SchwabSection({ number, title, description, children, conditional }: SchwabSectionProps) {
  return (
    <section
      className={cn(
        'space-y-4 pb-6 mb-6 border-b border-border last:border-b-0 last:pb-0 last:mb-0',
        conditional && 'pl-3 border-l-2 border-l-muted',
      )}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          {number ? <span className="text-muted-foreground mr-2">{number}.</span> : null}
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

interface SchwabFieldRowProps {
  children: ReactNode
  /** Tailwind grid template; defaults to 2 cols on sm+. */
  cols?: 1 | 2 | 3 | 4
}

export function SchwabFieldRow({ children, cols = 2 }: SchwabFieldRowProps) {
  const grid =
    cols === 1
      ? 'sm:grid-cols-1'
      : cols === 2
        ? 'sm:grid-cols-2'
        : cols === 3
          ? 'sm:grid-cols-3'
          : 'sm:grid-cols-4'
  return <div className={cn('grid grid-cols-1 gap-3', grid)}>{children}</div>
}

interface SchwabTextFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date'
  multiline?: boolean
}

export function SchwabTextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  type = 'text',
  multiline,
}: SchwabTextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm h-9"
        />
      )}
      {hint ? <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p> : null}
    </div>
  )
}

interface SchwabRadioGroupProps {
  label: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
  inline?: boolean
  required?: boolean
  hint?: string
}

export function SchwabRadioGroup({
  label,
  options,
  value,
  onChange,
  inline,
  required,
  hint,
}: SchwabRadioGroupProps) {
  const name = useId()
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <div className={cn('gap-3 text-sm', inline ? 'flex flex-wrap items-center' : 'space-y-2')}>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 h-4 w-4 accent-foreground shrink-0"
            />
            <span className="leading-snug">{opt.label}</span>
          </label>
        ))}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p> : null}
    </div>
  )
}

interface SchwabCheckboxGroupProps {
  label: string
  options: Array<{ value: string; label: string }>
  values: string[]
  onChange: (next: string[]) => void
  columns?: 1 | 2 | 3
  hint?: string
}

export function SchwabCheckboxGroup({
  label,
  options,
  values,
  onChange,
  columns = 2,
  hint,
}: SchwabCheckboxGroupProps) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v))
    else onChange([...values, v])
  }
  const grid =
    columns === 1 ? 'sm:grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className={cn('grid grid-cols-1 gap-y-2 gap-x-4 text-sm', grid)}>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={values.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              className="mt-0.5"
            />
            <span className="leading-snug">{opt.label}</span>
          </label>
        ))}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p> : null}
    </div>
  )
}

interface SchwabSelectFieldProps {
  label: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}

export function SchwabSelectField({
  label,
  options,
  value,
  onChange,
  placeholder,
  required,
}: SchwabSelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full text-sm text-left [&>span]:text-left">
          <SelectValue placeholder={placeholder ?? 'Select…'} />
        </SelectTrigger>
        <SelectContent className="max-h-[min(24rem,70vh)]">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface SchwabSingleCheckboxProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}

export function SchwabSingleCheckbox({ label, checked, onChange, hint }: SchwabSingleCheckboxProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-2 cursor-pointer text-sm">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
        <span className="leading-snug">{label}</span>
      </label>
      {hint ? <p className="text-[11px] text-muted-foreground leading-snug ml-6">{hint}</p> : null}
    </div>
  )
}

interface SchwabSignatureLineProps {
  label: string
  printedName: string
  date: string
  onPrintedNameChange: (v: string) => void
  onDateChange: (v: string) => void
}

export function SchwabSignatureLine({
  label,
  printedName,
  date,
  onPrintedNameChange,
  onDateChange,
}: SchwabSignatureLineProps) {
  return (
    <div className="rounded-md border border-dashed border-border p-3 space-y-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="h-9 rounded-sm border border-border bg-muted/30 flex items-center px-3 text-xs text-muted-foreground italic">
        e-signature applied at execution
      </div>
      <SchwabFieldRow cols={2}>
        <SchwabTextField label="Print name" value={printedName} onChange={onPrintedNameChange} />
        <SchwabTextField label="Date" type="date" value={date} onChange={onDateChange} />
      </SchwabFieldRow>
    </div>
  )
}

/* ─────────────────────────────  Shared field option sets  ───────────────────────────── */

export const RELATIONSHIP_OPTIONS = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Child', label: 'Child' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Other', label: 'Other' },
]

export const ID_TYPE_OPTIONS = [
  { value: 'Passport', label: 'Passport' },
  { value: "Driver's License", label: "Driver's License" },
  { value: "Gov't-Issued ID", label: "Gov't-Issued ID" },
]

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'Employed', label: 'Employed' },
  { value: 'Self-Employed', label: 'Self-Employed' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Homemaker', label: 'Homemaker' },
  { value: 'Student', label: 'Student' },
  { value: 'Not Employed', label: 'Not Employed' },
]

export const OCCUPATION_OPTIONS = [
  { value: 'Business Owner/Self-Employed', label: 'Business Owner/Self-Employed' },
  { value: 'Financial Services/Banking Professional', label: 'Financial Services/Banking Professional' },
  { value: 'Military', label: 'Military' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'Executive/Senior Management', label: 'Executive/Senior Management' },
  { value: 'Information Technology Professional', label: 'Information Technology Professional' },
  { value: 'Educator', label: 'Educator' },
  { value: 'Other', label: 'Other' },
  { value: 'Medical Professional', label: 'Medical Professional' },
  { value: 'Other Professional', label: 'Other Professional' },
  { value: 'Sales/Marketing', label: 'Sales/Marketing' },
  { value: 'Legal Professional', label: 'Legal Professional' },
  { value: 'Clerical/Administrative Services', label: 'Clerical/Administrative Services' },
  { value: 'U.S. Government Employee', label: 'U.S. Government Employee' },
  { value: 'Accounting Professional', label: 'Accounting Professional' },
  { value: 'Foreign Government Employee', label: 'Foreign Government Employee' },
  { value: 'Trade/Service', label: 'Trade/Service' },
]

export const YES_NO = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
]

export const SOURCE_OF_FUNDS_OPTIONS = [
  { value: 'salary', label: 'Salary/Wages/Savings' },
  { value: 'social-security', label: 'Social Security Benefits' },
  { value: 'sale-of-property', label: 'Sale of Property or Business' },
  { value: 'family-inheritance', label: 'Family/Relatives/Inheritance' },
  { value: 'capital-gains', label: 'Investment Capital Gains' },
  { value: 'gifts', label: 'Gifts' },
  { value: 'gambling', label: 'Gambling/Lottery' },
  { value: 'other', label: 'Other' },
]

export const PURPOSE_OF_ACCOUNT_OPTIONS = [
  { value: 'general', label: 'General Investing' },
  { value: 'tax', label: 'Investing for Tax Planning' },
  { value: 'retirement', label: 'Investing for Retirement' },
  { value: 'estate', label: 'Investing for Estate Planning' },
  { value: 'college', label: 'Investing for College' },
  { value: 'pooled', label: 'Investing of Pooled Assets' },
  { value: 'other', label: 'Other' },
]
