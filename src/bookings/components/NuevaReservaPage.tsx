import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
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
  Repeat,
  CalendarRange,
  Info,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCanchas, useReservas } from '../hooks/useCalendario'
import { useClientes, type Cliente } from '../../customers/hooks/useClientes'
import { apiClient } from '../../shared/api/client'
import { formatFecha } from '../../shared/utils/format'

type TipoReserva = 'UNICA' | 'MULTIDIA' | 'RECURRENTE'
type ModoPagoSerie = 'INDIVIDUAL' | 'ACUMULADO'
type EstadoPago = 'PENDIENTE' | 'PARCIAL' | 'PAGADO'

const TIPOS_RESERVA: { value: TipoReserva; label: string; ayuda: string; icon: typeof CalendarRange }[] = [
  { value: 'UNICA', label: 'Única', ayuda: 'Un solo día, cualquier duración.', icon: Clock },
  { value: 'MULTIDIA', label: 'Varios días seguidos', ayuda: 'Ej. un torneo de fin de semana.', icon: CalendarRange },
  { value: 'RECURRENTE', label: 'Recurrente', ayuda: 'Ej. todos los martes, cliente fijo.', icon: Repeat },
]

const MODOS_PAGO_SERIE: { value: ModoPagoSerie; label: string; ayuda: string }[] = [
  { value: 'INDIVIDUAL', label: 'Por fecha', ayuda: 'Cada fecha se cobra y se marca como pagada por separado.' },
  { value: 'ACUMULADO', label: 'En bloque', ayuda: 'El cliente paga varias fechas juntas; se marcan como pagadas todas a la vez.' },
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

function horasEntre(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60
}

function formatDuracion(horas: number): string {
  if (horas <= 0) return '—'
  const h = Math.floor(horas)
  const m = Math.round((horas - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00`)
  d.setDate(d.getDate() + dias)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// Tope de 60 fechas por serie (torneos largos o recurrencias de hasta
// ~1 año semanal) para no generar de más por un error de captura.
const TOPE_FECHAS_SERIE = 60

function generarFechasMultidia(inicio: string, fin: string): string[] {
  const fechas: string[] = []
  let cursor = inicio
  let guard = 0
  while (cursor <= fin && guard < TOPE_FECHAS_SERIE) {
    fechas.push(cursor)
    cursor = sumarDias(cursor, 1)
    guard++
  }
  return fechas
}

function generarFechasRecurrentes(inicio: string, repeticiones: number): string[] {
  const total = Math.min(Math.max(repeticiones, 1), TOPE_FECHAS_SERIE)
  return Array.from({ length: total }, (_, i) => sumarDias(inicio, i * 7))
}

function generarSerieId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `serie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function NuevaReservaPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)

  const { data: canchas = [], isLoading: cargandoCanchas } = useCanchas()
  const { data: reservas = [] } = useReservas()
  const { data: clientes = [] } = useClientes()
  // Guarda el id ya precargado para no repetir el prefill en cada
  // render, pero sí volver a hacerlo si se navega de "editar A" a
  // "editar B" sin desmontar el componente.
  const cargadoRef = useRef<string | null>(null)

  const [canchaId, setCanchaId] = useState<number | null>(null)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [horaFin, setHoraFin] = useState('11:00')

  // Tipo de reserva y campos de serie (solo aplican al crear; una
  // reserva ya guardada se edita siempre como una fecha individual).
  const [tipoReserva, setTipoReserva] = useState<TipoReserva>('UNICA')
  const [fechaFinMultidia, setFechaFinMultidia] = useState('')
  const [repeticiones, setRepeticiones] = useState(4)
  const [modoPagoSerie, setModoPagoSerie] = useState<ModoPagoSerie>('INDIVIDUAL')
  // Info de la serie a la que pertenece la reserva que se está
  // editando (si aplica), solo para mostrar el aviso informativo.
  const [serieInfoEdicion, setSerieInfoEdicion] = useState<{ etiqueta: string; indice: number; total: number } | null>(null)

  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)

  const canchaSeleccionada = canchas.find((c) => c.id === canchaId) ?? null

  const [montoTotal, setMontoTotal] = useState('')
  const [montoPagado, setMontoPagado] = useState('')
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('PENDIENTE')

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const duracionHoras = horasEntre(horaInicio, horaFin)

  // Precarga el formulario cuando se abre en modo edición
  // (/calendario/nueva-reserva/:id/editar), una sola vez, apenas
  // reservas y clientes ya cargaron.
  useEffect(() => {
    if (!editando || !id || cargadoRef.current === id) return
    const reserva = reservas.find((r) => String(r.id) === id)
    if (!reserva) return

    setCanchaId(reserva.canchaId)
    setFecha(reserva.fecha)
    setHoraInicio(reserva.horaInicio)
    setHoraFin(reserva.horaFin)
    setMontoTotal(String(reserva.montoTotal))
    setMontoPagado(String(reserva.montoPagado))
    setEstadoPago(reserva.estadoPago)

    if (reserva.serieId) {
      const fechasSerie = reservas.filter((r) => r.serieId === reserva.serieId)
      setSerieInfoEdicion({
        etiqueta: reserva.serieEtiqueta ?? 'Reserva en serie',
        indice: reserva.serieIndice ?? fechasSerie.findIndex((r) => r.id === reserva.id) + 1,
        total: reserva.serieTotalFechas ?? fechasSerie.length,
      })
    }

    if (reserva.clienteId) {
      const cliente = clientes.find((c) => c.id === reserva.clienteId)
      if (cliente) {
        setClienteSeleccionado(cliente)
        setBusquedaCliente(cliente.nombre)
      }
    } else if (reserva.clienteNombre) {
      // Reservas grupales (clienteId null, ej. "Club Atlético
      // Juniors"): no hay un Cliente real que seleccionar, así que se
      // arma uno local solo para no bloquear la validación del form.
      setClienteSeleccionado({ id: 0, nombre: reserva.clienteNombre, telefono: '' })
      setBusquedaCliente(reserva.clienteNombre)
    }

    cargadoRef.current = id
  }, [editando, id, reservas, clientes])

  function recalcularMonto(precioHora: number, horas: number) {
    if (horas > 0) setMontoTotal(String(Math.round(precioHora * horas * 100) / 100))
  }

  function seleccionarCancha(idCancha: number) {
    setCanchaId(idCancha)
    const cancha = canchas.find((c) => c.id === idCancha)
    if (cancha) recalcularMonto(cancha.precioHora, duracionHoras)
  }

  function cambiarHoraFin(valor: string) {
    setHoraFin(valor)
    if (canchaSeleccionada) recalcularMonto(canchaSeleccionada.precioHora, horasEntre(horaInicio, valor))
  }

  function cambiarHoraInicio(valor: string) {
    setHoraInicio(valor)
    if (canchaSeleccionada) recalcularMonto(canchaSeleccionada.precioHora, horasEntre(valor, horaFin))
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
  function disponibilidadDe(idCancha: number) {
    if (!fecha || !horaFin) return true
    return !reservas.some(
      (r) =>
        r.canchaId === idCancha &&
        r.fecha === fecha &&
        (!editando || String(r.id) !== id) &&
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

  // Vista previa de las fechas que se generarán para MULTIDIA /
  // RECURRENTE, solo para mostrarle al usuario qué va a crear.
  const fechasPrevisualizadas = useMemo(() => {
    if (tipoReserva === 'MULTIDIA' && fecha && fechaFinMultidia && fechaFinMultidia >= fecha) {
      return generarFechasMultidia(fecha, fechaFinMultidia)
    }
    if (tipoReserva === 'RECURRENTE' && fecha) {
      return generarFechasRecurrentes(fecha, repeticiones)
    }
    return []
  }, [tipoReserva, fecha, fechaFinMultidia, repeticiones])

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
    if (!horaInicio || !horaFin || duracionHoras <= 0) {
      setError('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    if (!clienteSeleccionado) {
      setError('Busca y selecciona un cliente.')
      return
    }
    if (!editando && tipoReserva === 'MULTIDIA' && (!fechaFinMultidia || fechaFinMultidia < fecha)) {
      setError('Elige una fecha de fin válida para el rango de días.')
      return
    }
    if (!editando && tipoReserva === 'RECURRENTE' && (repeticiones < 1 || repeticiones > TOPE_FECHAS_SERIE)) {
      setError(`La cantidad de repeticiones debe estar entre 1 y ${TOPE_FECHAS_SERIE}.`)
      return
    }

    setGuardando(true)
    try {
      const basePayload = {
        canchaId: canchaSeleccionada.id,
        canchaNombre: canchaSeleccionada.nombre,
        // clienteId 0 marca un cliente "sintético" armado solo para
        // precargar una reserva grupal en modo edición (ver useEffect
        // de arriba); en ese caso se guarda como reserva sin cliente
        // real, igual que estaba antes de editarla.
        clienteId: clienteSeleccionado.id === 0 ? null : clienteSeleccionado.id,
        clienteNombre: clienteSeleccionado.nombre,
        tipo: canchaSeleccionada.deporte,
        horaInicio,
        horaFin,
        estado: 'RESERVADO',
        estadoPago,
        montoTotal: Number(montoTotal) || 0,
        montoPagado: Number(montoPagado) || 0,
      }

      if (editando && id) {
        // Se reemplaza por PATCH /api/bookings/:id (US17-US19) cuando
        // el backend esté conectado (Sprint 2). Por ahora pega al
        // fake API. Editar solo actualiza esta fecha puntual, aunque
        // sea parte de una serie.
        await apiClient.patch(`/alquileres/${id}`, { ...basePayload, fecha })
        navigate('/reservas')
        return
      }

      if (tipoReserva === 'UNICA') {
        // Se reemplaza por POST /api/bookings (US17, RF/US del
        // Subdominio Bookings) cuando el backend esté conectado
        // (Sprint 2). Por ahora escribe directo en el fake API.
        await apiClient.post('/alquileres', { ...basePayload, fecha, tipoReserva: 'UNICA' })
        navigate('/calendario')
        return
      }

      const fechas =
        tipoReserva === 'MULTIDIA'
          ? generarFechasMultidia(fecha, fechaFinMultidia)
          : generarFechasRecurrentes(fecha, repeticiones)

      // Antes de crear nada, se valida que la cancha esté libre en
      // esa franja horaria para TODAS las fechas de la serie.
      const ocupadas = fechas.filter((f) =>
        reservas.some(
          (r) => r.canchaId === canchaSeleccionada.id && r.fecha === f && horaInicio < r.horaFin && horaFin > r.horaInicio,
        ),
      )
      if (ocupadas.length > 0) {
        setError(`La cancha ya está ocupada en ese horario para: ${ocupadas.map((f) => formatFecha(f)).join(', ')}.`)
        setGuardando(false)
        return
      }

      const serieId = generarSerieId()
      const serieEtiqueta =
        tipoReserva === 'MULTIDIA'
          ? `Reserva de ${fechas.length} días seguidos`
          : `Reserva recurrente semanal (${fechas.length} fechas)`

      // No hay endpoint de "series" en el fake API: se crea un
      // /alquileres por fecha, todos con el mismo serieId, para poder
      // agruparlos y accionarlos juntos desde Reservas (ver
      // ReservasPage). Se reemplaza por POST /api/bookings/series
      // cuando el backend esté conectado (Sprint 2).
      await Promise.all(
        fechas.map((f, index) =>
          apiClient.post('/alquileres', {
            ...basePayload,
            fecha: f,
            tipoReserva,
            serieId,
            serieEtiqueta,
            serieModoPago: modoPagoSerie,
            serieTotalFechas: fechas.length,
            serieIndice: index + 1,
          }),
        ),
      )
      navigate('/calendario')
    } catch {
      setError('No se pudo guardar el alquiler. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const tituloDesktop = editando ? 'Editar Alquiler' : 'Registrar Nuevo Alquiler'
  const tituloDesktopBreadcrumb = editando ? 'Editar Alquiler' : 'Registrar Alquiler'

  return (
    <AppShell searchPlaceholder="Buscar reservas o clientes..." minimalMobile>
      {/* Barra superior mobile: solo flecha + título, sin el chrome
          habitual de AppShell (este es un flujo de pantalla completa). */}
      <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center gap-3">
        <Link to="/calendario" aria-label="Volver" className="text-neutral-900 dark:text-neutral-50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
          {editando ? 'Editar Alquiler' : 'Registrar Alquiler'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================= MOBILE ================= */}
        <div className="md:hidden px-4 py-4 pb-28 space-y-4 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
          {/* 1. Seleccionar cancha */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-brand-primary text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">
                Seleccionar Cancha
              </h2>
            </div>

            {cargandoCanchas && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Cargando canchas...</p>
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
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="h-14 w-14 rounded-lg bg-gradient-to-br from-brand-primary to-[#1E293B] flex items-center justify-center shrink-0">
                      <Goal className="h-5 w-5 text-white/70" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                        {c.nombre}
                      </p>
                      <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {c.superficie}
                      </p>
                    </div>
                    {seleccionada && (
                      <span className="h-6 w-6 rounded-full border-2 border-brand-primary bg-white dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-brand-primary" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Información de reserva */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">
                Información de Reserva
              </h2>
            </div>

            {serieInfoEdicion && (
              <div className="flex items-start gap-2 rounded-lg bg-brand-secondary/10 p-3 mb-3">
                <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-brand-primary">
                  Fecha {serieInfoEdicion.indice} de {serieInfoEdicion.total} de "{serieInfoEdicion.etiqueta}". Solo se
                  actualizará esta fecha puntual.
                </p>
              </div>
            )}

            {!editando && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Tipo de Reserva
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {TIPOS_RESERVA.map(({ value, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setTipoReserva(value)}
                      className={`h-16 rounded-lg border flex flex-col items-center justify-center gap-1 font-sans text-xs font-medium px-1 text-center ${
                        tipoReserva === value
                          ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 -mt-2 mb-3">
                  {TIPOS_RESERVA.find((t) => t.value === tipoReserva)?.ayuda}
                </p>
              </>
            )}

            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
              {tipoReserva === 'UNICA' ? 'Fecha' : 'Fecha de Inicio'}
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            />

            {!editando && tipoReserva === 'MULTIDIA' && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-3 block">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  required
                  min={fecha || undefined}
                  value={fechaFinMultidia}
                  onChange={(e) => setFechaFinMultidia(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </>
            )}

            {!editando && tipoReserva === 'RECURRENTE' && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-3 block">
                  Repetir cada semana, durante
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={TOPE_FECHAS_SERIE}
                    value={repeticiones}
                    onChange={(e) => setRepeticiones(Number(e.target.value) || 1)}
                    className="w-24 h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                  <span className="font-sans text-sm text-neutral-600 dark:text-neutral-300">semanas</span>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => cambiarHoraInicio(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Hora Fin
                </label>
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => cambiarHoraFin(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Duración: <span className="font-semibold">{formatDuracion(duracionHoras)}</span>
            </p>

            {!editando && tipoReserva !== 'UNICA' && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-3 block">
                  Modo de Cobro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODOS_PAGO_SERIE.map(({ value, label }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setModoPagoSerie(value)}
                      className={`h-10 rounded-lg border font-sans text-sm font-medium ${
                        modoPagoSerie === value
                          ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {fechasPrevisualizadas.length > 0 && (
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Se crearán <span className="font-semibold text-brand-primary">{fechasPrevisualizadas.length}</span>{' '}
                    reservas, una por cada fecha.
                  </p>
                )}
              </>
            )}
          </div>

          {/* 3. Cliente */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">Cliente</h2>
              </div>
              <button
                type="button"
                className="font-sans text-sm font-semibold text-brand-primary"
              >
                + Nuevo
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                placeholder="Buscar por nombre o DNI..."
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
              />
            </div>

            {!clienteSeleccionado && clientesFiltrados.length > 0 && (
              <div className="mt-2 rounded-lg border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-700/60 overflow-hidden">
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
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">{c.nombre}</span>{' '}
                    <span className="text-neutral-400 dark:text-neutral-500">{c.telefono}</span>
                  </button>
                ))}
              </div>
            )}

            {clienteSeleccionado && (
              <div className="mt-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-center gap-3 p-3">
                <span className="h-9 w-9 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-brand-primary" />
                </span>
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                    {clienteSeleccionado.nombre}
                  </p>
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
                    {clienteSeleccionado.telefono}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Detalles de pago */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">
                Detalles de Pago
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Monto Total {tipoReserva !== 'UNICA' && !editando ? '(por fecha)' : ''}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="S/. 0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Monto Pagado
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="S/. 0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>

            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-3 block">
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
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Comprobante */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-neutral-800 text-white font-sans text-xs font-bold flex items-center justify-center shrink-0">
                5
              </span>
              <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">
                Comprobante (Opcional)
              </h2>
            </div>
            <label className="flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl py-8 px-4">
              <UploadCloud className="h-6 w-6 text-neutral-300 mb-2" />
              <p className="font-sans font-semibold text-sm text-neutral-700 dark:text-neutral-200">
                Toca para subir imagen
              </p>
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1">JPG, PNG max 5MB</p>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>

          {error && (
            <p className="font-sans text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 pt-2">
            Desarrollado por Brianna Salinas | 2026
          </p>
        </div>

        {/* Botón fijo inferior (solo mobile) */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 z-20">
          <button
            type="submit"
            disabled={guardando}
            className="w-full h-12 rounded-xl bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {guardando
              ? 'Guardando...'
              : editando
                ? 'Actualizar Alquiler'
                : tipoReserva === 'UNICA'
                  ? 'Guardar Alquiler'
                  : `Guardar ${fechasPrevisualizadas.length || ''} Reservas`}
          </button>
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:block">
          <div className="flex items-center gap-1.5 font-sans text-sm text-neutral-500 dark:text-neutral-400">
            <Link to="/calendario" className="hover:text-brand-primary">
              Calendario
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {tituloDesktopBreadcrumb}
            </span>
          </div>

          <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50 mt-2">
            {tituloDesktop}
          </h1>
          <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1">
            {editando
              ? 'Actualiza los detalles de esta reserva.'
              : 'Complete los detalles para asegurar la reserva de la cancha.'}
          </p>
        </div>

        <div className="hidden md:block mt-6 space-y-6">
          {/* 1. Seleccionar cancha */}
          <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide">
              1. Seleccionar Cancha
            </h2>
            <span className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
              {canchas.length} canchas disponibles
            </span>
          </div>

          {cargandoCanchas && (
            <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Cargando canchas...</p>
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
                  className={`text-left rounded-xl border bg-white dark:bg-neutral-800 overflow-hidden transition-shadow ${
                    seleccionada
                      ? 'border-brand-primary ring-2 ring-brand-primary/30'
                      : 'border-neutral-200 dark:border-neutral-700 hover:shadow-sm'
                  }`}
                >
                  <div className="relative h-28 bg-gradient-to-br from-brand-primary to-[#1E293B] flex items-center justify-center">
                    <Goal className="h-8 w-8 text-white/70" />
                    {seleccionada && (
                      <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center">
                        <Check className="h-4 w-4 text-brand-primary" />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 capitalize">
                      {c.deporte}
                    </p>
                    <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                      {c.nombre} · {c.superficie}
                    </p>
                    <p
                      className={`flex items-center gap-1.5 font-sans text-xs mt-1 ${
                        disponible ? 'text-success' : 'text-neutral-400 dark:text-neutral-500'
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
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-700/60">
              2. Información de Reserva
            </h2>

            {serieInfoEdicion && (
              <div className="flex items-start gap-2 rounded-lg bg-brand-secondary/10 p-3 mb-4">
                <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-brand-primary">
                  Fecha {serieInfoEdicion.indice} de {serieInfoEdicion.total} de "{serieInfoEdicion.etiqueta}". Solo se
                  actualizará esta fecha puntual; las demás fechas de la serie no se ven afectadas.
                </p>
              </div>
            )}

            {!editando && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Tipo de Reserva
                </label>
                <div className="grid grid-cols-3 gap-2 mb-1">
                  {TIPOS_RESERVA.map(({ value, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setTipoReserva(value)}
                      className={`h-14 rounded-lg border flex flex-col items-center justify-center gap-1 font-sans text-xs font-medium ${
                        tipoReserva === value
                          ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mb-4">
                  {TIPOS_RESERVA.find((t) => t.value === tipoReserva)?.ayuda}
                </p>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className={editando || tipoReserva === 'UNICA' ? 'col-span-2' : ''}>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  {tipoReserva === 'UNICA' ? 'Fecha de Reserva' : 'Fecha de Inicio'}
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
              {!editando && tipoReserva === 'MULTIDIA' ? (
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    required
                    min={fecha || undefined}
                    value={fechaFinMultidia}
                    onChange={(e) => setFechaFinMultidia(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                </div>
              ) : !editando && tipoReserva === 'RECURRENTE' ? (
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                    Repetir cada semana, durante
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={TOPE_FECHAS_SERIE}
                      value={repeticiones}
                      onChange={(e) => setRepeticiones(Number(e.target.value) || 1)}
                      className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                    />
                    <span className="font-sans text-sm text-neutral-600 dark:text-neutral-300 shrink-0">semanas</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => cambiarHoraInicio(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => cambiarHoraFin(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Duración: <span className="font-semibold">{formatDuracion(duracionHoras)}</span>
            </p>

            {!editando && tipoReserva !== 'UNICA' && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-4 block">
                  Modo de Cobro de la Serie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODOS_PAGO_SERIE.map(({ value, label, ayuda }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setModoPagoSerie(value)}
                      title={ayuda}
                      className={`h-10 rounded-lg border font-sans text-sm font-medium ${
                        modoPagoSerie === value
                          ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {fechasPrevisualizadas.length > 0 && (
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Se crearán <span className="font-semibold text-brand-primary">{fechasPrevisualizadas.length}</span>{' '}
                    reservas, una por cada fecha, con el mismo horario y cliente.
                  </p>
                )}
              </>
            )}
          </div>

          {/* 3. Información del cliente */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-700/60">
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

            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
              Buscar Cliente (DNI / Nombre)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  setClienteSeleccionado(null)
                }}
                placeholder="Ej. Juan Perez o 4567..."
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
              />
            </div>

            {!clienteSeleccionado && clientesFiltrados.length > 0 && (
              <div className="mt-2 rounded-lg border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-700/60 overflow-hidden">
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
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">{c.nombre}</span>{' '}
                    <span className="text-neutral-400 dark:text-neutral-500">{c.telefono}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center text-center py-8 px-4">
              {clienteSeleccionado ? (
                <>
                  <span className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-brand-primary" />
                  </span>
                  <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
                    {clienteSeleccionado.nombre}
                  </p>
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {clienteSeleccionado.telefono}
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-6 w-6 text-neutral-300 mb-2" />
                  <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
                    Seleccione un cliente para ver sus datos aquí
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* 4. Detalles de pago */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-700/60">
              4. Detalles de Pago
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Monto Total (S/){tipoReserva !== 'UNICA' && !editando ? ' por fecha' : ''}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                  Monto Pagado (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>

            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-4 block">
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
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Comprobante de pago */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-700/60">
              5. Comprobante de Pago
            </h2>
            <label className="flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl py-10 px-4 cursor-pointer hover:border-brand-primary/40 hover:bg-neutral-50 transition-colors">
              <UploadCloud className="h-8 w-8 text-neutral-300 mb-2" />
              <p className="font-sans font-semibold text-sm text-neutral-700 dark:text-neutral-200">
                Subir imagen o PDF
              </p>
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1">
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
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-5">
          <Link
            to={editando ? '/reservas' : '/calendario'}
            className="h-11 px-5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm font-medium text-neutral-600 dark:text-neutral-300 flex items-center hover:bg-neutral-50"
          >
            Cancelar
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
                {tipoReserva !== 'UNICA' && !editando ? 'Cargo por Fecha' : 'Resumen de Cargo'}
              </p>
              <p className="font-sans font-bold text-xl text-neutral-900 dark:text-neutral-50">
                S/ {(Number(montoTotal) || 0).toFixed(2)}
              </p>
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="h-11 px-5 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {guardando
                ? 'Guardando...'
                : editando
                  ? 'Actualizar Alquiler'
                  : tipoReserva === 'UNICA'
                    ? 'Guardar Alquiler'
                    : `Guardar ${fechasPrevisualizadas.length || ''} Reservas`}
            </button>
          </div>
        </div>
        </div>
      </form>
    </AppShell>
  )
}
