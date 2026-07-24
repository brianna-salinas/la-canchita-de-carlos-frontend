/**
 * Validaciones de formato en el cliente, espejo de las que ya aplica el
 * backend (platform/validation/validators.ts) para dar feedback inmediato
 * antes de golpear la red — el backend sigue siendo la fuente de verdad,
 * esto solo evita el viaje redondo para errores obvios.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  const isLocal = digits.length === 9 && digits.startsWith('9')
  const hasCountryCode = digits.length === 11 && digits.startsWith('519')
  return isLocal || hasCountryCode
}

export function isValidPrice(value: string): boolean {
  if (!value.trim()) return false
  const num = Number(value)
  return Number.isFinite(num) && num > 0
}
