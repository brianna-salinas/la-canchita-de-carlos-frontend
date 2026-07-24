import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  CircleCheck,
  Filter,
  Pencil,
  Trash2,
  Clock,
  Wallet,
  ArrowLeft,
  Search,
  Goal,
  CalendarDays,
  SlidersHorizontal,
  Repeat,
  Landmark,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCourts, useBookings } from '../hooks/useCalendario'
import { apiClient } from '../../shared/api/client'
import { initials, formatDate } from '../../shared/utils/format'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import MetodoPagoIcon from '../../shared/components/MetodoPagoIcon'

const FECHA_DEMO = '2026-07-11'

type MetodoPago = 'EFECTIVO' | 'YAPE' | 'OTRO'

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'YAPE', label: 'Yape / Plin' },
  { value: 'OTRO', label: 'Otro (tarjeta, etc.)' },
]

type PagoPendiente = { tipo: 'individual' } | { tipo: 'serie'; seriesId: string }

const ESTADO_BADGE: Record<string, string> = {
  PAID: 'bg-success text-white',
  PARTIAL: 'bg-warning text-white',
  PENDING: 'bg-danger text-white',
}

const ESTADO_BADGE_SUAVE: Record<string, string> = {
  PAID: 'bg-success/15 text-success',
  PARTIAL: 'bg-warning/15 text-warning',
  PENDING: 'bg-danger/15 text-danger',
}

const ESTADO_ICONO: Record<string, typeof CircleCheck> = {
  PAID: CircleCheck,
  PARTIAL: Wallet,
  PENDING: Clock,
}

const ESTADO_PAGO_LABEL: Record<string, string> = {
  PAID: 'PAGADO',
  PARTIAL: 'PARCIAL',
  PENDING: 'PENDIENTE',
}

export default function ReservasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const { data: canchas = [] } = useCourts()
  const { data: reservas = [], isLoading, isError } = useBookings()

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [canchaFiltro, setCanchaFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  // Prefill desde "Historial" en Clientes: /reservas?cliente=Nombre
  const [busqueda, setBusqueda] = useState(searchParams.get('cliente') ?? '')
  const [chipActivo, setChipActivo] = useState('todos')
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set())
  const [confirmando, setConfirmando] = useState(false)
  // Chip "Recurrentes / Series": muestra solo reservas que forman
  // parte de una serie (tipoReserva MULTIDIA o RECURRENTE).
  const [soloSeries, setSoloSeries] = useState(false)
  const [marcandoSerie, setMarcandoSerie] = useState<string | null>(null)
  // Antes de ejecutar un pago (individual o de serie) se pregunta el método
  // con este modal; pagoPendiente guarda qué acción ejecutar una vez elegido.
  const [pagoPendiente, setPagoPendiente] = useState<PagoPendiente | null>(null)
  const [procesandoPago, setProcesandoPago] = useState(false)

  function limpiarFiltros() {
    setFechaInicio('')
    setFechaFin('')
    setCanchaFiltro('')
    setEstadoFiltro('')
    setSoloSeries(false)
  }

  const chips = [
    { id: 'todos', label: 'Todos', apply: limpiarFiltros },
    {
      id: 'hoy',
      label: 'Hoy',
      apply: () => {
        limpiarFiltros()
        setFechaInicio(FECHA_DEMO)
        setFechaFin(FECHA_DEMO)
      },
    },
    {
      id: 'pendientes',
      label: 'Pendientes',
      apply: () => {
        limpiarFiltros()
        setEstadoFiltro('PENDING')
      },
    },
    {
      id: 'recurrentes',
      label: 'Recurrentes / Series',
      apply: () => {
        limpiarFiltros()
        setSoloSeries(true)
      },
    },
    ...canchas.map((c) => ({
      id: `cancha-${c.id}`,
      label: c.name,
      apply: () => {
        limpiarFiltros()
        setCanchaFiltro(String(c.id))
      },
    })),
  ]

  function aplicarChip(id: string, apply: () => void) {
    setChipActivo(id)
    apply()
  }

  const reservasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return reservas.filter((r) => {
      if (fechaInicio && r.date < fechaInicio) return false
      if (fechaFin && r.date > fechaFin) return false
      if (canchaFiltro && String(r.courtId) !== canchaFiltro) return false
      if (estadoFiltro && r.paymentStatus !== estadoFiltro) return false
      if (soloSeries && !r.seriesId) return false
      if (q) {
        const idTexto = `res-${String(r.id).padStart(3, '0')}`
        const coincide =
          idTexto.includes(q) || r.customerName.toLowerCase().includes(q)
        if (!coincide) return false
      }
      return true
    })
  }, [reservas, fechaInicio, fechaFin, canchaFiltro, estadoFiltro, soloSeries, busqueda])

  function pendientesDeSerie(seriesId: string) {
    return reservas.filter((r) => r.seriesId === seriesId && r.paymentStatus !== 'PAID').length
  }

  function marcarSeriePagada(seriesId: string) {
    if (!window.confirm('¿Marcar todas las fechas pendientes de esta serie como pagadas?')) return
    setPagoPendiente({ tipo: 'serie', seriesId })
  }

  async function ejecutarMarcarSeriePagada(seriesId: string, metodo: MetodoPago) {
    setMarcandoSerie(seriesId)
    try {
      const fechasDeLaSerie = reservas.filter((r) => r.seriesId === seriesId && r.paymentStatus !== 'PAID')
      await Promise.all(
        fechasDeLaSerie
          .filter((r) => r.totalAmount - r.paidAmount > 0)
          .map((r) =>
            apiClient.post('/payments', {
              bookingId: r.id,
              amount: r.totalAmount - r.paidAmount,
              method: metodo,
            }),
          ),
      )
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo marcar la serie como pagada. Intenta de nuevo.'))
    } finally {
      setMarcandoSerie(null)
    }
  }

  function toggleSeleccion(id: number) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const reservasSeleccionables = useMemo(
    () => reservasFiltradas.filter((r) => r.paymentStatus !== 'PAID'),
    [reservasFiltradas],
  )

  function toggleSeleccionTodas() {
    setSeleccionadas((prev) =>
      prev.size === reservasSeleccionables.length && reservasSeleccionables.length > 0
        ? new Set()
        : new Set(reservasSeleccionables.map((r) => r.id)),
    )
  }

  function confirmarPago() {
    if (seleccionadas.size === 0) return
    setPagoPendiente({ tipo: 'individual' })
  }

  async function ejecutarConfirmarPago(metodo: MetodoPago) {
    setConfirmando(true)
    try {
      await Promise.all(
        [...seleccionadas].map((id) => {
          const r = reservas.find((x) => x.id === id)
          if (!r || r.totalAmount - r.paidAmount <= 0) return Promise.resolve()
          return apiClient.post('/payments', {
            bookingId: id,
            amount: r.totalAmount - r.paidAmount,
            method: metodo,
          })
        }),
      )
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setSeleccionadas(new Set())
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo confirmar el pago. Intenta de nuevo.'))
    } finally {
      setConfirmando(false)
    }
  }

  async function confirmarConMetodo(metodo: MetodoPago) {
    if (!pagoPendiente) return
    setProcesandoPago(true)
    try {
      if (pagoPendiente.tipo === 'serie') {
        await ejecutarMarcarSeriePagada(pagoPendiente.seriesId, metodo)
      } else {
        await ejecutarConfirmarPago(metodo)
      }
    } finally {
      setProcesandoPago(false)
      setPagoPendiente(null)
    }
  }

  async function eliminarReserva(id: number) {
    if (!window.confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) {
      return
    }
    try {
      await apiClient.post(`/bookings/${id}/cancelar`)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo cancelar la reserva. Intenta de nuevo.'))
    }
  }

  return (
    <AppShell
      searchPlaceholder="Buscar por ID, cliente o teléfono..."
      searchValue={busqueda}
      onSearchChange={setBusqueda}
      minimalMobile
    >
      {/* Barra superior mobile */}
      <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Volver" className="text-neutral-900 dark:text-neutral-50">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">Reservas</h1>
        </div>
        <button
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-label="Más filtros"
          className="text-neutral-500 dark:text-neutral-400"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden px-4 py-4 pb-28 space-y-4 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, cliente o teléfono..."
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => aplicarChip(chip.id, chip.apply)}
              className={`shrink-0 h-9 px-4 rounded-full font-sans text-sm font-medium flex items-center gap-1.5 border ${
                chipActivo === chip.id
                  ? 'bg-brand-primary border-brand-primary text-white'
                  : 'bg-neutral-200/60 border-transparent text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {chipActivo === chip.id && <CircleCheck className="h-3.5 w-3.5" />}
              {chip.label}
            </button>
          ))}
        </div>

        {filtrosAbiertos && (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value)
                    setChipActivo('')
                  }}
                  className="w-full h-10 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value)
                    setChipActivo('')
                  }}
                  className="w-full h-10 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
            <button
              onClick={() => {
                limpiarFiltros()
                setChipActivo('todos')
              }}
              className="w-full h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm font-medium text-neutral-600 dark:text-neutral-300"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {isError && (
          <p className="font-sans text-sm text-danger">
            No se pudieron cargar las reservas. Verifica tu conexión o que
            el servidor esté disponible.
          </p>
        )}

        {isLoading && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Cargando reservas...</p>
        )}
        {!isLoading && reservasFiltradas.length === 0 && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
            No hay reservas que coincidan con la búsqueda.
          </p>
        )}

        {reservasFiltradas.map((r) => {
          const seleccionada = seleccionadas.has(r.id)
          return (
            <div
              key={r.id}
              className={`bg-white dark:bg-neutral-800 rounded-2xl border p-4 ${
                seleccionada ? 'border-brand-primary ring-1 ring-brand-primary/30' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={seleccionada}
                  disabled={r.paymentStatus === 'PAID'}
                  onChange={() => toggleSeleccion(r.id)}
                  title={r.paymentStatus === 'PAID' ? 'Esta reserva ya está pagada' : undefined}
                  className="h-4 w-4 mt-1 rounded border-neutral-300 dark:border-neutral-600 accent-brand-primary shrink-0 disabled:opacity-40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
                      #RES-{String(r.id).padStart(3, '0')}
                    </p>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase ${ESTADO_BADGE_SUAVE[r.paymentStatus]}`}
                    >
                      {r.paymentStatus === 'PAID' ? '✓ Pagado' : r.paymentStatus === 'PARTIAL' ? 'Parcial' : '! Pendiente'}
                    </span>
                  </div>
                  <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50 mt-0.5 truncate">
                    {r.customerName}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 font-sans text-sm text-neutral-500 dark:text-neutral-400">
                      <Goal className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      {r.courtName}
                    </span>
                    <span className="flex items-center gap-1.5 font-sans text-sm text-neutral-500 dark:text-neutral-400">
                      <CalendarDays className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      {formatDate(r.date)}, {r.startTime}
                    </span>
                  </div>

                  {r.seriesId && (
                    <div className="mt-2">
                      <span
                        title={r.seriesLabel}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-secondary/15 text-brand-primary px-2.5 py-1 font-sans text-[11px] font-semibold"
                      >
                        <Repeat className="h-3 w-3" />
                        {r.seriesIndex ?? '?'}/{r.seriesTotalDates ?? '?'} · {r.bookingType === 'RECURRING' ? 'Recurrente' : 'Serie'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60">
                    <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
                      Total: <span className="font-bold text-brand-primary">S/{r.totalAmount}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      {r.seriesId && pendientesDeSerie(r.seriesId) > 0 && (
                        <button
                          onClick={() => marcarSeriePagada(r.seriesId as string)}
                          disabled={marcandoSerie === r.seriesId}
                          aria-label="Marcar serie como pagada"
                          title={`Marcar ${pendientesDeSerie(r.seriesId)} fecha(s) pendiente(s) de la serie como pagadas`}
                          className="text-neutral-400 dark:text-neutral-500 hover:text-success disabled:opacity-50"
                        >
                          <Landmark className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/calendario/nueva-reserva/${r.id}/editar`)}
                        aria-label="Editar reserva"
                        className="text-neutral-400 dark:text-neutral-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarReserva(r.id)}
                        aria-label="Eliminar reserva"
                        className="text-neutral-400 dark:text-neutral-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 pt-4">
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>

      {/* Botones flotantes (solo mobile) */}
      <div className="md:hidden fixed bottom-24 right-5 flex flex-col gap-3 z-20">
        {seleccionadas.size > 0 && (
          <button
            onClick={confirmarPago}
            disabled={confirmando}
            aria-label="Confirmar pago de seleccionadas"
            className="h-12 w-12 rounded-full bg-success text-white shadow-lg flex items-center justify-center disabled:opacity-60"
          >
            <CircleCheck className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => navigate('/calendario/nueva-reserva')}
          aria-label="Nueva reserva"
          className="h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50">
            Gestión de Reservas
          </h1>
          <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1">
            Administra todas las reservas, pagos y estados de las canchas.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={confirmarPago}
            disabled={seleccionadas.size === 0 || confirmando}
            className="h-11 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90 disabled:opacity-40"
          >
            <CircleCheck className="h-4 w-4" />
            Confirmar Pago{seleccionadas.size > 0 ? ` (${seleccionadas.size})` : ''}
          </button>
          <button
            onClick={() => navigate('/calendario/nueva-reserva')}
            className="h-11 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </button>
        </div>
      </div>

      {/* Filtros (desktop) */}
      <div className="hidden md:flex bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 mt-6 flex-wrap items-end gap-4">
        <div>
          <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
            Desde
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        </div>
        <div>
          <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
            Hasta
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        </div>
        <div>
          <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
            Cancha
          </label>
          <select
            value={canchaFiltro}
            onChange={(e) => setCanchaFiltro(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
          >
            <option value="">Todas las canchas</option>
            {canchas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
            Estado
          </label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
          >
            <option value="">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="PARTIAL">Parcial</option>
            <option value="PENDING">Pendiente</option>
          </select>
        </div>
        <button
          onClick={limpiarFiltros}
          className="h-11 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-2 hover:bg-neutral-50"
        >
          <Filter className="h-4 w-4" />
          Limpiar filtros
        </button>
      </div>

      {isError && (
        <p className="hidden md:block font-sans text-sm text-danger mt-4">
          No se pudieron cargar las reservas. Verifica tu conexión o que el
          servidor esté disponible.
        </p>
      )}

      {/* Tabla (desktop) */}
      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="text-left border-b border-neutral-100 dark:border-neutral-700/60">
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  checked={
                    reservasSeleccionables.length > 0 &&
                    seleccionadas.size === reservasSeleccionables.length
                  }
                  disabled={reservasSeleccionables.length === 0}
                  onChange={toggleSeleccionTodas}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-brand-primary disabled:opacity-40"
                />
              </th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">ID</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Cliente</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Cancha</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Fecha y Hora</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Monto</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Estado</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3 text-right pr-5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="text-center py-8 font-sans text-sm text-neutral-400 dark:text-neutral-500">
                  Cargando reservas...
                </td>
              </tr>
            )}
            {!isLoading && reservasFiltradas.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 font-sans text-sm text-neutral-400 dark:text-neutral-500">
                  No hay reservas que coincidan con los filtros.
                </td>
              </tr>
            )}
            {reservasFiltradas.map((r) => {
              const Icon = ESTADO_ICONO[r.paymentStatus]
              return (
                <tr key={r.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(r.id)}
                      disabled={r.paymentStatus === 'PAID'}
                      onChange={() => toggleSeleccion(r.id)}
                      title={r.paymentStatus === 'PAID' ? 'Esta reserva ya está pagada' : undefined}
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-brand-primary disabled:opacity-40"
                    />
                  </td>
                  <td className="px-2 py-4 font-sans text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    #RES-{String(r.id).padStart(3, '0')}
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-xs font-bold flex items-center justify-center shrink-0">
                        {initials(r.customerName)}
                      </span>
                      <span className="font-sans text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {r.customerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 font-sans text-sm text-neutral-700 dark:text-neutral-200">
                    {r.courtName}
                  </td>
                  <td className="px-2 py-4">
                    <p className="font-sans text-sm text-neutral-700 dark:text-neutral-200">{formatDate(r.date)}</p>
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
                      {r.startTime} - {r.endTime}
                    </p>
                    {r.seriesId && (
                      <span
                        title={r.seriesLabel}
                        className="inline-flex items-center gap-1 mt-1 rounded-full bg-brand-secondary/15 text-brand-primary px-2 py-0.5 font-sans text-[10px] font-semibold"
                      >
                        <Repeat className="h-2.5 w-2.5" />
                        {r.seriesIndex ?? '?'}/{r.seriesTotalDates ?? '?'}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-4 font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    S/ {r.totalAmount}
                  </td>
                  <td className="px-2 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase ${ESTADO_BADGE[r.paymentStatus]}`}
                    >
                      <Icon className="h-3 w-3" />
                      {ESTADO_PAGO_LABEL[r.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center justify-end gap-3 pr-3">
                      {r.seriesId && pendientesDeSerie(r.seriesId) > 0 && (
                        <button
                          onClick={() => marcarSeriePagada(r.seriesId as string)}
                          disabled={marcandoSerie === r.seriesId}
                          aria-label="Marcar serie como pagada"
                          title={`Marcar ${pendientesDeSerie(r.seriesId)} fecha(s) pendiente(s) de la serie como pagadas`}
                          className="text-neutral-400 dark:text-neutral-500 hover:text-success disabled:opacity-50"
                        >
                          <Landmark className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/calendario/nueva-reserva/${r.id}/editar`)}
                        aria-label="Editar reserva"
                        className="text-neutral-400 dark:text-neutral-500 hover:text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarReserva(r.id)}
                        aria-label="Eliminar reserva"
                        className="text-neutral-400 dark:text-neutral-500 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pagoPendiente && (
        <div
          className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/40 md:px-4"
          onClick={() => !procesandoPago && setPagoPendiente(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 w-full max-w-sm rounded-t-2xl md:rounded-2xl p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6"
          >
            <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-1">
              ¿Cómo pagó el cliente?
            </h2>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Selecciona el método de pago para confirmar{pagoPendiente.tipo === 'serie' ? ' esta serie' : ''}.
            </p>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {METODOS_PAGO.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={procesandoPago}
                  onClick={() => confirmarConMetodo(value)}
                  className="h-12 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 disabled:opacity-50 flex items-center gap-3 px-4"
                >
                  <MetodoPagoIcon value={value} className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={procesandoPago}
              onClick={() => setPagoPendiente(null)}
              className="w-full h-10 rounded-lg font-sans text-sm font-medium text-neutral-500 dark:text-neutral-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
