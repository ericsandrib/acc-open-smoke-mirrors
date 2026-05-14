import { useEffect, useRef, useState } from 'react'
import { GripVertical, Eye, Glasses } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const STORAGE_KEY = 'demo-advisor-reviewer-perspective-card-pos'

type Position = { right: number; bottom: number }

const DEFAULT_POSITION: Position = { right: 24, bottom: 112 }

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

function defaultReviewerMode(
  inChildAction: boolean,
  childType: string | undefined,
): 'aml' | 'ho-documents' {
  if (inChildAction && childType === 'kyc') return 'aml'
  return 'ho-documents'
}

/**
 * Demo-only: draggable card to switch between advisor and reviewer demo perspectives
 * (journey surface and child drill-in). Does not change production auth.
 */
export function AdvisorReviewerPerspectiveCard() {
  const { state, dispatch } = useWorkflow()
  const [position, setPosition] = useState<Position>(readPersistedPosition)
  const draggingRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const inChildAction = Boolean(state.activeChildActionId)
  const activeChild = inChildAction
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === state.activeChildActionId)
    : null

  const mode = state.demoViewMode ?? 'advisor'
  const isAdvisor = mode === 'advisor'
  const reviewerDefault = defaultReviewerMode(inChildAction, activeChild?.childType)

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
      aria-label="Demo perspective: advisor or reviewer"
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
            {isAdvisor ? (
              <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <Glasses className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="font-semibold">Demo:</span>
            <span className="truncate max-w-[11rem]">{isAdvisor ? 'Advisor View' : 'Reviewer View'}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className="z-[200] min-w-[14rem] rounded-lg border border-border bg-background p-1 shadow-lg"
        >
          <DropdownMenuItem
            onSelect={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })}
            className={cn('flex items-center gap-2 text-sm', isAdvisor && 'bg-accent/70')}
          >
            <Eye className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            Advisor View
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => dispatch({ type: 'SET_DEMO_VIEW', mode: reviewerDefault })}
            className={cn('flex items-center gap-2 text-sm', !isAdvisor && 'bg-accent/70')}
          >
            <Glasses className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            Reviewer View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
