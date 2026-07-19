/**
 * Helpers de formato compartidos por las pantallas de gestión
 * (Clientes, Reservas, Ajustes, Solicitudes...). Antes cada pantalla
 * tenía su propia copia de "iniciales"/"formatFecha" con pequeñas
 * variaciones; centralizarlos evita que diverjan con el tiempo.
 */

/** "Juan Pérez" -> "JP" (máximo 2 iniciales, siempre en mayúscula). */
export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

/** "2026-07-11" -> "11 jul 2026". */
export function formatFecha(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`)
  return d
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '')
}
