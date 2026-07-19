import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ClipboardCheck, Mail, CalendarDays, Check, X, Lock, Trash2 } from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import {
  useSolicitudes,
  useAprobarSolicitud,
  useRechazarSolicitud,
  formatFechaLarga,
  formatFechaRelativa,
} from '../hooks/useSolicitudes'
import { useUsuarios, formatActivoHace } from '../hooks/useUsuarios'
import { apiClient } from '../../shared/api/client'
import { iniciales } from '../../shared/utils/format'

function esRecienActivo(iso?: string) {
  if (!iso) return false
  const horas = (Date.now() - new Date(iso).getTime()) / 3600000
  return horas < 24
}

export default function SolicitudesAccesoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: solicitudes = [] } = useSolicitudes()
  const aprobar = useAprobarSolicitud()
  const rechazar = useRechazarSolicitud()
  const { data: usuarios = [] } = useUsuarios()

  const [tab, setTab] = useState<'pendientes' | 'aprobados'>('pendientes')

  const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE')
  const aprobadas = solicitudes.filter((s) => s.estado === 'APROBADO')
  const usuariosAprobados = usuarios.filter((u) => !u.esDueno && u.estado === 'ACTIVO')

  async function quitarAcceso(id: string) {
    if (!window.confirm('¿Quitar el acceso a este usuario?')) return
    try {
      await apiClient.patch(`/usuarios/${id}`, { estado: 'INACTIVO' })
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    } catch {
      window.alert('No se pudo quitar el acceso. Intenta de nuevo.')
    }
  }

  async function eliminarCuenta(id: string) {
    if (!window.confirm('¿Eliminar esta cuenta? Esta acción no se puede deshacer.')) return
    try {
      await apiClient.delete(`/usuarios/${id}`)
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    } catch {
      window.alert('No se pudo eliminar la cuenta. Intenta de nuevo.')
    }
  }

  return (
    <AppShell showSearch={false} minimalMobile>
      {/* Barra superior mobile */}
      <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/ajustes')} aria-label="Volver" className="text-brand-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-sans font-bold text-lg text-brand-primary">Gestión de Accesos</h1>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden px-4 py-4 pb-8 space-y-3 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Solicitudes Pendientes
        </p>
        {pendientes.length === 0 && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">No hay solicitudes pendientes.</p>
        )}
        {pendientes.map((s) => (
          <div key={s.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">{s.nombre}</p>
              <span className="shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-700/60 px-2 py-1 font-sans text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                {formatFechaRelativa(s.creadoEn)}
              </span>
            </div>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{s.correo}</p>
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

        <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide pt-3">
          Usuarios Aprobados
        </p>
        {usuariosAprobados.length === 0 && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Todavía no hay usuarios con acceso.</p>
        )}
        {usuariosAprobados.map((u) => (
          <div key={u.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-sm font-bold flex items-center justify-center shrink-0">
                {iniciales(u.nombre)}
              </span>
              <div className="min-w-0">
                <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{u.nombre}</p>
                <p className="flex items-center gap-1.5 font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      esRecienActivo(u.ultimoAcceso) ? 'bg-brand-primary' : 'bg-neutral-300'
                    }`}
                  />
                  {formatActivoHace(u.ultimoAcceso)}
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

        <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 pt-4">
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>

      {/* ================= DESKTOP ================= */}
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
                {String(pendientes.length).padStart(2, '0')}
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
                  {String(pendientes.length).padStart(2, '0')}
                </span>
              </button>
              <button
                onClick={() => setTab('aprobados')}
                className={`pb-3 font-sans text-sm font-semibold border-b-2 -mb-px ${
                  tab === 'aprobados'
                    ? 'text-brand-primary border-brand-primary'
                    : 'text-neutral-400 dark:text-neutral-500 border-transparent'
                }`}
              >
                Aprobados
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {tab === 'pendientes' && pendientes.length === 0 && (
                <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">No hay solicitudes pendientes.</p>
              )}
              {tab === 'aprobados' && aprobadas.length === 0 && (
                <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Todavía no hay solicitudes aprobadas.</p>
              )}
              {(tab === 'pendientes' ? pendientes : aprobadas).map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-4"
                >
                  <span className="h-11 w-11 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-sm font-bold flex items-center justify-center shrink-0">
                    {iniciales(s.nombre)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{s.nombre}</p>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                        <Mail className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                        {s.correo}
                      </span>
                      <span className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                        <CalendarDays className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                        {formatFechaLarga(s.creadoEn)}
                      </span>
                    </div>
                  </div>
                  {tab === 'pendientes' && (
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
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">Usuarios Aprobados</h2>
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
            {usuariosAprobados.length} usuarios activos
          </p>
        </div>

        <div className="space-y-4">
          {usuariosAprobados.length === 0 && (
            <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Todavía no hay usuarios con acceso.</p>
          )}
          {usuariosAprobados.map((u) => (
            <div key={u.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-4">
              <span className="h-11 w-11 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-sm font-bold flex items-center justify-center shrink-0">
                {iniciales(u.nombre)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{u.nombre}</p>
                <p className="flex items-center gap-1.5 font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      esRecienActivo(u.ultimoAcceso) ? 'bg-brand-primary' : 'bg-neutral-300'
                    }`}
                  />
                  {formatActivoHace(u.ultimoAcceso)}
                </p>
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
        </div>
      </div>
    </AppShell>
  )
}
