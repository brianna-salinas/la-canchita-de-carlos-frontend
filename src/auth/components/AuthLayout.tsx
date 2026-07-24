import { type ReactNode } from 'react'
import ThemeToggle from '../../shared/components/ThemeToggle'

interface AuthLayoutProps {
  left: ReactNode
  children: ReactNode
  rightBgClassName?: string
}

export default function AuthLayout({
  left,
  children,
  rightBgClassName = 'bg-white',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row dark:bg-neutral-900">
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {left}
      </div>
      <div
        className={`relative flex-1 flex flex-col items-center justify-center px-6 py-10 dark:bg-neutral-900 ${rightBgClassName}`}
      >
        <ThemeToggle className="absolute top-4 right-4 dark:hover:bg-white/10" />
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

export function AuthFooter() {
  return (
    <p className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-sans">
      Desarrollado por Brianna Salinas | 2026
    </p>
  )
}
