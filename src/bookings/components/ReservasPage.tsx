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
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCanchas, useReservas } from '../hooks/useCalendario'
import { apiClient } from '../../shared/api/client'

// Fecha con datos de ejemplo en db.json. El chip "Hoy" filtra por
// esta fecha mientras el dataset del fake API siga anclado a ella.
const FECHA_DEMO = '2026-07-11'

const ESTADO_BADGE: Record<string, string> = {
  PAGADO: 'bg-success text-white',
  PARCIAL: 'bg-warning text-white',
  PENDIENTE: 'bg-danger text-white',
}

const ESTADO_BADGE_SUAVE: Record<string, string> = {
  PAGADO: 'bg-success/15 text-success',
  PARCIAL: 'bg-warning/15 text-warning',
  PENDIENTE: 'bg-danger/15 text-danger',
}

const ESTADO_ICONO: Record<string, typeof CircleCheck> = {
  PAGADO: CircleCheck,
  PARCIAL: Wallet,
  PENDIENTE: Clock,
}

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function formatFecha(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`)
  return d
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}

export default function ReservasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const { data: canchas = [] } = useCanchas()
  const { data: reservas = [], isLoading, isError } = useReservas()

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

  function limpiarFiltros() {
    setFechaInicio('')
    setFechaFin('')
    setCanchaFiltro('')
    setEstadoFiltro('')
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
        setEstadoFiltro('PENDIENTE')
      },
    },
    ...canchas.map((c) => ({
      id: `cancha-${c.id}`,
      label: c.nombre,
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
      if (fechaInicio && r.fecha < fechaInicio) return false
      if (fechaFin && r.fecha > fechaFin) return false
      if (canchaFiltro && String(r.canchaId) !== canchaFiltro) return false
      if (estadoFiltro && r.estadoPago !== estadoFiltro) return false
      if (q) {
        const idTexto = `res-${String(r.id).padStart(3, '0')}`
        const coincide =
          idTexto.includes(q) || r.clienteNombre.toLowerCase().includes(q)
        if (!coincide) return false
      }
      return true
    })
  }, [reservas, fechaInicio, fechaFin, canchaFiltro, estadoFiltro, busqueda])

  function toggleSeleccion(id: number) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSeleccionTodas() {
    setSeleccionadas((prev) =>
      prev.size === reservasFiltradas.length
        ? new Set()
        : new Set(reservasFiltradas.map((r) => r.id)),
    )
  }

  async function confirmarPago() {
    if (seleccionadas.size === 0) return
    setConfirmando(true)
    try {
      // Se reemplaza por PATCH /api/bookings/:id/payment (RF de
      // Payments) cuando el backend esté conectado (Sprint 2).
      await Promise.all(
        [...seleccionadas].map((id) => {
          const r = reservas.find((x) => x.id === id)
          if (!r) return Promise.resolve()
          return apiClient.patch(`/alquileres/${id}`, {
            estadoPago: 'PAGADO',
            montoPagado: r.montoTotal,
          })
        }),
      )
      await queryClient.invalidateQueries({ queryKey: ['alquileres'] })
      setSeleccionadas(new Set())
    } finally {
      setConfirmando(false)
    }
  }

  async function eliminarReserva(id: number) {
    if (!window.confirm('¿Eliminar esta reserva? Esta acción no se puede deshacer.')) {
      return
    }
    await apiClient.delete(`/alquileres/${id}`)
    await queryClient.invalidateQueries({ queryKey: ['alquileres'] })
  }

  return (
    <AppShell searchPlaceholder="Buscar reservas o clientes..." minimalMobile>
      {/* Barra superior mobile */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Volver" className="text-neutral-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-sans font-bold text-lg text-neutral-900">Reservas</h1>
        </div>
        <button
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-label="Más filtros"
          className="text-neutral-500"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden px-4 py-4 pb-28 space-y-4 bg-neutral-50 min-h-screen">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, cliente o teléfono..."
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 bg-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
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
                  : 'bg-neutral-200/60 border-transparent text-neutral-600'
              }`}
            >
              {chipActivo === chip.id && <CircleCheck className="h-3.5 w-3.5" />}
              {chip.label}
            </button>
          ))}
        </div>

        {filtrosAbiertos && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value)
                    setChipActivo('')
                  }}
                  className="w-full h-10 px-2 rounded-lg border border-neutral-200 font-sans text-sm"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value)
                    setChipActivo('')
                  }}
                  className="w-full h-10 px-2 rounded-lg border border-neutral-200 font-sans text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => {
                limpiarFiltros()
                setChipActivo('todos')
              }}
              className="w-full h-10 rounded-lg border border-neutral-200 font-sans text-sm font-medium text-neutral-600"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {isError && (
          <p className="font-sans text-sm text-danger">
            No se pudieron cargar las reservas. Verifica que el fake API
            (json-server) esté corriendo en el puerto 3001.
          </p>
        )}

        {isLoading && (
          <p className="font-sans text-sm text-neutral-400">Cargando reservas...</p>
        )}
        {!isLoading && reservasFiltradas.length === 0 && (
          <p className="font-sans text-sm text-neutral-400">
            No hay reservas que coincidan con la búsqueda.
          </p>
        )}

        {reservasFiltradas.map((r) => {
          const seleccionada = seleccionadas.has(r.id)
          return (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border p-4 ${
                seleccionada ? 'border-brand-primary ring-1 ring-brand-primary/30' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={seleccionada}
                  onChange={() => toggleSeleccion(r.id)}
                  className="h-4 w-4 mt-1 rounded border-neutral-300 accent-brand-primary shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans text-xs text-neutral-400">
                      #RES-{String(r.id).padStart(3, '0')}
                    </p>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase ${ESTADO_BADGE_SUAVE[r.estadoPago]}`}
                    >
                      {r.estadoPago === 'PAGADO' ? '✓ Pagado' : r.estadoPago === 'PARCIAL' ? 'Parcial' : '! Pendiente'}
                    </span>
                  </div>
                  <p className="font-sans font-bold text-base text-neutral-900 mt-0.5 truncate">
                    {r.clienteNombre}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 font-sans text-sm text-neutral-500">
                      <Goal className="h-4 w-4 text-neutral-400" />
                      {r.canchaNombre}
                    </span>
                    <span className="flex items-center gap-1.5 font-sans text-sm text-neutral-500">
                      <CalendarDays className="h-4 w-4 text-neutral-400" />
                      {formatFecha(r.fecha)}, {r.horaInicio}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                    <p className="font-sans text-sm text-neutral-500">
                      Total: <span className="font-bold text-brand-primary">S/{r.montoTotal}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <button aria-label="Editar reserva" className="text-neutral-400">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarReserva(r.id)}
                        aria-label="Eliminar reserva"
                        className="text-neutral-400"
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

        <p className="text-center font-sans text-xs text-neutral-400 pt-4">
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
          <h1 className="font-sans font-bold text-3xl text-neutral-900">
            Gestión de Reservas
          </h1>
          <p className="font-sans text-base text-neutral-500 mt-1">
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
      <div className="hidden md:flex bg-white rounded-2xl border border-neutral-200 p-5 mt-6 flex-wrap items-end gap-4">
        <div>
          <label className="font-sans text-sm text-neutral-600 mb-1 block">
            Desde
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div>
          <label className="font-sans text-sm text-neutral-600 mb-1 block">
            Hasta
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div>
          <label className="font-sans text-sm text-neutral-600 mb-1 block">
            Cancha
          </label>
          <select
            value={canchaFiltro}
            onChange={(e) => setCanchaFiltro(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="">Todas las canchas</option>
            {canchas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-sans text-sm text-neutral-600 mb-1 block">
            Estado
          </label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="">Todos los estados</option>
            <option value="PAGADO">Pagado</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PENDIENTE">Pendiente</option>
          </select>
        </div>
        <button
          onClick={limpiarFiltros}
          className="h-11 px-4 rounded-lg border border-neutral-200 font-sans text-sm font-medium text-neutral-600 flex items-center gap-2 hover:bg-neutral-50"
        >
          <Filter className="h-4 w-4" />
          Limpiar filtros
        </button>
      </div>

      {isError && (
        <p className="hidden md:block font-sans text-sm text-danger mt-4">
          No se pudieron cargar las reservas. Verifica que el fake API
          (json-server) esté corriendo en el puerto 3001.
        </p>
      )}

      {/* Tabla (desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-neutral-200 mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="text-left border-b border-neutral-100">
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  checked={
                    reservasFiltradas.length > 0 &&
                    seleccionadas.size === reservasFiltradas.length
                  }
                  onChange={toggleSeleccionTodas}
                  className="h-4 w-4 rounded border-neutral-300 accent-brand-primary"
                />
              </th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3">ID</th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3">Cliente</th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3">Cancha</th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3">Fecha y Hora</th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3">Monto</th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3">Estado</th>
              <th className="font-sans text-xs text-neutral-500 uppercase font-semibold px-2 py-3 text-right pr-5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="text-center py-8 font-sans text-sm text-neutral-400">
                  Cargando reservas...
                </td>
              </tr>
            )}
            {!isLoading && reservasFiltradas.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 font-sans text-sm text-neutral-400">
                  No hay reservas que coincidan con los filtros.
                </td>
              </tr>
            )}
            {reservasFiltradas.map((r) => {
              const Icon = ESTADO_ICONO[r.estadoPago]
              return (
                <tr key={r.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(r.id)}
                      onChange={() => toggleSeleccion(r.id)}
                      className="h-4 w-4 rounded border-neutral-300 accent-brand-primary"
                    />
                  </td>
                  <td className="px-2 py-4 font-sans text-sm font-semibold text-neutral-700">
                    #RES-{String(r.id).padStart(3, '0')}
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-xs font-bold flex items-center justify-center shrink-0">
                        {iniciales(r.clienteNombre)}
                      </span>
                      <span className="font-sans text-sm font-medium text-neutral-900">
                        {r.clienteNombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 font-sans text-sm text-neutral-700">
                    {r.canchaNombre}
                  </td>
                  <td className="px-2 py-4">
                    <p className="font-sans text-sm text-neutral-700">{formatFecha(r.fecha)}</p>
                    <p className="font-sans text-xs text-neutral-400">
                      {r.horaInicio} - {r.horaFin}
                    </p>
                  </td>
                  <td className="px-2 py-4 font-sans text-sm font-semibold text-neutral-900">
                    S/ {r.montoTotal}
                  </td>
                  <td className="px-2 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase ${ESTADO_BADGE[r.estadoPago]}`}
                    >
                      <Icon className="h-3 w-3" />
                      {r.estadoPago}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center justify-end gap-3 pr-3">
                      <button
                        aria-label="Editar reserva"
                        className="text-neutral-400 hover:text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarReserva(r.id)}
                        aria-label="Eliminar reserva"
                        className="text-neutral-400 hover:text-danger"
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
    </AppShell>
  )
}
