import { apiClient } from '../shared/api/client'

interface RequestAccessPayload {
  nombre: string
  correo: string
  telefono: string
  password: string
}

export async function requestAccess(payload: RequestAccessPayload) {
  return apiClient.post('/users/solicitudes', {
    name: payload.nombre,
    email: payload.correo,
    phone: payload.telefono,
    password: payload.password,
  })
}
