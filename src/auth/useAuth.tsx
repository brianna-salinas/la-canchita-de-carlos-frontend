import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiClient } from "../shared/api/client";

interface AuthUser {
  id: string;
  nombre: string;
  correo: string;
  esDueno: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Fase de fake API (Sprint 1): valida contra json-server buscando un
 * usuario por correo/usuario y comparando la contraseña en texto plano
 * (db.json). Se reemplaza por el endpoint real POST /api/auth/login
 * (TS02) en el Sprint 2, con hash bcrypt y JWT en el backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  async function login(usuario: string, password: string) {
    const { data } = await apiClient.get("/usuarios", {
      params: { correo: usuario },
    });

    const found = data[0];
    if (!found || found.password !== password) {
      // US01, Escenario 2: credenciales inválidas rechazadas
      throw new Error("Credenciales inválidas");
    }

    setUser({
      id: found.id,
      nombre: found.nombre,
      correo: found.correo,
      esDueno: !!found.esDueno,
    });
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
  {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}