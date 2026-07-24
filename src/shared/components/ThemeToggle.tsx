import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../theme/useTheme'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className={`h-9 w-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  )
}
