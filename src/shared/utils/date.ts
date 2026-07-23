/**
 * Helpers de fecha/hora compartidos entre Calendario y Panel (antes cada
 * pantalla tenía su propia copia de estas funciones).
 */

/** Date -> "YYYY-MM-DD" en hora local (no UTC, para no desfasar el día). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "18:00" -> 18 */
export function hourToNum(h: string): number {
  return parseInt(h.split(':')[0], 10)
}

/** Date -> "HH:mm" en hora local, para comparar contra un <input type="time">. */
export function toHHmm(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** Lunes de la semana que contiene `date`, a las 00:00. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=domingo..6=sábado
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Los 7 días (lunes a domingo) de la semana que contiene `date`. */
export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}
