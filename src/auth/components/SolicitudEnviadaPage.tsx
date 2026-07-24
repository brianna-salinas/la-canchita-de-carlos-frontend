import { Link } from 'react-router-dom'
import { CircleCheck, CalendarCheck, LineChart } from 'lucide-react'
import AuthLayout, { AuthFooter } from './AuthLayout'

export default function SolicitudEnviadaPage() {
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

            <div className="flex gap-4 mt-8">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/15 px-6 py-5 w-36">
                <CalendarCheck className="h-6 w-6 text-white" />
                <span className="font-sans text-sm text-white text-center leading-snug">
                  Calendario de reservas
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/15 px-6 py-5 w-36">
                <LineChart className="h-6 w-6 text-white" />
                <span className="font-sans text-sm text-white text-center leading-snug">
                  Control de pagos
                </span>
              </div>
            </div>
          </div>

          <AuthFooter />
        </div>
      }
    >
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-md dark:shadow-none md:shadow-none p-8 md:p-0 text-center">
        <span className="inline-flex h-16 w-16 rounded-full bg-success/10 text-success items-center justify-center mx-auto">
          <CircleCheck className="h-8 w-8" />
        </span>
        <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-5">
          Solicitud enviada
        </h1>
        <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto">
          Tu solicitud de acceso quedó registrada. El administrador principal la
          revisará y te habilitará el acceso una vez aprobada.
        </p>

        <Link
          to="/login"
          className="inline-flex items-center justify-center w-full h-12 rounded-lg bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 transition-colors mt-8"
        >
          Volver a iniciar sesión
        </Link>
      </div>

      <AuthFooter />
    </AuthLayout>
  )
}
