import type { ReactNode } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import {
  SchwabTextField,
  SchwabSelectField,
  SchwabRadioGroup,
  SchwabCheckboxGroup,
  SchwabSingleCheckbox,
  YES_NO,
} from '../schwab/schwabPrimitives'
import type { SeiField, SeiFieldStatus } from '@/data/sei/seiRegistry'
import { getOptionsFor } from '@/data/sei/seiPlaceholderOptions'
import type { SeiFormStateApi } from './useSeiFormState'

interface Props {
  field: SeiField
  status: SeiFieldStatus
  readOnly: boolean
  form: SeiFormStateApi
}

/**
 * Pull a live SEI endpoint out of the field's `apiSource`, if it points at one.
 * Many fields instead carry a note ("N/A — local enum", "user-entered text",
 * validation hints); those return null so we only surface real data sources.
 */
function extractEndpoint(apiSource: string): string | null {
  const s = (apiSource || '').trim()
  if (!s) return null
  const url = s.match(/https?:\/\/[^\s)]+/)
  if (url) return url[0]
  const path = s.match(/\/api\/v\d+\/[^\s)]+/) || s.match(/\b[a-z]+service\b[^\s)]*/i)
  if (path) return path[0]
  return null
}

/** Small dev-facing source annotation under an endpoint-backed control. */
function EndpointHint({ endpoint }: { endpoint: string }) {
  return (
    <p
      className="truncate text-[10px] font-mono text-muted-foreground/80"
      title={endpoint}
    >
      ⇢ options from {endpoint}
    </p>
  )
}

/** Read-only label + value, for Display-Only / Read-Only fields. */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/40 px-3 text-sm text-muted-foreground">
        {value || <span className="italic">computed / pre-populated</span>}
      </div>
    </div>
  )
}

export function SeiFieldRenderer({ field, status, readOnly, form }: Props) {
  const k = field.key
  const required = status === 'Required'
  const label = field.field
  const endpoint = extractEndpoint(field.apiSource)

  if (readOnly || field.control === 'display') {
    return <ReadOnlyField label={label} value={form.get(k)} />
  }

  if (field.control === 'progress') {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 rounded-full bg-primary/60" />
        </div>
      </div>
    )
  }

  // Wraps an option-based control with its data-source annotation.
  const withEndpoint = (node: ReactNode): ReactNode =>
    endpoint ? (
      <div className="space-y-1">
        {node}
        <EndpointHint endpoint={endpoint} />
      </div>
    ) : (
      node
    )

  switch (field.control) {
    case 'text':
      return <SchwabTextField label={label} required={required} value={form.get(k)} onChange={(v) => form.set(k, v)} />
    case 'textarea':
      return <SchwabTextField label={label} required={required} multiline value={form.get(k)} onChange={(v) => form.set(k, v)} />
    case 'number':
      return <SchwabTextField label={label} required={required} type="number" value={form.get(k)} onChange={(v) => form.set(k, v)} />
    case 'date':
      return <SchwabTextField label={label} required={required} type="date" value={form.get(k)} onChange={(v) => form.set(k, v)} />
    case 'checkbox':
      return <SchwabSingleCheckbox label={label} checked={form.getBool(k)} onChange={(v) => form.set(k, v)} />
    case 'toggle':
      return (
        <SchwabRadioGroup
          label={label}
          required={required}
          inline
          options={YES_NO}
          value={form.get(k)}
          onChange={(v) => form.set(k, v)}
        />
      )
    case 'radio': {
      const options = getOptionsFor(field)
      return withEndpoint(
        <SchwabRadioGroup
          label={label}
          required={required}
          options={options.length ? options : YES_NO}
          value={form.get(k)}
          onChange={(v) => form.set(k, v)}
        />,
      )
    }
    case 'multiselect': {
      const options = getOptionsFor(field)
      return withEndpoint(
        <SchwabCheckboxGroup
          label={label}
          options={options}
          values={form.getMulti(k)}
          onChange={(next) => form.set(k, next)}
        />,
      )
    }
    case 'dropdown':
    case 'typeahead': {
      const options = getOptionsFor(field)
      if (field.control === 'typeahead' || options.length > 8) {
        return withEndpoint(
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {label}
              {required ? <span className="text-destructive ml-0.5">*</span> : null}
            </Label>
            <Combobox
              options={options}
              value={form.get(k)}
              onValueChange={(v) => form.set(k, v)}
              placeholder="Select…"
              emptyMessage="No matches"
            />
          </div>,
        )
      }
      return withEndpoint(
        <SchwabSelectField
          label={label}
          required={required}
          options={options}
          value={form.get(k)}
          onChange={(v) => form.set(k, v)}
        />,
      )
    }
    default:
      return <SchwabTextField label={label} required={required} value={form.get(k)} onChange={(v) => form.set(k, v)} />
  }
}
