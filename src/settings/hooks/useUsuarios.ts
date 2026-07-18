import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  esDueno: boolean
  estado: 'ACTIVO' | 'INACTIVO'
  /** ISO timestamp del último acceso, usado para el "Activo hace Xh". */
  ultimoAcceso?: string
}

// Cuentas de administrador/personal con acceso otorgado. Se reemplaza
// por GET /api/users (RF de administración de cuentas) cuando el
// backend esté conectado (Sprint 2). Por ahora apunta al fake API.
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await apiClient.get<Usuario[]>('/usuarios')
      return data
    },
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
