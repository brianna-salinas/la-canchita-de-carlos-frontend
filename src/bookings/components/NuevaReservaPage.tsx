import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ChevronRight,
  ArrowLeft,
  Check,
  Search,
  UserPlus,
  Users,
  Clock,
  Wallet,
  CircleCheck,
  UploadCloud,
  Save,
  Goal,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCanchas, useReservas } from '../hooks/useCalendario'
import { useClientes, type Cliente } from '../../customers/hooks/useClientes'
import { apiClient } from '../../shared/api/client'

type Duracion = 1 | 1.5 | 2
type EstadoPago = 'PENDIENTE' | 'PARCIAL' | 'PAGADO'

const DURACIONES: { value: Duracion; label: string }[] = [
  { value: 1, label: '1 Hora' },
  { value: 1.5, label: '1.5 Horas' },
  { value: 2, label: '2 Horas' },
]

const ESTADOS_PAGO: { value: EstadoPago; label: string; icon: typeof Clock }[] = [
  { value: 'PENDIENTE', label: 'Pendiente', icon: Clock },
  { value: 'PARCIAL', label: 'Parcial', icon: Wallet },
  { value: 'PAGADO', label: 'Pagado', icon: CircleCheck },
]

const ESTADO_PAGO_COLOR: Record<EstadoPago, string> = {
  PENDIENTE: 'border-danger text-danger bg-danger/5',
  PARCIAL: 'border-warning text-warning bg-warning/5',
  PAGADO: 'border-success text-success bg-success/5',
}

function sumarHoras(hora: string, horas: number) {
  if (!hora) return ''
  const [h, m] = hora.split(':').map(Number)
  const totalMin = h * 60 + m + horas * 60
  const hh = Math.floor(totalMin / 60) % 24
  const mm = totalMin % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function NuevaReservaPage() {
  const navigate = useNavigate()
  const { data: canchas = [], isLoading: cargandoCanchas } = useCanchas()
  const { data: reservas = [] } = useReservas()
  const { data: clientes = [] } = useClientes()

  const [canchaId, setCanchaId] = useState<number | null>(null)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [duracion, setDuracion] = useState<Duracion>(1)

  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

  const canchaSeleccionada = canchas.find((c) => c.id === canchaId) ?? null

  const [montoTotal, setMontoTotal] = useState('')
  const [montoPagado, setMontoPagado] = useState('')
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('PENDIENTE')

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function seleccionarCancha(id: number) {
    setCanchaId(id)
    const cancha = canchas.find((c) => c.id === id)
    if (cancha) {
      setMontoTotal(String(cancha.precioHora * duracion))
    }
  }

  function cambiarDuracion(d: Duracion) {
    setDuracion(d)
    if (canchaSeleccionada) {
      setMontoTotal(String(canchaSeleccionada.precioHora * d))
    }
  }

  function cambiarEstadoPago(estado: EstadoPago) {
    setEstadoPago(estado)
    const total = Number(montoTotal) || 0
    if (estado === 'PAGADO') setMontoPagado(String(total))
    if (estado === 'PENDIENTE') setMontoPagado('0')
  }

  // Disponibilidad de cada cancha para la fecha/hora elegidas: si aún
  // no se eligió fecha, se muestran todas como disponibles (no hay
  // con qué comparar todavía).
  function disponibilidadDe(id: number) {
    if (!fecha) return true
    const horaFin = sumarHoras(horaInicio, duracion)
    return !reservas.some(
      (r) =>
        r.canchaId === id &&
        r.fecha === fecha &&
        horaInicio < r.horaFin &&
        horaFin > r.horaInicio,
    )
  }

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase()
    if (!q) return []
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.dni ?? '').includes(q) ||
          c.telefono.includes(q),
      )
      .slice(0, 5)
  }, [busquedaCliente, clientes])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!canchaSeleccionada) {
      setError('Selecciona una cancha.')
      return
    }
    if (!fecha) {
      setError('Elige la fecha de la reserva.')
      return
    }
    if (!clienteSeleccionado) {
      setError('Busca y selecciona un cliente.')
      return
    }

    setGuardando(true)
    try {
      // Se reemplaza por POST /api/bookings (US17, RF/US del
      // Subdominio Bookings) cuando el backend esté conectado
      // (Sprint 2). Por ahora escribe directo en el fake API.
      await apiClient.post('/alquileres', {
        canchaId: canchaSeleccionada.id,
        canchaNombre: canchaSeleccionada.nombre,
        clienteId: clienteSeleccionado.id,
        clienteNombre: clienteSeleccionado.nombre,
        tipo: canchaSeleccionada.deporte,
        fecha,
        horaInicio,
        horaFin: sumarHoras(horaInicio, duracion),
        estado: 'RESERVADO',
        estadoPago,
        montoTotal: Number(montoTotal) || 0,
        montoPagado: Number(montoPagado) || 0,
      })
      navigate('/calendario')
    } catch {
      setError('No se pudo guardar el alquiler. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <AppShell searchPlaceholder="Buscar reservas o clientes..." minimalMobile>
      {/* Barra superior mobile: solo flecha + título, sin el chrome
          habitual de AppShell (este es un flujo de pantalla completa). */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-4 flex items-center gap-3">
        <Link to="/calendario" aria-label="Volver" className="text-neutral-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-sans font-bold text-lg text-neutral-900">
          Registrar Alquiler
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================= MOBILE ================= */}
        <div className="md:hidden px-4 py-4 pb-28 space-y-4 bg-neutral-50 min-h-screen">
          {/* 1. Seleccionar cancha */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-brand-primary text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900">
                Seleccionar Cancha
              </h2>
            </div>

            {cargandoCanchas && (
              <p className="font-sans text-sm text-neutral-400">Cargando canchas...</p>
            )}

            <div className="space-y-2">
              {canchas.map((c) => {
                const seleccionada = canchaId === c.id
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => seleccionarCancha(c.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-2 text-left ${
                      seleccionada
                        ? 'border-brand-primary bg-brand-secondary/10'
                        : 'border-neutral-200'
                    }`}
                  >
                    <span className="h-14 w-14 rounded-lg bg-gradient-to-br from-brand-primary to-[#1E293B] flex items-center justify-center shrink-0">
                      <Goal className="h-5 w-5 text-white/70" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-semibold text-sm text-neutral-900 truncate">
                        {c.nombre}
                      </p>
                      <p className="font-sans text-xs text-neutral-500 capitalize">
                        {c.superficie}
                      </p>
                    </div>
                    {seleccionada && (
                      <span className="h-6 w-6 rounded-full border-2 border-brand-primary bg-white flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-brand-primary" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Información de reserva */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900">
                Información de Reserva
              </h2>
            </div>

            <label className="font-sans text-sm text-neutral-600 mb-1 block">Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Hora Fin (Calc.)
                </label>
                <input
                  type="time"
                  disabled
                  value={sumarHoras(horaInicio, duracion)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 bg-neutral-100 font-sans text-sm text-neutral-500"
                />
              </div>
            </div>

            <label className="font-sans text-sm text-neutral-600 mb-1 mt-3 block">
              Duración
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURACIONES.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => cambiarDuracion(d.value)}
                  className={`h-10 rounded-lg border font-sans text-sm font-medium ${
                    duracion === d.value
                      ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                      : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  {d.value}h
                </button>
              ))}
            </div>
          </div>

          {/* 3. Cliente */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <h2 className="font-sans font-bold text-base text-neutral-900">Cliente</h2>
              </div>
              <button
                type="button"
                className="font-sans text-sm font-semibold text-brand-primary"
              >
                + Nuevo
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                placeholder="Buscar por nombre o DNI..."
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            {!clienteSeleccionado && clientesFiltrados.length > 0 && (
              <div className="mt-2 rounded-lg border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                {clientesFiltrados.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setClienteSeleccionado(c)
                      setBusquedaCliente(c.nombre)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 font-sans text-sm"
                  >
                    <span className="font-medium text-neutral-900">{c.nombre}</span>{' '}
                    <span className="text-neutral-400">{c.telefono}</span>
                  </button>
                ))}
              </div>
            )}

            {clienteSeleccionado && (
              <div className="mt-3 rounded-lg bg-neutral-50 flex items-center gap-3 p-3">
                <span className="h-9 w-9 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-brand-primary" />
                </span>
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-sm text-neutral-900 truncate">
                    {clienteSeleccionado.nombre}
                  </p>
                  <p className="font-sans text-xs text-neutral-500">
                    {clienteSeleccionado.telefono}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Detalles de pago */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900">
                Detalles de Pago
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Monto Total
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="S/. 0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Monto Pagado
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="S/. 0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
            </div>

            <label className="font-sans text-sm text-neutral-600 mb-1 mt-3 block">
              Estado del Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ESTADOS_PAGO.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => cambiarEstadoPago(value)}
                  className={`h-10 rounded-lg border font-sans text-sm font-medium ${
                    estadoPago === value
                      ? ESTADO_PAGO_COLOR[value]
                      : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Comprobante */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                5
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900">
                Comprobante (Opcional)
              </h2>
            </div>
            <label className="flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-200 rounded-xl py-8 px-4">
              <UploadCloud className="h-6 w-6 text-neutral-300 mb-2" />
              <p className="font-sans font-semibold text-sm text-neutral-700">
                Toca para subir imagen
              </p>
              <p className="font-sans text-xs text-neutral-400 mt-1">JPG, PNG max 5MB</p>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>

          {error && (
            <p className="font-sans text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <p className="text-center font-sans text-xs text-neutral-400 pt-2">
            Desarrollado por Brianna Salinas | 2026
          </p>
        </div>

        {/* Botón fijo inferior (solo mobile) */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 z-20">
          <button
            type="submit"
            disabled={guardando}
            className="w-full h-12 rounded-xl bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar Alquiler'}
          </button>
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:block">
          <div className="flex items-center gap-1.5 font-sans text-sm text-neutral-500">
            <Link to="/calendario" className="hover:text-brand-primary">
              Calendario
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-neutral-700">Registrar Alquiler</span>
          </div>

          <h1 className="font-sans font-bold text-3xl text-neutral-900 mt-2">
            Registrar Nuevo Alquiler
          </h1>
          <p className="font-sans text-base text-neutral-500 mt-1">
            Complete los detalles para asegurar la reserva de la cancha.
          </p>
        </div>

        <div className="hidden md:block mt-6 space-y-6">
          {/* 1. Seleccionar cancha */}
          <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide">
              1. Seleccionar Cancha
            </h2>
            <span className="font-sans text-sm text-neutral-400">
              {canchas.length} canchas disponibles
            </span>
          </div>

          {cargandoCanchas && (
            <p className="font-sans text-sm text-neutral-400">Cargando canchas...</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {canchas.map((c) => {
              const disponible = disponibilidadDe(c.id)
              const seleccionada = canchaId === c.id
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => seleccionarCancha(c.id)}
                  className={`text-left rounded-xl border bg-white overflow-hidden transition-shadow ${
                    seleccionada
                      ? 'border-brand-primary ring-2 ring-brand-primary/30'
                      : 'border-neutral-200 hover:shadow-sm'
                  }`}
                >
                  <div className="relative h-28 bg-gradient-to-br from-brand-primary to-[#1E293B] flex items-center justify-center">
                    <Goal className="h-8 w-8 text-white/70" />
                    {seleccionada && (
                      <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white flex items-center justify-center">
                        <Check className="h-4 w-4 text-brand-primary" />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-sans text-xs text-neutral-400 capitalize">
                      {c.deporte}
                    </p>
                    <p className="font-sans font-semibold text-sm text-neutral-900 truncate">
                      {c.nombre} · {c.superficie}
                    </p>
                    <p
                      className={`flex items-center gap-1.5 font-sans text-xs mt-1 ${
                        disponible ? 'text-success' : 'text-neutral-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          disponible ? 'bg-success' : 'bg-neutral-400'
                        }`}
                      />
                      {disponible ? 'Disponible' : 'Ocupada'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-5">
          {/* 2. Información de reserva */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide pb-3 mb-4 border-b border-neutral-100">
              2. Información de Reserva
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Fecha de Reserva
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
            </div>

            <label className="font-sans text-sm text-neutral-600 mb-1 mt-4 block">
              Duración
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURACIONES.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => cambiarDuracion(d.value)}
                  className={`h-10 rounded-lg border font-sans text-sm font-medium ${
                    duracion === d.value
                      ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Información del cliente */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
              <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide">
                3. Información del Cliente
              </h2>
              <button
                type="button"
                className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-secondary/15 text-brand-primary font-sans text-xs font-semibold hover:bg-brand-secondary/25"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Registrar nuevo cliente
              </button>
            </div>

            <label className="font-sans text-sm text-neutral-600 mb-1 block">
              Buscar Cliente (DNI / Nombre)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                placeholder="Ej. Juan Perez o 4567..."
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            {!clienteSeleccionado && clientesFiltrados.length > 0 && (
              <div className="mt-2 rounded-lg border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                {clientesFiltrados.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setClienteSeleccionado(c)
                      setBusquedaCliente(c.nombre)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 font-sans text-sm"
                  >
                    <span className="font-medium text-neutral-900">{c.nombre}</span>{' '}
                    <span className="text-neutral-400">{c.telefono}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 rounded-lg bg-neutral-50 flex flex-col items-center justify-center text-center py-8 px-4">
              {clienteSeleccionado ? (
                <>
                  <span className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-brand-primary" />
                  </span>
                  <p className="font-sans font-semibold text-sm text-neutral-900">
                    {clienteSeleccionado.nombre}
                  </p>
                  <p className="font-sans text-xs text-neutral-500 mt-0.5">
                    {clienteSeleccionado.telefono}
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-6 w-6 text-neutral-300 mb-2" />
                  <p className="font-sans text-sm text-neutral-400">
                    Seleccione un cliente para ver sus datos aquí
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* 4. Detalles de pago */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide pb-3 mb-4 border-b border-neutral-100">
              4. Detalles de Pago
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Monto Total (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 mb-1 block">
                  Monto Pagado (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
            </div>

            <label className="font-sans text-sm text-neutral-600 mb-1 mt-4 block">
              Estado de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ESTADOS_PAGO.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => cambiarEstadoPago(value)}
                  className={`h-14 rounded-lg border flex flex-col items-center justify-center gap-1 font-sans text-xs font-medium ${
                    estadoPago === value
                      ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Comprobante de pago */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide pb-3 mb-4 border-b border-neutral-100">
              5. Comprobante de Pago
            </h2>
            <label className="flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-200 rounded-xl py-10 px-4 cursor-pointer hover:border-brand-primary/40 hover:bg-neutral-50 transition-colors">
              <UploadCloud className="h-8 w-8 text-neutral-300 mb-2" />
              <p className="font-sans font-semibold text-sm text-neutral-700">
                Subir imagen o PDF
              </p>
              <p className="font-sans text-xs text-neutral-400 mt-1">
                Arrastre archivos aquí o haga clic
              </p>
              <p className="font-sans text-xs text-neutral-300 mt-2">Máximo 5MB</p>
              <input type="file" accept="image/*,.pdf" className="hidden" />
            </label>
          </div>
        </div>

        {error && (
          <p className="font-sans text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {/* Pie: cancelar + resumen + guardar */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-5">
          <Link
            to="/calendario"
            className="h-11 px-5 rounded-lg border border-neutral-200 font-sans text-sm font-medium text-neutral-600 flex items-center hover:bg-neutral-50"
          >
            Cancelar
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-sans text-xs text-neutral-500">Resumen de Cargo</p>
              <p className="font-sans font-bold text-xl text-neutral-900">
                S/ {(Number(montoTotal) || 0).toFixed(2)}
              </p>
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="h-11 px-5 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {guardando ? 'Guardando...' : 'Guardar Alquiler'}
            </button>
          </div>
        </div>
        </div>
      </form>
    </AppShell>
  )
}
