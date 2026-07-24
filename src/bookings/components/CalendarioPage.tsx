import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  ArrowDown,
  CalendarCheck,
  Wallet,
  CreditCard,
  TrendingUp,
  ListFilter,
  Check as CheckIcon,
  Wrench,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCourts, useBookings, useScheduleBlocks, useScheduleBlocksRange, type Court } from '../hooks/useCalendario'
import { toISODate, hourToNum, getWeekDates } from '../../shared/utils/date'
import type { Booking } from '../../dashboard/hooks/usePanelData'
import ProgramarMantenimientoModal from './ProgramarMantenimientoModal'

const VISTAS = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
] as const

type Vista = (typeof VISTAS)[number]['value']

function siguienteHora(hora: string): string {
  const h = hourToNum(hora)
  return `${String((h + 1) % 24).padStart(2, '0')}:00`
}

function FranjaHoraria({ hora }: { hora: string }) {
  return (
    <span className="leading-tight">
      <span className="block">{hora} -</span>
      <span className="block text-neutral-400 dark:text-neutral-500">{siguienteHora(hora)}</span>
    </span>
  )
}

// Genera la lista de horas en punto entre `open` y `close` (ambos "HH:MM").
function generateHours(open: string, close: string): string[] {
  const startH = hourToNum(open)
  const endH = hourToNum(close)
  const hours: string[] = []
  for (let h = startH; h < endH; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`)
  }
  return hours.length > 0 ? hours : ['08:00']
}

function computeHourRange(canchas: Court[]): string[] {
  if (canchas.length === 0) return generateHours('00:00', '24:00')
  let minOpen = '23:59'
  let maxClose = '00:00'
  for (const c of canchas) {
    const open = c.openTime ?? '00:00'
    const close = c.closeTime ?? '24:00'
    if (open < minOpen) minOpen = open
    if (close > maxClose) maxClose = close
  }
  return generateHours(minOpen, maxClose)
}

function getMonthGrid(date: Date): Date[][] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startDay = firstOfMonth.getDay()
  const diffToMonday = startDay === 0 ? -6 : 1 - startDay
  const gridStart = new Date(year, month, 1 + diffToMonday)

  const weeks: Date[][] = []
  const current = new Date(gridStart)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

type CellState =
  | { tipo: 'bloqueado' }
  | { tipo: 'fueraDeHorario' }
  | { tipo: 'pasado' }
  | { tipo: 'libre' }
  | { tipo: 'continuacion'; reserva: Booking }
  | { tipo: 'reserva'; reserva: Booking; duracionHoras: number }

function estaFueraDeHorarioDeLaCancha(cancha: Court, hora: string): boolean {
  const open = cancha.openTime
  const close = cancha.closeTime
  if (!open || !close) return false // sin horario configurado = abierta 24h
  return hora < open || hora >= close
}

function Cell({
  estado,
  onReservar,
  onMantenimiento,
}: {
  estado: CellState
  onReservar?: () => void
  onMantenimiento?: () => void
}) {
  if (estado.tipo === 'bloqueado') {
    return (
      <div className="h-full min-h-[76px] rounded-lg bg-neutral-100 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center gap-1 text-neutral-400 dark:text-neutral-500">
        <Lock className="h-4 w-4" />
        <span className="font-sans text-[11px] font-medium">BLOQUEADO</span>
      </div>
    )
  }

  if (estado.tipo === 'fueraDeHorario') {
    return (
      <div className="h-full min-h-14 md:min-h-[76px] rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-dashed border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-300 dark:text-neutral-600">
        <span className="font-sans text-[11px] font-medium">Fuera de horario</span>
      </div>
    )
  }

  if (estado.tipo === 'pasado') {
    return (
      <div className="h-full min-h-14 md:min-h-[76px] rounded-lg bg-neutral-100 dark:bg-neutral-700/40 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
        <span className="font-sans text-[11px] font-medium">Ya pasó</span>
      </div>
    )
  }

  if (estado.tipo === 'libre') {
    return (
      <div className="group relative w-full h-full min-h-14 md:min-h-[76px] rounded-lg bg-neutral-50 dark:bg-neutral-900 md:bg-brand-secondary/10 border-0 md:border md:border-brand-secondary/40 flex items-center justify-center md:justify-between text-left overflow-hidden">
        <button
          type="button"
          onClick={onReservar}
          className="flex-1 h-full p-2 flex items-center justify-center md:justify-start text-left"
        >
          <span className="font-sans text-xs md:text-[11px] font-medium md:font-semibold text-neutral-400 dark:text-neutral-500 md:text-brand-primary md:uppercase">
            Libre
          </span>
        </button>
        <div className="hidden md:flex items-center gap-1 pr-2">
          {onMantenimiento && (
            <button
              type="button"
              onClick={onMantenimiento}
              className="h-6 w-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-warning hover:border-warning/50"
              aria-label="Programar mantenimiento en este horario"
              title="Programar mantenimiento"
            >
              <Wrench className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onReservar}
            className="h-6 w-6 rounded-full bg-white dark:bg-neutral-800 border border-brand-secondary/50 flex items-center justify-center text-brand-primary group-hover:bg-brand-secondary/10"
            aria-label="Nueva reserva en este horario"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (estado.tipo === 'continuacion') {
    const pagado = estado.reserva.paymentStatus === 'PAID'
    return (
      <div
        className={`h-full min-h-14 md:min-h-[76px] rounded-lg border flex items-center justify-center ${
          pagado ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/30'
        }`}
      >
        <ArrowDown className={`h-4 w-4 ${pagado ? 'text-success' : 'text-danger'}`} />
      </div>
    )
  }

  const { reserva, duracionHoras } = estado
  const pagado = reserva.paymentStatus === 'PAID'
  const debe = reserva.totalAmount - reserva.paidAmount

  return (
    <div
      className={`h-full min-h-14 md:min-h-[76px] rounded-lg border p-2 md:p-2.5 flex flex-col justify-between gap-1 ${
        pagado ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/40'
      }`}
    >
      <div className="min-w-0">
        <p className="font-sans font-semibold text-xs text-neutral-900 dark:text-neutral-50 leading-tight truncate">
          {reserva.customerName}
        </p>
        <p className="hidden md:block font-sans text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
          {reserva.type ?? 'Reserva'} - {duracionHoras}hr
        </p>
      </div>
      <span
        className={`self-start rounded px-2 py-0.5 font-sans text-[10px] font-bold text-white ${
          pagado ? 'bg-success' : 'bg-danger'
        }`}
      >
        {pagado ? 'Pagado' : `Debe S/ ${debe}`}
      </span>
    </div>
  )
}

function diasEntre(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcA - utcB) / 86400000)
}

function esHoraPasada(fechaCelda: Date, hora: string, ahora: Date = new Date()): boolean {
  const diff = diasEntre(fechaCelda, ahora)
  if (diff < 0) return true
  if (diff > 0) return false
  return hourToNum(hora) <= ahora.getHours()
}

function etiquetaRelativa(fecha: Date): string {
  const diff = diasEntre(fecha, new Date())
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff === 2) return 'Pasado mañana'
  if (diff === -2) return 'Antier'
  return diff > 0 ? `En ${diff} días` : `Hace ${Math.abs(diff)} días`
}

export default function CalendarioPage() {
  const navigate = useNavigate()
  const [fecha, setFecha] = useState(() => new Date())
  const [vista, setVista] = useState<Vista>('dia')

  const { data: canchas = [], isLoading: cargandoCanchas } = useCourts()
  const { data: reservas = [], isLoading: cargandoReservas } = useBookings()

  const [canchasOcultas, setCanchasOcultas] = useState<Set<number>>(() => {
    try {
      const guardado = localStorage.getItem('calendario:canchasOcultas')
      return guardado ? new Set(JSON.parse(guardado) as number[]) : new Set()
    } catch {
      return new Set()
    }
  })
  const [filtroAbierto, setFiltroAbierto] = useState(false)
  const filtroRef = useRef<HTMLDivElement>(null)

  const [mantenimientoContexto, setMantenimientoContexto] = useState<{ courtId: number; time: string } | null>(null)

  useEffect(() => {
    localStorage.setItem('calendario:canchasOcultas', JSON.stringify([...canchasOcultas]))
  }, [canchasOcultas])

  useEffect(() => {
    function alHacerClickFuera(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAbierto(false)
      }
    }
    document.addEventListener('mousedown', alHacerClickFuera)
    return () => document.removeEventListener('mousedown', alHacerClickFuera)
  }, [])

  function alternarCancha(id: number) {
    setCanchasOcultas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canchasVisibles = useMemo(
    () => canchas.filter((c) => !canchasOcultas.has(c.id)),
    [canchas, canchasOcultas],
  )

  const HOURS = useMemo(() => computeHourRange(canchasVisibles), [canchasVisibles])

  const idsVisibles = useMemo(() => new Set(canchasVisibles.map((c) => c.id)), [canchasVisibles])

  const isoFecha = toISODate(fecha)
  const { data: bloqueos = [] } = useScheduleBlocks(isoFecha)
  const reservasDelDia = reservas.filter((r) => r.date === isoFecha && idsVisibles.has(r.courtId))
  const bloqueosDelDia = bloqueos.filter((b) => b.date === isoFecha && idsVisibles.has(b.courtId))

  const fechasSemana = useMemo(
    () => (vista === 'semana' ? getWeekDates(fecha).map(toISODate) : []),
    [vista, fecha],
  )
  const { data: bloqueosSemana = [] } = useScheduleBlocksRange(fechasSemana)

  const displayDate = useMemo(() => {
    if (vista === 'mes') {
      return fecha
        .toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
        .replace(/^\w/, (c) => c.toUpperCase())
    }
    if (vista === 'semana') {
      const [inicio, fin] = [getWeekDates(fecha)[0], getWeekDates(fecha)[6]]
      const fmt = (d: Date) =>
        d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace(/^\w/, (c) => c.toUpperCase())
      return `Semana del ${fmt(inicio)} al ${fmt(fin)}`
    }
    return fecha
      .toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase())
  }, [fecha, vista])

  function cambiarPeriodo(delta: number) {
    setFecha((prev) => {
      const next = new Date(prev)
      if (vista === 'semana') next.setDate(next.getDate() + delta * 7)
      else if (vista === 'mes') next.setMonth(next.getMonth() + delta)
      else next.setDate(next.getDate() + delta)
      return next
    })
  }

  function irADia(dia: Date) {
    setFecha(dia)
    setVista('dia')
  }

  function irAHoy() {
    setFecha(new Date())
  }

  function getCellState(cancha: Court, hora: string): CellState {
    const bloqueo = bloqueosDelDia.find(
      (b) => b.courtId === cancha.id && b.time === hora,
    )
    if (bloqueo) return { tipo: 'bloqueado' }

    const reservaInicia = reservasDelDia.find(
      (r) => r.courtId === cancha.id && r.startTime === hora,
    )
    if (reservaInicia) {
      return {
        tipo: 'reserva',
        reserva: reservaInicia,
        duracionHoras: hourToNum(reservaInicia.endTime) - hourToNum(reservaInicia.startTime),
      }
    }

    const reservaEnCurso = reservasDelDia.find(
      (r) =>
        r.courtId === cancha.id &&
        hourToNum(r.startTime) < hourToNum(hora) &&
        hourToNum(r.endTime) > hourToNum(hora),
    )
    if (reservaEnCurso) return { tipo: 'continuacion', reserva: reservaEnCurso }

    if (estaFueraDeHorarioDeLaCancha(cancha, hora)) return { tipo: 'fueraDeHorario' }

    if (esHoraPasada(fecha, hora)) return { tipo: 'pasado' }

    return { tipo: 'libre' }
  }

  const totalCeldas = canchasVisibles.length * HOURS.length
  let libres = 0
  let bloqueadas = 0
  for (const c of canchasVisibles) {
    for (const h of HOURS) {
      const estado = getCellState(c, h)
      if (estado.tipo === 'libre') libres++
      if (estado.tipo === 'bloqueado') bloqueadas++
    }
  }
  const disponibilidad =
    totalCeldas - bloqueadas > 0
      ? Math.round((libres / (totalCeldas - bloqueadas)) * 100)
      : 0

  const recaudacionHoy = reservasDelDia.reduce((sum, r) => sum + r.paidAmount, 0)
  const pagosPendientes = reservasDelDia
    .filter((r) => r.paymentStatus !== 'PAID')
    .reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0)

  let ocupacionPico = '—'
  let maxOcupadas = 0
  for (const h of HOURS) {
    const ocupadas = reservasDelDia.filter(
      (r) => hourToNum(r.startTime) <= hourToNum(h) && hourToNum(r.endTime) > hourToNum(h),
    ).length
    if (ocupadas > maxOcupadas) {
      maxOcupadas = ocupadas
      ocupacionPico = h
    }
  }

  const cargando = cargandoCanchas || cargandoReservas
  const esHoy = isoFecha === toISODate(new Date())
  const displayDateCorta = fecha
    .toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <AppShell showSearch={false}>
      {/* Encabezado desktop: navegación de fecha + vista + nueva reserva */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => cambiarPeriodo(-1)}
            className="h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => cambiarPeriodo(1)}
            className="h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h1 className="font-sans font-bold text-xl md:text-2xl text-neutral-900 dark:text-neutral-50">
          {displayDate}
        </h1>

        <button
          onClick={irAHoy}
          className="h-8 px-4 rounded-full border border-neutral-200 dark:border-neutral-700 font-sans text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
        >
          {esHoy ? 'Hoy' : `Ir a hoy (${etiquetaRelativa(fecha)})`}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex rounded-full bg-neutral-100 dark:bg-neutral-700/60 p-1">
            {VISTAS.map((v) => (
              <button
                key={v.value}
                onClick={() => setVista(v.value)}
                className={`px-4 h-8 rounded-full font-sans text-sm font-medium transition-colors ${
                  vista === v.value
                    ? 'bg-brand-primary text-white'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Filtro "mis calendarios": elegir qué canchas se muestran,
              como el selector de calendarios visibles de Google Calendar. */}
          <div className="relative" ref={filtroRef}>
            <button
              onClick={() => setFiltroAbierto((v) => !v)}
              className="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/40"
            >
              <ListFilter className="h-4 w-4" />
              Canchas
              {canchasOcultas.size > 0 && (
                <span className="h-5 min-w-[20px] px-1 rounded-full bg-brand-primary text-white text-[11px] font-bold flex items-center justify-center">
                  {canchas.length - canchasOcultas.size}
                </span>
              )}
            </button>
            {filtroAbierto && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-30 p-2">
                <p className="font-sans text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500 px-2 py-1">
                  Mostrar canchas
                </p>
                {canchas.map((c) => {
                  const visible = !canchasOcultas.has(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => alternarCancha(c.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/40 text-left"
                    >
                      <span
                        className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 ${
                          visible ? 'bg-brand-primary border-brand-primary' : 'border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {visible && <CheckIcon className="h-3 w-3 text-white" />}
                      </span>
                      <span className="font-sans text-sm text-neutral-700 dark:text-neutral-200 truncate">
                        {c.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/calendario/nueva-reserva')}
            className="h-10 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </button>
        </div>
      </div>

      {/* Encabezado mobile: tarjeta oscura de fecha + toggle de vista full-width */}
      <div className="md:hidden space-y-4">
        <div className="bg-[#0F172A] rounded-2xl px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => cambiarPeriodo(-1)}
            aria-label="Día anterior"
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={irAHoy} className="text-center">
            <p className="font-sans font-bold text-white text-base">{displayDateCorta}</p>
            <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              {esHoy ? 'Hoy' : `${etiquetaRelativa(fecha)} · toca para ir a hoy`}
            </p>
          </button>
          <button
            onClick={() => cambiarPeriodo(1)}
            aria-label="Día siguiente"
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex rounded-full bg-neutral-200/60 p-1">
          {VISTAS.map((v) => (
            <button
              key={v.value}
              onClick={() => setVista(v.value)}
              className={`flex-1 h-9 rounded-full font-sans text-sm font-medium transition-colors ${
                vista === v.value
                  ? 'bg-brand-primary text-white'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {vista === 'semana' ? (
        <>
          {/* Resumen de días: total de reservas + recaudación, con acceso
              directo a la vista de Día de cada uno. */}
          <div className="mt-6 grid grid-cols-7 gap-2">
            {getWeekDates(fecha).map((dia) => {
              const iso = toISODate(dia)
              const reservasDia = reservas.filter(
                (r) => r.date === iso && r.status !== 'CANCELLED' && idsVisibles.has(r.courtId),
              )
              const recaudacionDia = reservasDia.reduce((sum, r) => sum + r.paidAmount, 0)
              const esHoyCol = iso === toISODate(new Date())
              const esSeleccionado = iso === isoFecha
              return (
                <button
                  key={iso}
                  onClick={() => irADia(dia)}
                  className={`rounded-xl border p-2 md:p-3 text-left transition-colors ${
                    esSeleccionado
                      ? 'border-brand-primary bg-brand-primary/10'
                      : esHoyCol
                        ? 'border-brand-secondary bg-brand-secondary/10'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/40'
                  }`}
                >
                  <p className="font-sans text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
                    {DIAS_CORTOS[dia.getDay() === 0 ? 6 : dia.getDay() - 1]}
                  </p>
                  <p className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
                    {dia.getDate()}
                  </p>
                  <p className="font-sans text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {reservasDia.length} {reservasDia.length === 1 ? 'reserva' : 'reservas'}
                  </p>
                  <p className="font-sans text-[11px] font-semibold text-success mt-0.5">
                    S/ {recaudacionDia.toFixed(2)}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Grilla hora x día: mismo criterio de color que la vista de Día
              (libre/pagado/debe), agregando todas las canchas por celda, más
              un estado "pasado" para fechas ya transcurridas sin reserva. */}
          <div className="mt-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
            <div style={{ minWidth: '760px' }}>
              <div
                className="grid border-b border-neutral-100 dark:border-neutral-700/60"
                style={{ gridTemplateColumns: '84px repeat(7, minmax(96px, 1fr))' }}
              >
                <div className="px-2 py-3 font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                  Hora
                </div>
                {getWeekDates(fecha).map((dia) => {
                  const iso = toISODate(dia)
                  const esHoyCol = iso === toISODate(new Date())
                  return (
                    <div
                      key={iso}
                      className={`px-2 py-3 text-center border-l border-neutral-100 dark:border-neutral-700/60 ${
                        esHoyCol ? 'bg-brand-secondary/10' : ''
                      }`}
                    >
                      <p className="font-sans text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
                        {DIAS_CORTOS[dia.getDay() === 0 ? 6 : dia.getDay() - 1]}
                      </p>
                      <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
                        {dia.getDate()}
                      </p>
                    </div>
                  )
                })}
              </div>

              {HOURS.map((hora) => (
                <div
                  key={hora}
                  className="grid border-b border-neutral-50 last:border-0"
                  style={{ gridTemplateColumns: '84px repeat(7, minmax(96px, 1fr))' }}
                >
                  <div className="px-2 py-2.5 font-sans text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center">
                    <FranjaHoraria hora={hora} />
                  </div>
                  {getWeekDates(fecha).map((dia) => {
                    const iso = toISODate(dia)
                    // Antes la vista Semana solo revisaba reservas: un
                    // bloqueo por mantenimiento no se veía para nada acá
                    // (solo en la vista Día).
                    const bloqueoActivo = bloqueosSemana.some(
                      (b) => b.date === iso && idsVisibles.has(b.courtId) && b.time === hora,
                    )
                    const reservaActiva = reservas.find(
                      (r) =>
                        r.date === iso &&
                        r.status !== 'CANCELLED' &&
                        idsVisibles.has(r.courtId) &&
                        hourToNum(r.startTime) <= hourToNum(hora) &&
                        hourToNum(r.endTime) > hourToNum(hora),
                    )
                    const esPasado = esHoraPasada(dia, hora)
                    const pagado = reservaActiva?.paymentStatus === 'PAID'

                    return (
                      <button
                        key={iso}
                        onClick={() => irADia(dia)}
                        title={
                          bloqueoActivo
                            ? 'Bloqueado por mantenimiento'
                            : reservaActiva
                              ? `${reservaActiva.customerName} - ${reservaActiva.courtName} (${reservaActiva.startTime}-${reservaActiva.endTime})`
                              : undefined
                        }
                        className={`p-1 border-l border-neutral-50 dark:border-neutral-700/40 text-left`}
                      >
                        <div
                          className={`h-8 rounded flex items-center px-1.5 ${
                            bloqueoActivo
                              ? 'bg-neutral-200 dark:bg-neutral-700/70'
                              : reservaActiva
                                ? pagado
                                  ? 'bg-success/15 border border-success/30'
                                  : 'bg-danger/15 border border-danger/30'
                                : esPasado
                                  ? 'bg-neutral-100 dark:bg-neutral-700/40'
                                  : 'bg-brand-secondary/10 border border-brand-secondary/30'
                          }`}
                        >
                          {bloqueoActivo ? (
                            <span className="font-sans text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 truncate">
                              Mantenimiento
                            </span>
                          ) : (
                            reservaActiva && (
                              <span className="font-sans text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 truncate">
                                {reservaActiva.customerName} - {reservaActiva.courtName}
                              </span>
                            )
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 font-sans text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">REFERENCIAS:</span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-brand-secondary/20 border border-brand-secondary" />
              Libre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-success/20 border border-success" />
              Ocupado (Pagado)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-danger/20 border border-danger" />
              Ocupado (Debe)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-neutral-200 dark:bg-neutral-700" />
              Ya pasó (sin reserva)
            </span>
          </div>
        </>
      ) : vista === 'mes' ? (
        <div className="mt-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 md:p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DIAS_CORTOS.map((d) => (
              <p key={d} className="font-sans text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500 text-center">
                {d}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getMonthGrid(fecha).flatMap((semana) =>
              semana.map((dia) => {
                const iso = toISODate(dia)
                const reservasDia = reservas.filter(
                  (r) => r.date === iso && r.status !== 'CANCELLED' && idsVisibles.has(r.courtId),
                )
                const esMesActual = dia.getMonth() === fecha.getMonth()
                const esHoyCol = iso === toISODate(new Date())
                const esSeleccionado = iso === isoFecha
                const MAX_VISIBLE = 2
                const visibles = reservasDia.slice(0, MAX_VISIBLE)
                const restantes = reservasDia.length - visibles.length
                return (
                  <button
                    key={iso}
                    onClick={() => irADia(dia)}
                    className={`min-h-[72px] md:min-h-[92px] rounded-lg border p-1.5 md:p-2 flex flex-col items-start text-left transition-colors ${
                      !esMesActual ? 'opacity-40' : ''
                    } ${
                      esSeleccionado
                        ? 'border-brand-primary bg-brand-primary/10'
                        : esHoyCol
                          ? 'border-brand-secondary bg-brand-secondary/10'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/40'
                    }`}
                  >
                    <span className="font-sans text-xs md:text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {dia.getDate()}
                    </span>
                    <div className="mt-1 w-full space-y-0.5">
                      {visibles.map((r) => (
                        <p
                          key={r.id}
                          title={`${r.customerName} - ${r.courtName} (${r.startTime}-${r.endTime})`}
                          className={`w-full truncate rounded px-1 py-0.5 font-sans text-[9px] md:text-[10px] font-medium ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-success/15 text-success'
                              : 'bg-danger/15 text-danger'
                          }`}
                        >
                          {r.customerName} - {r.courtName} ({r.startTime}-{r.endTime})
                        </p>
                      ))}
                      {restantes > 0 && (
                        <p className="font-sans text-[9px] md:text-[10px] text-neutral-400 dark:text-neutral-500 px-1">
                          +{restantes} más
                        </p>
                      )}
                    </div>
                  </button>
                )
              }),
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Grilla del día */}
          {canchasVisibles.length === 0 && !cargando ? (
            <p className="mt-6 font-sans text-sm text-neutral-400 dark:text-neutral-500 text-center py-8 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              Ocultaste todas las canchas. Ábrelas de nuevo con el filtro "Canchas" de arriba.
            </p>
          ) : (
          <div className="mt-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
            <div style={{ minWidth: `${84 + canchasVisibles.length * 140}px` }}>
              <div
                className="grid border-b border-neutral-100 dark:border-neutral-700/60"
                style={{
                  gridTemplateColumns: `84px repeat(${canchasVisibles.length || 1}, minmax(140px, 1fr))`,
                }}
              >
                <div className="px-2 md:px-4 py-3 font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                  Hora
                </div>
                {canchasVisibles.map((c) => (
                  <div key={c.id} className="px-2 md:px-4 py-3 text-center border-l border-neutral-100 dark:border-neutral-700/60">
                    <p className="font-sans font-semibold text-sm text-brand-primary">
                      {c.name}
                    </p>
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">{c.surface}</p>
                  </div>
                ))}
              </div>

              {cargando && (
                <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
                  Cargando calendario...
                </p>
              )}

              {!cargando &&
                HOURS.map((hora) => (
                  <div
                    key={hora}
                    className="grid border-b border-neutral-50 last:border-0"
                    style={{
                      gridTemplateColumns: `84px repeat(${canchasVisibles.length || 1}, minmax(140px, 1fr))`,
                    }}
                  >
                    <div className="px-2 md:px-4 py-3 font-sans text-[11px] md:text-xs text-neutral-600 dark:text-neutral-300 flex items-center">
                      <FranjaHoraria hora={hora} />
                    </div>
                    {canchasVisibles.map((c) => (
                      <div key={c.id} className="p-1.5 border-l border-neutral-50">
                        <Cell
                          estado={getCellState(c, hora)}
                          onReservar={() =>
                            navigate(
                              `/calendario/nueva-reserva?canchaId=${c.id}&fecha=${isoFecha}&horaInicio=${hora}`,
                            )
                          }
                          onMantenimiento={() => setMantenimientoContexto({ courtId: c.id, time: hora })}
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
          )}

          {/* Referencias */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 font-sans text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">REFERENCIAS:</span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-brand-secondary/20 border border-brand-secondary" />
              Libre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-success/20 border border-success" />
              Ocupado (Pagado)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-danger/20 border border-danger" />
              Ocupado (Debe)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600" />
              Mantenimiento / Bloqueado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-neutral-100 dark:bg-neutral-700/40 border border-neutral-300 dark:border-neutral-600" />
              Ya pasó
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-neutral-50 dark:bg-neutral-900/60 border border-dashed border-neutral-200 dark:border-neutral-700" />
              Fuera de horario de esa cancha
            </span>
          </div>

          {/* Tarjetas de resumen del día */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-5 w-5 text-brand-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Disponibilidad
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900 dark:text-neutral-50">
                  {disponibilidad}%
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-success" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Recaudación Hoy
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900 dark:text-neutral-50">
                  S/ {recaudacionHoy.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-danger/15 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-danger" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Pagos Pendientes
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900 dark:text-neutral-50">
                  S/ {pagosPendientes.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Ocupación Pico
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900 dark:text-neutral-50">
                  {ocupacionPico}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones inferiores (solo mobile) */}
          <p className="md:hidden text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-8">
            Desarrollado por Brianna Salinas | 2026
          </p>
          <div className="md:hidden flex gap-3 mt-4">
            <button
              onClick={() => navigate('/reservas')}
              className="flex-1 h-12 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans font-semibold text-sm text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-2 hover:bg-neutral-50"
            >
              <CalendarCheck className="h-4 w-4" />
              Ver todas
            </button>
            <button
              onClick={() => navigate('/calendario/nueva-reserva')}
              className="flex-1 h-12 rounded-full bg-brand-primary text-white font-sans font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nueva reserva
            </button>
          </div>
        </>
      )}

      {mantenimientoContexto && (
        <ProgramarMantenimientoModal
          canchas={canchasVisibles}
          canchaIdInicial={mantenimientoContexto.courtId}
          fechaInicial={isoFecha}
          horaInicial={mantenimientoContexto.time}
          onClose={() => setMantenimientoContexto(null)}
        />
      )}
    </AppShell>
  )
}
