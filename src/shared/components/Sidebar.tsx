import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Calendar,
  ClipboardCheck,
  Users,
  Goal,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

const NAV_ITEMS = [
  { to: '/panel', label: 'Panel', icon: LayoutGrid },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/reservas', label: 'Reservas', icon: ClipboardCheck },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/canchas', label: 'Canchas', icon: Goal },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

/**
 * Sidebar de navegación, compartido por todas las pantallas
 * autenticadas (Panel, Calendario, Reservas, Clientes, Canchas,
 * Ajustes). Vive en shared/ porque no pertenece a un solo bounded
 * context — lo usa cualquier pantalla que necesite el layout base.
 */
export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-[#0F172A] text-white flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <img
          src="/assets/logo.png"
          alt="Logo La Canchita de Carlos"
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <p className="font-display font-bold text-2xl leading-none">
            <span className="text-white">La Canchita</span>
            <br />
            <span className="text-brand-secondary">de Carlos</span>
          </p>
        </div>
      </div>

      <p className="font-sans text-xs tracking-wide text-neutral-400 uppercase px-6 mb-2">
        {user?.isOwner ? 'Administrador Principal' : 'Administrador'}
      </p>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-brand-secondary'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-brand-secondary hover:bg-white/5"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
        <p className="font-sans text-xs text-neutral-500 px-3 mt-4">
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>
    </aside>
  )
}
