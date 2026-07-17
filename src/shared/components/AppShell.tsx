import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Search,
  Bell,
  HelpCircle,
  LayoutGrid,
  Calendar,
  Users,
  Goal,
  Settings,
  User,
} from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import Sidebar from './Sidebar'

/** Foto de perfil del usuario, o un ícono redondo genérico si no tiene una. */
function UserAvatar({ fotoUrl, size = 'h-9 w-9' }: { fotoUrl?: string; size?: string }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt="Foto de perfil"
        className={`${size} rounded-full object-cover`}
      />
    )
  }
  return (
    <span
      className={`${size} rounded-full bg-neutral-200 flex items-center justify-center shrink-0`}
    >
      <User className="h-1/2 w-1/2 text-neutral-500" />
    </span>
  )
}

const MOBILE_NAV_ITEMS = [
  { to: '/panel', label: 'Panel', icon: LayoutGrid },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/canchas', label: 'Canchas', icon: Goal },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

interface AppShellProps {
  /** Título mostrado en el buscador superior, ej. "Buscar reservas o clientes..." */
  searchPlaceholder?: string
  /** Muestra la barra de búsqueda superior. Desactívala en pantallas
   * que no listan/filtran registros (ej. Panel). Por defecto: true. */
  showSearch?: boolean
  /** Contenido extra que se muestra dentro del header oscuro móvil,
   * debajo del logo (ej. el saludo "Hoy, {fecha}" del Panel). Se
   * ignora en desktop. */
  mobileHero?: ReactNode
  children: ReactNode
}

/**
 * Layout compartido para todas las pantallas autenticadas (Panel,
 * Calendario, Reservas, Clientes, Canchas, Ajustes). En desktop:
 * Sidebar de navegación + barra superior con buscador. En mobile:
 * header oscuro con logo/notificaciones/usuario + barra de
 * navegación inferior fija.
 */
export default function AppShell({
  searchPlaceholder = 'Buscar reservas o clientes...',
  showSearch = true,
  mobileHero,
  children,
}: AppShellProps) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header oscuro (solo mobile) */}
        <header className="md:hidden bg-[#0F172A] text-white rounded-b-3xl px-5 pt-5 pb-6">
          <div className="flex items-center justify-between">
            <button
              className="relative text-white/80 hover:text-white"
              aria-label="Notificaciones"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-sans text-sm font-semibold leading-none">
                  {user?.nombre ?? 'carlitos_admin'}
                </p>
                <p className="font-sans text-xs text-neutral-400 mt-0.5">
                  {user?.esDueno ? 'Administrador Principal' : 'Administrador'}
                </p>
              </div>
              <UserAvatar fotoUrl={user?.fotoUrl} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <img
              src="/assets/logo.png"
              alt="Logo La Canchita de Carlos"
              className="h-10 w-10 rounded-full object-cover"
            />
            <p className="font-display font-bold text-xl leading-none">
              <span className="text-white">La Canchita</span>
              <br />
              <span className="text-brand-secondary">de Carlos</span>
            </p>
          </div>

          {mobileHero && <div className="mt-6">{mobileHero}</div>}
        </header>

        {/* Barra superior (solo desktop) */}
        <header className="hidden md:flex items-center gap-4 px-8 py-4 bg-white border-b border-neutral-200">
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            <button
              className="relative text-neutral-500 hover:text-neutral-700"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
            </button>
            <button
              className="text-neutral-500 hover:text-neutral-700"
              aria-label="Ayuda"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="h-8 w-px bg-neutral-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-sans text-sm font-semibold text-neutral-900 leading-none">
                  {user?.nombre ?? 'carlitos_admin'}
                </p>
                <p className="font-sans text-xs text-neutral-500 mt-0.5">
                  {user?.esDueno ? 'Administrador Principal' : 'Administrador'}
                </p>
              </div>
              <UserAvatar fotoUrl={user?.fotoUrl} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 pb-24 md:p-8 md:pb-8 relative">
          {children}
        </main>
      </div>

      {/* Barra de navegación inferior (solo mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 flex items-stretch z-30">
        {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 font-sans text-[11px] ${
                isActive ? 'text-brand-primary' : 'text-neutral-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center h-9 w-9 rounded-xl ${
                    isActive ? 'bg-brand-primary/10' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
