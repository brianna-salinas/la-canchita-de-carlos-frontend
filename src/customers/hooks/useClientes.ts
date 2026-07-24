import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/api/client'

export interface Customer {
  id: number
  name: string
  phone: string
  documentNumber?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

interface CustomerApiRow {
  id: number
  name: string
  phone: string
  documentNumber?: string | null
  status?: string
}

function mapCustomerRow(row: CustomerApiRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    documentNumber: row.documentNumber ?? undefined,
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  }
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await apiClient.get('/customers')
      return (data as CustomerApiRow[]).map(mapCustomerRow)
    },
  })
}
