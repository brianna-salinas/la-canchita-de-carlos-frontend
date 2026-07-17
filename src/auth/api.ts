import { apiClient } from '../shared/api/client'

interface RequestAccessPayload {
  nombre: string
  correo: string
  telefono: string
  password: string
}

/**
 * Fase de fake API (Sprint 1): crea una "solicitud" en json-server con
 * estado PENDIENTE. Se reemplaza por POST /api/users/solicitudes
 * (US20, TS05) en el Sprint 2, contra el backend real.
 */
export async function requestAccess(payload: RequestAccessPayload) {
  const { data: existentes } = await apiClient.get('/usuarios', {
    params: { correo: payload.correo },
  })

  if (existentes.length > 0) {
    // US20, Escenario 2: correo ya registrado
    throw new Error('Correo ya registrado')
  }

  return apiClient.post('/usuarios', {
    ...payload,
    estado: 'PENDIENTE',
    esDueno: false,
    creadoEn: new Date().toISOString(),
  })
}
