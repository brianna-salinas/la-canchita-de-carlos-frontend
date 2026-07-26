import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
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
import { useQueryClient } from '@tanstack/react-query'
import AppShell from '../../shared/components/AppShell'
import { useCourts, useBookings } from '../hooks/useCalendario'
import { useCustomers, type Customer } from '../../customers/hooks/useClientes'
import { apiClient } from '../../shared/api/client'
import { formatDate } from '../../shared/utils/format'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { isValidPhone } from '../../shared/utils/validation'
import { toISODate, toHHmm } from '../../shared/utils/date'
import MetodoPagoIcon from '../../shared/components/MetodoPagoIcon'

type TipoReserva = 'UNICA' | 'MULTIDIA' | 'RECURRENTE'
type ModoPagoSerie = 'INDIVIDUAL' | 'ACUMULADO'
type EstadoPago = 'PENDIENTE' | 'PARCIAL' | 'PAGADO'
type MetodoPago = 'EFECTIVO' | 'YAPE' | 'OTRO'

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

const PAYMENT_STATUS_TO_ESTADO_PAGO: Record<'PAID' | 'PARTIAL' | 'PENDING', EstadoPago> = {
  PAID: 'PAGADO',
  PARTIAL: 'PARCIAL',
  PENDING: 'PENDIENTE',
}

const ESTADO_PAGO_COLOR: Record<EstadoPago, string> = {
  PENDIENTE: 'border-danger text-danger bg-danger/5',
  PARCIAL: 'border-warning text-warning bg-warning/5',
  PAGADO: 'border-success text-success bg-success/5',
}

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'YAPE', label: 'Yape / Plin' },
  { value: 'OTRO', label: 'Otro (tarjeta, etc.)' },
]

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

export default function NuevaReservaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const editando = Boolean(id)

  const { data: canchas = [], isLoading: cargandoCanchas } = useCourts()
  const { data: reservas = [] } = useBookings()
  const { data: clientes = [] } = useCustomers()

  const cargadoRef = useRef<string | null>(null)
  const prellenadoRef = useRef(false)

  const fechaHoraOriginalRef = useRef<{ date: string; startTime: string } | null>(null)

  const [canchaId, setCanchaId] = useState<number | null>(null)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('10:00')
  const [horaFin, setHoraFin] = useState('11:00')

  const [tipoReserva, setTipoReserva] = useState<TipoReserva>('UNICA')
  const [fechaFinMultidia, setFechaFinMultidia] = useState('')
  const [repeticiones, setRepeticiones] = useState(4)
  const [modoPagoSerie, setModoPagoSerie] = useState<ModoPagoSerie>('INDIVIDUAL')

  const [serieInfoEdicion, setSerieInfoEdicion] = useState<{ etiqueta: string; indice: number; total: number } | null>(null)

  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Customer | null>(null)

  const [modalClienteAbierto, setModalClienteAbierto] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', dni: '' })
  const [errorNuevoCliente, setErrorNuevoCliente] = useState<string | null>(null)
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  const canchaSeleccionada = canchas.find((c) => c.id === canchaId) ?? null

  const [montoTotal, setMontoTotal] = useState('')
  const [montoPagado, setMontoPagado] = useState('')
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('PENDIENTE')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO')

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const duracionHoras = horasEntre(horaInicio, horaFin)

  const hoyISO = toISODate(new Date())
  function esFechaHoraPasada(fechaSel: string, horaSel: string): boolean {
    if (!fechaSel) return false
    if (fechaSel < hoyISO) return true
    if (fechaSel > hoyISO) return false
    return Boolean(horaSel) && horaSel < toHHmm(new Date())
  }

  useEffect(() => {
    if (!editando || !id || cargadoRef.current === id) return
    const reserva = reservas.find((r) => String(r.id) === id)
    if (!reserva) return

    setCanchaId(reserva.courtId)
    setFecha(reserva.date)
    setHoraInicio(reserva.startTime)
    setHoraFin(reserva.endTime)
    setMontoTotal(String(reserva.totalAmount))
    setMontoPagado(String(reserva.paidAmount))
    setEstadoPago(PAYMENT_STATUS_TO_ESTADO_PAGO[reserva.paymentStatus])
    fechaHoraOriginalRef.current = { date: reserva.date, startTime: reserva.startTime }

    if (reserva.seriesId) {
      const fechasSerie = reservas.filter((r) => r.seriesId === reserva.seriesId)
      setSerieInfoEdicion({
        etiqueta: reserva.seriesLabel ?? 'Reserva en serie',
        indice: reserva.seriesIndex ?? fechasSerie.findIndex((r) => r.id === reserva.id) + 1,
        total: reserva.seriesTotalDates ?? fechasSerie.length,
      })
    }

    if (reserva.customerId) {
      const cliente = clientes.find((c) => c.id === reserva.customerId)
      if (cliente) {
        setClienteSeleccionado(cliente)
        setBusquedaCliente(cliente.name)
      }
    } else if (reserva.customerName) {
      setClienteSeleccionado({ id: 0, name: reserva.customerName, phone: '' })
      setBusquedaCliente(reserva.customerName)
    }

    cargadoRef.current = id
  }, [editando, id, reservas, clientes])

  useEffect(() => {
    if (editando || prellenadoRef.current) return
    const canchaIdParam = searchParams.get('canchaId')
    const fechaParam = searchParams.get('fecha')
    const horaParam = searchParams.get('horaInicio')

    if (canchaIdParam) setCanchaId(Number(canchaIdParam))
    if (fechaParam) setFecha(fechaParam)
    if (horaParam) {
      setHoraInicio(horaParam)
      const h = parseInt(horaParam.split(':')[0], 10)
      setHoraFin(`${String(h + 1).padStart(2, '0')}:00`)
    }
    prellenadoRef.current = true
  }, [editando, searchParams])

  useEffect(() => {
    if (editando || !canchaId || montoTotal) return
    const cancha = canchas.find((c) => c.id === canchaId)
    if (cancha) {
      recalcularMonto(cancha.pricePerHour, duracionHoras)
    }
  }, [editando, canchaId, canchas, montoTotal, duracionHoras])

  function recalcularMonto(precioHora: number, horas: number) {
    if (horas > 0) setMontoTotal(String(Math.round(precioHora * horas * 100) / 100))
  }

  function abrirNuevoCliente() {
    setNuevoCliente({ nombre: busquedaCliente.trim(), telefono: '', dni: '' })
    setErrorNuevoCliente(null)
    setModalClienteAbierto(true)
  }

  async function guardarNuevoCliente() {
    if (!nuevoCliente.nombre.trim()) {
      setErrorNuevoCliente('El nombre no puede estar vacío.')
      return
    }
    if (!isValidPhone(nuevoCliente.telefono)) {
      setErrorNuevoCliente('El teléfono no es válido (debe ser un celular peruano de 9 dígitos).')
      return
    }
    setErrorNuevoCliente(null)
    setGuardandoCliente(true)
    try {
      const { data: creado } = await apiClient.post('/customers', {
        name: nuevoCliente.nombre.trim(),
        phone: nuevoCliente.telefono.trim(),
        documentNumber: nuevoCliente.dni.trim() || undefined,
      })
      const clienteCreado: Customer = {
        id: creado.id,
        name: creado.name,
        phone: creado.phone,
        documentNumber: creado.documentNumber ?? undefined,
        status: 'ACTIVE',
      }
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      setClienteSeleccionado(clienteCreado)
      setBusquedaCliente(clienteCreado.name)
      setModalClienteAbierto(false)
    } catch (err) {
      setErrorNuevoCliente(getApiErrorMessage(err, 'No se pudo registrar el cliente. Intenta de nuevo.'))
    } finally {
      setGuardandoCliente(false)
    }
  }

  function seleccionarCancha(idCancha: number) {
    setCanchaId(idCancha)
    const cancha = canchas.find((c) => c.id === idCancha)
    if (cancha) recalcularMonto(cancha.pricePerHour, duracionHoras)
  }

  function cambiarHoraFin(valor: string) {
    setHoraFin(valor)
    if (canchaSeleccionada) recalcularMonto(canchaSeleccionada.pricePerHour, horasEntre(horaInicio, valor))
  }

  function cambiarHoraInicio(valor: string) {
    setHoraInicio(valor)
    if (canchaSeleccionada) recalcularMonto(canchaSeleccionada.pricePerHour, horasEntre(valor, horaFin))
  }

  function cambiarEstadoPago(estado: EstadoPago) {
    setEstadoPago(estado)
    const total = Number(montoTotal) || 0
    if (estado === 'PAGADO') setMontoPagado(String(total))
    if (estado === 'PENDIENTE') setMontoPagado('0')
  }

  function disponibilidadDe(idCancha: number) {
    if (!fecha || !horaFin) return true
    return !reservas.some(
      (r) =>
        r.courtId === idCancha &&
        r.date === fecha &&
        (!editando || String(r.id) !== id) &&
        horaInicio < r.endTime &&
        horaFin > r.startTime,
    )
  }

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase()
    if (!q) return []
    return clientes
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.documentNumber ?? '').includes(q) ||
          c.phone.includes(q),
      )
      .slice(0, 5)
  }, [busquedaCliente, clientes])

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

    if (
      canchaSeleccionada.openTime &&
      canchaSeleccionada.closeTime &&
      (horaInicio < canchaSeleccionada.openTime || horaFin > canchaSeleccionada.closeTime)
    ) {
      setError(
        `Esta cancha solo está disponible de ${canchaSeleccionada.openTime} a ${canchaSeleccionada.closeTime}.`,
      )
      return
    }
    const original = fechaHoraOriginalRef.current
    const cambioFechaHora = !editando || !original || fecha !== original.date || horaInicio !== original.startTime
    if (cambioFechaHora && esFechaHoraPasada(fecha, horaInicio)) {
      setError('No se pueden registrar reservas en una fecha u hora que ya pasó.')
      return
    }
    if (!clienteSeleccionado) {
      setError("Busca y selecciona un cliente registrado, o usa 'Registrar nuevo cliente' para crear uno.")
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
      const customerId = clienteSeleccionado.id === 0 ? undefined : clienteSeleccionado.id
      const montoTotalNum = Number(montoTotal) || 0
      const montoPagadoNum = Number(montoPagado) || 0

      if (editando && id) {

        await apiClient.patch(`/bookings/${id}`, {
          courtId: canchaSeleccionada.id,
          customerName: clienteSeleccionado.name,
          type: canchaSeleccionada.sport,
          date: fecha,
          startTime: horaInicio,
          endTime: horaFin,
          totalAmount: montoTotalNum,
          paidAmount: montoPagadoNum,
        })

        navigate('/reservas')
        return
      }

      if (tipoReserva === 'UNICA') {
        const { data: creada } = await apiClient.post('/bookings', {
          courtId: canchaSeleccionada.id,
          customerId,
          customerName: clienteSeleccionado.name,
          type: canchaSeleccionada.sport,
          date: fecha,
          startTime: horaInicio,
          endTime: horaFin,
          totalAmount: montoTotalNum,
        })

        if (montoPagadoNum > 0) {
          await apiClient.post('/payments', {
            bookingId: creada.id,
            amount: Math.min(montoPagadoNum, montoTotalNum),
            method: metodoPago,
          })
        }

        navigate('/calendario')
        return
      }

      const fechas =
        tipoReserva === 'MULTIDIA'
          ? generarFechasMultidia(fecha, fechaFinMultidia)
          : generarFechasRecurrentes(fecha, repeticiones)

      const ocupadas = fechas.filter((f) =>
        reservas.some(
          (r) => r.courtId === canchaSeleccionada.id && r.date === f && horaInicio < r.endTime && horaFin > r.startTime,
        ),
      )
      if (ocupadas.length > 0) {
        setError(`La cancha ya está ocupada en ese horario para: ${ocupadas.map((f) => formatDate(f)).join(', ')}.`)
        setGuardando(false)
        return
      }

      const serieEtiqueta =
        tipoReserva === 'MULTIDIA'
          ? `Reserva de ${fechas.length} días seguidos`
          : `Reserva recurrente semanal (${fechas.length} fechas)`

      const { data: creadas } = await apiClient.post('/bookings/series', {
        courtId: canchaSeleccionada.id,
        customerId,
        customerName: clienteSeleccionado.name,
        type: canchaSeleccionada.sport,
        dates: fechas,
        startTime: horaInicio,
        endTime: horaFin,
        totalAmount: montoTotalNum,
        seriesPaymentMode: modoPagoSerie === 'ACUMULADO' ? 'LUMP_SUM' : 'INDIVIDUAL',
        seriesLabel: serieEtiqueta,
        bookingType: tipoReserva === 'MULTIDIA' ? 'MULTIDAY' : 'RECURRING',
      })

      if (montoPagadoNum > 0 && creadas[0]) {
        await apiClient.post('/payments', {
          bookingId: creadas[0].id,
          amount: Math.min(montoPagadoNum, creadas[0].totalAmount),
          method: 'EFECTIVO',
        })
      }

      navigate('/calendario')
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la reserva. Intenta de nuevo.'))
    } finally {
      setGuardando(false)
    }
  }

  const tituloDesktop = editando ? 'Editar Reserva' : 'Registrar Nueva Reserva'
  const tituloDesktopBreadcrumb = editando ? 'Editar Reserva' : 'Registrar Reserva'

  return (
    <AppShell searchPlaceholder="Buscar reservas o clientes..." minimalMobile>
      <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center gap-3">
        <Link to="/calendario" aria-label="Volver" className="text-neutral-900 dark:text-neutral-50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
          {editando ? 'Editar Reserva' : 'Registrar Reserva'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="md:hidden px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-4 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
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
                    <span className="h-14 w-14 rounded-lg bg-gradient-to-br from-brand-primary to-[#1E293B] flex items-center justify-center shrink-0 overflow-hidden">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        <Goal className="h-5 w-5 text-white/70" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                        {c.name}
                      </p>
                      <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {c.surface}
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
              min={editando ? undefined : hoyISO}
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
                  min={canchaSeleccionada?.openTime}
                  max={canchaSeleccionada?.closeTime}
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
                  min={canchaSeleccionada?.openTime}
                  max={canchaSeleccionada?.closeTime}
                  onChange={(e) => cambiarHoraFin(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Duración: <span className="font-semibold">{formatDuracion(duracionHoras)}</span>
            </p>
            {canchaSeleccionada?.openTime && canchaSeleccionada?.closeTime && (
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Esta cancha atiende de {canchaSeleccionada.openTime} a {canchaSeleccionada.closeTime}.
              </p>
            )}

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
                onClick={abrirNuevoCliente}
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
                      setBusquedaCliente(c.name)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 font-sans text-sm"
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">{c.name}</span>{' '}
                    <span className="text-neutral-400 dark:text-neutral-500">{c.phone}</span>
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
                    {clienteSeleccionado.name}
                  </p>
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
                    {clienteSeleccionado.phone}
                  </p>
                </div>
              </div>
            )}
          </div>

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

            {Number(montoPagado) > 0 && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-3 block">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {METODOS_PAGO.map(({ value, label }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setMetodoPago(value)}
                      className={`h-14 rounded-lg border font-sans text-xs font-medium px-1 flex flex-col items-center justify-center gap-1 ${
                        metodoPago === value
                          ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <MetodoPagoIcon value={value} className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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

        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20">
          <button
            type="submit"
            disabled={guardando}
            className="w-full h-12 rounded-xl bg-brand-primary text-white font-sans font-semibold text-base hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {guardando
              ? 'Guardando...'
              : editando
                ? 'Actualizar Reserva'
                : tipoReserva === 'UNICA'
                  ? 'Guardar Reserva'
                  : `Guardar ${fechasPrevisualizadas.length || ''} Reservas`}
          </button>
        </div>

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
                  <div className="relative h-28 bg-gradient-to-br from-brand-primary to-[#1E293B] flex items-center justify-center overflow-hidden">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <Goal className="h-8 w-8 text-white/70" />
                    )}
                    {seleccionada && (
                      <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center">
                        <Check className="h-4 w-4 text-brand-primary" />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 capitalize">
                      {c.sport}
                    </p>
                    <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                      {c.name} · {c.surface}
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
                  min={editando ? undefined : hoyISO}
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
                  min={canchaSeleccionada?.openTime}
                  max={canchaSeleccionada?.closeTime}
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
                  min={canchaSeleccionada?.openTime}
                  max={canchaSeleccionada?.closeTime}
                  onChange={(e) => cambiarHoraFin(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Duración: <span className="font-semibold">{formatDuracion(duracionHoras)}</span>
            </p>
            {canchaSeleccionada?.openTime && canchaSeleccionada?.closeTime && (
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Esta cancha atiende de {canchaSeleccionada.openTime} a {canchaSeleccionada.closeTime}.
              </p>
            )}

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

          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-700/60">
              <h2 className="font-sans font-bold text-sm text-brand-primary uppercase tracking-wide">
                3. Información del cliente
              </h2>
              <button
                type="button"
                onClick={abrirNuevoCliente}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-secondary/15 text-brand-primary font-sans text-xs font-semibold hover:bg-brand-secondary/25"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Registrar nuevo cliente
              </button>
            </div>

            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
              Buscar cliente (DNI / Nombre)
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
                      setBusquedaCliente(c.name)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 font-sans text-sm"
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">{c.name}</span>{' '}
                    <span className="text-neutral-400 dark:text-neutral-500">{c.phone}</span>
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
                    {clienteSeleccionado.name}
                  </p>
                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {clienteSeleccionado.phone}
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

            {Number(montoPagado) > 0 && (
              <>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 mt-4 block">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {METODOS_PAGO.map(({ value, label }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setMetodoPago(value)}
                      className={`h-16 rounded-lg border font-sans text-xs font-medium px-1 flex flex-col items-center justify-center gap-1 ${
                        metodoPago === value
                          ? 'border-brand-primary text-brand-primary bg-brand-secondary/10'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <MetodoPagoIcon value={value} className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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
                  ? 'Actualizar Reserva'
                  : tipoReserva === 'UNICA'
                    ? 'Guardar Reserva'
                    : `Guardar ${fechasPrevisualizadas.length || ''} Reservas`}
            </button>
          </div>
        </div>
        </div>
      </form>

      {modalClienteAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-lg">
            <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-4">
              Registrar nuevo cliente
            </h2>

            <div className="space-y-4">
              <div>
                <label className="font-sans text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente((c) => ({ ...c, nombre: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 font-sans text-sm text-neutral-900 dark:text-neutral-50"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="font-sans text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente((c) => ({ ...c, telefono: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 font-sans text-sm text-neutral-900 dark:text-neutral-50"
                  placeholder="9XXXXXXXX"
                />
              </div>

              <div>
                <label className="font-sans text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  DNI (opcional)
                </label>
                <input
                  type="text"
                  value={nuevoCliente.dni}
                  onChange={(e) => setNuevoCliente((c) => ({ ...c, dni: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 font-sans text-sm text-neutral-900 dark:text-neutral-50"
                  placeholder="Ej. 12345678"
                />
              </div>

              {errorNuevoCliente && (
                <p className="font-sans text-sm text-danger" role="alert">
                  {errorNuevoCliente}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModalClienteAbierto(false)}
                className="h-11 px-5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoCliente}
                onClick={guardarNuevoCliente}
                className="h-11 px-5 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm disabled:opacity-60"
              >
                {guardandoCliente ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
