import { useEffect, useRef, useState } from 'react'
import { Settings2, Check, X, ExternalLink } from 'lucide-react'
import { getKnob } from '@/data/configKnobs'
import { useConfigOverlay } from './ConfigOverlayProvider'
import { cn } from '@/lib/utils'

/**
 * ConfigHotspot
 * --------------
 * Drop one of these next to (or inside) any UI element that's configurable.
 * When the overlay is OFF, the hotspot renders nothing — production view is
 * untouched. When the overlay is ON, the hotspot renders a translucent
 * callout circle. Hover or click for the explanation panel.
 *
 * Usage:
 *
 *   <ConfigHotspot knobId="relationships/list/columns" anchor="top-right" />
 *
 * Place inside a `relative`-positioned container so the absolute positioning
 * resolves to that container.
 */

type Anchor =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'middle-left'
  | 'middle-right'
  | 'inline'

interface ConfigHotspotProps {
  knobId: string
  anchor?: Anchor
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional override label shown beside the dot when overlay is on */
  label?: string
  /** Visual hint about the area the hotspot represents */
  area?: 'point' | 'region'
  className?: string
}

const ANCHOR_CLASSES: Record<Anchor, string> = {
  'top-left': 'absolute top-1 left-1 z-30',
  'top-right': 'absolute top-1 right-1 z-30',
  'top-center': 'absolute top-1 left-1/2 -translate-x-1/2 z-30',
  'bottom-left': 'absolute bottom-1 left-1 z-30',
  'bottom-right': 'absolute bottom-1 right-1 z-30',
  'middle-left': 'absolute top-1/2 -translate-y-1/2 left-1 z-30',
  'middle-right': 'absolute top-1/2 -translate-y-1/2 right-1 z-30',
  inline: 'inline-flex relative z-30 align-middle',
}

const SIZE_CLASSES: Record<NonNullable<ConfigHotspotProps['size']>, string> = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-7 w-7 text-xs',
  lg: 'h-9 w-9 text-sm',
}

const SCOPE_COLORS: Record<string, string> = {
  direction: 'bg-purple-500/80 ring-purple-300 hover:bg-purple-600',
  page: 'bg-rose-500/80 ring-rose-300 hover:bg-rose-600',
  section: 'bg-amber-500/80 ring-amber-300 hover:bg-amber-600',
  knob: 'bg-sky-500/80 ring-sky-300 hover:bg-sky-600',
}

export function ConfigHotspot({
  knobId,
  anchor = 'top-right',
  size = 'md',
  label,
  area = 'point',
  className,
}: ConfigHotspotProps) {
  const { enabled, captured, capture, uncapture, focusedKnobId, setFocusedKnobId } =
    useConfigOverlay()
  const [hovered, setHovered] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const knob = getKnob(knobId)

  const isCaptured = !!captured[knobId]
  const isPinned = focusedKnobId === knobId
  const showPanel = enabled && (hovered || isPinned)

  // Click outside to unpin
  useEffect(() => {
    if (!isPinned) return
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) {
        setFocusedKnobId(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [isPinned, setFocusedKnobId])

  if (!enabled) return null
  if (!knob) {
    if (import.meta.env.DEV) {
      console.warn(`[ConfigHotspot] Unknown knob id: ${knobId}`)
    }
    return null
  }

  const dotColor = SCOPE_COLORS[knob.scope] ?? SCOPE_COLORS.knob

  return (
    <div
      ref={wrapRef}
      className={cn(ANCHOR_CLASSES[anchor], className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Region halo — translucent rectangle shown when this hotspot
          represents a whole region. We render it as a sibling so it doesn't
          interfere with the dot's hover affordance. */}
      {area === 'region' && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 rounded-lg ring-2 ring-offset-0 transition-opacity',
            knob.scope === 'page'
              ? 'ring-rose-400/40 bg-rose-400/5'
              : knob.scope === 'section'
              ? 'ring-amber-400/40 bg-amber-400/5'
              : knob.scope === 'direction'
              ? 'ring-purple-400/40 bg-purple-400/5'
              : 'ring-sky-400/40 bg-sky-400/5',
          )}
        />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setFocusedKnobId(isPinned ? null : knobId)
        }}
        aria-label={`Configurable: ${knob.title}`}
        className={cn(
          'group relative inline-flex items-center justify-center rounded-full font-semibold text-white shadow-md ring-2 ring-offset-2 ring-offset-white/0 transition-all',
          SIZE_CLASSES[size],
          dotColor,
          isPinned && 'scale-110 shadow-lg',
          isCaptured && 'ring-emerald-400',
        )}
      >
        {isCaptured ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          <Settings2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
        {/* Tiny ping when not captured to draw attention */}
        {!isCaptured && (
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full opacity-60 animate-ping',
              dotColor,
            )}
          />
        )}
      </button>

      {label && (
        <span className="ml-1.5 text-xs font-medium text-foreground/70 align-middle">
          {label}
        </span>
      )}

      {showPanel && (
        <ConfigHotspotPanel
          knobId={knobId}
          isCaptured={isCaptured}
          isPinned={isPinned}
          onCapture={() => capture(knobId)}
          onUncapture={() => uncapture(knobId)}
          onClose={() => {
            setHovered(false)
            setFocusedKnobId(null)
          }}
          anchor={anchor}
        />
      )}
    </div>
  )
}

function ConfigHotspotPanel({
  knobId,
  isCaptured,
  isPinned,
  onCapture,
  onUncapture,
  onClose,
  anchor,
}: {
  knobId: string
  isCaptured: boolean
  isPinned: boolean
  onCapture: () => void
  onUncapture: () => void
  onClose: () => void
  anchor: Anchor
}) {
  const knob = getKnob(knobId)!
  const { captured, updateCapture } = useConfigOverlay()
  const captureEntry = captured[knobId]

  // Place panel below or above the dot depending on the anchor's vertical
  // location. For top-anchored dots, panel goes below; for bottom-anchored
  // dots, above; for middle anchors, default to below.
  const verticalSide = anchor.startsWith('bottom') ? 'above' : 'below'
  const horizontalSide = anchor.includes('right')
    ? 'right'
    : anchor.includes('left')
    ? 'left'
    : 'center'

  const sideClasses = cn(
    'absolute z-40 w-[340px]',
    verticalSide === 'below' ? 'top-full mt-2' : 'bottom-full mb-2',
    horizontalSide === 'right'
      ? 'right-0'
      : horizontalSide === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2',
  )

  const scopeLabel = knob.scope.toUpperCase()
  const scopeBadgeColor =
    knob.scope === 'direction'
      ? 'bg-purple-100 text-purple-800'
      : knob.scope === 'page'
      ? 'bg-rose-100 text-rose-800'
      : knob.scope === 'section'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-sky-100 text-sky-800'

  const tierLabel =
    knob.who === 'avantos'
      ? 'Avantos deploy'
      : knob.who === 'admin'
      ? 'Admin'
      : 'Per-advisor'
  const tierColor =
    knob.who === 'avantos'
      ? 'bg-orange-100 text-orange-800'
      : knob.who === 'admin'
      ? 'bg-red-100 text-red-800'
      : 'bg-stone-100 text-stone-800'

  return (
    <div
      className={sideClasses}
      onMouseEnter={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-xl border border-border bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-border bg-gradient-to-b from-muted/40 to-white">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={cn(
                  'inline-flex h-4 items-center rounded px-1.5 text-[9px] font-bold tracking-wide',
                  scopeBadgeColor,
                )}
              >
                {scopeLabel}
              </span>
              <span
                className={cn(
                  'inline-flex h-4 items-center rounded px-1.5 text-[9px] font-bold tracking-wide',
                  tierColor,
                )}
              >
                {tierLabel}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {knob.title}
            </h3>
          </div>
          {isPinned && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground -mr-1 -mt-0.5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Question
            </p>
            <p className="text-sm text-foreground font-medium leading-snug">
              {knob.question}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              What this controls
            </p>
            <p className="text-sm text-foreground/90 leading-snug">
              {knob.description}
            </p>
          </div>

          {knob.considerations && knob.considerations.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Worth considering
              </p>
              <ul className="space-y-1 list-disc pl-4 marker:text-muted-foreground/60">
                {knob.considerations.map((c) => (
                  <li key={c} className="text-xs text-foreground/85 leading-snug">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {knob.options && knob.options.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Options
              </p>
              <div className="space-y-1">
                {knob.options.map((opt) => {
                  const selected = captureEntry?.selectedOption === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (!isCaptured) onCapture()
                        updateCapture(knobId, { selectedOption: selected ? undefined : opt })
                      }}
                      className={cn(
                        'w-full text-left text-xs rounded-md border px-2.5 py-1.5 transition-colors leading-snug',
                        selected
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                          : 'border-border bg-white text-foreground/85 hover:bg-muted/40',
                      )}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {knob.recommendedDefault && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 mb-0.5">
                Recommended starting point
              </p>
              <p className="text-xs text-emerald-900 leading-snug">
                {knob.recommendedDefault}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
          {isCaptured ? (
            <button
              onClick={onUncapture}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-white/80"
            >
              <X className="h-3.5 w-3.5" /> Remove from capture
            </button>
          ) : (
            <button
              onClick={onCapture}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Capture for follow-up
            </button>
          )}
          {knob.referenceUrl && (
            <a
              href={knob.referenceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Reference"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
