import { useNavigate } from 'react-router-dom'
import {
  Pencil,
  Mail,
  Lock,
  ChevronRight,
  TriangleAlert,
  User,
  UserPlus,
  LogOut,
  Trash2,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useAuth } from '../../auth/useAuth'
import { useSolicitudes, useAprobarSolicitud, useRechazarSolicitud } from '../hooks/useSolicitudes'

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function AjustesPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { data: solicitudes = [] } = useSolicitudes()
  const aprobar = useAprobarSolicitud()
  const rechazar = useRechazarSolicitud()

  const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE')
  const nombre = user?.nombre ?? 'Carlos Maldonado'
  const correo = user?.correo ?? 'carlos@lacanchita.com'
  const nombreUsuario = correo.split('@')[0]

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell showSearch={false}>
      <h1 className="font-sans font-bold text-3xl text-neutral-900 hidden md:block">Ajustes de Cuenta</h1>
      <p className="font-sans text-base text-neutral-500 mt-1 hidden md:block">
        Gestiona tu perfil, seguridad y permisos administrativos.
      </p>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden pb-6">
        <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Información Personal
        </p>

        <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            {user?.fotoUrl ? (
              <img src={user.fotoUrl} alt={nombre} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="h-14 w-14 rounded-full bg-brand-primary text-white font-sans font-bold text-lg flex items-center justify-center">
                {iniciales(nombre)}
              </span>
            )}
            <button className="font-sans text-xs font-semibold text-brand-primary">
              Editar foto
            </button>
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <p className="font-sans text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                Nombre de Usuario
              </p>
              <p className="font-sans text-sm font-semibold text-neutral-900">{nombreUsuario}</p>
            </div>
            <div>
              <p className="font-sans text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                Correo Electrónico
              </p>
              <p className="font-sans text-sm font-semibold text-neutral-900 truncate">{correo}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-3">
          <button className="w-full bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800">
              Cambiar nombre de usuario
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
          <button className="w-full bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800">
              Cambiar correo electrónico
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
        </div>

        <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wide mt-6 mb-3">
          Seguridad y Datos
        </p>
        <div className="space-y-3">
          <button className="w-full bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800">
              Cambiar contraseña
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
          <button
            onClick={() => navigate('/ajustes/solicitudes')}
            className="w-full bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3"
          >
            <UserPlus className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800">
              Solicitudes de acceso
            </span>
            {pendientes.length > 0 && (
              <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-danger text-white font-sans text-[11px] font-bold flex items-center justify-center">
                {pendientes.length}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
        </div>

        <div className="bg-danger/5 border border-danger/20 rounded-2xl mt-6 p-4">
          <p className="flex items-center gap-2 font-sans font-bold text-sm text-danger">
            <TriangleAlert className="h-4 w-4" />
            Zona de Peligro
          </p>
          <p className="font-sans text-xs text-neutral-600 mt-1.5">
            Una vez que elimines tu cuenta o la desactives, no hay vuelta atrás. Por favor, asegúrate.
          </p>
          <button className="w-full h-11 rounded-full bg-danger text-white font-sans font-semibold text-sm flex items-center justify-center gap-2 mt-3">
            <Trash2 className="h-4 w-4" />
            Eliminar Cuenta
          </button>
        </div>

        <div className="border-t border-neutral-200 mt-6 pt-6">
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-full border border-danger text-danger font-sans font-semibold text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        <p className="text-center font-sans text-xs text-neutral-400 mt-6">
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5 mt-6">
        {/* Información Personal */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden grid grid-cols-1 sm:grid-cols-[220px_1fr]">
          <div className="bg-neutral-50 flex flex-col items-center justify-center gap-3 p-8 border-b sm:border-b-0 sm:border-r border-neutral-100">
            <div className="relative">
              <span className="h-24 w-24 rounded-full bg-brand-primary text-white font-sans font-bold text-3xl flex items-center justify-center">
                {iniciales(nombre)}
              </span>
              <button
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-brand-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="font-sans font-bold text-lg text-neutral-900 text-center">{nombre}</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Información Personal
              </p>
              <button className="font-sans text-sm font-semibold text-brand-primary hover:underline">
                Editar todo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-sans text-xs text-neutral-400">Nombre Completo</p>
                <p className="font-sans text-sm font-semibold text-neutral-900 mt-0.5">{nombre}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-neutral-400">Correo Electrónico</p>
                <p className="font-sans text-sm font-semibold text-neutral-900 mt-0.5">{correo}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="font-sans text-xs text-neutral-400">Nombre de Usuario</p>
              <p className="font-sans text-sm font-semibold text-neutral-900 mt-0.5">{nombreUsuario}</p>
            </div>
          </div>
        </div>

        {/* Seguridad y Datos */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
            Seguridad y Datos
          </p>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-neutral-50 rounded-lg px-1 -mx-1">
              <span className="h-9 w-9 rounded-lg bg-brand-secondary/20 text-brand-primary flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0 font-sans text-sm text-neutral-700">
                Cambiar correo electrónico
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </button>
            <button className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-neutral-50 rounded-lg px-1 -mx-1">
              <span className="h-9 w-9 rounded-lg bg-brand-secondary/20 text-brand-primary flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0 font-sans text-sm text-neutral-700">
                Cambiar contraseña
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Administración (desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-neutral-200 mt-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <p className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Administración
            </p>
            {pendientes.length > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-danger text-white font-sans text-[11px] font-bold flex items-center justify-center">
                {pendientes.length}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/ajustes/solicitudes')}
            className="font-sans text-sm font-semibold text-brand-primary hover:underline"
          >
            Ver todas
          </button>
        </div>

        <div className="p-6">
          {pendientes.length === 0 ? (
            <p className="font-sans text-sm text-neutral-400">
              No hay solicitudes de acceso pendientes.
            </p>
          ) : (
            <>
              <p className="font-sans text-sm text-neutral-500 mb-4">Solicitudes de acceso pendientes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendientes.slice(0, 3).map((s) => (
                  <div key={s.id} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="h-10 w-10 rounded-full bg-neutral-200 text-neutral-600 font-sans text-sm font-bold flex items-center justify-center shrink-0">
                        {iniciales(s.nombre)}
                      </span>
                      <p className="font-sans font-semibold text-sm text-neutral-900">{s.nombre}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => aprobar(s)}
                        className="flex-1 h-9 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm hover:bg-brand-primary/90"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => rechazar(s.id)}
                        className="flex-1 h-9 rounded-lg border border-neutral-200 font-sans font-semibold text-sm text-neutral-600 hover:bg-neutral-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zona de Peligro */}
      <div className="hidden md:flex bg-danger/5 border border-danger/20 rounded-2xl mt-5 p-6 flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-sans font-bold text-lg text-danger">
            <TriangleAlert className="h-5 w-5" />
            Zona de Peligro
          </p>
          <p className="font-sans text-sm text-neutral-600 mt-1">
            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
          </p>
        </div>
        <button className="shrink-0 h-11 px-5 rounded-lg border border-danger text-danger font-sans font-semibold text-sm hover:bg-danger/10">
          Eliminar Cuenta
        </button>
      </div>
    </AppShell>
  )
}
