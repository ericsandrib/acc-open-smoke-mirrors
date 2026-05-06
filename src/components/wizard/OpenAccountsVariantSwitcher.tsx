import { useEffect, useRef, useState } from 'react'
import { GripVertical, LayoutList, Layers, Palette, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  useOpenAccountsVariantControls,
  type OpenAccountsVariant,
} from '@/components/wizard/openAccountsVariantContext'

const STORAGE_KEY = 'demo-open-accounts-variant-switcher-pos'

type Position = { right: number; bottom: number }

const DEFAULT_POSITION: Position = { right: 24, bottom: 96 }

function readPersistedPosition(): Position {
  if (typeof window === 'undefined') return DEFAULT_POSITION
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_POSITION
    const parsed = JSON.parse(raw) as Partial<Position>
    if (typeof parsed.right === 'number' && typeof parsed.bottom === 'number') {
      return { right: parsed.right, bottom: parsed.bottom }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_POSITION
}

const VARIANT_OPTIONS: Array<{
  id: OpenAccountsVariant
  label: string
  description: string
  icon: typeof Rows3
}> = [
  {
    id: 'v1',
    label: 'Version 1 — Two tasks',
    description: 'One action, two tasks (no annuity / with annuity).',
    icon: Rows3,
  },
  {
    id: 'v2',
    label: 'Version 2 — Bordered cards',
    description: 'One task with two accordions in a single Open Accounts step.',
    icon: Layers,
  },
  {
    id: 'v3',
    label: 'Version 3 — Colored cards',
    description: 'Version 2 layout with subtle color accents on section cards.',
    icon: Palette,
  },
  {
    id: 'v4',
    label: 'Version 4 — colored background',
    description: 'Same as Version 3.',
    icon: Palette,
  },
  {
    id: 'v5',
    label: 'Version 5 — tasks in sections',
    description:
      'Version 2 visuals, with pizza-tracker task sections for Accounts without / with Annuities.',
    icon: LayoutList,
  },
]

/**
 * Demo-only floating card used to toggle between the two Account Opening presentation
 * variants while reviewing the wizard. The card is draggable and remembers its position.
 */
export function OpenAccountsVariantSwitcher() {
  const { variant, setVariant } = useOpenAccountsVariantControls()
  const [position, setPosition] = useState<Position>(readPersistedPosition)
  const draggingRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Make sure the pill never persists fully off-screen across reloads.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    if (
      position.right > window.innerWidth - 24 ||
      position.bottom > window.innerHeight - 24 ||
      rect.right < 0 ||
      rect.bottom < 0
    ) {
      setPosition(DEFAULT_POSITION)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  }, [position])

  const activeOption = VARIANT_OPTIONS.find((o) => o.id === variant) ?? VARIANT_OPTIONS[0]
  const ActiveIcon = activeOption.icon

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    draggingRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const dragging = draggingRef.current
    if (!dragging || dragging.pointerId !== event.pointerId) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const newLeft = event.clientX - dragging.offsetX
    const newTop = event.clientY - dragging.offsetY
    const newRight = window.innerWidth - (newLeft + rect.width)
    const newBottom = window.innerHeight - (newTop + rect.height)
    setPosition({
      right: Math.max(8, Math.min(window.innerWidth - rect.width - 8, newRight)),
      bottom: Math.max(8, Math.min(window.innerHeight - rect.height - 8, newBottom)),
    })
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const dragging = draggingRef.current
    if (!dragging) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    draggingRef.current = null
  }

  return (
    <div
      ref={cardRef}
      style={{ right: position.right, bottom: position.bottom }}
      className={cn(
        'fixed z-50 flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-1.5 py-1 shadow-lg backdrop-blur',
        'select-none',
      )}
      role="region"
      aria-label="Account Opening demo variant switcher"
    >
      <button
        type="button"
        aria-label="Drag to move"
        title="Drag to move"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="cursor-grab touch-none rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
          >
            <ActiveIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">Demo:</span>
            <span className="truncate max-w-[10rem]">{activeOption.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className="z-[200] min-w-[18rem] rounded-lg border border-border bg-background p-1 shadow-lg"
        >
          <div className="px-2 pb-1.5 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Account opening layout
            </p>
            <p className="text-[11px] text-muted-foreground">
              Switch how the no-annuity and with-annuity flows are surfaced.
            </p>
          </div>
          {VARIANT_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = option.id === variant
            return (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => setVariant(option.id)}
                className={cn(
                  'flex items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                  isActive ? 'bg-accent/70 text-foreground' : 'text-foreground hover:bg-muted/60',
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium">
                    {option.label}
                    {isActive ? (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wide text-primary">
                        Active
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {option.description}
                  </span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
