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

export async function forgotPassword(email: string) {
  return apiClient.post('/auth/olvide-password', { email })
}

export async function resetPassword(token: string, newPassword: string) {
  return apiClient.post('/auth/restablecer-password', { token, newPassword })
}
