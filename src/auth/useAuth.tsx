import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiClient } from "../shared/api/client";

export interface AuthUser {
  id: string;
  nombre: string;
  correo: string;
  esDueno: boolean;
  /** URL de foto de perfil. Si no existe, la UI muestra un ícono
   * genérico de usuario en su lugar. */
  fotoUrl?: string;
  /** Nombre de usuario mostrado en Ajustes. Si el registro de
   * db.json no lo trae, se deriva del correo (antes del @). */
  nombreUsuario?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  /** Aplica cambios parciales al usuario logueado en memoria y en
   * localStorage (no pega al fake API por sí sola; eso lo hace quien
   * llama, ej. AjustesPage, antes de invocar esto). */
  updateUser: (cambios: Partial<AuthUser>) => void;
  /** Verifica la contraseña actual contra el registro real en el
   * fake API, sin persistir nada. Se reemplaza por un endpoint real
   * de verificación cuando el backend esté conectado (Sprint 2). */
  verifyPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'canchita_auth_user';

function leerUsuarioGuardado(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function guardarUsuario(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage no disponible (modo privado, etc.) — la sesión
    // simplemente no persiste entre recargas.
  }
}

/**
 * Fase de fake API (Sprint 1): valida contra json-server buscando un
 * usuario por correo/usuario y comparando la contraseña en texto plano
 * (db.json). La sesión se guarda en localStorage para sobrevivir
 * recargas de página, igual que un JWT persistido lo haría en el
 * backend real. Se reemplaza por el endpoint real POST /api/auth/login
 * (TS02) en el Sprint 2, con hash bcrypt y JWT en el backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => leerUsuarioGuardado());

  async function login(usuario: string, password: string) {
    const { data } = await apiClient.get("/usuarios", {
      params: { correo: usuario },
    });

    const found = data[0];
    if (!found || found.password !== password) {
      // US01, Escenario 2: credenciales inválidas rechazadas
      throw new Error("Credenciales inválidas");
    }

    const nuevoUsuario: AuthUser = {
      id: found.id,
      nombre: found.nombre,
      correo: found.correo,
      esDueno: !!found.esDueno,
      fotoUrl: found.fotoUrl,
      nombreUsuario: found.nombreUsuario ?? found.correo.split('@')[0],
    };

    setUser(nuevoUsuario);
    guardarUsuario(nuevoUsuario);
  }

  function logout() {
    setUser(null);
    guardarUsuario(null);
  }

  function updateUser(cambios: Partial<AuthUser>) {
    setUser((actual) => {
      if (!actual) return actual;
      const actualizado = { ...actual, ...cambios };
      guardarUsuario(actualizado);
      return actualizado;
    });
  }

  async function verifyPassword(password: string) {
    if (!user) return false;
    const { data } = await apiClient.get(`/usuarios/${user.id}`);
    return data?.password === password;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, verifyPassword }}>
  {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
