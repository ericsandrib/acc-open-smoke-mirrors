import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Configuration Overlay
 * ----------------------
 * Live-review tool for the Stratos × Avantos prototype. When the overlay is
 * enabled, every configurable surface lights up with a callout. Hover or
 * click a callout to read the plain-English explanation; click "capture" to
 * pin the knob plus a free-text note for follow-up with engineering.
 *
 * State (overlay enabled, focused knob, captured selections, notes) is held
 * in this provider and persisted to localStorage so notes survive a refresh
 * during a long review session.
 */

const STORAGE_KEY = 'config-overlay/v1'

export interface CapturedKnob {
  id: string
  /** Free-text note from the live conversation */
  note: string
  /** Optional preset path the client picked from `options` */
  selectedOption?: string
  /** ISO timestamp when first captured */
  capturedAt: string
}

interface PersistedState {
  enabled: boolean
  captured: Record<string, CapturedKnob>
}

interface ConfigOverlayContextValue {
  enabled: boolean
  setEnabled: (v: boolean) => void
  toggle: () => void

  /** Currently-pinned knob (sticky panel mode). null = nothing pinned. */
  focusedKnobId: string | null
  setFocusedKnobId: (id: string | null) => void

  captured: Record<string, CapturedKnob>
  capture: (id: string, patch?: Partial<CapturedKnob>) => void
  uncapture: (id: string) => void
  updateCapture: (id: string, patch: Partial<CapturedKnob>) => void
  clearAll: () => void

  capturePanelOpen: boolean
  setCapturePanelOpen: (v: boolean) => void
}

const ConfigOverlayContext = createContext<ConfigOverlayContextValue | null>(null)

function loadState(): PersistedState {
  if (typeof window === 'undefined') return { enabled: false, captured: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { enabled: false, captured: {} }
    const parsed = JSON.parse(raw) as PersistedState
    return {
      enabled: !!parsed.enabled,
      captured: parsed.captured ?? {},
    }
  } catch {
    return { enabled: false, captured: {} }
  }
}

export function ConfigOverlayProvider({ children }: { children: React.ReactNode }) {
  const [{ enabled, captured }, setState] = useState<PersistedState>(loadState)
  const [focusedKnobId, setFocusedKnobId] = useState<string | null>(null)
  const [capturePanelOpen, setCapturePanelOpen] = useState<boolean>(false)

  // Persist
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled, captured }),
      )
    } catch {
      /* ignore quota errors */
    }
  }, [enabled, captured])

  // Keyboard shortcut: Shift+? toggles overlay
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.shiftKey && e.key === '?') {
        e.preventDefault()
        setState((s) => ({ ...s, enabled: !s.enabled }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setState((s) => ({ ...s, enabled: v }))
    if (!v) setFocusedKnobId(null)
  }, [])

  const toggle = useCallback(() => {
    setState((s) => ({ ...s, enabled: !s.enabled }))
  }, [])

  const capture = useCallback(
    (id: string, patch?: Partial<CapturedKnob>) => {
      setState((s) => {
        const existing = s.captured[id]
        const next: CapturedKnob = existing
          ? { ...existing, ...patch }
          : {
              id,
              note: '',
              selectedOption: undefined,
              capturedAt: new Date().toISOString(),
              ...patch,
            }
        return { ...s, captured: { ...s.captured, [id]: next } }
      })
      setCapturePanelOpen(true)
    },
    [],
  )

  const uncapture = useCallback((id: string) => {
    setState((s) => {
      const next = { ...s.captured }
      delete next[id]
      return { ...s, captured: next }
    })
  }, [])

  const updateCapture = useCallback(
    (id: string, patch: Partial<CapturedKnob>) => {
      setState((s) => {
        const existing = s.captured[id]
        if (!existing) return s
        return {
          ...s,
          captured: { ...s.captured, [id]: { ...existing, ...patch } },
        }
      })
    },
    [],
  )

  const clearAll = useCallback(() => {
    setState((s) => ({ ...s, captured: {} }))
  }, [])

  const value = useMemo<ConfigOverlayContextValue>(
    () => ({
      enabled,
      setEnabled,
      toggle,
      focusedKnobId,
      setFocusedKnobId,
      captured,
      capture,
      uncapture,
      updateCapture,
      clearAll,
      capturePanelOpen,
      setCapturePanelOpen,
    }),
    [
      enabled,
      setEnabled,
      toggle,
      focusedKnobId,
      captured,
      capture,
      uncapture,
      updateCapture,
      clearAll,
      capturePanelOpen,
    ],
  )

  return (
    <ConfigOverlayContext.Provider value={value}>
      {children}
    </ConfigOverlayContext.Provider>
  )
}

export function useConfigOverlay(): ConfigOverlayContextValue {
  const ctx = useContext(ConfigOverlayContext)
  if (!ctx) {
    throw new Error(
      'useConfigOverlay must be used inside a ConfigOverlayProvider',
    )
  }
  return ctx
}
