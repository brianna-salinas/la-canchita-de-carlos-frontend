import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'canchita_theme'

function leerPreferenciaGuardada(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'dark' || raw === 'light' ? raw : null
  } catch {
    return null
  }
}

function preferenciaDelSistema(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicarClase(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const guardado = leerPreferenciaGuardada()
    return guardado ?? preferenciaDelSistema()
  })

  useEffect(() => {
    aplicarClase(theme)
  }, [theme])

  function toggleTheme() {
    setTheme((actual) => {
      const nuevo = actual === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, nuevo)
      } catch {

      }
      return nuevo
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
