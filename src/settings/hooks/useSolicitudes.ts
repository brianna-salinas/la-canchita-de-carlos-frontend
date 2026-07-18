import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface Solicitud {
  id: number
  nombre: string
  correo: string
  /** ISO timestamp de cuándo se envió la solicitud. */
  creadoEn: string
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
}

// "12 Oct 2023" para desktop.
export function formatFechaLarga(iso: string) {
  return new Date(iso)
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}

// "Hoy, 10:45 AM" / "Ayer, 18:20 PM" / "12 oct 2023" para mobile.
export function formatFechaRelativa(iso: string) {
  const fecha = new Date(iso)
  const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  const mismodia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (mismodia(fecha, hoy)) return `Hoy, ${hora}`
  if (mismodia(fecha, ayer)) return `Ayer, ${hora}`
  return formatFechaLarga(iso)
}

// Solicitudes de acceso de nuevos administradores/personal. Se
// reemplaza por GET /api/access-requests cuando el backend esté
// conectado (Sprint 2). Por ahora apunta al fake API.
export function useSolicitudes() {
  return useQuery({
    queryKey: ['solicitudes'],
    queryFn: async () => {
      const { data } = await apiClient.get<Solicitud[]>('/solicitudes')
      return data
    },
  })
}

export function useAprobarSolicitud() {
  const queryClient = useQueryClient()
  return async (solicitud: Solicitud) => {
    await apiClient.patch(`/solicitudes/${solicitud.id}`, { estado: 'APROBADO' })
    await apiClient.post('/usuarios', {
      nombre: solicitud.nombre,
      correo: solicitud.correo,
      password: 'canchita123',
      esDueno: false,
      estado: 'ACTIVO',
      ultimoAcceso: new Date().toISOString(),
    })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
      queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
    ])
  }
}

export function useRechazarSolicitud() {
  const queryClient = useQueryClient()
  return async (id: number) => {
    await apiClient.patch(`/solicitudes/${id}`, { estado: 'RECHAZADO' })
    await queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
  }
}
