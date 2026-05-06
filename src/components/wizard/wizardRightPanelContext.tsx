import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type WizardRightPanelTab = 'details' | 'activity' | 'comments'

type WizardRightPanelContextValue = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggle: () => void
  activeTab: WizardRightPanelTab
  setActiveTab: (tab: WizardRightPanelTab) => void
}

const WizardRightPanelContext =
  createContext<WizardRightPanelContextValue | null>(null)

export function WizardRightPanelProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState<WizardRightPanelTab>('details')
  const toggle = useCallback(() => setCollapsed((c) => !c), [])
  return (
    <WizardRightPanelContext.Provider
      value={{ collapsed, setCollapsed, toggle, activeTab, setActiveTab }}
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
