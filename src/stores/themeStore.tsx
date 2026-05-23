import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

import { shouldHideKycInOnboardingListings } from '@/utils/onboardingJourneyActionTree'
import type { KycWorkflowMode } from '@/utils/kycWorkflowMode'
import { getPersistedKycWorkflowMode, persistKycWorkflowMode } from '@/utils/kycWorkflowMode'

type ColorScheme = 'light' | 'dark'
type BrandTheme = 'mercer' | 'guardian' | 'vanguard'

const ThemeContext = createContext<{
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
  brandTheme: BrandTheme
  setBrandTheme: (theme: BrandTheme) => void
  showNestedGroups: boolean
  setShowNestedGroups: (show: boolean) => void
  /**
   * Derived: true when KYC orchestration mode is single-flow.
   * Hides nested KYC child rows in Actions/Journeys and account child rows on the Journeys tab only; separate KYC nav is hidden in the wizard.
   */
  hideKycChildWorkflows: boolean
  kycWorkflowMode: KycWorkflowMode
  setKycWorkflowMode: (mode: KycWorkflowMode) => void
  /** @deprecated Use colorScheme instead */
  theme: ColorScheme
  /** @deprecated Use toggleColorScheme instead */
  toggleTheme: () => void
} | null>(null)

function getInitialColorScheme(): ColorScheme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialBrandTheme(): BrandTheme {
  const stored = localStorage.getItem('brand-theme')
  if (stored === 'mercer' || stored === 'guardian' || stored === 'vanguard') return stored
  return 'guardian'
}

function getInitialShowNestedGroups(): boolean {
  return localStorage.getItem('show-nested-groups') === 'true'
}


export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getInitialColorScheme)
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>(getInitialBrandTheme)
  const [showNestedGroups, setShowNestedGroupsState] = useState<boolean>(getInitialShowNestedGroups)
  const [kycWorkflowMode, setKycWorkflowModeState] = useState<KycWorkflowMode>(getPersistedKycWorkflowMode)
  const hideKycChildWorkflows = shouldHideKycInOnboardingListings(kycWorkflowMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorScheme === 'dark')
    localStorage.setItem('theme', colorScheme)
  }, [colorScheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', brandTheme)
    localStorage.setItem('brand-theme', brandTheme)
  }, [brandTheme])

  useEffect(() => {
    localStorage.setItem('show-nested-groups', String(showNestedGroups))
  }, [showNestedGroups])

  useEffect(() => {
    persistKycWorkflowMode(kycWorkflowMode)
  }, [kycWorkflowMode])

  const toggleColorScheme = () => setColorScheme((t) => (t === 'light' ? 'dark' : 'light'))

  const setBrandTheme = (theme: BrandTheme) => setBrandThemeState(theme)
  const setShowNestedGroups = (show: boolean) => setShowNestedGroupsState(show)
  const setKycWorkflowMode = (mode: KycWorkflowMode) => setKycWorkflowModeState(mode)

  return (
    <ThemeContext.Provider value={{
      colorScheme,
      setColorScheme,
      toggleColorScheme,
      brandTheme,
      setBrandTheme,
      showNestedGroups,
      setShowNestedGroups,
      hideKycChildWorkflows,
      kycWorkflowMode,
      setKycWorkflowMode,
      // backwards compat aliases
      theme: colorScheme,
      toggleTheme: toggleColorScheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
