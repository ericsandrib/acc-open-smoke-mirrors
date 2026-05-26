import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'pizza-tracker-display-prefs'

export type PizzaTrackerDisplayPrefs = {
  showDueDate: boolean
  showAssignee: boolean
}

const DEFAULT_PREFS: PizzaTrackerDisplayPrefs = {
  showDueDate: true,
  showAssignee: true,
}

function readStoredPrefs(): PizzaTrackerDisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<PizzaTrackerDisplayPrefs>
    return {
      showDueDate: parsed.showDueDate ?? DEFAULT_PREFS.showDueDate,
      showAssignee: parsed.showAssignee ?? DEFAULT_PREFS.showAssignee,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

type PizzaTrackerDisplayPrefsContextValue = {
  prefs: PizzaTrackerDisplayPrefs
  setShowDueDate: (showDueDate: boolean) => void
  setShowAssignee: (showAssignee: boolean) => void
}

const PizzaTrackerDisplayPrefsContext =
  createContext<PizzaTrackerDisplayPrefsContextValue | null>(null)

export function PizzaTrackerDisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<PizzaTrackerDisplayPrefs>(readStoredPrefs)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  const setShowDueDate = useCallback((showDueDate: boolean) => {
    setPrefs((prev) => ({ ...prev, showDueDate }))
  }, [])

  const setShowAssignee = useCallback((showAssignee: boolean) => {
    setPrefs((prev) => ({ ...prev, showAssignee }))
  }, [])

  const value = useMemo(
    () => ({ prefs, setShowDueDate, setShowAssignee }),
    [prefs, setShowDueDate, setShowAssignee],
  )

  return (
    <PizzaTrackerDisplayPrefsContext.Provider value={value}>
      {children}
    </PizzaTrackerDisplayPrefsContext.Provider>
  )
}

export function usePizzaTrackerDisplayPrefs() {
  const ctx = useContext(PizzaTrackerDisplayPrefsContext)
  if (!ctx) {
    throw new Error(
      'usePizzaTrackerDisplayPrefs must be used within PizzaTrackerDisplayPrefsProvider',
    )
  }
  return ctx
}
