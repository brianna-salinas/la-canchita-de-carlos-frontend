import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'
import AuthLayout, { AuthFooter } from './AuthLayout'

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setEnviado(true)
    } catch {
      setError('No se pudo enviar el correo. Intenta de nuevo.')
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
      <Link
        to="/login"
        className="inline-flex items-center gap-1 font-sans text-base text-brand-primary dark:text-brand-secondary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      {/* Marca visible solo en mobile (en desktop ya está en el panel
          izquierdo azul), mismo estilo que Login y Solicitar Acceso. */}
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

      {/* En mobile, el contenido va dentro de una tarjeta blanca (como
          Login/Solicitar Acceso). En desktop no lleva card. */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-md dark:shadow-none p-6 sm:p-8 md:bg-transparent md:shadow-none md:rounded-none md:p-0">
        {enviado ? (
          <div className="text-center md:text-left">
            <span className="mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <MailCheck className="h-7 w-7 text-success" />
            </span>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-4">
              Revisa tu correo
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2">
              Si <span className="font-semibold text-neutral-700 dark:text-neutral-200">{correo}</span>{' '}
              tiene una cuenta con nosotros, te enviamos instrucciones para
              restablecer tu contraseña.
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex w-full md:w-auto items-center justify-center h-12 px-6 rounded-lg bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 text-center md:text-left">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-1 mb-6 text-center md:text-left">
              Ingresa tu correo y te enviaremos instrucciones para
              restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
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
                className="w-full h-12 rounded-lg bg-brand-secondary text-neutral-900 font-sans font-semibold text-base hover:bg-brand-secondary/90 transition-colors disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>

              <p className="font-sans text-base text-center text-neutral-600 dark:text-neutral-300">
                ¿Ya la recordaste?{' '}
                <Link
                  to="/login"
                  className="text-brand-primary dark:text-brand-secondary font-medium hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
