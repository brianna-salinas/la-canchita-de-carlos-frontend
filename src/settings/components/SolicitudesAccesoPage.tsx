import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ArrowLeft, ClipboardCheck, Mail, CalendarDays, Check, X, Lock, Trash2 } from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import {
  useAccessRequests,
  useApproveAccessRequest,
  useRejectAccessRequest,
  formatLongDate,
  formatRelativeDate,
} from '../hooks/useSolicitudes'
import { useAdminUsers, useDeactivateAdminUser, formatLastActive } from '../hooks/useUsuarios'
import { initials } from '../../shared/utils/format'
import { getApiErrorMessage } from '../../shared/utils/api-error'

function esRecienActivo(iso?: string) {
  if (!iso) return false
  const horas = (Date.now() - new Date(iso).getTime()) / 3600000
  return horas < 24
}

export default function SolicitudesAccesoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const tabInicial = (location.state as { tab?: 'pendientes' | 'aprobados' } | null)?.tab ?? 'pendientes'

  useEffect(() => {
    if (user && !user.isOwner) {
      navigate('/ajustes', { replace: true })
    }
  }, [user, navigate])

  const { data: solicitudes = [] } = useAccessRequests()
  const aprobar = useApproveAccessRequest()
  const rechazar = useRejectAccessRequest()
  const { data: usuarios = [] } = useAdminUsers()
  const desactivarUsuario = useDeactivateAdminUser()

  const [tab, setTab] = useState<'pendientes' | 'aprobados'>(tabInicial)

  const pendientes = solicitudes.filter((s) => s.status === 'PENDING')
  const usuariosAprobados = usuarios.filter((u) => !u.isOwner && u.status === 'ACTIVE')

  async function quitarAcceso(id: number) {
    if (!window.confirm('¿Quitar el acceso a este administrador?')) return
    try {
      await desactivarUsuario.mutateAsync(id)
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo quitar el acceso. Intenta de nuevo.'))
    }
  }

  async function eliminarCuenta(id: number) {
    if (!window.confirm('¿Eliminar esta cuenta de administrador? Esta acción no se puede deshacer.')) return
    try {
      await desactivarUsuario.mutateAsync(id)
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo eliminar la cuenta. Intenta de nuevo.'))
    }
  }

  return (
    <AppShell showSearch={false} minimalMobile>
      <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/ajustes')} aria-label="Volver" className="text-brand-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-sans font-bold text-lg text-brand-primary">Gestión de Accesos</h1>
      </div>

      <div className="md:hidden px-4 py-4 pb-8 space-y-3 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <div className="flex rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 p-1">
          <button
            onClick={() => setTab('pendientes')}
            className={`flex-1 h-9 rounded-full font-sans text-sm font-medium transition-colors ${
              tab === 'pendientes' ? 'bg-brand-primary text-white' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            Pendientes ({pendientes.length})
          </button>
          <button
            onClick={() => setTab('aprobados')}
            className={`flex-1 h-9 rounded-full font-sans text-sm font-medium transition-colors ${
              tab === 'aprobados' ? 'bg-brand-primary text-white' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            Aprobados ({usuariosAprobados.length})
          </button>
        </div>

        {tab === 'pendientes' && (
          <>
            {pendientes.length === 0 && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">No hay solicitudes pendientes.</p>
            )}
            {pendientes.map((s) => (
              <div key={s.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">{s.name}</p>
                  <span className="shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-700/60 px-2 py-1 font-sans text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {formatRelativeDate(s.createdAt)}
                  </span>
                </div>
                <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{s.email}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => aprobar(s)}
                    className="flex-1 h-10 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => rechazar(s.id)}
                    className="flex-1 h-10 rounded-lg border border-brand-primary text-brand-primary font-sans font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'aprobados' && (
          <>
            {usuariosAprobados.length === 0 && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Todavía no hay usuarios con acceso.</p>
            )}
            {usuariosAprobados.map((u) => (
              <div key={u.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center gap-3">
                  {u.photoUrl ? (
                    <img
                      src={u.photoUrl}
                      alt={u.name}
                      className="h-11 w-11 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="h-11 w-11 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-sm font-bold flex items-center justify-center shrink-0">
                      {initials(u.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{u.name}</p>
                    <p className="flex items-center gap-1.5 font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          esRecienActivo(u.lastAccess) ? 'bg-brand-primary' : 'bg-neutral-300'
                        }`}
                      />
                      {formatLastActive(u.lastAccess)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  <button
                    onClick={() => quitarAcceso(u.id)}
                    className="w-full h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-4 w-4" />
                    Quitar Acceso
                  </button>
                  <button
                    onClick={() => eliminarCuenta(u.id)}
                    className="w-full h-10 rounded-lg bg-danger/10 font-sans font-semibold text-sm text-danger flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 pt-4">
          Oryon Copyright © 2026. All rights reserved.
        </p>
      </div>

      <div className="hidden md:block">
        <Link to="/ajustes" className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50 mt-2">Solicitudes de Acceso</h1>
        <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1">
          Gestiona las peticiones de nuevos administradores o personal para tu instalación deportiva.
        </p>

        <div className="grid grid-cols-[220px_1fr] gap-6 mt-6">
          <div className="bg-brand-primary rounded-2xl p-6 flex flex-col justify-between h-[130px]">
            <p className="font-sans text-xs font-semibold text-white/80 uppercase tracking-wide">
              Pendientes
            </p>
            <div className="flex items-end justify-between">
              <p className="font-sans font-bold text-4xl text-white">
                {pendientes.length}
              </p>
              <ClipboardCheck className="h-6 w-6 text-white/70" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setTab('pendientes')}
                className={`pb-3 font-sans text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${
                  tab === 'pendientes'
                    ? 'text-brand-primary border-brand-primary'
                    : 'text-neutral-400 dark:text-neutral-500 border-transparent'
                }`}
              >
                Pendientes
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400 text-[11px] font-bold flex items-center justify-center">
                  {pendientes.length}
                </span>
              </button>
              <button
                onClick={() => setTab('aprobados')}
                className={`pb-3 font-sans text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${
                  tab === 'aprobados'
                    ? 'text-brand-primary border-brand-primary'
                    : 'text-neutral-400 dark:text-neutral-500 border-transparent'
                }`}
              >
                Aprobados
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400 text-[11px] font-bold flex items-center justify-center">
                  {usuariosAprobados.length}
                </span>
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {tab === 'pendientes' && (
                <>
                  {pendientes.length === 0 && (
                    <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">No hay solicitudes pendientes.</p>
                  )}
                  {pendientes.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-4"
                    >
                      <span className="h-11 w-11 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-sm font-bold flex items-center justify-center shrink-0">
                        {initials(s.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{s.name}</p>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                            <Mail className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                            {s.email}
                          </span>
                          <span className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                            <CalendarDays className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                            {formatLongDate(s.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => aprobar(s)}
                          className="h-9 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm hover:bg-brand-primary/90"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => rechazar(s.id)}
                          className="h-9 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tab === 'aprobados' && (
                <>
                  {usuariosAprobados.length === 0 && (
                    <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Todavía no hay usuarios con acceso.</p>
                  )}
                  {usuariosAprobados.map((u) => (
                    <div
                      key={u.id}
                      className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-4"
                    >
                      {u.photoUrl ? (
                        <img
                          src={u.photoUrl}
                          alt={u.name}
                          className="h-11 w-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="h-11 w-11 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-sm font-bold flex items-center justify-center shrink-0">
                          {initials(u.name)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{u.name}</p>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                            <Mail className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                            {u.email}
                          </span>
                          <span className="flex items-center gap-1.5 font-sans text-xs text-neutral-400 dark:text-neutral-500">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                esRecienActivo(u.lastAccess) ? 'bg-brand-primary' : 'bg-neutral-300'
                              }`}
                            />
                            {formatLastActive(u.lastAccess)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => quitarAcceso(u.id)}
                          className="h-9 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50"
                        >
                          Quitar Acceso
                        </button>
                        <button
                          onClick={() => eliminarCuenta(u.id)}
                          className="h-9 px-4 rounded-lg bg-danger/10 font-sans font-semibold text-sm text-danger hover:bg-danger/20"
                        >
                          Eliminar Cuenta
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
