import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import AuthLayout, { AuthFooter } from './AuthLayout'
import { useAuth } from './../useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(usuario, password)
      navigate('/panel')
    } catch {
      // US01, Escenario 2: credenciales inválidas rechazadas
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      rightBgClassName="bg-neutral-50 md:bg-white dark:!bg-neutral-900"
      left={
        <>
          <img
            src="/assets/login-cancha.png"
            alt="Cancha de La Canchita de Carlos de noche"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative mt-auto p-10 self-end">
            <h2 className="font-sans font-bold text-3xl text-white leading-tight">
              Gestión interna de alquileres
            </h2>
            <p className="font-sans text-base text-white/80 mt-2 max-w-sm">
              Sistema para administrar canchas, reservas y clientes de La
              Canchita de Carlos.
            </p>
          </div>
        </>
      }
    >
      {/* En mobile todo (logo + form) va dentro de una sola tarjeta,
          igual que el mockup. En desktop la tarjeta queda solo
          alrededor del formulario, como ya estaba. */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-md dark:shadow-none p-6 sm:p-8 md:bg-transparent md:shadow-none md:rounded-none md:p-0">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/assets/logo.png"
            alt="Logo La Canchita de Carlos"
            className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover border-2 border-brand-secondary shadow-sm"
          />
          <h1 className="font-display font-bold text-4xl md:text-5xl mt-4 leading-none">
            <span className="text-brand-primary dark:text-white">La Canchita</span>
            <br />
            <span className="text-brand-secondary dark:text-white">de Carlos</span>
          </h1>
          <p className="font-sans text-sm tracking-wide text-neutral-500 dark:text-neutral-400 uppercase mt-2">
            Gestión interna de alquileres
          </p>
        </div>

        {/* Card / marco que envuelve todo el formulario (solo visible
            como borde propio en desktop; en mobile ya está dentro de
            la tarjeta de arriba). */}
        <div className="md:rounded-2xl md:border md:border-neutral-200 dark:md:border-neutral-700 md:shadow-sm md:p-6">
          <h2 className="font-sans font-bold text-2xl text-neutral-900 dark:text-neutral-50 text-center mb-5">
            Inicia sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
                Usuario o correo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="ejemplo@canchita.com"
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-sans text-base text-neutral-700 dark:text-neutral-200">
                  Contraseña
                </label>
                <Link
                  to="/olvide-password"
                  className="font-sans text-sm text-brand-primary dark:text-brand-secondary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="font-sans text-base text-danger" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-brand-primary dark:bg-brand-secondary text-white dark:text-neutral-900 font-sans font-semibold text-base hover:bg-brand-primary/90 dark:hover:bg-brand-secondary/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <p className="font-sans text-base text-center text-neutral-600 dark:text-neutral-300">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/solicitar-acceso"
                className="text-brand-primary dark:text-brand-secondary font-medium hover:underline"
              >
                Solicita acceso aquí
              </Link>
            </p>
          </form>
        </div>
      </div>

      <AuthFooter />
    </AuthLayout>
  )
}
