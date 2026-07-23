import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'

export interface Notificacion {
  id: number
  titulo: string
  descripcion: string
  hora: string
  leida: boolean
}

interface NotificationApiRow {
  id: number
  title: string
  message?: string | null
  read: boolean
  createdAt: string
}

function formatHoraRelativa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.max(0, Math.round(diffMs / 60000))
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Hace ${horas}h`
  const dias = Math.round(horas / 24)
  return `Hace ${dias}d`
}

// La campanita de notificaciones (in-app, entre administradores) antes
// arrancaba con una lista vacía fija y nunca se conectaba al backend, que sí
// tiene un módulo funcional (GET/PATCH /notifications) usado para avisar de
// nuevas reservas, mantenimiento, etc. Se refresca cada minuto para que
// lleguen avisos de otros administradores sin tener que recargar la página.
export function useNotificaciones() {
  return useQuery({
    queryKey: ['notificaciones'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications')
      return (data as NotificationApiRow[]).map(
        (row): Notificacion => ({
          id: row.id,
          titulo: row.title,
          descripcion: row.message ?? '',
          hora: formatHoraRelativa(row.createdAt),
          leida: row.read,
        }),
      )
    },
  })
}

export function useMarcarNotificacionLeida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/notifications/${id}/leida`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })
}
