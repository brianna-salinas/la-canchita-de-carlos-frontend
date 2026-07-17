import { type ReactNode } from 'react'

interface AuthLayoutProps {
  /** Contenido del panel izquierdo (imagen o gradiente de marca) */
  left: ReactNode
  /** Contenido del panel derecho (formulario) */
  children: ReactNode
}

/**
 * Layout compartido para las pantallas públicas de autenticación
 * (Login y Solicitar Acceso): panel izquierdo de marca + panel
 * derecho con el formulario. En mobile, el panel izquierdo se
 * oculta y solo se muestra el formulario.
 */
export default function AuthLayout({ left, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {left}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

export function AuthFooter() {
  return (
    <p className="mt-8 text-center text-xs text-neutral-400 font-sans">
      Desarrollado por Brianna Salinas | 2026
    </p>
  )
}
