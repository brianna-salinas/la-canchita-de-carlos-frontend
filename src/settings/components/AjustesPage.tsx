import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
  X,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useAuth } from '../../auth/useAuth'
import { useSolicitudes, useAprobarSolicitud, useRechazarSolicitud } from '../hooks/useSolicitudes'
import { apiClient } from '../../shared/api/client'
import { iniciales } from '../../shared/utils/format'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { esCorreoValido } from '../../shared/utils/validation'

type Modo = null | 'perfil' | 'usuario' | 'correo' | 'password'

export default function AjustesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout, updateUser } = useAuth()
  const { data: solicitudes = [] } = useSolicitudes()
  const aprobar = useAprobarSolicitud()
  const rechazar = useRechazarSolicitud()
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE')
  const nombre = user?.nombre ?? 'Carlos Maldonado'
  const correo = user?.correo ?? 'carlos@lacanchita.com'
  const nombreUsuario = user?.nombreUsuario ?? correo.split('@')[0]

  const [modo, setModo] = useState<Modo>(null)
  const [formPerfil, setFormPerfil] = useState({ nombre, nombreUsuario, correo })
  const [formPassword, setFormPassword] = useState({ actual: '', nueva: '', confirmar: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [eliminarModalAbierto, setEliminarModalAbierto] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState('')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function abrirModo(m: Exclude<Modo, null>) {
    setError('')
    setFormPerfil({ nombre, nombreUsuario, correo })
    setFormPassword({ actual: '', nueva: '', confirmar: '' })
    setModo(m)
  }

  async function guardarPerfil() {
    if (!user) return
    if (!formPerfil.nombre.trim() || !formPerfil.nombreUsuario.trim() || !formPerfil.correo.trim()) {
      setError('Completa todos los campos.')
      return
    }
    if (!esCorreoValido(formPerfil.correo)) {
      setError('El correo no tiene un formato válido.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      if (formPerfil.nombre.trim() !== nombre || formPerfil.nombreUsuario.trim() !== nombreUsuario) {
        await apiClient.patch('/users/me/perfil', {
          name: formPerfil.nombre.trim(),
          username: formPerfil.nombreUsuario.trim(),
        })
      }
      if (formPerfil.correo.trim() !== correo) {
        await apiClient.patch('/users/me/correo', { email: formPerfil.correo.trim() })
      }
      updateUser({
        nombre: formPerfil.nombre.trim(),
        nombreUsuario: formPerfil.nombreUsuario.trim(),
        correo: formPerfil.correo.trim(),
      })
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setModo(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar. Intenta de nuevo.'))
    } finally {
      setGuardando(false)
    }
  }

  async function guardarPassword() {
    if (!user) return
    if (!formPassword.actual || !formPassword.nueva || !formPassword.confirmar) {
      setError('Completa todos los campos.')
      return
    }
    if (formPassword.nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (formPassword.nueva !== formPassword.confirmar) {
      setError('La nueva contraseña y su confirmación no coinciden.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      await apiClient.patch('/users/me/contrasena', {
        currentPassword: formPassword.actual,
        newPassword: formPassword.nueva,
      })
      setModo(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'La contraseña actual es incorrecta o no se pudo cambiar. Intenta de nuevo.'))
    } finally {
      setGuardando(false)
    }
  }

  function subirFoto(archivo: File | undefined) {
    if (!archivo || !user) return
    setSubiendoFoto(true)
    const formData = new FormData()
    formData.append('foto', archivo)
    apiClient
      .post(`/users/${user.id}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(({ data }) => {
        updateUser({ fotoUrl: data.photoUrl ?? undefined })
        return queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      })
      .catch((err) => {
        window.alert(getApiErrorMessage(err, 'No se pudo subir la foto. Intenta de nuevo.'))
      })
      .finally(() => setSubiendoFoto(false))
  }

  async function eliminarCuenta() {
    if (!user || confirmarEliminar !== 'ELIMINAR') return
    try {
      await apiClient.delete('/users/me')
      setEliminarModalAbierto(false)
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo eliminar la cuenta. Intenta de nuevo.'))
    }
  }

  const tituloModal =
    modo === 'perfil'
      ? 'Editar información personal'
      : modo === 'usuario'
      ? 'Cambiar nombre de usuario'
      : modo === 'correo'
      ? 'Cambiar correo electrónico'
      : 'Cambiar contraseña'

  return (
    <AppShell showSearch={false}>
      <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50 hidden md:block">Ajustes de Cuenta</h1>
      <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1 hidden md:block">
        Gestiona tu perfil, seguridad y permisos administrativos.
      </p>

      <input
        ref={fotoInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => subirFoto(e.target.files?.[0])}
      />

      {/* ================= MOBILE ================= */}
      <div className="md:hidden pb-6">
        <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
          Información Personal
        </p>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-4">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            {user?.fotoUrl ? (
              <img src={user.fotoUrl} alt={nombre} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="h-14 w-14 rounded-full bg-brand-primary text-white font-sans font-bold text-lg flex items-center justify-center">
                {iniciales(nombre)}
              </span>
            )}
            <button
              onClick={() => fotoInputRef.current?.click()}
              disabled={subiendoFoto}
              className="font-sans text-xs font-semibold text-brand-primary disabled:opacity-50"
            >
              {subiendoFoto ? 'Subiendo...' : 'Editar foto'}
            </button>
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <p className="font-sans text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                Nombre de Usuario
              </p>
              <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50">{nombreUsuario}</p>
            </div>
            <div>
              <p className="font-sans text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                Correo Electrónico
              </p>
              <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{correo}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-3">
          <button
            onClick={() => abrirModo('usuario')}
            className="w-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3"
          >
            <User className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800 dark:text-neutral-100">
              Cambiar nombre de usuario
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
          <button
            onClick={() => abrirModo('correo')}
            className="w-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3"
          >
            <Mail className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800 dark:text-neutral-100">
              Cambiar correo electrónico
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
        </div>

        <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-6 mb-3">
          Seguridad y Datos
        </p>
        <div className="space-y-3">
          <button
            onClick={() => abrirModo('password')}
            className="w-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3"
          >
            <Lock className="h-5 w-5 text-brand-primary shrink-0" />
            <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800 dark:text-neutral-100">
              Cambiar contraseña
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
          {/* Solo el dueño (Carlos) administra accesos: aprobar/rechazar
              solicitudes es una accion que el backend ya protege con
              requireOwner, pero antes el boton se mostraba a cualquier
              administrador y les daba un 403 al tocarlo. */}
          {user?.esDueno && (
            <button
              onClick={() => navigate('/ajustes/solicitudes')}
              className="w-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3"
            >
              <UserPlus className="h-5 w-5 text-brand-primary shrink-0" />
              <span className="flex-1 min-w-0 text-left font-sans text-sm font-medium text-neutral-800 dark:text-neutral-100">
                Solicitudes de acceso
              </span>
              {pendientes.length > 0 && (
                <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-danger text-white font-sans text-[11px] font-bold flex items-center justify-center">
                  {pendientes.length}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </button>
          )}
        </div>

        <div className="bg-danger/5 border border-danger/20 rounded-2xl mt-6 p-4">
          <p className="flex items-center gap-2 font-sans font-bold text-sm text-danger">
            <TriangleAlert className="h-4 w-4" />
            Zona de Peligro
          </p>
          <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300 mt-1.5">
            Una vez que elimines tu cuenta o la desactives, no hay vuelta atrás. Por favor, asegúrate.
          </p>
          <button
            onClick={() => setEliminarModalAbierto(true)}
            className="w-full h-11 rounded-full bg-danger text-white font-sans font-semibold text-sm flex items-center justify-center gap-2 mt-3"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar Cuenta
          </button>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 mt-6 pt-6">
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-full border border-danger text-danger font-sans font-semibold text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-6">
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5 mt-6">
        {/* Información Personal */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden grid grid-cols-1 sm:grid-cols-[220px_1fr]">
          <div className="bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center gap-3 p-8 border-b sm:border-b-0 sm:border-r border-neutral-100 dark:border-neutral-700/60">
            <div className="relative">
              {user?.fotoUrl ? (
                <img src={user.fotoUrl} alt={nombre} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <span className="h-24 w-24 rounded-full bg-brand-primary text-white font-sans font-bold text-3xl flex items-center justify-center">
                  {iniciales(nombre)}
                </span>
              )}
              <button
                onClick={() => fotoInputRef.current?.click()}
                disabled={subiendoFoto}
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white dark:bg-neutral-800 shadow border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-brand-primary disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 text-center">{nombre}</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Información Personal
              </p>
              <button
                onClick={() => abrirModo('perfil')}
                className="font-sans text-sm font-semibold text-brand-primary hover:underline"
              >
                Editar todo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">Nombre Completo</p>
                <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 mt-0.5">{nombre}</p>
              </div>
              <div>
                <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">Correo Electrónico</p>
                <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 mt-0.5">{correo}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700/60">
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">Nombre de Usuario</p>
              <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 mt-0.5">{nombreUsuario}</p>
            </div>
          </div>
        </div>

        {/* Seguridad y Datos */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
          <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
            Seguridad y Datos
          </p>
          <div className="space-y-1">
            <button
              onClick={() => abrirModo('correo')}
              className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-neutral-50 rounded-lg px-1 -mx-1"
            >
              <span className="h-9 w-9 rounded-lg bg-brand-secondary/20 text-brand-primary flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0 font-sans text-sm text-neutral-700 dark:text-neutral-200">
                Cambiar correo electrónico
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </button>
            <button
              onClick={() => abrirModo('password')}
              className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-neutral-50 rounded-lg px-1 -mx-1"
            >
              <span className="h-9 w-9 rounded-lg bg-brand-secondary/20 text-brand-primary flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0 font-sans text-sm text-neutral-700 dark:text-neutral-200">
                Cambiar contraseña
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Administración (desktop) — solo el dueño (Carlos) ve esto. Antes
          se mostraba a cualquier administrador aunque el backend ya
          bloquea GET/PATCH de solicitudes con requireOwner, asi que un
          admin no-dueño solo se topaba con un 403 al entrar. */}
      {user?.esDueno && (
      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 mt-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700/60">
          <div className="flex items-center gap-2">
            <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
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
            <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
              No hay solicitudes de acceso pendientes.
            </p>
          ) : (
            <>
              <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mb-4">Solicitudes de acceso pendientes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendientes.slice(0, 3).map((s) => (
                  <div key={s.id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-sans text-sm font-bold flex items-center justify-center shrink-0">
                        {iniciales(s.nombre)}
                      </span>
                      <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">{s.nombre}</p>
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
                        className="flex-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50"
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
      )}

      {/* Zona de Peligro */}
      <div className="hidden md:flex bg-danger/5 border border-danger/20 rounded-2xl mt-5 p-6 flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-sans font-bold text-lg text-danger">
            <TriangleAlert className="h-5 w-5" />
            Zona de Peligro
          </p>
          <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
          </p>
        </div>
        <button
          onClick={() => setEliminarModalAbierto(true)}
          className="shrink-0 h-11 px-5 rounded-lg border border-danger text-danger font-sans font-semibold text-sm hover:bg-danger/10"
        >
          Eliminar Cuenta
        </button>
      </div>

      {/* Modal editar perfil / usuario / correo / contraseña */}
      {modo && (
        <div
          className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/40 md:px-4"
          onClick={() => setModo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 w-full max-w-md max-h-[88vh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6"
          >
            <div className="md:hidden w-10 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">{tituloModal}</h2>
              <button onClick={() => setModo(null)} aria-label="Cerrar">
                <X className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </button>
            </div>

            {modo === 'password' ? (
              <div className="space-y-3">
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Contraseña actual</label>
                  <input
                    type="password"
                    value={formPassword.actual}
                    onChange={(e) => setFormPassword({ ...formPassword, actual: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Nueva contraseña</label>
                  <input
                    type="password"
                    value={formPassword.nueva}
                    onChange={(e) => setFormPassword({ ...formPassword, nueva: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={formPassword.confirmar}
                    onChange={(e) => setFormPassword({ ...formPassword, confirmar: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(modo === 'perfil') && (
                  <div>
                    <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Nombre completo</label>
                    <input
                      type="text"
                      value={formPerfil.nombre}
                      onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                    />
                  </div>
                )}
                {(modo === 'perfil' || modo === 'usuario') && (
                  <div>
                    <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Nombre de usuario</label>
                    <input
                      type="text"
                      value={formPerfil.nombreUsuario}
                      onChange={(e) => setFormPerfil({ ...formPerfil, nombreUsuario: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                    />
                  </div>
                )}
                {(modo === 'perfil' || modo === 'correo') && (
                  <div>
                    <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Correo electrónico</label>
                    <input
                      type="email"
                      value={formPerfil.correo}
                      onChange={(e) => setFormPerfil({ ...formPerfil, correo: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                    />
                  </div>
                )}
              </div>
            )}

            {error && <p className="font-sans text-sm text-danger mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModo(null)}
                className="flex-1 h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                onClick={modo === 'password' ? guardarPassword : guardarPerfil}
                disabled={guardando}
                className="flex-1 h-11 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cuenta */}
      {eliminarModalAbierto && (
        <div
          className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/40 md:px-4"
          onClick={() => setEliminarModalAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 md:p-6"
          >
            <div className="md:hidden w-10 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-4" />
            <p className="flex items-center gap-2 font-sans font-bold text-lg text-danger">
              <TriangleAlert className="h-5 w-5" />
              Eliminar cuenta
            </p>
            <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-2">
              Esta acción es permanente: perderás el acceso administrativo y no podrás deshacerla.
              Escribe <span className="font-bold">ELIMINAR</span> para confirmar.
            </p>
            <input
              type="text"
              value={confirmarEliminar}
              onChange={(e) => setConfirmarEliminar(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full h-11 px-3 mt-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-danger/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEliminarModalAbierto(false)
                  setConfirmarEliminar('')
                }}
                className="flex-1 h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarCuenta}
                disabled={confirmarEliminar !== 'ELIMINAR'}
                className="flex-1 h-11 rounded-lg bg-danger text-white font-sans font-semibold text-sm disabled:opacity-50"
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
