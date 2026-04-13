import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  emptyMessage = "No results found.",
  className,
  inputClassName,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(-1)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

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
    }
  }, [open])

  const updateDropdownPosition = React.useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  React.useEffect(() => {
    if (!open) return

    updateDropdownPosition()

    const scrollParents: Element[] = []
    let el: Element | null = containerRef.current
    while (el) {
      if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
        scrollParents.push(el)
      }
      el = el.parentElement
    }

    const handleScroll = () => updateDropdownPosition()
    scrollParents.forEach((sp) => sp.addEventListener("scroll", handleScroll, { passive: true }))
    window.addEventListener("resize", handleScroll, { passive: true })

    return () => {
      scrollParents.forEach((sp) => sp.removeEventListener("scroll", handleScroll))
      window.removeEventListener("resize", handleScroll)
    }
  }, [open, updateDropdownPosition])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
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

      {open && (
        <div
          ref={listRef}
          role="listbox"
          style={dropdownStyle}
          className="z-[9999] max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filtered.length === 0 ? (
            <div className="py-2 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
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
      )}
    </div>
  )
}

export { Combobox }
export type { ComboboxOption, ComboboxProps }
