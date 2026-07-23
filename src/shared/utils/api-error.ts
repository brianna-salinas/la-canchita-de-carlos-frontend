import axios from 'axios'

/**
 * El backend real siempre responde los errores como { error: "mensaje en
 * español" } (ver platform/middlewares/error.middleware.ts). Este helper
 * centraliza cómo extraer ese mensaje desde cualquier catch, en vez de que
 * cada pantalla muestre un texto genérico que oculta la razón real
 * (ej. "no puedes desactivar al único dueño", "ese usuario ya existe").
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(err)) {
    return err.response?.data?.error ?? fallback
  }
  return fallback
}
