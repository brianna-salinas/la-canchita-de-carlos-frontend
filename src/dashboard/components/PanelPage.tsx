import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Wallet,
  ClipboardX,
  MoreVertical,
  BarChart3,
  Plus,
  AlertTriangle,
  CircleCheck,
  Eye,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import AppShell from '../../shared/components/AppShell'
import {
  useTodayBookings,
  calculateSummary,
  dayPhrase,
  calculateNextFreeSlot,
  calculateWeeklyOccupancy,
  type DayOccupancy,
  type NextFreeSlot,
} from '../hooks/usePanelData'
import { useCourts, useBookings, useScheduleBlocks, type ScheduleBlock } from '../../bookings/hooks/useCalendario'
import { useAuth } from '../../auth/useAuth'
import { apiClient } from '../../shared/api/client'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { toISODate, hourToNum } from '../../shared/utils/date'

const ESTADO_LABEL: Record<string, string> = {
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
  PENDING: 'Pendiente',
}

const ESTADO_BADGE: Record<string, string> = {
  PAID: 'bg-success/15 text-success',
  PARTIAL: 'bg-warning/15 text-warning',
  PENDING: 'bg-danger/15 text-danger',
}

const ESTADO_BORDER: Record<string, string> = {
  PAID: 'border-success',
  PARTIAL: 'border-warning',
  PENDING: 'border-danger',
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function SiguienteHorarioCard({
  proximaLibre,
  onReservar,
}: {
  proximaLibre: NextFreeSlot | null
  onReservar: (proximaLibre: NextFreeSlot) => void
}) {
  return (
    <div className="bg-brand-primary rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between gap-4 md:block">
        <div>
          <p className="font-sans text-xs tracking-wide uppercase text-white/70">
            Siguiente Horario Libre
          </p>
          <p className="font-sans font-bold text-2xl md:text-3xl mt-1">
            {proximaLibre ? proximaLibre.startTime : '—'}
            {proximaLibre && (
              <span className="md:hidden"> - {proximaLibre.courtName}</span>
            )}
          </p>
          <p className="hidden md:block font-sans text-sm text-white/80 mt-1">
            {proximaLibre ? proximaLibre.courtName : 'Sin horarios libres hoy'}
          </p>
        </div>
        <button
          type="button"
          disabled={!proximaLibre}
          onClick={() => proximaLibre && onReservar(proximaLibre)}
          className="shrink-0 h-10 px-5 md:w-full md:mt-4 rounded-lg bg-white text-brand-primary font-sans font-semibold text-sm hover:bg-white/90 disabled:opacity-50"
        >
          Reservar Ya
        </button>
      </div>
    </div>
  )
}

function OcupacionCard({ ocupacion }: { ocupacion: DayOccupancy[] }) {
  const isoHoy = toISODate(new Date())
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
          Ocupación Semanal
        </p>
        <BarChart3 className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
      </div>
      <div className="h-32 rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-end justify-between gap-1.5 px-2 pt-3 pb-1.5">
        {ocupacion.map((dia) => {
          const esHoy = toISODate(dia.date) === isoHoy
          return (
            <div key={dia.date.toISOString()} className="flex-1 h-full flex items-end">
              <div
                className={`w-full rounded-t ${esHoy ? 'bg-brand-primary' : 'bg-brand-secondary/60'}`}
                style={{ height: `${Math.max(4, dia.percentage)}%` }}
                title={`${dia.percentage}% ocupado`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 px-2 mt-2">
        {DIAS_SEMANA.map((d, i) => (
          <div key={d + i} className="flex-1 text-center">
            <span
              className={`font-sans text-xs ${
                toISODate(ocupacion[i]?.date ?? new Date()) === isoHoy
                  ? 'font-bold text-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function agruparBloqueosPorCancha(bloqueos: ScheduleBlock[]): string[] {
  const porCancha = new Map<number, { nombre: string; horas: string[] }>()
  for (const b of bloqueos) {
    const entrada = porCancha.get(b.courtId) ?? { nombre: b.courtName, horas: [] }
    entrada.horas.push(b.time)
    porCancha.set(b.courtId, entrada)
  }
  return Array.from(porCancha.values()).map(({ nombre, horas }) => {
    const ordenadas = [...horas].sort((a, c) => hourToNum(a) - hourToNum(c))
    const inicio = ordenadas[0]!
    const finNum = hourToNum(ordenadas[ordenadas.length - 1]!) + 1
    const fin = `${String(finNum % 24).padStart(2, '0')}:00`
    return `${nombre} en mantenimiento hoy de ${inicio} a ${fin}.`
  })
}

function AvisoCard({ bloqueosHoy }: { bloqueosHoy: ScheduleBlock[] }) {
  const sinAvisos = bloqueosHoy.length === 0
  const mensaje = sinAvisos
    ? 'No hay avisos de mantenimiento programados por ahora.'
    : agruparBloqueosPorCancha(bloqueosHoy).join(' ')

  return (
    <div className="bg-brand-secondary/10 md:bg-brand-secondary/10 rounded-2xl border-l-4 border-brand-primary p-4">
      <div className="hidden md:block">
        <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
          Aviso del Sistema
        </p>
        <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
          {mensaje}
        </p>
      </div>
      <div className="md:hidden flex gap-3">
        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${sinAvisos ? 'text-neutral-400 dark:text-neutral-500' : 'text-warning'}`} />
        <div>
          <p className={`font-sans font-semibold text-sm ${sinAvisos ? 'text-neutral-600 dark:text-neutral-300' : 'text-warning'}`}>
            Aviso del Sistema
          </p>
          <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            {mensaje}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PanelPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null)
  const [pistaFabVisible, setPistaFabVisible] = useState(false)

  useEffect(() => {
    const aparecer = setTimeout(() => setPistaFabVisible(true), 900)
    const desaparecer = setTimeout(() => setPistaFabVisible(false), 3600)
    return () => {
      clearTimeout(aparecer)
      clearTimeout(desaparecer)
    }
  }, [])

  const hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const { data: alquileres = [], isLoading, isError } = useTodayBookings()
  const resumen = calculateSummary(alquileres)

  const { data: canchas = [] } = useCourts()
  const { data: reservas = [] } = useBookings()
  const isoHoy = toISODate(new Date())
  const { data: bloqueosHoy = [] } = useScheduleBlocks(isoHoy)

  async function marcarComoPagado(id: number, montoTotal: number) {
    setMenuAbierto(null)
    try {

      const alquiler = alquileres.find((a) => a.id === id)
      const saldo = montoTotal - (alquiler?.paidAmount ?? 0)
      if (saldo > 0) {
        await apiClient.post('/payments', { bookingId: id, amount: saldo, method: 'EFECTIVO' })
      }
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo marcar como pagado. Intenta de nuevo.'))
    }
  }

  async function eliminarAlquiler(id: number) {
    setMenuAbierto(null)
    if (!window.confirm('¿Cancelar este alquiler? Esta acción no se puede deshacer.')) return
    try {

      await apiClient.post(`/bookings/${id}/cancel`)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo cancelar el alquiler. Intenta de nuevo.'))
    }
  }

  const montoEsperado = alquileres.reduce((sum, a) => sum + a.totalAmount, 0)
  const porcentajeCobrado =
    montoEsperado > 0 ? Math.round((resumen.todayRevenue / montoEsperado) * 100) : 0

  const proximaLibre = calculateNextFreeSlot(canchas, alquileres)
  const ocupacionSemanal = calculateWeeklyOccupancy(reservas, canchas)

  function reservarProximaLibre(proxima: NextFreeSlot) {
    navigate(
      `/calendario/nueva-reserva?canchaId=${proxima.courtId}&fecha=${isoHoy}&horaInicio=${proxima.startTime}`,
    )
  }

  return (
    <AppShell
      showSearch={false}
      mobileHero={
        <h1 className="font-sans font-bold text-3xl text-white leading-tight">
          Hoy, {hoy}
        </h1>
      }
    >
      <h1 className="hidden md:block font-sans font-bold text-4xl text-neutral-900 dark:text-neutral-50 animate-fade-in-up">
        Hoy, {hoy}
      </h1>
      <p className="hidden md:block font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1 animate-fade-in-up">
        Bienvenido de nuevo, {user?.username ?? 'administrador'}. {dayPhrase(resumen.totalBookings)}
      </p>

      {isError && (
        <p className="font-sans text-sm text-danger mt-4">
          No se pudieron cargar los datos del panel. Verifica tu conexión o
          que el servidor esté disponible.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 md:gap-5 mt-5 md:mt-8">
        <div
          className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 md:p-5 animate-fade-in-up"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex items-start justify-between">
            <p className="font-sans text-xs md:uppercase md:tracking-wide text-neutral-500 dark:text-neutral-400">
              Alquileres
            </p>
            <span className="hidden md:flex h-9 w-9 rounded-full bg-brand-secondary/20 items-center justify-center">
              <CalendarDays className="h-4 w-4 text-brand-primary" />
            </span>
          </div>
          <p className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-2">
            {isLoading ? '—' : resumen.totalBookings}
          </p>
          <p className="hidden md:block font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1">hoy</p>
        </div>

        <div
          className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 md:p-5 animate-fade-in-up"
          style={{ animationDelay: '90ms' }}
        >
          <div className="flex items-start justify-between">
            <p className="font-sans text-xs md:uppercase md:tracking-wide text-neutral-500 dark:text-neutral-400">
              Ingreso hoy
            </p>
            <span className="hidden md:flex h-9 w-9 rounded-full bg-success/15 items-center justify-center">
              <Wallet className="h-4 w-4 text-success" />
            </span>
          </div>
          <p className="font-sans font-bold text-2xl md:text-3xl text-success mt-2">
            {isLoading ? '—' : `S/${resumen.todayRevenue}`}
          </p>
          <div className="hidden md:flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60">
              <div
                className="h-1.5 rounded-full bg-brand-primary"
                style={{ width: `${porcentajeCobrado}%` }}
              />
            </div>
            <span className="font-sans text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
              {porcentajeCobrado}% cobrado
            </span>
          </div>
        </div>

        <div
          className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 md:p-5 animate-fade-in-up"
          style={{ animationDelay: '140ms' }}
        >
          <div className="flex items-start justify-between">
            <p className="font-sans text-xs md:uppercase md:tracking-wide text-neutral-500 dark:text-neutral-400">
              Pendiente
            </p>
            <span className="hidden md:flex h-9 w-9 rounded-full bg-danger/15 items-center justify-center">
              <ClipboardX className="h-4 w-4 text-danger" />
            </span>
          </div>
          <p className="font-sans font-bold text-2xl md:text-3xl text-danger mt-2">
            {isLoading ? '—' : `S/${resumen.pendingAmount}`}
          </p>
          <p className="hidden md:block font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {resumen.pendingCount} cobros pendientes
          </p>
        </div>
      </div>

      <div className="md:hidden mt-5 space-y-6">
        <SiguienteHorarioCard proximaLibre={proximaLibre ?? null} onReservar={reservarProximaLibre} />

        <div>
          <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-3">
            Alquileres de hoy
          </h2>
          <div className="space-y-3">
            {isLoading && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Cargando alquileres...</p>
            )}
            {!isLoading && alquileres.length === 0 && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
                No hay alquileres registrados hoy.
              </p>
            )}
            {alquileres.map((a) => (
              <div
                key={a.id}
                className={`bg-white dark:bg-neutral-800 rounded-xl border-l-4 p-4 flex items-center justify-between gap-3 shadow-sm ${ESTADO_BORDER[a.paymentStatus]}`}
              >
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                    {a.courtName} • {a.startTime} - {a.endTime}
                  </p>
                  <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                    {a.customerName}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs font-semibold ${ESTADO_BADGE[a.paymentStatus]}`}
                >
                  {ESTADO_LABEL[a.paymentStatus]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <OcupacionCard ocupacion={ocupacionSemanal} />

        <AvisoCard bloqueosHoy={bloqueosHoy} />
      </div>

      <div className="hidden md:grid grid-cols-3 gap-5 mt-6">
        <div className="col-span-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
              Alquileres de hoy
            </h2>
            <Link
              to="/reservas"
              className="font-sans text-sm text-brand-primary hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-neutral-100 dark:border-neutral-700/60">
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Cancha
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Horario
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Cliente
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Estado de Pago
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="font-sans text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
                    Cargando alquileres...
                  </td>
                </tr>
              )}
              {!isLoading && alquileres.length === 0 && (
                <tr>
                  <td colSpan={5} className="font-sans text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
                    No hay alquileres registrados hoy.
                  </td>
                </tr>
              )}
              {alquileres.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-neutral-50 last:border-0"
                >
                  <td className="font-sans text-sm text-neutral-700 dark:text-neutral-200 py-3">
                    {a.courtName}
                  </td>
                  <td className="font-sans text-sm text-neutral-700 dark:text-neutral-200 py-3">
                    {a.startTime} - {a.endTime}
                  </td>
                  <td className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 py-3">
                    {a.customerName}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 font-sans text-xs font-semibold ${ESTADO_BADGE[a.paymentStatus]}`}
                    >
                      {ESTADO_LABEL[a.paymentStatus]}
                    </span>
                  </td>
                  <td className="py-3 relative">
                    <button
                      onClick={() => setMenuAbierto(menuAbierto === a.id ? null : a.id)}
                      className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
                      aria-label="Más acciones"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuAbierto === a.id && (
                      <>
                        <button
                          aria-hidden
                          tabIndex={-1}
                          onClick={() => setMenuAbierto(null)}
                          className="fixed inset-0 z-10 cursor-default"
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg py-1">
                          {a.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => marcarComoPagado(a.id, a.totalAmount)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50"
                            >
                              <CircleCheck className="h-4 w-4 text-success" />
                              Marcar como pagado
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setMenuAbierto(null)
                              navigate('/reservas')
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50"
                          >
                            <Eye className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                            Ver en Reservas
                          </button>
                          <button
                            onClick={() => eliminarAlquiler(a.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-danger hover:bg-danger/5"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-5">
          <SiguienteHorarioCard proximaLibre={proximaLibre ?? null} onReservar={reservarProximaLibre} />
          <OcupacionCard ocupacion={ocupacionSemanal} />
          <AvisoCard bloqueosHoy={bloqueosHoy} />
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
          © 2026 La Canchita de Carlos - Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <a
            href="#"
            className="font-sans text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
          >
            Términos
          </a>
          <a
            href="#"
            className="font-sans text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
          >
            Privacidad
          </a>
          <a
            href="https://api.whatsapp.com/send?phone=982040488"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
          >
            Soporte
          </a>
        </div>
      </div>

      <p className="md:hidden text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-8">
        Oryon Copyright © 2026. All rights reserved.
      </p>

      <div className="md:hidden group fixed bottom-24 right-5 z-30">
        <span
          className={`pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-full bg-neutral-900 dark:bg-neutral-700 text-white font-sans text-sm font-medium px-4 py-2 shadow-lg transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 ${
            pistaFabVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          Nueva reserva
        </span>
        <button
          aria-label="Nueva reserva"
          onClick={() => navigate('/calendario/nueva-reserva')}
          className="h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </AppShell>
  )
}
