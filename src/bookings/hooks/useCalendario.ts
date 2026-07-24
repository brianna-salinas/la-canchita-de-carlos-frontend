import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'
import { toISODate } from '../../shared/utils/date'
import type { Booking } from '../../dashboard/hooks/usePanelData'

export interface Court {
  id: number
  name: string
  sport: string
  surface: string
  pricePerHour: number
  status?: 'ACTIVE' | 'MAINTENANCE'
  photoUrl?: string
  description?: string
  enabled?: boolean
  openTime?: string
  closeTime?: string
}

export interface ScheduleBlock {
  id: number
  courtId: number
  courtName: string
  date: string
  time: string
  reason: string
}

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

function today(): string {
  return toISODate(new Date())
}

function mapCourtRow(row: CourtApiRow): Court {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    surface: row.surface ?? '',
    pricePerHour: row.pricePerHour,
    photoUrl: row.photoUrl ?? undefined,
    status: row.status === 'MAINTENANCE' || row.status === 'ACTIVE' ? row.status : undefined,
    enabled: row.enabled ?? undefined,
    description: row.description ?? undefined,
    openTime: row.openTime ?? undefined,
    closeTime: row.closeTime ?? undefined,
  }
}

export function useCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/courts/disponibilidad', {
        params: { fecha: today() },
      })
      return (data as CourtAvailabilityApiRow[]).map(mapCourtRow)
    },
  })
}

export function useAllCourts() {
  return useQuery({
    queryKey: ['courts', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get('/courts')
      return (data as CourtApiRow[]).map(mapCourtRow)
    },
  })
}

export function mapBookingRow(row: BookingApiRow): Booking {
  return {
    id: row.id,
    courtId: row.courtId,
    courtName: row.court?.name ?? '',
    customerId: row.customerId ?? null,
    customerName: row.customerName,
    type: row.type ?? undefined,
    date: String(row.date).slice(0, 10),
    startTime: String(row.startTime).slice(11, 16),
    endTime: String(row.endTime).slice(11, 16),
    status: row.status,
    // Se dejan tal como los manda el backend (PAID/PARTIAL/PENDING, etc.);
    // la traducción a español se hace solo al renderizar.
    paymentStatus: (row.paymentStatus as Booking['paymentStatus']) ?? 'PENDING',
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    bookingType: row.bookingType as Booking['bookingType'],
    seriesId: row.seriesId ?? undefined,
    seriesPaymentMode: row.seriesPaymentMode as Booking['seriesPaymentMode'],
    seriesLabel: row.seriesLabel ?? undefined,
    seriesTotalDates: row.seriesTotalDates ?? undefined,
    seriesIndex: row.seriesIndex ?? undefined,
  }
}

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/bookings')
      return (data as BookingApiRow[])
        .map(mapBookingRow)
        .filter((b) => b.status !== 'CANCELLED')
    },
  })
}

async function fetchScheduleBlocksForDate(date: string): Promise<ScheduleBlock[]> {
  const { data } = await apiClient.get('/courts/disponibilidad', {
    params: { fecha: date },
  })
  const blocks: ScheduleBlock[] = []
  for (const court of data as CourtAvailabilityApiRow[]) {
    for (const block of court.scheduleBlocks ?? []) {
      blocks.push({
        id: block.id,
        courtId: court.id,
        courtName: court.name,
        date,
        time: String(block.time).slice(11, 16),
        reason: '',
      })
    }
  }
  return blocks
}

export function useScheduleBlocks(date: string) {
  return useQuery({
    queryKey: ['scheduleBlocks', date],
    enabled: Boolean(date),
    queryFn: () => fetchScheduleBlocksForDate(date),
  })
}

export function useScheduleBlocksRange(dates: string[]) {
  const resultados = useQueries({
    queries: dates.map((date) => ({
      queryKey: ['scheduleBlocks', date],
      enabled: Boolean(date),
      queryFn: () => fetchScheduleBlocksForDate(date),
    })),
  })
  return {
    data: resultados.flatMap((r) => r.data ?? []),
    isLoading: resultados.some((r) => r.isLoading),
  }
}

export interface ScheduleMaintenanceInput {
  courtId: number
  /** YYYY-MM-DD, una por fecha de la serie (el frontend calcula la recurrencia). */
  dates: string[]
  startTime: string
  endTime: string
  reason?: string
}

export function useScheduleMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ScheduleMaintenanceInput) => {
      const { data } = await apiClient.post(`/courts/${input.courtId}/bloqueos/serie`, {
        dates: input.dates,
        startTime: input.startTime,
        endTime: input.endTime,
        reason: input.reason || undefined,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['maintenanceBlocks'] })
    },
  })
}

export interface MaintenanceBlock {
  id: number
  date: string
  time: string
  reason: string
}

interface MaintenanceBlockApiRow {
  id: number
  date: string
  time: string
  reason?: string | null
}

export function useUpcomingMaintenance(courtId: number | null) {
  return useQuery({
    queryKey: ['maintenanceBlocks', courtId],
    enabled: courtId != null,
    queryFn: async () => {
      const { data } = await apiClient.get(`/courts/${courtId}/bloqueos/proximos`)
      return (data as MaintenanceBlockApiRow[]).map(
        (row): MaintenanceBlock => ({
          id: row.id,
          date: String(row.date).slice(0, 10),
          time: String(row.time).slice(11, 16),
          reason: row.reason ?? '',
        }),
      )
    },
  })
}

export function useCancelMaintenanceBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blockId: number) => {
      await apiClient.delete(`/courts/bloqueos/${blockId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] })
    },
  })
}
