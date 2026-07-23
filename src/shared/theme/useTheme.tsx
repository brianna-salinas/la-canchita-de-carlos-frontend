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

/**
 * Tema global de la app (claro/oscuro). Prioriza lo que el usuario
 * eligió a mano (guardado en localStorage) sobre la preferencia del
 * sistema operativo, y solo cae a esta última la primera vez que
 * alguien entra sin haber tocado el botón nunca.
 */
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
        // localStorage no disponible: el tema no persiste entre
        // recargas, pero sigue funcionando en la sesión actual.
      }
      return nuevo
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}

// Hook ubicado a propósito junto a su Provider (patrón estándar de React
// Context); no es un componente, pero exportarlo desde aquí es intencional.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
