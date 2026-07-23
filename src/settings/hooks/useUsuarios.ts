import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface Usuario {
  id: number
  nombre: string
  correo: string
  esDueno: boolean
  estado: 'ACTIVO' | 'INACTIVO'
  /** ISO timestamp del último acceso, usado para el "Activo hace Xh". */
  ultimoAcceso?: string
  fotoUrl?: string
}

interface UsuarioApiRow {
  id: number
  name: string
  email: string
  isOwner: boolean
  lastAccess?: string | null
  // Antes el backend no incluía esto en el listado (se pensaba como
  // "listado liviano"), así que ningún administrador mostraba su foto acá.
  photoUrl?: string | null
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users')
      return (data as UsuarioApiRow[]).map(
        (row): Usuario => ({
          id: row.id,
          nombre: row.name,
          correo: row.email,
          esDueno: row.isOwner,
          estado: 'ACTIVO',
          ultimoAcceso: row.lastAccess ?? undefined,
          fotoUrl: row.photoUrl ?? undefined,
        }),
      )
    },
  })
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/users/${userId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function formatActivoHace(iso?: string) {
  if (!iso) return 'Sin actividad registrada'
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.max(1, Math.round(diffMs / 60000))
  if (minutos < 60) return `Activo hace ${minutos}m`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `Activo hace ${horas}h`
  const dias = Math.round(horas / 24)
  return `Activo hace ${dias}d`
}
