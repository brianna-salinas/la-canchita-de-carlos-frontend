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
// Reemplazar por la llamada real al endpoint de solicitud (US20 / TS05)
// cuando el backend esté conectado (Sprint 2). Por ahora apunta al fake API.
import { requestAccess } from './../api.ts'

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
    setLoading(true)
    try {
      // US20, Escenario 1: solicitud creada en estado pendiente
      await requestAccess({ nombre, correo, telefono, password })
      navigate('/solicitud-enviada')
    } catch {
      // US20, Escenario 2: correo ya registrado
      setError('Ese correo ya tiene una cuenta o una solicitud pendiente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      left={
        <div className="flex flex-col h-full w-full bg-gradient-to-b from-brand-primary to-[#1E293B] p-10">
          <div className="flex flex-col items-center text-center m-auto">
            <img
              src="../../../public/assets/logo.png"
              alt="Logo La Canchita de Carlos"
              className="h-28 w-28 rounded-2xl bg-white object-contain p-2"
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
        className="inline-flex items-center gap-1 font-sans text-base text-brand-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="font-sans font-bold text-3xl text-neutral-900">
        Solicitar Acceso
      </h1>
      <p className="font-sans text-base text-neutral-500 mt-1 mb-6">
        Completa el formulario para enviar tu solicitud al administrador del
        sistema y acceder como administrador.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-sans text-base text-neutral-700 mb-1 block">
            Nombre Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="font-sans text-base text-neutral-700 mb-1 block">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-sans text-base text-neutral-700 mb-1 block">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 9..."
                className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="font-sans text-base text-neutral-700 mb-1 block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 rounded-lg bg-brand-secondary/15 p-3">
          <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
          <p className="font-sans text-sm text-neutral-600">
            Tu solicitud será revisada por el administrador principal antes de
            poder ingresar.
          </p>
        </div>

        {error && (
          <p className="font-sans text-base text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Solicitar acceso'}
        </button>

        <p className="font-sans text-base text-center text-neutral-600">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="text-brand-primary font-medium hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
