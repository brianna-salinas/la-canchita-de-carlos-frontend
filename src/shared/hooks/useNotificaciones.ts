import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'

export interface Notification {
  id: number
  title: string
  message: string
  relativeTime: string
  read: boolean
}

interface NotificationApiRow {
  id: number
  title: string
  message?: string | null
  read: boolean
  createdAt: string
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.max(0, Math.round(diffMs / 60000))
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Hace ${horas}h`
  const dias = Math.round(horas / 24)
  return `Hace ${dias}d`
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications')
      return (data as NotificationApiRow[]).map(
        (row): Notification => ({
          id: row.id,
          title: row.title,
          message: row.message ?? '',
          relativeTime: formatRelativeTime(row.createdAt),
          read: row.read,
        }),
      )
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
