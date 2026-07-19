import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Goal, CircleCheck, Wrench } from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCanchas, useReservas } from '../../bookings/hooks/useCalendario'
import { apiClient } from '../../shared/api/client'

// Misma fecha de ejemplo que usan Reservas/Calendario mientras el
// dataset del fake API siga anclado a ella.
const FECHA_DEMO = '2026-07-11'
const HORA_APERTURA = 8
const HORA_CIERRE = 23

const PAGE_SIZE = 6

function deporteIcono(_deporte: string) {
  // Un solo icono genérico de cancha por ahora (Goal, ya usado en el
  // nav). Se puede diferenciar por deporte más adelante si se agrega
  // un set de iconos deportivos específico.
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

  const { data: canchas = [], isLoading, isError } = useCanchas()
  const { data: reservas = [] } = useReservas()

  const [visibles, setVisibles] = useState(PAGE_SIZE)

  const canchasConDatos = useMemo(() => {
    return canchas.map((c) => {
      const reservasHoy = reservas
        .filter((r) => r.canchaId === c.id && r.fecha === FECHA_DEMO)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      const horasOcupadas = reservasHoy.reduce(
        (acc, r) => acc + duracionHoras(r.horaInicio, r.horaFin),
        0,
      )
      const ocupacionPct = Math.round(
        (horasOcupadas / (HORA_CIERRE - HORA_APERTURA)) * 100,
      )
      return { ...c, reservasHoy, ocupacionPct }
    })
  }, [canchas, reservas])

  const total = canchasConDatos.length
  const activas = canchasConDatos.filter((c) => (c.estado ?? 'ACTIVA') === 'ACTIVA').length
  const mantenimiento = canchasConDatos.filter((c) => c.estado === 'MANTENIMIENTO').length

  async function eliminarCancha(id: number) {
    if (!window.confirm('¿Eliminar esta cancha? Esta acción no se puede deshacer.')) return
    try {
      await apiClient.delete(`/canchas/${id}`)
      await queryClient.invalidateQueries({ queryKey: ['canchas'] })
    } catch {
      window.alert('No se pudo eliminar la cancha. Intenta de nuevo.')
    }
  }

  function CardCancha({ c }: { c: (typeof canchasConDatos)[number] }) {
    const enMantenimiento = c.estado === 'MANTENIMIENTO'
    const Icon = deporteIcono(c.deporte)
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className={`relative h-36 bg-gradient-to-br ${gradientePorId(c.id)} flex items-center justify-center`}>
          {c.fotoUrl ? (
            <img src={c.fotoUrl} alt={c.nombre} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Icon className="h-10 w-10 text-white/70" />
          )}
          <span
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase ${
              enMantenimiento ? 'bg-warning text-white' : 'bg-success text-white'
            }`}
          >
            {enMantenimiento ? 'Mantenimiento' : 'Activa'}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">{c.nombre}</p>
            <p className="font-sans font-bold text-brand-primary whitespace-nowrap">
              S/{c.precioHora.toFixed(2)}
              <span className="font-sans font-normal text-xs text-neutral-400 dark:text-neutral-500"> /hora</span>
            </p>
          </div>
          <p className="flex items-center gap-1.5 font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            <Icon className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            {c.deporte}
          </p>

          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between">
            {enMantenimiento ? (
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
                    {r.horaInicio.slice(0, 2)}h
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
                onClick={() => navigate(`/canchas/${c.id}/editar`)}
                aria-label="Editar cancha"
                className="text-neutral-400 dark:text-neutral-500 hover:text-brand-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => eliminarCancha(c.id)}
                aria-label="Eliminar cancha"
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
      {/* ================= DESKTOP ================= */}
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
              {String(mantenimiento).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {isError && (
        <p className="hidden md:block font-sans text-sm text-danger mt-6">
          No se pudieron cargar las canchas. Verifica que el fake API
          (json-server) esté corriendo en el puerto 3001.
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

      {/* ================= MOBILE ================= */}
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
            No se pudieron cargar las canchas. Verifica que el fake API
            (json-server) esté corriendo en el puerto 3001.
          </p>
        )}
        {isLoading && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 mt-4">Cargando canchas...</p>
        )}

        <div className="space-y-4 mt-4">
          {canchasConDatos.map((c) => {
            const enMantenimiento = c.estado === 'MANTENIMIENTO'
            const Icon = deporteIcono(c.deporte)
            return (
              <div key={c.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className={`relative h-32 bg-gradient-to-br ${gradientePorId(c.id)} flex items-center justify-center`}>
                  {c.fotoUrl ? (
                    <img src={c.fotoUrl} alt={c.nombre} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-9 w-9 text-white/70" />
                  )}
                  <span
                    className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase flex items-center gap-1 ${
                      enMantenimiento ? 'bg-warning text-white' : 'bg-success text-white'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-800" />
                    {enMantenimiento ? 'Mantenimiento' : 'Activa'}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">{c.nombre}</p>
                  <p className="flex items-center gap-1.5 font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                    {c.deporte}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-sans font-bold text-brand-primary text-base">
                      S/{c.precioHora.toFixed(0)}
                      <span className="font-sans font-normal text-xs text-neutral-400 dark:text-neutral-500"> /hr</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/canchas/${c.id}/editar`)}
                        aria-label="Editar cancha"
                        className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarCancha(c.id)}
                        aria-label="Eliminar cancha"
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
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>

      <button
        onClick={() => navigate('/canchas/nueva')}
        aria-label="Nueva cancha"
        className="md:hidden fixed bottom-24 right-5 h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center z-20"
      >
        <Plus className="h-6 w-6" />
      </button>
    </AppShell>
  )
}
