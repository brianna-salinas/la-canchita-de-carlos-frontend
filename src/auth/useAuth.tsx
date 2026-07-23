import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient, setToken, getToken } from "../shared/api/client";

// La signed URL de la foto de perfil (bucket privado en Supabase) vence a la
// hora. Antes solo se obtenia una vez (login o al subirla) y quedaba fija en
// localStorage, asi que pasada la hora la foto "desaparecia sola" del navbar
// aunque siguiera en el bucket. Se renueva pidiendo /users/me bastante antes
// de que venza.
const INTERVALO_REFRESCO_FOTO_MS = 45 * 60 * 1000;

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  esDueno: boolean;
  fotoUrl?: string;
  nombreUsuario?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (cambios: Partial<AuthUser>) => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!getToken()) return null;
    return leerUsuarioGuardado();
  });

  async function login(usuario: string, password: string) {
    const { data } = await apiClient.post("/auth/login", {
      usernameOrEmail: usuario,
      password,
    });

    setToken(data.accessToken);

    const nuevoUsuario: AuthUser = {
      id: data.user.id,
      nombre: data.user.name,
      correo: data.user.email,
      esDueno: !!data.user.isOwner,
      // Antes se derivaba del correo (data.user.email.split('@')[0]) porque
      // el backend nunca mandaba el username real; ya lo manda, así que se
      // usa directamente.
      nombreUsuario: data.user.username,
      // Antes el login nunca devolvia la foto de perfil, asi que tras cada
      // inicio de sesion se perdia (solo quedaba si ya estaba en localStorage
      // de una sesion anterior). Ahora el backend la resuelve a signed URL.
      fotoUrl: data.user.photoUrl ?? undefined,
    };

    setUser(nuevoUsuario);
    guardarUsuario(nuevoUsuario);
  }

  function logout() {
    void apiClient.post("/auth/logout").catch(() => {});
    setToken(null);
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

  useEffect(() => {
    if (!user) return;

    let cancelado = false;
    async function refrescarFoto() {
      try {
        const { data } = await apiClient.get("/users/me");
        if (!cancelado) updateUser({ fotoUrl: data.photoUrl ?? undefined });
      } catch {
        // Si falla (sin red, sesion vencida, etc.) se deja la foto como
        // estaba; el proximo intento programado lo vuelve a resolver.
      }
    }

    refrescarFoto();
    const id = setInterval(refrescarFoto, INTERVALO_REFRESCO_FOTO_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
    // Solo se re-arma el intervalo cuando cambia de usuario (login/logout),
    // no en cada cambio de `user` (evitaria un loop, ya que refrescarFoto
    // tambien actualiza `user`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
  {children}
  </AuthContext.Provider>
);
}

// Hook ubicado a propósito junto a su Provider (patrón estándar de React
// Context); no es un componente, pero exportarlo desde aquí es intencional.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
