import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface Cliente {
  id: number
  nombre: string
  telefono: string
  dni?: string
  // "ACTIVO" | "INACTIVO" — opcional porque db.json todavía no lo
  // trae para todos los clientes de ejemplo. Si falta, la UI lo
  // trata como "ACTIVO" por defecto.
  estado?: 'ACTIVO' | 'INACTIVO'
  fotoUrl?: string
}

// Trae todos los clientes del fake API (json-server). Se reemplaza
// por GET /api/customers (RF09, Subdominio Customers) cuando el
// backend esté conectado (Sprint 2).
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cliente[]>('/clientes')
      return data
    },
  })
}
