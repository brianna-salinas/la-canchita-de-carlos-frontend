import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

export default function NotFoundPage() {
  const { user } = useAuth()
  const destino = user ? '/panel' : '/login'
  const etiqueta = user ? 'Volver al Panel' : 'Ir a Iniciar sesión'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-neutral-50 dark:bg-neutral-900">
      <img
        src="/assets/logo.png"
        alt="Logo La Canchita de Carlos"
        className="h-20 w-20 rounded-full object-cover border-2 border-brand-secondary shadow-sm"
      />

      <p className="font-display font-bold text-8xl leading-none text-brand-primary">
        404
      </p>

      <div className="space-y-2">
        <h1 className="font-sans font-bold text-2xl text-neutral-900 dark:text-neutral-50">
          Esta cancha no existe
        </h1>
        <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          La página que buscas no está disponible. Puede que el enlace esté roto
          o que se haya movido.
        </p>
      </div>

      <Link
        to={destino}
        className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm hover:bg-brand-primary/90 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {etiqueta}
      </Link>

      <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-4">
        Desarrollado por Brianna Salinas | 2026
      </p>
    </div>
  )
}
