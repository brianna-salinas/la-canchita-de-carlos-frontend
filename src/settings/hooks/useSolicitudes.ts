import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'
import { getApiErrorMessage } from '../../shared/utils/api-error'

export interface Solicitud {
  id: number
  nombre: string
  correo: string
  /** ISO timestamp de cuándo se envió la solicitud. */
  creadoEn: string
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
}

export function formatFechaLarga(iso: string) {
  return new Date(iso)
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}

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

interface SolicitudApiRow {
  id: number
  name: string
  email: string
  createdAt: string
}

export function useSolicitudes() {
  return useQuery({
    queryKey: ['solicitudes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/solicitudes')
      return (data as SolicitudApiRow[]).map(
        (row): Solicitud => ({
          id: row.id,
          nombre: row.name,
          correo: row.email,
          creadoEn: row.createdAt,
          estado: 'PENDIENTE',
        }),
      )
    },
  })
}

export function useAprobarSolicitud() {
  const queryClient = useQueryClient()
  return async (solicitud: Solicitud) => {
    try {

      await apiClient.patch(`/users/solicitudes/${solicitud.id}/autorizar`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
        queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
      ])
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo aprobar la solicitud. Intenta de nuevo.'))
    }
  }
}

export function useRechazarSolicitud() {
  const queryClient = useQueryClient()
  return async (id: number) => {
    try {
      await apiClient.patch(`/users/solicitudes/${id}/rechazar`)
      await queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo rechazar la solicitud. Intenta de nuevo.'))
    }
  }
}
