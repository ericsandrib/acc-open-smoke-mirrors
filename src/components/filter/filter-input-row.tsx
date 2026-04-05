import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Search, Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterTag } from './filter-tag'
import { DATE_PRESETS, type FilterProps, type FilterState } from './filter-types'

// ─── Helpers ─────────────────────────────────────────────────

function getTagsForProps(props: FilterProps): { label: string; value: string }[] {
  switch (props.type) {
    case 'multi-select': {
      const optionMap = new Map(props.options.map((o) => [o.value, o.label]))
      return props.value.map((v) => ({ label: optionMap.get(v) ?? v, value: v }))
    }
    case 'free-text':
      return props.value.map((v) => ({ label: v, value: v }))
    case 'date': {
      if (!props.value) return []
      const preset = DATE_PRESETS.find((p) => p.value === props.value)
      return [{ label: preset?.label ?? props.value, value: props.value }]
    }
    case 'date-range': {
      if (!props.value) return []
      const [from, to] = props.value
      const fromPreset = DATE_PRESETS.find((p) => p.value === from)
      const toPreset = DATE_PRESETS.find((p) => p.value === to)
      return [{ label: `${fromPreset?.label ?? from} → ${toPreset?.label ?? to}`, value: 'range' }]
    }
    default:
      return []
  }
}

function hasValues(props: FilterProps): boolean {
  switch (props.type) {
    case 'multi-select':
    case 'free-text':
      return props.value.length > 0
    case 'date':
      return props.value !== null
    case 'date-range':
      return props.value !== null
    default:
      return false
  }
}

// ─── Input Row ───────────────────────────────────────────────

interface FilterInputRowProps {
  filterProps: FilterProps
  expanded: boolean
  search: string
  onSearchChange: (value: string) => void
}

export function FilterInputRow({
  filterProps,
  expanded,
  search,
  onSearchChange,
}: FilterInputRowProps) {
  const [freeTextInput, setFreeTextInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const state: FilterState = filterProps.state ?? 'default'
  const isDisabled = state === 'disabled'
  const tags = getTagsForProps(filterProps)
  const show = expanded || tags.length > 0

  useEffect(() => {
    if (expanded && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else if (!expanded && inputRef.current) {
      inputRef.current.blur()
    }
  }, [expanded])

  if (!show) return null

  const isDateType = filterProps.type === 'date' || filterProps.type === 'date-range'
  const Icon = isDateType ? Calendar : Search

  const removeTag = (tagValue: string) => {
    if (isDisabled) return
    switch (filterProps.type) {
      case 'multi-select':
        filterProps.onChange(filterProps.value.filter((v) => v !== tagValue))
        break
      case 'free-text':
        filterProps.onChange(filterProps.value.filter((v) => v !== tagValue))
        break
      case 'date':
        filterProps.onChange(null)
        break
      case 'date-range':
        filterProps.onChange(null)
        break
    }
  }

  const clearAll = () => {
    if (isDisabled) return
    onSearchChange('')
    setFreeTextInput('')
    switch (filterProps.type) {
      case 'multi-select':
        filterProps.onChange([])
        break
      case 'free-text':
        filterProps.onChange([])
        break
      case 'date':
        filterProps.onChange(null)
        break
      case 'date-range':
        filterProps.onChange(null)
        break
    }
  }

  const handleFreeTextKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filterProps.type !== 'free-text') return
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = freeTextInput.trim()
      if (trimmed && !filterProps.value.includes(trimmed)) {
        filterProps.onChange([...filterProps.value, trimmed])
      }
      setFreeTextInput('')
    }
    if (e.key === 'Backspace' && freeTextInput === '' && filterProps.value.length > 0) {
      filterProps.onChange(filterProps.value.slice(0, -1))
    }
  }

  let placeholder = ''
  if (expanded && tags.length === 0) {
    if (isDateType) {
      placeholder = filterProps.type === 'date-range'
        ? 'mm / dd / yyyy – mm / dd / yyyy'
        : 'mm / dd / yyyy'
    } else {
      placeholder = 'Search...'
    }
  }

  const showTextInput = expanded && !isDateType
  const showDatePlaceholder = expanded && isDateType && tags.length === 0

  return (
    <div
      className={cn(
        'flex items-center pl-1 pr-2 pb-1',
        isDisabled && 'opacity-60 pointer-events-none',
      )}
    >
      <span className="flex items-center justify-center size-8 shrink-0">
        {expanded && <Icon className="size-3.5 text-muted-foreground" />}
      </span>

      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
        {tags.map((tag) => (
          <FilterTag
            key={tag.value}
            label={tag.label}
            onRemove={() => removeTag(tag.value)}
            disabled={isDisabled}
          />
        ))}
        {showTextInput && (
          <input
            ref={inputRef}
            type="text"
            value={filterProps.type === 'free-text' ? freeTextInput : search}
            onChange={(e) => {
              if (filterProps.type === 'free-text') {
                setFreeTextInput(e.target.value)
              } else {
                onSearchChange(e.target.value)
              }
            }}
            onKeyDown={handleFreeTextKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={isDisabled}
            className="flex-1 min-w-[60px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-6"
          />
        )}
        {showDatePlaceholder && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {expanded && tags.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isDisabled}
          className="shrink-0 flex items-center justify-center size-8 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Clear all"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export { hasValues }
