import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Lock,
  Info,
  CalendarCheck,
  LineChart,
  ArrowLeft,
} from 'lucide-react'
import AuthLayout, { AuthFooter } from './AuthLayout'
import { requestAccess } from './../api.ts'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { esCorreoValido, esTelefonoValido } from '../../shared/utils/validation'

export default function RequestAccessPage() {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío.')
      return
    }
    if (!esCorreoValido(correo)) {
      setError('El correo no tiene un formato válido.')
      return
    }
    if (!esTelefonoValido(telefono)) {
      setError('El teléfono no es válido (debe ser un celular peruano de 9 dígitos).')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      // US20, Escenario 1: solicitud creada en estado pendiente
      await requestAccess({ nombre, correo, telefono, password })
      navigate('/solicitud-enviada')
    } catch (err) {
      // US20, Escenario 2: correo ya registrado (o cualquier otro rechazo
      // del backend, mostrando su mensaje real en vez de uno genérico).
      setError(getApiErrorMessage(err, 'No se pudo enviar la solicitud. Intenta de nuevo.'))
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
      <Link
        to="/login"
        className="inline-flex items-center gap-1 font-sans text-base text-brand-primary dark:text-brand-secondary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      {/* Marca visible solo en mobile (en desktop ya está en el panel
          izquierdo azul), mismo estilo que Login. */}
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

      {/* En mobile, el formulario va dentro de una tarjeta blanca
          (como el mockup). En desktop no lleva card, como ya estaba. */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-md dark:shadow-none p-6 sm:p-8 md:bg-transparent md:shadow-none md:rounded-none md:p-0">
        <h1 className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 text-center md:text-left">
          Solicitar Acceso
        </h1>
        <p className="font-sans text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-1 mb-6 text-center md:text-left">
          Completa el formulario para enviar tu solicitud al administrador del
          sistema y acceder como administrador.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

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

          <div>
            <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 9..."
                className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          <div>
            <label className="font-sans text-base text-neutral-700 dark:text-neutral-200 mb-1 block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            {loading ? 'Enviando...' : 'Solicitar acceso'}
          </button>

          <div className="flex gap-2 rounded-lg bg-brand-secondary/15 p-3">
            <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
            <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300">
              Tu solicitud será revisada por el administrador principal antes de
              poder ingresar.
            </p>
          </div>
        </form>
      </div>

      <p className="font-sans text-base text-center text-neutral-600 dark:text-neutral-300 mt-6">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to="/login"
          className="text-brand-primary dark:text-brand-secondary font-medium hover:underline"
        >
          Inicia sesión aquí
        </Link>
      </p>
    </AuthLayout>
  )
}
