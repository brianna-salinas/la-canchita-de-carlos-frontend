

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

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato no válido. Solo se aceptan imágenes JPG, PNG o WEBP.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'La imagen pesa más de 5 MB. Elige una imagen más liviana.'
  }
  return null
}
