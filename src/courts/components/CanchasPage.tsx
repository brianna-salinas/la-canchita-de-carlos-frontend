import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Goal, CircleCheck, Wrench, RotateCcw, TriangleAlert, X, Clock, Info } from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useAllCourts, useBookings } from '../../bookings/hooks/useCalendario'
import { apiClient } from '../../shared/api/client'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { toISODate } from '../../shared/utils/date'
import ProgramarMantenimientoModal from '../../bookings/components/ProgramarMantenimientoModal'
import MantenimientosProgramadosModal from '../../bookings/components/MantenimientosProgramadosModal'

const HORA_APERTURA = 8
const HORA_CIERRE = 23

const PAGE_SIZE = 6

function deporteIcono() {
  return Goal
}

function gradientePorId(id: number) {
  const gradientes = [
    'from-emerald-600 to-emerald-900',
    'from-orange-500 to-amber-800',
    'from-sky-600 to-slate-900',
    'from-blue-600 to-indigo-900',
    'from-teal-500 to-emerald-900',
  ]
  return gradientes[id % gradientes.length]
}

function duracionHoras(horaInicio: string, horaFin: string) {
  const [h1, m1] = horaInicio.split(':').map(Number)
  const [h2, m2] = horaFin.split(':').map(Number)
  return h2 + m2 / 60 - (h1 + m1 / 60)
}

export default function CanchasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: canchas = [], isLoading, isError } = useAllCourts()
  const { data: reservas = [] } = useBookings()

  const [visibles, setVisibles] = useState(PAGE_SIZE)
  const [canchaAEliminar, setCanchaAEliminar] = useState<{ id: number; name: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [canchaDetalle, setCanchaDetalle] = useState<(typeof canchasConDatos)[number] | null>(null)
  const [canchaMantenimiento, setCanchaMantenimiento] = useState<{ id: number; name: string } | null>(null)
  const [programandoNuevo, setProgramandoNuevo] = useState(false)

  const isoHoy = toISODate(new Date())

  const canchasConDatos = useMemo(() => {
    return canchas.map((c) => {
      const reservasHoy = reservas
        .filter((r) => r.courtId === c.id && r.date === isoHoy)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
      const horasOcupadas = reservasHoy.reduce(
        (acc, r) => acc + duracionHoras(r.startTime, r.endTime),
        0,
      )
      const ocupacionPct = Math.round(
        (horasOcupadas / (HORA_CIERRE - HORA_APERTURA)) * 100,
      )
      return { ...c, reservasHoy, ocupacionPct }
    })
  }, [canchas, reservas, isoHoy])

  const total = canchasConDatos.length
  const activas = canchasConDatos.filter((c) => c.enabled !== false && (c.status ?? 'ACTIVE') === 'ACTIVE').length
  const mantenimiento = canchasConDatos.filter((c) => c.enabled !== false && c.status === 'MAINTENANCE').length
  function pedirConfirmacionEliminar(c: { id: number; name: string }) {
    setCanchaAEliminar(c)
  }

  async function confirmarEliminarDefinitivo() {
    if (!canchaAEliminar) return
    setEliminando(true)
    try {
      await apiClient.delete(`/courts/${canchaAEliminar.id}`)
      await queryClient.invalidateQueries({ queryKey: ['courts'] })
      setCanchaAEliminar(null)
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo eliminar la cancha. Intenta de nuevo.'))
    } finally {
      setEliminando(false)
    }
  }

  async function reactivarCancha(id: number) {
    if (!window.confirm('¿Reactivar esta cancha? Volverá a estar disponible para reservas.')) return
    try {
      await apiClient.patch(`/courts/${id}`, { enabled: true })
      await queryClient.invalidateQueries({ queryKey: ['courts'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo reactivar la cancha. Intenta de nuevo.'))
    }
  }

  function CardCancha({ c }: { c: (typeof canchasConDatos)[number] }) {
    const enMantenimiento = c.status === 'MAINTENANCE'
    const pausada = c.enabled === false
    const Icon = deporteIcono()
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCanchaDetalle(c)}
        onKeyDown={(e) => e.key === 'Enter' && setCanchaDetalle(c)}
        className={`text-left bg-white dark:bg-neutral-800 rounded-2xl border overflow-hidden cursor-pointer hover:shadow-sm transition-shadow ${pausada ? 'border-neutral-200 dark:border-neutral-700 opacity-60' : 'border-neutral-200 dark:border-neutral-700'}`}
      >
        <div className={`relative h-36 bg-gradient-to-br ${gradientePorId(c.id)} flex items-center justify-center`}>
          {c.photoUrl ? (
            <img src={c.photoUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Icon className="h-10 w-10 text-white/70" />
          )}
          <span
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase ${
              pausada ? 'bg-neutral-500 text-white' : enMantenimiento ? 'bg-warning text-white' : 'bg-success text-white'
            }`}
          >
            {pausada ? 'Pausada' : enMantenimiento ? 'Mantenimiento' : 'Activa'}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">{c.name}</p>
            <p className="font-sans font-bold text-brand-primary whitespace-nowrap">
              S/{c.pricePerHour.toFixed(2)}
              <span className="font-sans font-normal text-xs text-neutral-400 dark:text-neutral-500"> /hora</span>
            </p>
          </div>
          <p className="flex items-center gap-1.5 font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            <Icon className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            {c.sport}
          </p>

          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between">
            {pausada ? (
              <span className="font-sans text-sm text-neutral-400 dark:text-neutral-500">No disponible para reservas</span>
            ) : enMantenimiento ? (
              <span className="font-sans text-sm text-warning">En mantenimiento</span>
            ) : c.reservasHoy.length === 0 ? (
              <span className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Sin reservas para hoy</span>
            ) : (
              <div className="flex items-center gap-1.5">
                {c.reservasHoy.slice(0, 2).map((r) => (
                  <span
                    key={r.id}
                    className="h-7 px-2 rounded-full bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 font-sans text-xs font-semibold flex items-center justify-center"
                  >
                    {r.startTime.slice(0, 2)}h
                  </span>
                ))}
                {c.reservasHoy.length > 2 && (
                  <span className="h-7 px-2 rounded-full bg-brand-primary/10 text-brand-primary font-sans text-xs font-semibold flex items-center justify-center">
                    +{c.reservasHoy.length - 2}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/canchas/${c.id}/editar`)
                }}
                aria-label="Editar cancha"
                className="text-neutral-400 dark:text-neutral-500 hover:text-brand-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {pausada && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    reactivarCancha(c.id)
                  }}
                  aria-label="Reactivar cancha"
                  className="text-neutral-400 dark:text-neutral-500 hover:text-success"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCanchaMantenimiento({ id: c.id, name: c.name })
                }}
                aria-label="Programar mantenimiento"
                className="text-neutral-400 dark:text-neutral-500 hover:text-warning"
              >
                <Wrench className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  pedirConfirmacionEliminar({ id: c.id, name: c.name })
                }}
                aria-label="Eliminar cancha permanentemente"
                className="text-neutral-400 dark:text-neutral-500 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppShell showSearch={false}>
      <div className="hidden md:flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50">
            Gestión de Canchas
          </h1>
          <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1">
            Administra y configura las canchas disponibles en el sistema.
          </p>
        </div>
        <button
          onClick={() => navigate('/canchas/nueva')}
          className="h-11 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva Cancha
        </button>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <Goal className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold">Total Canchas</p>
            <p className="font-sans text-xl font-bold text-neutral-900 dark:text-neutral-50">{total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <CircleCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold">Activas</p>
            <p className="font-sans text-xl font-bold text-neutral-900 dark:text-neutral-50">{activas}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold">Mantenimiento</p>
            <p className="font-sans text-xl font-bold text-neutral-900 dark:text-neutral-50">
              {mantenimiento}
            </p>
          </div>
        </div>
      </div>

      {isError && (
        <p className="hidden md:block font-sans text-sm text-danger mt-6">
          No se pudieron cargar las canchas. Verifica tu conexión o que el
          servidor esté disponible.
        </p>
      )}
      {isLoading && (
        <p className="hidden md:block font-sans text-sm text-neutral-400 dark:text-neutral-500 mt-6">
          Cargando canchas...
        </p>
      )}

      <div className="hidden md:grid grid-cols-3 gap-5 mt-6">
        {canchasConDatos.slice(0, visibles).map((c) => (
          <CardCancha key={c.id} c={c} />
        ))}

        <button
          onClick={() => navigate('/canchas/nueva')}
          className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl flex flex-col items-center justify-center gap-3 py-10 text-neutral-400 dark:text-neutral-500 hover:border-brand-primary hover:text-brand-primary transition-colors"
        >
          <span className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-700/60 flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </span>
          <span className="font-sans font-semibold text-sm">Nueva Cancha</span>
          <span className="font-sans text-xs text-neutral-400 dark:text-neutral-500 px-6 text-center">
            Configurar nuevo espacio deportivo
          </span>
        </button>
      </div>

      {visibles < canchasConDatos.length && (
        <div className="hidden md:flex justify-center mt-6">
          <button
            onClick={() => setVisibles((v) => v + PAGE_SIZE)}
            className="h-11 px-6 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50"
          >
            Cargar más canchas
          </button>
        </div>
      )}

      <div className="md:hidden pb-24">
        <h1 className="font-sans font-bold text-2xl text-neutral-900 dark:text-neutral-50">Gestión de Canchas</h1>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-center">
            <p className="font-sans font-bold text-xl text-brand-primary">{total}</p>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">Total</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-center">
            <p className="font-sans font-bold text-xl text-success">{activas}</p>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">Activas</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-center">
            <p className="font-sans font-bold text-xl text-warning">{mantenimiento}</p>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">Manten.</p>
          </div>
        </div>

        {isError && (
          <p className="font-sans text-sm text-danger mt-4">
            No se pudieron cargar las canchas. Verifica tu conexión o que el
            servidor esté disponible.
          </p>
        )}
        {isLoading && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 mt-4">Cargando canchas...</p>
        )}

        <div className="space-y-4 mt-4">
          {canchasConDatos.map((c) => {
            const enMantenimiento = c.status === 'MAINTENANCE'
            const pausada = c.enabled === false
            const Icon = deporteIcono()
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setCanchaDetalle(c)}
                onKeyDown={(e) => e.key === 'Enter' && setCanchaDetalle(c)}
                className={`bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden cursor-pointer ${pausada ? 'opacity-60' : ''}`}
              >
                <div className={`relative h-32 bg-gradient-to-br ${gradientePorId(c.id)} flex items-center justify-center`}>
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-9 w-9 text-white/70" />
                  )}
                  <span
                    className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase flex items-center gap-1 ${
                      pausada ? 'bg-neutral-500 text-white' : enMantenimiento ? 'bg-warning text-white' : 'bg-success text-white'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-800" />
                    {pausada ? 'Pausada' : enMantenimiento ? 'Mantenimiento' : 'Activa'}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{c.name}</p>
                  <p className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                    {c.sport}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-sans font-bold text-brand-primary text-base">
                      S/{c.pricePerHour.toFixed(0)}
                      <span className="font-sans font-normal text-xs text-neutral-400 dark:text-neutral-500"> /hr</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/canchas/${c.id}/editar`)
                        }}
                        aria-label="Editar cancha"
                        className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {pausada && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            reactivarCancha(c.id)
                          }}
                          aria-label="Reactivar cancha"
                          className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-success"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCanchaMantenimiento({ id: c.id, name: c.name })
                        }}
                        aria-label="Programar mantenimiento"
                        className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-warning"
                      >
                        <Wrench className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          pedirConfirmacionEliminar({ id: c.id, name: c.name })
                        }}
                        aria-label="Eliminar cancha permanentemente"
                        className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-8">
          Oryon Copyright © 2026. All rights reserved.
        </p>
      </div>

      <button
        onClick={() => navigate('/canchas/nueva')}
        aria-label="Nueva cancha"
        className="md:hidden fixed bottom-24 right-5 h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {canchaAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setCanchaAEliminar(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 rounded-2xl border border-danger/30 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="flex items-start gap-3 p-5 bg-danger/10">
              <span className="h-10 w-10 rounded-full bg-danger/20 text-danger flex items-center justify-center shrink-0">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-sans font-bold text-base text-danger">Esta acción es permanente</p>
                <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                  Vas a eliminar <span className="font-semibold">{canchaAEliminar.name}</span> para siempre. No se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => setCanchaAEliminar(null)}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <p className="font-sans text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Junto con la cancha se borrará también, en cascada:
              </p>
              <ul className="mt-2 space-y-1.5 font-sans text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger mt-2 shrink-0" />
                  Todo su historial de reservas (pasadas y futuras)
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger mt-2 shrink-0" />
                  Los pagos registrados de esas reservas
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger mt-2 shrink-0" />
                  Sus bloqueos de horario por mantenimiento
                </li>
              </ul>
              <p className="mt-3 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                Si solo quieres dejar de recibir reservas por ahora sin perder nada, cierra esto y en su lugar edita la cancha y
                desactiva &quot;Habilitada para reservas&quot;: eso se puede revertir cuando quieras.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-5">
                <button
                  onClick={() => setCanchaAEliminar(null)}
                  disabled={eliminando}
                  className="h-11 sm:h-10 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 disabled:opacity-60 w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarDefinitivo}
                  disabled={eliminando}
                  className="h-11 sm:h-10 px-4 rounded-lg bg-danger text-white font-sans font-semibold text-sm hover:bg-danger/90 disabled:opacity-60 w-full sm:w-auto"
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar para siempre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canchaDetalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setCanchaDetalle(null)}
        >
          <div
            className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative h-32 bg-gradient-to-br ${gradientePorId(canchaDetalle.id)} flex items-center justify-center`}>
              {canchaDetalle.photoUrl ? (
                <img src={canchaDetalle.photoUrl} alt={canchaDetalle.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Goal className="h-9 w-9 text-white/70" />
              )}
              <button
                onClick={() => setCanchaDetalle(null)}
                aria-label="Cerrar"
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">{canchaDetalle.name}</p>
                <p className="font-sans font-bold text-brand-primary whitespace-nowrap">
                  S/{canchaDetalle.pricePerHour.toFixed(2)}
                  <span className="font-sans font-normal text-xs text-neutral-400 dark:text-neutral-500"> /hora</span>
                </p>
              </div>
              <p className="flex items-center gap-1.5 font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1 capitalize">
                <Goal className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                {canchaDetalle.sport}
              </p>

              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 uppercase font-semibold">
                      Horario de atención
                    </p>
                    <p className="font-sans text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                      {canchaDetalle.openTime && canchaDetalle.closeTime
                        ? `${canchaDetalle.openTime} a ${canchaDetalle.closeTime}`
                        : 'Sin restricción (abierta las 24 horas)'}
                    </p>
                  </div>
                </div>

                {canchaDetalle.description && (
                  <div className="flex items-start gap-3">
                    <span className="h-9 w-9 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center shrink-0">
                      <Info className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 uppercase font-semibold">
                        Descripción
                      </p>
                      <p className="font-sans text-sm text-neutral-700 dark:text-neutral-200">
                        {canchaDetalle.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-5">
                <button
                  onClick={() => setCanchaDetalle(null)}
                  className="h-11 sm:h-10 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 w-full sm:w-auto"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const id = canchaDetalle.id
                    setCanchaDetalle(null)
                    navigate(`/canchas/${id}/editar`)
                  }}
                  className="h-11 sm:h-10 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm hover:bg-brand-primary/90 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canchaMantenimiento && !programandoNuevo && (
        <MantenimientosProgramadosModal
          canchaId={canchaMantenimiento.id}
          canchaNombre={canchaMantenimiento.name}
          onClose={() => setCanchaMantenimiento(null)}
          onProgramarNuevo={() => setProgramandoNuevo(true)}
        />
      )}

      {canchaMantenimiento && programandoNuevo && (
        <ProgramarMantenimientoModal
          canchas={canchas}
          canchaIdInicial={canchaMantenimiento.id}
          onClose={() => setProgramandoNuevo(false)}
          onProgramado={() => setProgramandoNuevo(false)}
        />
      )}
    </AppShell>
  )
}
