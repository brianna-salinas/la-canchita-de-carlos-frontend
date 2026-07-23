import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'
import { toISODate } from '../../shared/utils/date'
import type { Alquiler } from '../../dashboard/hooks/usePanelData'

export interface Cancha {
  id: number
  nombre: string
  deporte: string
  superficie: string
  precioHora: number
  estado?: 'ACTIVA' | 'MANTENIMIENTO'
  fotoUrl?: string
  descripcion?: string
  habilitada?: boolean
  horaApertura?: string
  horaCierre?: string
}

export interface Bloqueo {
  id: number
  canchaId: number
  canchaNombre: string
  fecha: string
  hora: string
  motivo: string
}

// Shapes tal como los devuelve el backend real (inglés), antes de mapear
// a los tipos en español que consume el resto de la app.
interface CourtApiRow {
  id: number
  name: string
  sport: string
  surface?: string | null
  pricePerHour: number
  photoUrl?: string | null
  status?: string
  enabled?: boolean
  description?: string | null
  openTime?: string
  closeTime?: string
}

interface ScheduleBlockApiRow {
  id: number
  time: string
}

interface CourtAvailabilityApiRow extends CourtApiRow {
  scheduleBlocks?: ScheduleBlockApiRow[]
}

export interface BookingApiRow {
  id: number
  courtId: number
  court?: { name: string }
  customerId?: number | null
  customerName: string
  type?: string | null
  date: string
  startTime: string
  endTime: string
  status: string
  paymentStatus: string
  totalAmount: number
  paidAmount: number
  bookingType?: string
  seriesId?: string | null
  seriesPaymentMode?: string | null
  seriesLabel?: string | null
  seriesTotalDates?: number | null
  seriesIndex?: number | null
}

function fechaHoy(): string {
  // Antes usaba toISOString(), que convierte a UTC: en Perú (UTC-5), desde
  // las 19:00 hora local en adelante eso ya cae en el día siguiente en UTC
  // y devolvía la fecha equivocada. toISODate() usa la fecha local real.
  return toISODate(new Date())
}

const ESTADO_CANCHA_A_ESPANOL: Record<string, NonNullable<Cancha['estado']>> = {
  ACTIVE: 'ACTIVA',
  MAINTENANCE: 'MANTENIMIENTO',
}

function mapCourtToCancha(row: CourtApiRow): Cancha {
  return {
    id: row.id,
    nombre: row.name,
    deporte: row.sport,
    superficie: row.surface ?? '',
    precioHora: row.pricePerHour,
    fotoUrl: row.photoUrl ?? undefined,
    estado: row.status ? ESTADO_CANCHA_A_ESPANOL[row.status] : undefined,
    habilitada: row.enabled ?? undefined,
    descripcion: row.description ?? undefined,
    horaApertura: row.openTime ?? undefined,
    horaCierre: row.closeTime ?? undefined,
  }
}

export function useCanchas() {
  return useQuery({
    queryKey: ['canchas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/courts/disponibilidad', {
        params: { fecha: fechaHoy() },
      })
      return (data as CourtAvailabilityApiRow[]).map(mapCourtToCancha)
    },
  })
}

// A diferencia de useCanchas() (que solo trae canchas habilitadas, para
// Calendario/Nueva Reserva — nadie debería poder reservar en una cancha
// "eliminada"), esta lista TODAS las canchas, incluidas las desactivadas,
// para la pantalla de administración de Canchas: si no se ven las
// desactivadas ahí, no hay forma de reactivarlas.
export function useTodasLasCanchas() {
  return useQuery({
    queryKey: ['canchas', 'todas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/courts')
      return (data as CourtApiRow[]).map(mapCourtToCancha)
    },
  })
}

const ESTADO_PAGO_A_ESPANOL: Record<string, Alquiler['estadoPago']> = {
  PAID: 'PAGADO',
  PARTIAL: 'PARCIAL',
  PENDING: 'PENDIENTE',
}

const TIPO_RESERVA_A_ESPANOL: Record<string, NonNullable<Alquiler['tipoReserva']>> = {
  SINGLE: 'UNICA',
  MULTIDAY: 'MULTIDIA',
  RECURRING: 'RECURRENTE',
}

const MODO_PAGO_A_ESPANOL: Record<string, NonNullable<Alquiler['serieModoPago']>> = {
  INDIVIDUAL: 'INDIVIDUAL',
  LUMP_SUM: 'ACUMULADO',
}

export function mapBookingToAlquiler(row: BookingApiRow): Alquiler {
  return {
    id: row.id,
    canchaId: row.courtId,
    canchaNombre: row.court?.name ?? '',
    clienteId: row.customerId ?? null,
    clienteNombre: row.customerName,
    tipo: row.type ?? undefined,
    fecha: String(row.date).slice(0, 10),
    horaInicio: String(row.startTime).slice(11, 16),
    horaFin: String(row.endTime).slice(11, 16),
    estado: row.status,
    estadoPago: ESTADO_PAGO_A_ESPANOL[row.paymentStatus] ?? 'PENDIENTE',
    montoTotal: row.totalAmount,
    montoPagado: row.paidAmount,
    tipoReserva: row.bookingType ? TIPO_RESERVA_A_ESPANOL[row.bookingType] : undefined,
    serieId: row.seriesId ?? undefined,
    serieModoPago: row.seriesPaymentMode ? MODO_PAGO_A_ESPANOL[row.seriesPaymentMode] : undefined,
    serieEtiqueta: row.seriesLabel ?? undefined,
    serieTotalFechas: row.seriesTotalDates ?? undefined,
    serieIndice: row.seriesIndex ?? undefined,
  }
}

// GET /bookings sin filtro de status devuelve TODAS las reservas, incluidas
// las CANCELLED (el botón "Eliminar" de Gestión de Reservas cancela en el
// backend, pero la fila seguía apareciendo en la lista porque nunca se
// excluía por estado). Ninguna pantalla del sistema quiere tratar una
// reserva cancelada como activa (disponibilidad, listados, estadísticas de
// cliente, etc.), así que se filtra acá, en la fuente, para todos los
// consumidores de este hook.
export function useReservas() {
  return useQuery({
    queryKey: ['alquileres'],
    queryFn: async () => {
      const { data } = await apiClient.get('/bookings')
      return (data as BookingApiRow[])
        .map(mapBookingToAlquiler)
        .filter((a) => a.estado !== 'CANCELLED')
    },
  })
}

async function fetchBloqueosDeFecha(fecha: string): Promise<Bloqueo[]> {
  const { data } = await apiClient.get('/courts/disponibilidad', {
    params: { fecha },
  })
  const bloqueos: Bloqueo[] = []
  for (const court of data as CourtAvailabilityApiRow[]) {
    for (const block of court.scheduleBlocks ?? []) {
      bloqueos.push({
        id: block.id,
        canchaId: court.id,
        canchaNombre: court.name,
        fecha,
        hora: String(block.time).slice(11, 16),
        motivo: '',
      })
    }
  }
  return bloqueos
}

export function useBloqueos(fecha: string) {
  return useQuery({
    queryKey: ['bloqueos', fecha],
    enabled: Boolean(fecha),
    queryFn: () => fetchBloqueosDeFecha(fecha),
  })
}

// Igual que useBloqueos, pero para varias fechas a la vez (ej. los 7 días de
// la vista Semana del Calendario, que antes no mostraba mantenimientos para
// nada porque solo se pedían los bloqueos del día seleccionado en la vista
// Día). Comparte cache con useBloqueos: misma queryKey por fecha.
export function useBloqueosRango(fechas: string[]) {
  const resultados = useQueries({
    queries: fechas.map((fecha) => ({
      queryKey: ['bloqueos', fecha],
      enabled: Boolean(fecha),
      queryFn: () => fetchBloqueosDeFecha(fecha),
    })),
  })
  return {
    data: resultados.flatMap((r) => r.data ?? []),
    isLoading: resultados.some((r) => r.isLoading),
  }
}

export interface ProgramarMantenimientoInput {
  canchaId: number
  /** YYYY-MM-DD, una por fecha de la serie (el frontend calcula la recurrencia). */
  fechas: string[]
  horaInicio: string
  horaFin: string
  motivo?: string
}

// RF07/RF32 — bloquea una o varias franjas por mantenimiento (una sola fecha
// o una serie recurrente calculada en el frontend, igual que las reservas
// recurrentes). Invalida 'bloqueos' de forma difusa para que se refresque
// cualquier fecha que se esté viendo en el Calendario.
export function useProgramarMantenimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProgramarMantenimientoInput) => {
      const { data } = await apiClient.post(`/courts/${input.canchaId}/bloqueos/serie`, {
        dates: input.fechas,
        startTime: input.horaInicio,
        endTime: input.horaFin,
        reason: input.motivo || undefined,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] })
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] })
    },
  })
}

export interface BloqueMantenimiento {
  id: number
  fecha: string
  hora: string
  motivo: string
}

interface ScheduleBlockApiRow {
  id: number
  date: string
  time: string
  reason?: string | null
}

// Mantenimientos programados (desde hoy en adelante) de una cancha, para
// poder verlos y cancelarlos si alguien se equivocó — antes solo se podían
// crear, no había forma de deshacerlos desde la interfaz (aunque el
// endpoint para borrar un bloqueo ya existía).
export function useMantenimientosProgramados(canchaId: number | null) {
  return useQuery({
    queryKey: ['mantenimientos', canchaId],
    enabled: canchaId != null,
    queryFn: async () => {
      const { data } = await apiClient.get(`/courts/${canchaId}/bloqueos/proximos`)
      return (data as ScheduleBlockApiRow[]).map(
        (row): BloqueMantenimiento => ({
          id: row.id,
          fecha: String(row.date).slice(0, 10),
          hora: String(row.time).slice(11, 16),
          motivo: row.reason ?? '',
        }),
      )
    },
  })
}

export function useCancelarMantenimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blockId: number) => {
      await apiClient.delete(`/courts/bloqueos/${blockId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] })
      queryClient.invalidateQueries({ queryKey: ['bloqueos'] })
    },
  })
}
