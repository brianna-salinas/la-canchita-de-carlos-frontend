import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface AdminUser {
  id: number
  name: string
  email: string
  isOwner: boolean
  status: 'ACTIVE' | 'INACTIVE'
  /** ISO timestamp del último acceso, usado para el "Activo hace Xh". */
  lastAccess?: string
  photoUrl?: string
}

interface AdminUserApiRow {
  id: number
  name: string
  email: string
  isOwner: boolean
  lastAccess?: string | null
  photoUrl?: string | null
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users')
      return (data as AdminUserApiRow[]).map(
        (row): AdminUser => ({
          id: row.id,
          name: row.name,
          email: row.email,
          isOwner: row.isOwner,
          status: 'ACTIVE',
          lastAccess: row.lastAccess ?? undefined,
          photoUrl: row.photoUrl ?? undefined,
        }),
      )
    },
  })
}

export function useDeactivateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/users/${userId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  })
}

export function formatLastActive(iso?: string) {
  if (!iso) return 'Sin actividad registrada'
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.max(1, Math.round(diffMs / 60000))
  if (minutos < 60) return `Activo hace ${minutos}m`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Activo hace ${horas}h`
  const dias = Math.round(horas / 24)
  return `Activo hace ${dias}d`
}
