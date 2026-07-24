import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CircleCheck, CircleX } from 'lucide-react'
import AuthLayout, { AuthFooter } from './AuthLayout'
import { resetPassword } from '../api'
import { getApiErrorMessage } from '../../shared/utils/api-error'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState<string | null>(
    token ? null : 'El enlace para restablecer tu contraseña no es válido: falta el token.',
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)

    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setError('La nueva contraseña y su confirmación no coinciden.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, nueva)
      setListo(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo restablecer tu contraseña. Intenta de nuevo.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      rightBgClassName="bg-neutral-50 md:bg-white dark:!bg-neutral-900"
      left={
        <div className="flex flex-col h-full w-full bg-gradient-to-b from-brand-primary to-[#1E293B] p-10">
          <div className="flex flex-col items-center text-center m-auto">
            <img
              src="/assets/logo.png"
              alt="Logo La Canchita de Carlos"
              className="h-28 w-28 rounded-2xl bg-white dark:bg-neutral-800 object-contain p-2"
            />
            <h2 className="font-sans font-bold text-3xl text-white mt-6">
              La Canchita de Carlos
            </h2>
            <p className="font-sans text-base text-white/80 mt-3 max-w-xs">
              Sistema interno para administrar reservas, clientes y pagos de tus
              canchas deportivas.
            </p>
          </div>

          <AuthFooter />
        </div>
      }
    >
      <div className="flex md:hidden flex-col items-center text-center mb-6">
        <img
          src="/assets/logo.png"
          alt="Logo La Canchita de Carlos"
          className="h-24 w-24 rounded-full object-cover border-2 border-brand-secondary shadow-sm bg-white dark:bg-neutral-800"
        />
        <h2 className="font-display font-bold text-4xl mt-4 leading-none">
          <span className="text-brand-primary dark:text-white">La Canchita</span>
          <br />
          <span className="text-brand-secondary dark:text-white">de Carlos</span>
        </h2>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-md dark:shadow-none p-6 sm:p-8 md:bg-transparent md:shadow-none md:rounded-none md:p-0">
        {listo ? (
          <div className="text-center md:text-left">
            <span className="mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <CircleCheck className="h-7 w-7 text-success" />
            </span>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex w-full md:w-auto items-center justify-center h-12 px-6 rounded-lg bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center md:text-left">
            <span className="mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
              <CircleX className="h-7 w-7 text-danger" />
            </span>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-4">
              Enlace inválido
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2">
              {error}
            </p>
            <Link
              to="/olvide-password"
              className="mt-6 inline-flex w-full md:w-auto items-center justify-center h-12 px-6 rounded-lg border border-brand-primary text-brand-primary dark:text-brand-secondary font-sans font-semibold text-base hover:bg-brand-primary/5 transition-colors"
            >
              Solicitar un enlace nuevo
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 text-center md:text-left">
              Restablece tu contraseña
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-1 mb-6 text-center md:text-left">
              Elige una nueva contraseña para tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full h-12 pl-10 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
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
                {loading ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
