import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient, setToken, getToken } from "../shared/api/client";

const INTERVALO_REFRESCO_FOTO_MS = 45 * 60 * 1000;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  isOwner: boolean;
  photoUrl?: string;
  username?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (changes: Partial<AuthUser>) => void;
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

  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!getToken()) return null;
    return leerUsuarioGuardado();
  });

  async function login(usernameOrEmail: string, password: string) {
    const { data } = await apiClient.post("/auth/login", {
      usernameOrEmail,
      password,
    });

    setToken(data.accessToken);

    const nuevoUsuario: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      isOwner: !!data.user.isOwner,
      username: data.user.username,
      photoUrl: data.user.photoUrl ?? undefined,
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

  function updateUser(changes: Partial<AuthUser>) {
    setUser((actual) => {
      if (!actual) return actual;
      const actualizado = { ...actual, ...changes };
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
        if (!cancelado) updateUser({ photoUrl: data.photoUrl ?? undefined });
      } catch {

      }
    }

    refrescarFoto();
    const id = setInterval(refrescarFoto, INTERVALO_REFRESCO_FOTO_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };

  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
  {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
