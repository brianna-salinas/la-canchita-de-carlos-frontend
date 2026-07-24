import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, CircleX, Loader2 } from 'lucide-react'
import AuthLayout, { AuthFooter } from './AuthLayout'
import { apiClient } from '../../shared/api/client'
import { getApiErrorMessage } from '../../shared/utils/api-error'

type Estado = 'verificando' | 'exito' | 'error'

export default function VerificarCorreoPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [estado, setEstado] = useState<Estado>(() => (token ? 'verificando' : 'error'))
  const [error, setError] = useState<string | null>(() =>
    token ? null : 'El enlace de verificación no es válido: falta el token.',
  )
  const yaIntentadoRef = useRef(false)

  useEffect(() => {
    if (!token || yaIntentadoRef.current) return
    yaIntentadoRef.current = true

    apiClient
      .get('/users/verificar', { params: { token } })
      .then(() => setEstado('exito'))
      .catch((err) => {
        setEstado('error')
        setError(getApiErrorMessage(err, 'No se pudo verificar el correo. Intenta de nuevo.'))
      })
  }, [token])

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

      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-md dark:shadow-none p-6 sm:p-8 md:bg-transparent md:shadow-none md:rounded-none md:p-0 text-center md:text-left">
        {estado === 'verificando' && (
          <>
            <span className="mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-brand-secondary/15">
              <Loader2 className="h-7 w-7 text-brand-primary animate-spin" />
            </span>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-4">
              Verificando tu correo...
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2">
              Esto toma solo un momento.
            </p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <span className="mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <CircleCheck className="h-7 w-7 text-success" />
            </span>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-4">
              ¡Correo verificado!
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2">
              Tu cuenta ya está activa. Ya puedes iniciar sesión.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex w-full md:w-auto items-center justify-center h-12 px-6 rounded-lg bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 transition-colors"
            >
              Iniciar sesión
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <span className="mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
              <CircleX className="h-7 w-7 text-danger" />
            </span>
            <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-4">
              No se pudo verificar
            </h1>
            <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-2">
              {error}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex w-full md:w-auto items-center justify-center h-12 px-6 rounded-lg border border-brand-primary text-brand-primary dark:text-brand-secondary font-sans font-semibold text-base hover:bg-brand-primary/5 transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
