/**
 * Helpers de formato compartidos por las pantallas de gestión
 * (Clientes, Reservas, Ajustes, Solicitudes...). Antes cada pantalla
 * tenía su propia copia de "initials"/"formatDate" con pequeñas
 * variaciones; centralizarlos evita que diverjan con el tiempo.
 */

/** "Juan Pérez" -> "JP" (máximo 2 iniciales, siempre en mayúscula). */
export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

/** "2026-07-11" -> "11 jul 2026". */
export function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`)
  return d
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}
