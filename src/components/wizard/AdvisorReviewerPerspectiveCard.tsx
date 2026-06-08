import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { Building, Eye, GripVertical, ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowState } from '@/types/workflow'
import { useWorkflow } from '@/stores/workflowStore'
import { isEmbeddedAccountOwnerKycEnabled } from '@/utils/ownerKycReview'
import { setDemoPerspectiveDragging } from '@/utils/demoPerspectiveControl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const STORAGE_KEY = 'demo-advisor-reviewer-perspective-card-pos'

type Position = { right: number; bottom: number }

const DEFAULT_POSITION: Position = { right: 24, bottom: 112 }

/** Pixels of movement before a pointer gesture counts as drag (not a click). */
const DRAG_THRESHOLD_PX = 5
/** Press longer than this opens nothing — avoids opening on click-and-hold. */
const CLICK_MAX_DURATION_MS = 250

type DemoMode = NonNullable<WorkflowState['demoViewMode']>

/** Border + icon hues so each demo workspace is recognizable; shell uses opaque white. */
const PERSPECTIVE_ACCENT: Record<
  DemoMode,
  { shell: string; icon: string; menuSelected: string }
> = {
  advisor: {
    shell: 'border-slate-400/50 shadow-slate-900/10',
    icon: 'text-slate-600',
    menuSelected: 'border-l-slate-500/70 bg-slate-500/[0.08]',
  },
  'ho-documents': {
    shell: 'border-teal-500/40 shadow-teal-900/10',
    icon: 'text-teal-700/90',
    menuSelected: 'border-l-teal-600/65 bg-teal-500/[0.08]',
  },
  'ho-kyc': {
    shell: 'border-teal-500/40 shadow-teal-900/10',
    icon: 'text-teal-700/90',
    menuSelected: 'border-l-teal-600/65 bg-teal-500/[0.08]',
  },
  'ho-principal': {
    shell: 'border-violet-500/40 shadow-violet-900/10',
    icon: 'text-violet-700/90',
    menuSelected: 'border-l-violet-600/65 bg-violet-500/[0.09]',
  },
  aml: {
    shell: 'border-rose-500/40 shadow-rose-900/10',
    icon: 'text-rose-700/90',
    menuSelected: 'border-l-rose-600/65 bg-rose-500/[0.08]',
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
  onOnboardingList: boolean,
): 'ho-documents' | 'ho-kyc' {
  if (onOnboardingList) return 'ho-documents'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const draggingRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    startX: number
    startY: number
    startAt: number
  } | null>(null)
  const dragMovedRef = useRef(false)
  const cardRef = useRef<HTMLButtonElement | null>(null)

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

  const onServicingWizard =
    /^\/servicing\/[^/]+$/.test(location.pathname) && !location.pathname.endsWith('/servicing')

  const hasKycSubjects = state.tasks.some((t) =>
    (t.children ?? []).some((c) => c.childType === 'kyc'),
  )

  const singleFlowKyc = isEmbeddedAccountOwnerKycEnabled()
  const amlAvailable =
    (inChildAction && childType === 'kyc') ||
    // Single-flow KYC: AML lives on every account-opening child, so the AML team should be
    // able to switch perspectives anywhere inside the onboarding wizard, including the
    // parent "Open Accounts" screen.
    singleFlowKyc ||
    onOnboardingListOrDetail ||
    (onServicingWizard && !inChildAction && hasKycSubjects)
  /** Principal applies to account opening — only block inside an active KYC child wizard, not on onboarding lists. */
  const principalUnavailable = inChildAction && childType === 'kyc' && !onOnboardingListOrDetail

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
    dragMovedRef.current = false
    draggingRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - card.getBoundingClientRect().left,
      offsetY: event.clientY - card.getBoundingClientRect().top,
      startX: event.clientX,
      startY: event.clientY,
      startAt: Date.now(),
    }
    setDemoPerspectiveDragging(true)
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const dragging = draggingRef.current
    if (!dragging || dragging.pointerId !== event.pointerId) return

    const dx = event.clientX - dragging.startX
    const dy = event.clientY - dragging.startY
    if (!dragMovedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

    dragMovedRef.current = true
    setMenuOpen(false)
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

    const heldMs = Date.now() - dragging.startAt
    const isQuickClick = !dragMovedRef.current && heldMs <= CLICK_MAX_DURATION_MS
    draggingRef.current = null
    dragMovedRef.current = false
    setDemoPerspectiveDragging(false)

    if (isQuickClick) {
      setMenuOpen(true)
    }
  }

  function handleTriggerClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Radix opens on click by default — we open only from handlePointerUp after a quick tap.
    event.preventDefault()
    event.stopPropagation()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      data-demo-perspective-layer=""
      className="pointer-events-none fixed inset-0 z-[150]"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu
        open={menuOpen}
        onOpenChange={(next) => {
          if (!next) setMenuOpen(false)
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            ref={cardRef}
            type="button"
            data-demo-perspective-card=""
            style={{ right: position.right, bottom: position.bottom }}
            aria-label={`${label}. Click to switch workspace, drag to move.`}
            title="Click to switch workspace · drag to move"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleTriggerClick}
            className={cn(
              'pointer-events-auto fixed z-[150] flex cursor-grab touch-none items-center gap-1.5 rounded-full border bg-white py-1 pl-1.5 pr-1.5 shadow-lg',
              'select-none isolate active:cursor-grabbing hover:bg-white',
              accent.shell,
            )}
          >
          <span className="shrink-0 rounded-full p-1 text-muted-foreground pointer-events-none">
            <GripVertical className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="flex max-w-[min(100vw-6rem,16rem)] min-w-0 items-center gap-2 px-2.5">
            <ModeGlyph mode={mode} />
            <span className="truncate text-left text-xs font-medium text-foreground">{label}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          data-demo-perspective-menu=""
          className="pointer-events-auto z-[250] min-w-[17rem] rounded-lg border border-border bg-background p-1 shadow-lg"
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
              dispatch({
                type: 'SET_DEMO_VIEW',
                mode: documentReviewDemoMode(inChildAction, childType, onOnboardingListOrDetail),
              })
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
                ? 'Open a KYC subject on this journey, or go to Onboarding, to use AML Team view.'
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
    </div>,
    document.body,
  )
}
