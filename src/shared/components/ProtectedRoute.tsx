import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

/**
 * Envuelve las pantallas autenticadas (Panel, Calendario, Reservas,
 * Clientes, Canchas, Ajustes...). Si no hay sesión activa (ni en
 * memoria ni restaurada desde localStorage), redirige a /login en
 * vez de dejar ver la pantalla. Se reemplaza por una verificación
 * real de JWT/cookie de sesión cuando el backend esté conectado
 * (Sprint 2).
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
