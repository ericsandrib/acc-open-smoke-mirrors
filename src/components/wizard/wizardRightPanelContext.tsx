import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type WizardRightPanelContextValue = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

const WizardRightPanelContext =
  createContext<WizardRightPanelContextValue | null>(null)

export function WizardRightPanelProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = useCallback(() => setCollapsed((c) => !c), [])
  return (
    <WizardRightPanelContext.Provider
      value={{ collapsed, setCollapsed, toggle }}
    >
      {children}
    </WizardRightPanelContext.Provider>
  )
}

export function useWizardRightPanel() {
  const ctx = useContext(WizardRightPanelContext)
  if (!ctx) {
    throw new Error(
      'useWizardRightPanel must be used within WizardRightPanelProvider',
    )
  }
  return ctx
}
