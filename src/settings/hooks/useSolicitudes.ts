import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'
import { getApiErrorMessage } from '../../shared/utils/api-error'

export interface AccessRequest {
  id: number
  name: string
  email: string
  /** ISO timestamp de cuándo se envió la solicitud. */
  createdAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export function formatLongDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}

export function formatRelativeDate(iso: string) {
  const fecha = new Date(iso)
  const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  const mismodia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (mismodia(fecha, hoy)) return `Hoy, ${hora}`
  if (mismodia(fecha, ayer)) return `Ayer, ${hora}`
  return formatLongDate(iso)
}

interface AccessRequestApiRow {
  id: number
  name: string
  email: string
  createdAt: string
}

export function useAccessRequests() {
  return useQuery({
    queryKey: ['accessRequests'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/solicitudes')
      return (data as AccessRequestApiRow[]).map(
        (row): AccessRequest => ({
          id: row.id,
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
          status: 'PENDING',
        }),
      )
    },
  })
}

export function useApproveAccessRequest() {
  const queryClient = useQueryClient()
  return async (request: AccessRequest) => {
    try {

      await apiClient.patch(`/users/solicitudes/${request.id}/autorizar`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accessRequests'] }),
        queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
      ])
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo aprobar la solicitud. Intenta de nuevo.'))
    }
  }
}

export function useRejectAccessRequest() {
  const queryClient = useQueryClient()
  return async (id: number) => {
    try {
      await apiClient.patch(`/users/solicitudes/${id}/rechazar`)
      await queryClient.invalidateQueries({ queryKey: ['accessRequests'] })
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'No se pudo rechazar la solicitud. Intenta de nuevo.'))
    }
  }
}
