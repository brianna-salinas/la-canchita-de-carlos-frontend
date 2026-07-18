import { useState } from 'react'
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
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCanchas, useReservas, useBloqueos } from '../hooks/useCalendario'
import type { Alquiler } from '../../dashboard/hooks/usePanelData'

const HOURS = ['16:00', '17:00', '18:00', '19:00', '20:00']
const VISTAS = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
] as const

type Vista = (typeof VISTAS)[number]['value']

function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function hourToNum(h: string) {
  return parseInt(h.split(':')[0], 10)
}

type CellState =
  | { tipo: 'bloqueado' }
  | { tipo: 'libre' }
  | { tipo: 'continuacion'; reserva: Alquiler }
  | { tipo: 'reserva'; reserva: Alquiler; duracionHoras: number }

function Cell({ estado }: { estado: CellState }) {
  if (estado.tipo === 'bloqueado') {
    return (
      <div className="h-full min-h-[76px] rounded-lg bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center gap-1 text-neutral-400">
        <Lock className="h-4 w-4" />
        <span className="font-sans text-[11px] font-medium">BLOQUEADO</span>
      </div>
    )
  }

  if (estado.tipo === 'libre') {
    return (
      <div className="group h-full min-h-14 md:min-h-[76px] rounded-lg bg-neutral-50 md:bg-brand-secondary/10 border-0 md:border md:border-brand-secondary/40 p-2 flex items-center justify-center md:justify-between">
        <span className="font-sans text-xs md:text-[11px] font-medium md:font-semibold text-neutral-400 md:text-brand-primary md:uppercase">
          Libre
        </span>
        <button
          className="hidden md:flex self-end h-6 w-6 rounded-full bg-white border border-brand-secondary/50 items-center justify-center text-brand-primary hover:bg-brand-secondary/10"
          aria-label="Nueva reserva en este horario"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (estado.tipo === 'continuacion') {
    const pagado = estado.reserva.estadoPago === 'PAGADO'
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
  const pagado = reserva.estadoPago === 'PAGADO'
  const debe = reserva.montoTotal - reserva.montoPagado

  return (
    <div
      className={`h-full min-h-14 md:min-h-[76px] rounded-lg border p-2 md:p-2.5 flex flex-col justify-between gap-1 ${
        pagado ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/40'
      }`}
    >
      <div className="min-w-0">
        <p className="font-sans font-semibold text-xs text-neutral-900 leading-tight truncate">
          {reserva.clienteNombre}
        </p>
        <p className="hidden md:block font-sans text-[11px] text-neutral-500 truncate">
          {reserva.tipo ?? 'Reserva'} - {duracionHoras}hr
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

export default function CalendarioPage() {
  const navigate = useNavigate()
  const [fecha, setFecha] = useState(() => new Date('2026-07-11T00:00:00'))
  const [vista, setVista] = useState<Vista>('dia')

  // Datos reales del fake API (json-server). El mismo /alquileres que
  // usa el Panel: no hay dos fuentes distintas para las reservas.
  const { data: canchas = [], isLoading: cargandoCanchas } = useCanchas()
  const { data: reservas = [], isLoading: cargandoReservas } = useReservas()
  const { data: bloqueos = [] } = useBloqueos()

  const isoFecha = toISODate(fecha)
  const reservasDelDia = reservas.filter((r) => r.fecha === isoFecha)
  const bloqueosDelDia = bloqueos.filter((b) => b.fecha === isoFecha)

  const displayDate = fecha
    .toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(/^\w/, (c) => c.toUpperCase())

  function cambiarDia(delta: number) {
    setFecha((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + delta)
      return next
    })
  }

  function irAHoy() {
    setFecha(new Date())
  }

  function getCellState(canchaId: number, hora: string): CellState {
    const bloqueo = bloqueosDelDia.find(
      (b) => b.canchaId === canchaId && b.hora === hora,
    )
    if (bloqueo) return { tipo: 'bloqueado' }

    const reservaInicia = reservasDelDia.find(
      (r) => r.canchaId === canchaId && r.horaInicio === hora,
    )
    if (reservaInicia) {
      return {
        tipo: 'reserva',
        reserva: reservaInicia,
        duracionHoras: hourToNum(reservaInicia.horaFin) - hourToNum(reservaInicia.horaInicio),
      }
    }

    const reservaEnCurso = reservasDelDia.find(
      (r) =>
        r.canchaId === canchaId &&
        hourToNum(r.horaInicio) < hourToNum(hora) &&
        hourToNum(r.horaFin) > hourToNum(hora),
    )
    if (reservaEnCurso) return { tipo: 'continuacion', reserva: reservaEnCurso }

    return { tipo: 'libre' }
  }

  // Tarjetas de resumen, calculadas a partir de los datos reales del
  // día seleccionado (no hardcodeadas).
  const totalCeldas = canchas.length * HOURS.length
  let libres = 0
  let bloqueadas = 0
  for (const c of canchas) {
    for (const h of HOURS) {
      const estado = getCellState(c.id, h)
      if (estado.tipo === 'libre') libres++
      if (estado.tipo === 'bloqueado') bloqueadas++
    }
  }
  const disponibilidad =
    totalCeldas - bloqueadas > 0
      ? Math.round((libres / (totalCeldas - bloqueadas)) * 100)
      : 0

  const recaudacionHoy = reservasDelDia.reduce((sum, r) => sum + r.montoPagado, 0)
  const pagosPendientes = reservasDelDia
    .filter((r) => r.estadoPago !== 'PAGADO')
    .reduce((sum, r) => sum + (r.montoTotal - r.montoPagado), 0)

  let ocupacionPico = '—'
  let maxOcupadas = 0
  for (const h of HOURS) {
    const ocupadas = reservasDelDia.filter(
      (r) => hourToNum(r.horaInicio) <= hourToNum(h) && hourToNum(r.horaFin) > hourToNum(h),
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
    <AppShell searchPlaceholder="Buscar reservas o clientes...">
      {/* Encabezado desktop: navegación de fecha + vista + nueva reserva */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => cambiarDia(-1)}
            className="h-9 w-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => cambiarDia(1)}
            className="h-9 w-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h1 className="font-sans font-bold text-xl md:text-2xl text-neutral-900">
          {displayDate}
        </h1>

        <button
          onClick={irAHoy}
          className="h-8 px-4 rounded-full border border-neutral-200 font-sans text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Hoy
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex rounded-full bg-neutral-100 p-1">
            {VISTAS.map((v) => (
              <button
                key={v.value}
                onClick={() => setVista(v.value)}
                className={`px-4 h-8 rounded-full font-sans text-sm font-medium transition-colors ${
                  vista === v.value
                    ? 'bg-brand-primary text-white'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {v.label}
              </button>
            ))}
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
            onClick={() => cambiarDia(-1)}
            aria-label="Día anterior"
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={irAHoy} className="text-center">
            <p className="font-sans font-bold text-white text-base">{displayDateCorta}</p>
            <p className="font-sans text-xs text-neutral-400 mt-0.5">
              {esHoy ? 'Hoy' : 'Ir a hoy'}
            </p>
          </button>
          <button
            onClick={() => cambiarDia(1)}
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
                  : 'text-neutral-500'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {vista !== 'dia' ? (
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-10 text-center">
          <p className="font-sans text-base text-neutral-500">
            La vista de {vista === 'semana' ? 'semana' : 'mes'} todavía no está
            disponible. Por ahora usa la vista de Día.
          </p>
        </div>
      ) : (
        <>
          {/* Grilla del día */}
          <div className="mt-6 bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
            <div style={{ minWidth: `${64 + canchas.length * 140}px` }}>
              <div
                className="grid border-b border-neutral-100"
                style={{
                  gridTemplateColumns: `64px repeat(${canchas.length || 1}, minmax(140px, 1fr))`,
                }}
              >
                <div className="px-2 md:px-4 py-3 font-sans text-xs font-semibold text-neutral-500 uppercase">
                  Hora
                </div>
                {canchas.map((c) => (
                  <div key={c.id} className="px-2 md:px-4 py-3 text-center border-l border-neutral-100">
                    <p className="font-sans font-semibold text-sm text-brand-primary">
                      {c.nombre}
                    </p>
                    <p className="font-sans text-xs text-neutral-400">{c.superficie}</p>
                  </div>
                ))}
              </div>

              {cargando && (
                <p className="font-sans text-sm text-neutral-400 text-center py-8">
                  Cargando calendario...
                </p>
              )}

              {!cargando &&
                HOURS.map((hora) => (
                  <div
                    key={hora}
                    className="grid border-b border-neutral-50 last:border-0"
                    style={{
                      gridTemplateColumns: `64px repeat(${canchas.length || 1}, minmax(140px, 1fr))`,
                    }}
                  >
                    <div className="px-2 md:px-4 py-3 font-sans text-xs md:text-sm text-neutral-600 flex items-center">
                      {hora}
                    </div>
                    {canchas.map((c) => (
                      <div key={c.id} className="p-1.5 border-l border-neutral-50">
                        <Cell estado={getCellState(c.id, hora)} />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>

          {/* Referencias */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 font-sans text-xs text-neutral-500">
            <span className="font-semibold text-neutral-600">REFERENCIAS:</span>
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
              <span className="h-3.5 w-3.5 rounded bg-neutral-200 border border-neutral-300" />
              Mantenimiento / Bloqueado
            </span>
          </div>

          {/* Tarjetas de resumen del día */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-5 w-5 text-brand-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 uppercase tracking-wide">
                  Disponibilidad
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900">
                  {disponibilidad}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-success" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 uppercase tracking-wide">
                  Recaudación Hoy
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900">
                  S/ {recaudacionHoy.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-danger/15 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-danger" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 uppercase tracking-wide">
                  Pagos Pendientes
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900">
                  S/ {pagosPendientes.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-xs text-neutral-500 uppercase tracking-wide">
                  Ocupación Pico
                </p>
                <p className="font-sans font-bold text-xl text-neutral-900">
                  {ocupacionPico}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones inferiores (solo mobile) */}
          <p className="md:hidden text-center font-sans text-xs text-neutral-400 mt-8">
            Desarrollado por Brianna Salinas | 2026
          </p>
          <div className="md:hidden flex gap-3 mt-4">
            <button
              onClick={() => navigate('/reservas')}
              className="flex-1 h-12 rounded-full border border-neutral-200 bg-white font-sans font-semibold text-sm text-neutral-700 flex items-center justify-center gap-2 hover:bg-neutral-50"
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
    </AppShell>
  )
}
