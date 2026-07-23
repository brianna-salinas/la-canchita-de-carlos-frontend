/**
 * Validaciones de formato en el cliente, espejo de las que ya aplica el
 * backend (platform/validation/validators.ts) para dar feedback inmediato
 * antes de golpear la red — el backend sigue siendo la fuente de verdad,
 * esto solo evita el viaje redondo para errores obvios.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function esCorreoValido(correo: string): boolean {
  return EMAIL_REGEX.test(correo.trim())
}

// Celulares peruanos: 9 dígitos empezando en 9, con o sin el prefijo de
// país 51 (mismo criterio que normalizePhone/assertValidPhone del backend).
export function esTelefonoValido(telefono: string): boolean {
  const digitos = telefono.replace(/\D/g, '')
  const esLocal = digitos.length === 9 && digitos.startsWith('9')
  const esConCodigoPais = digitos.length === 11 && digitos.startsWith('519')
  return esLocal || esConCodigoPais
}

export function esPrecioValido(valor: string): boolean {
  if (!valor.trim()) return false
  const num = Number(valor)
  return Number.isFinite(num) && num > 0
}
