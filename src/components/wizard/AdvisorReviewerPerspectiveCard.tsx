import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Building, Eye, GripVertical, ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowState } from '@/types/workflow'
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

type DemoMode = NonNullable<WorkflowState['demoViewMode']>

/** Subtle shell + icon hues so each demo workspace is recognizable at a glance. */
const PERSPECTIVE_ACCENT: Record<
  DemoMode,
  { shell: string; icon: string; menuSelected: string }
> = {
  advisor: {
    shell:
      'border-slate-400/40 bg-slate-500/[0.06] shadow-slate-900/[0.04] dark:border-slate-500/35 dark:bg-slate-400/[0.07] dark:shadow-black/20',
    icon: 'text-slate-600 dark:text-slate-300',
    menuSelected: 'border-l-slate-500/70 bg-slate-500/[0.08] dark:border-l-slate-400/60 dark:bg-slate-400/[0.10]',
  },
  'ho-documents': {
    shell:
      'border-teal-500/30 bg-teal-500/[0.05] shadow-teal-900/[0.04] dark:border-teal-400/28 dark:bg-teal-400/[0.06] dark:shadow-black/20',
    icon: 'text-teal-700/90 dark:text-teal-300/90',
    menuSelected: 'border-l-teal-600/65 bg-teal-500/[0.08] dark:border-l-teal-400/55 dark:bg-teal-400/[0.10]',
  },
  'ho-kyc': {
    shell:
      'border-teal-500/30 bg-teal-500/[0.05] shadow-teal-900/[0.04] dark:border-teal-400/28 dark:bg-teal-400/[0.06] dark:shadow-black/20',
    icon: 'text-teal-700/90 dark:text-teal-300/90',
    menuSelected: 'border-l-teal-600/65 bg-teal-500/[0.08] dark:border-l-teal-400/55 dark:bg-teal-400/[0.10]',
  },
  'ho-principal': {
    shell:
      'border-violet-500/32 bg-violet-500/[0.055] shadow-violet-900/[0.05] dark:border-violet-400/30 dark:bg-violet-400/[0.07] dark:shadow-black/20',
    icon: 'text-violet-700/90 dark:text-violet-300/90',
    menuSelected: 'border-l-violet-600/65 bg-violet-500/[0.09] dark:border-l-violet-400/55 dark:bg-violet-400/[0.11]',
  },
  aml: {
    shell:
      'border-rose-500/30 bg-rose-500/[0.045] shadow-rose-900/[0.04] dark:border-rose-400/28 dark:bg-rose-400/[0.06] dark:shadow-black/20',
    icon: 'text-rose-700/90 dark:text-rose-300/90',
    menuSelected: 'border-l-rose-600/65 bg-rose-500/[0.08] dark:border-l-rose-400/55 dark:bg-rose-400/[0.10]',
  },
}

function accentForMode(mode: DemoMode | undefined) {
  return PERSPECTIVE_ACCENT[(mode ?? 'advisor') as DemoMode]
}

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

function documentReviewDemoMode(
  inChildAction: boolean,
  childType: string | undefined,
): 'ho-documents' | 'ho-kyc' {
  if (inChildAction && childType === 'kyc') return 'ho-kyc'
  return 'ho-documents'
}

function currentPerspectiveLabel(mode: DemoMode | undefined): string {
  const m = mode ?? 'advisor'
  if (m === 'advisor') return 'Advisor View'
  if (m === 'aml') return 'AML Team View'
  if (m === 'ho-principal') return 'Principal Review Team View'
  return 'Document Review Team View'
}

function isDocumentReviewMode(mode: DemoMode | undefined): boolean {
  const m = mode ?? 'advisor'
  return m === 'ho-documents' || m === 'ho-kyc'
}

function ModeGlyph({ mode }: { mode: DemoMode | undefined }) {
  const m = mode ?? 'advisor'
  const iconCls = cn('h-3.5 w-3.5 shrink-0', accentForMode(m).icon)
  if (m === 'advisor') return <Eye className={iconCls} aria-hidden />
  if (m === 'aml') return <ShieldAlert className={iconCls} aria-hidden />
  if (m === 'ho-principal') return <ShieldCheck className={iconCls} aria-hidden />
  return <Building className={iconCls} aria-hidden />
}

/**
 * Demo-only: draggable control to switch advisor vs Home Office / AML demo workspaces.
 * Does not change production auth.
 */
export function AdvisorReviewerPerspectiveCard() {
  const { state, dispatch } = useWorkflow()
  const location = useLocation()
  const [position, setPosition] = useState<Position>(readPersistedPosition)
  const draggingRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const inChildAction = Boolean(state.activeChildActionId)
  const activeChild = inChildAction
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === state.activeChildActionId)
    : null
  const childType = activeChild?.childType

  const mode = (state.demoViewMode ?? 'advisor') as DemoMode
  const accent = accentForMode(mode)
  const label = currentPerspectiveLabel(mode)

  const onOnboardingListOrDetail =
    location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')

  const amlAvailable = (inChildAction && childType === 'kyc') || onOnboardingListOrDetail
  const principalUnavailable = inChildAction && childType === 'kyc'

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
        'fixed z-50 flex items-center gap-1.5 rounded-full border px-1.5 py-1 shadow-lg backdrop-blur',
        'select-none',
        accent.shell,
      )}
      role="region"
      aria-label="Switch advisor or reviewer workspace"
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
            className="flex max-w-[min(100vw-6rem,16rem)] items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
          >
            <ModeGlyph mode={mode} />
            <span className="truncate text-left font-medium">{label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className="z-[200] min-w-[17rem] rounded-lg border border-border bg-background p-1 shadow-lg"
        >
          <DropdownMenuItem
            onSelect={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })}
            className={cn(
              'flex items-center gap-2 border-l-2 border-l-transparent pl-2 text-sm',
              mode === 'advisor' && PERSPECTIVE_ACCENT.advisor.menuSelected,
            )}
          >
            <Eye className={cn('h-4 w-4 shrink-0', PERSPECTIVE_ACCENT.advisor.icon)} aria-hidden />
            Advisor View
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              dispatch({ type: 'SET_DEMO_VIEW', mode: documentReviewDemoMode(inChildAction, childType) })
            }
            className={cn(
              'flex items-center gap-2 border-l-2 border-l-transparent pl-2 text-sm',
              isDocumentReviewMode(mode) && PERSPECTIVE_ACCENT['ho-documents'].menuSelected,
            )}
          >
            <Building className={cn('h-4 w-4 shrink-0', PERSPECTIVE_ACCENT['ho-documents'].icon)} aria-hidden />
            Document Review Team View
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={principalUnavailable}
            title={
              principalUnavailable
                ? 'Principal review applies to account opening in this demo.'
                : undefined
            }
            onSelect={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-principal' })}
            className={cn(
              'flex items-center gap-2 border-l-2 border-l-transparent pl-2 text-sm',
              mode === 'ho-principal' && PERSPECTIVE_ACCENT['ho-principal'].menuSelected,
            )}
          >
            <ShieldCheck className={cn('h-4 w-4 shrink-0', PERSPECTIVE_ACCENT['ho-principal'].icon)} aria-hidden />
            Principal Review Team View
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!amlAvailable}
            title={
              !amlAvailable
                ? 'Open a KYC subject in review, or go to the Onboarding page, to use AML Team view.'
                : undefined
            }
            onSelect={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'aml' })}
            className={cn(
              'flex items-center gap-2 border-l-2 border-l-transparent pl-2 text-sm',
              mode === 'aml' && PERSPECTIVE_ACCENT.aml.menuSelected,
            )}
          >
            <ShieldAlert className={cn('h-4 w-4 shrink-0', PERSPECTIVE_ACCENT.aml.icon)} aria-hidden />
            AML Team View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
