import { apiClient } from '../shared/api/client'

interface RequestAccessPayload {
  name: string
  email: string
  phone: string
  password: string
}

export async function requestAccess(payload: RequestAccessPayload) {
  return apiClient.post('/users/solicitudes', {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
  })
}
