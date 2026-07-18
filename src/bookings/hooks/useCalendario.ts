import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'
import type { Alquiler } from '../../dashboard/hooks/usePanelData'

export interface Cancha {
  id: number
  nombre: string
  deporte: string
  superficie: string
  precioHora: number
  // Campos de gestión (pantalla Canchas). Opcionales porque db.json
  // todavía no los trae para todas las canchas de ejemplo.
  estado?: 'ACTIVA' | 'MANTENIMIENTO'
  fotoUrl?: string
  descripcion?: string
  habilitada?: boolean
}

export interface Bloqueo {
  id: number
  canchaId: number
  canchaNombre: string
  fecha: string
  hora: string
  motivo: string
}

// Trae las canchas desde el fake API (json-server). Se reemplaza por
// GET /api/courts (US26-US30) cuando el backend esté conectado
// (Sprint 2).
export function useCanchas() {
  return useQuery({
    queryKey: ['canchas'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cancha[]>('/canchas')
      return data
    },
  })
}

// Mismo queryKey que useAlquileresHoy (Panel) a propósito: Panel y
// Calendario muestran el mismo dataset de reservas, no dos copias
// distintas. Se reemplaza por GET /api/bookings (US17-US19) cuando el
// backend esté conectado (Sprint 2).
export function useReservas() {
  return useQuery({
    queryKey: ['alquileres'],
    queryFn: async () => {
      const { data } = await apiClient.get<Alquiler[]>('/alquileres')
      return data
    },
  })
}

// Bloqueos manuales de horario (mantenimiento, etc.), separados de
// las reservas. Se reemplaza por GET /api/court-blocks (RF32) cuando
// el backend esté conectado (Sprint 2).
export function useBloqueos() {
  return useQuery({
    queryKey: ['bloqueos'],
    queryFn: async () => {
      const { data } = await apiClient.get<Bloqueo[]>('/bloqueos')
      return data
    },
  })
}
