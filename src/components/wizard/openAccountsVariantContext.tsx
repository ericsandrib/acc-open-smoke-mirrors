import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Demo-only presentation variant for the split annuity / no-annuity Account Opening flow.
 *
 * - `v1`: One action ("Account Opening") with two tasks ("Open Accounts (no annuity)" and
 *         "Open Accounts (with annuity)"). Each task renders its own form.
 * - `v2`: One action ("Account Opening") with one task ("Open Accounts") that renders both
 *         flows inside accordions. Submit-to-NetX360 controls live in the with-annuity
 *         accordion only.
 * - `v3`: Same structure as `v2`, but with subtle colored header accents on cards.
 * - `v4`: Clone of `v3` for alternate demo naming.
 * - `v5`: Clone of `v2` presentation (“tasks in sections”); same bordered cards and journey chrome as v2,
 *         with Account Opening tasks grouped under sidebar sections (without / with annuity).
 */
export type OpenAccountsVariant = 'v1' | 'v2' | 'v3' | 'v4' | 'v5'

const STORAGE_KEY = 'demo-open-accounts-variant'

const OpenAccountsVariantContext = createContext<{
  variant: OpenAccountsVariant
  setVariant: (next: OpenAccountsVariant) => void
} | null>(null)

export function OpenAccountsVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<OpenAccountsVariant>(() => {
    if (typeof window === 'undefined') return 'v1'
    const persisted = window.localStorage.getItem(STORAGE_KEY)
    if (
      persisted === 'v1' ||
      persisted === 'v2' ||
      persisted === 'v3' ||
      persisted === 'v4' ||
      persisted === 'v5'
    ) {
      return persisted
    }
    return 'v1'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, variant)
  }, [variant])

  return (
    <OpenAccountsVariantContext.Provider value={{ variant, setVariant: setVariantState }}>
      {children}
    </OpenAccountsVariantContext.Provider>
  )
}

export function useOpenAccountsVariant(): OpenAccountsVariant {
  const ctx = useContext(OpenAccountsVariantContext)
  return ctx?.variant ?? 'v1'
}

export function useOpenAccountsVariantControls(): {
  variant: OpenAccountsVariant
  setVariant: (next: OpenAccountsVariant) => void
} {
  const ctx = useContext(OpenAccountsVariantContext)
  if (!ctx) {
    return { variant: 'v1', setVariant: () => {} }
  }
  return ctx
}

/**
 * Override which Open Accounts task `OpenAccountsForm` should bind to. Used by the v2
 * combined-accordion view to render two independent forms (no-annuity and with-annuity)
 * side-by-side without changing the global `activeTaskId`.
 *
 * Optional `idPrefix` is appended to section element IDs so that two forms rendered on the
 * same page do not collide in the DOM (used by hierarchical scrollspy navigation).
 */
type OpenAccountsTaskOverride = { taskId: string; idPrefix: string }

const OpenAccountsTaskOverrideContext = createContext<OpenAccountsTaskOverride | null>(null)

export function OpenAccountsTaskOverrideProvider({
  taskId,
  idPrefix,
  children,
}: {
  taskId: string
  idPrefix?: string
  children: ReactNode
}) {
  return (
    <OpenAccountsTaskOverrideContext.Provider value={{ taskId, idPrefix: idPrefix ?? '' }}>
      {children}
    </OpenAccountsTaskOverrideContext.Provider>
  )
}

export function useOpenAccountsTaskOverride(): OpenAccountsTaskOverride | null {
  return useContext(OpenAccountsTaskOverrideContext)
}

/**
 * V2 combined-form accordion focus channel. The sidebar / scrollspy `requestFocus` to ask a
 * particular accordion to expand and scroll its inner section into view. The combined form
 * consumes the request after applying it.
 */
export type CombinedAccordionKey = 'no-annuity' | 'with-annuity'
export type CombinedSectionFocus = {
  accordionKey: CombinedAccordionKey
  sectionId: string
  /** Token used to retrigger focus when the same section is clicked twice in a row. */
  token: number
}

const CombinedSectionFocusContext = createContext<{
  pendingFocus: CombinedSectionFocus | null
  requestFocus: (accordionKey: CombinedAccordionKey, sectionId: string) => void
  consumeFocus: () => void
} | null>(null)

function CombinedSectionFocusProvider({ children }: { children: ReactNode }) {
  const [pendingFocus, setPendingFocus] = useState<CombinedSectionFocus | null>(null)
  return (
    <CombinedSectionFocusContext.Provider
      value={{
        pendingFocus,
        requestFocus: (accordionKey, sectionId) =>
          setPendingFocus({ accordionKey, sectionId, token: Date.now() }),
        consumeFocus: () => setPendingFocus(null),
      }}
    >
      {children}
    </CombinedSectionFocusContext.Provider>
  )
}

export function useCombinedSectionFocus() {
  const ctx = useContext(CombinedSectionFocusContext)
  if (!ctx) {
    return {
      pendingFocus: null,
      requestFocus: () => {},
      consumeFocus: () => {},
    }
  }
  return ctx
}

/**
 * Convenience wrapper that nests the focus provider inside the variant provider, so both are
 * mounted at the same level and consumers (sidebar, combined form) share state.
 */
export function OpenAccountsVariantAndFocusProvider({ children }: { children: ReactNode }) {
  return (
    <OpenAccountsVariantProvider>
      <CombinedSectionFocusProvider>{children}</CombinedSectionFocusProvider>
    </OpenAccountsVariantProvider>
  )
}
