import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface Cliente {
  id: number
  nombre: string
  telefono: string
  dni?: string
  estado?: 'ACTIVO' | 'INACTIVO'
  fotoUrl?: string
}

interface CustomerApiRow {
  id: number
  name: string
  phone: string
  documentNumber?: string | null
  status?: string
  photoUrl?: string | null
}

function mapCustomerToCliente(row: CustomerApiRow): Cliente {
  return {
    id: row.id,
    nombre: row.name,
    telefono: row.phone,
    dni: row.documentNumber ?? undefined,
    estado: row.status === 'INACTIVE' ? 'INACTIVO' : 'ACTIVO',
    fotoUrl: row.photoUrl ?? undefined,
  }
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/customers')
      return (data as CustomerApiRow[]).map(mapCustomerToCliente)
    },
  })
}
