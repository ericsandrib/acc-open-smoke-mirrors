import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxOption {
  value: string
  label: string
}

type ListBoxPosition = {
  left: number
  width: number
  maxHeight: number
} & ({ top: number; bottom?: never } | { bottom: number; top?: never })

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  inputClassName?: string
  dropdownClassName?: string
  disabled?: boolean
  /**
   * Portal the dropdown into this element (e.g. a node inside a Radix Dialog/Sheet).
   * Defaults to `document.body`. Without this, portaling to body breaks pickers opened inside modal sheets.
   */
  portalContainer?: HTMLElement | null
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  emptyMessage = "No results found.",
  className,
  inputClassName,
  dropdownClassName,
  disabled = false,
  portalContainer = null,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(-1)
  const [listBox, setListBox] = React.useState<ListBoxPosition | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const updateListPosition = React.useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow
    const edgePadding = 8
    const verticalGap = 4
    const available = openUpward
      ? Math.max(120, spaceAbove - edgePadding - verticalGap)
      : Math.max(120, spaceBelow - edgePadding - verticalGap)

    if (openUpward) {
      setListBox({
        bottom: viewportHeight - rect.top + verticalGap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(320, available),
      })
      return
    }

    setListBox({
      top: rect.bottom + verticalGap,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(320, available),
    })
  }, [])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ""

  const filtered = React.useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(lower))
  }, [options, search])

  React.useEffect(() => {
    setHighlightIndex(-1)
  }, [filtered])

  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setListBox(null)
    }
  }, [open])

  React.useLayoutEffect(() => {
    if (!open) return
    updateListPosition()
    window.addEventListener("scroll", updateListPosition, true)
    window.addEventListener("resize", updateListPosition)
    return () => {
      window.removeEventListener("scroll", updateListPosition, true)
      window.removeEventListener("resize", updateListPosition)
    }
  }, [open, updateListPosition, filtered.length, search])

  React.useEffect(() => {
    function shouldKeepOpen(target: EventTarget | null): boolean {
      const node = target as Node | null
      if (!node) return false
      if (containerRef.current?.contains(node)) return true
      if (listRef.current?.contains(node)) return true
      return false
    }

    function handlePointerDownOutside(e: PointerEvent) {
      if (!shouldKeepOpen(e.target)) setOpen(false)
    }

    function handleFocusInOutside(e: FocusEvent) {
      if (!shouldKeepOpen(e.target)) setOpen(false)
    }

    if (open) {
      // Capture phase ensures this still runs even when another control
      // stops bubbling events (e.g. Radix Select trigger/content internals).
      document.addEventListener("pointerdown", handlePointerDownOutside, true)
      document.addEventListener("focusin", handleFocusInOutside, true)
      return () => {
        document.removeEventListener("pointerdown", handlePointerDownOutside, true)
        document.removeEventListener("focusin", handleFocusInOutside, true)
      }
    }
  }, [open])

  React.useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-combobox-item]")
      items[highlightIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex])

  const selectOption = (opt: ComboboxOption) => {
    onValueChange(opt.value)
    setOpen(false)
    setSearch("")
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (filtered.length === 0) break
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectOption(filtered[highlightIndex])
        } else if (filtered.length === 1) {
          selectOption(filtered[0])
        } else if (search.trim().length > 0) {
          selectOption(filtered[0])
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
      case "Tab":
        setOpen(false)
        break
    }
  }

  const displayValue = open ? search : selectedLabel

  const listContent = (
    <div
      ref={listRef}
      role="listbox"
      style={
        listBox
          ? {
              position: "fixed",
              ...(listBox.top !== undefined ? { top: listBox.top } : { bottom: listBox.bottom }),
              left: listBox.left,
              width: listBox.width,
              maxHeight: listBox.maxHeight,
              zIndex: 9999,
            }
          : { position: "fixed", left: -9999, top: -9999, visibility: "hidden" as const }
      }
      className={cn(
        "overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        dropdownClassName
      )}
    >
      {filtered.length === 0 ? (
        <div className="py-2 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        filtered.map((opt, i) => (
          <div
            key={opt.value}
            data-combobox-item
            role="option"
            aria-selected={opt.value === value}
            className={cn(
              "relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm select-none",
              i === highlightIndex && "bg-accent text-accent-foreground",
              opt.value === value && i !== highlightIndex && "font-medium"
            )}
            onMouseEnter={() => setHighlightIndex(i)}
            onMouseDown={(e) => {
              e.preventDefault()
              selectOption(opt)
            }}
          >
            {opt.label}
            {opt.value === value && (
              <span className="absolute right-2 flex size-4 items-center justify-center">
                <Check className="size-4" />
              </span>
            )}
          </div>
        ))
      )}
    </div>
  )

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 pr-8",
            inputClassName
          )}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            setSearch("")
          }}
          onClick={() => {
            if (!open) {
              setOpen(true)
              setSearch("")
            }
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
          onClick={() => {
            if (!disabled) {
              setOpen(!open)
              if (!open) inputRef.current?.focus()
            }
          }}
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(listContent, portalContainer ?? document.body)
        : null}
    </div>
  )
}

export { Combobox }
export type { ComboboxOption, ComboboxProps }
