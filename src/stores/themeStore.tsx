import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type ColorScheme = 'light' | 'dark'
type BrandTheme = 'stratos' | 'mercer' | 'guardian' | 'vanguard'

const ThemeContext = createContext<{
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
  brandTheme: BrandTheme
  setBrandTheme: (theme: BrandTheme) => void
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
  // Force stratos for this demo; legacy stored values are ignored so the UI
  // never shows a non-Stratos brand to a client.
  if (stored === 'stratos') return stored
  localStorage.setItem('brand-theme', 'stratos')
  return 'stratos'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getInitialColorScheme)
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>(getInitialBrandTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorScheme === 'dark')
    localStorage.setItem('theme', colorScheme)
  }, [colorScheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', brandTheme)
    localStorage.setItem('brand-theme', brandTheme)
  }, [brandTheme])

  const toggleColorScheme = () => setColorScheme((t) => (t === 'light' ? 'dark' : 'light'))

  const setBrandTheme = (theme: BrandTheme) => setBrandThemeState(theme)

  return (
    <ThemeContext.Provider value={{
      colorScheme,
      setColorScheme,
      toggleColorScheme,
      brandTheme,
      setBrandTheme,
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
