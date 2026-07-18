import { useState, type ReactNode } from 'react'
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

interface Notificacion {
  id: number
  titulo: string
  descripcion: string
  hora: string
  leida: boolean
}

// Datos de ejemplo (fake API, Sprint 1). Se reemplaza por
// GET /api/notifications cuando el backend esté conectado (Sprint 2).
const NOTIFICACIONES_INICIALES: Notificacion[] = [
  {
    id: 1,
    titulo: 'Mantenimiento programado',
    descripcion: 'Cancha 2 no estará disponible el domingo de 22:00 a 23:00.',
    hora: 'Hace 2 h',
    leida: false,
  },
  {
    id: 2,
    titulo: 'Pago pendiente',
    descripcion: 'Lucía Fernández tiene un cobro pendiente de S/40.',
    hora: 'Hace 3 h',
    leida: false,
  },
  {
    id: 3,
    titulo: 'Nueva solicitud de acceso',
    descripcion: 'Alguien solicitó acceso como administrador.',
    hora: 'Ayer',
    leida: true,
  },
]

/** Panel desplegable de notificaciones, anclado al ícono de campana. */
function NotificationsPanel({
  notificaciones,
  align,
  onMarcarTodasLeidas,
  onClose,
}: {
  notificaciones: Notificacion[]
  align: 'left' | 'right'
  onMarcarTodasLeidas: () => void
  onClose: () => void
}) {
  return (
    <>
      {/* Overlay para cerrar al hacer click afuera */}
      <button
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Cerrar notificaciones"
        onClick={onClose}
      />
      <div
        className={`absolute top-full mt-2 w-80 max-w-[85vw] bg-white rounded-2xl shadow-lg border border-neutral-200 z-50 overflow-hidden ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <p className="font-sans font-semibold text-sm text-neutral-900">
            Notificaciones
          </p>
          <button
            onClick={onMarcarTodasLeidas}
            className="font-sans text-xs text-brand-primary hover:underline"
          >
            Marcar todas como leídas
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
          {notificaciones.length === 0 && (
            <p className="font-sans text-sm text-neutral-400 text-center py-6">
              No tienes notificaciones.
            </p>
          )}
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 ${!n.leida ? 'bg-brand-secondary/5' : ''}`}
            >
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                  !n.leida ? 'bg-brand-primary' : 'bg-transparent'
                }`}
              />
              <div className="min-w-0">
                <p className="font-sans text-sm font-semibold text-neutral-900">
                  {n.titulo}
                </p>
                <p className="font-sans text-sm text-neutral-500 mt-0.5">
                  {n.descripcion}
                </p>
                <p className="font-sans text-xs text-neutral-400 mt-1">{n.hora}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

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
  /** Para flujos de pantalla completa en mobile (ej. formularios
   * multi-paso como Nueva Reserva): oculta el header oscuro y la
   * barra de navegación inferior, dejando que la propia pantalla
   * controle su encabezado (ej. "← Volver"). No afecta desktop. */
  minimalMobile?: boolean
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
  minimalMobile = false,
  children,
}: AppShellProps) {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_INICIALES)
  const [notifOpen, setNotifOpen] = useState(false)
  const hayNoLeidas = notificaciones.some((n) => !n.leida)

  function marcarTodasLeidas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar />

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header oscuro (solo mobile). Versión compacta (sin
            mobileHero, ej. Calendario) vs. versión completa con
            saludo del día (ej. Panel). */}
        {minimalMobile ? null : mobileHero ? (
          <header className="md:hidden bg-[#0F172A] text-white rounded-b-3xl px-5 pt-5 pb-6">
            <div className="flex items-center justify-between">
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative text-white/80 hover:text-white"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-6 w-6" />
                  {hayNoLeidas && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
                  )}
                </button>
                {notifOpen && (
                  <NotificationsPanel
                    notificaciones={notificaciones}
                    align="left"
                    onMarcarTodasLeidas={marcarTodasLeidas}
                    onClose={() => setNotifOpen(false)}
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://api.whatsapp.com/send?phone=982040488"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white"
                  aria-label="Ayuda"
                >
                  <HelpCircle className="h-6 w-6" />
                </a>
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

            <div className="mt-6">{mobileHero}</div>
          </header>
        ) : (
          <header className="md:hidden bg-[#0F172A] text-white rounded-b-2xl px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo La Canchita de Carlos"
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
                <p className="font-display font-bold text-lg leading-none truncate">
                  <span className="text-white">La Canchita </span>
                  <span className="text-brand-secondary">de Carlos</span>
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative text-white/80 hover:text-white"
                    aria-label="Notificaciones"
                  >
                    <Bell className="h-5 w-5" />
                    {hayNoLeidas && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
                    )}
                  </button>
                  {notifOpen && (
                    <NotificationsPanel
                      notificaciones={notificaciones}
                      align="right"
                      onMarcarTodasLeidas={marcarTodasLeidas}
                      onClose={() => setNotifOpen(false)}
                    />
                  )}
                </div>
                <a
                  href="https://api.whatsapp.com/send?phone=982040488"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white"
                  aria-label="Ayuda"
                >
                  <HelpCircle className="h-5 w-5" />
                </a>
                <UserAvatar fotoUrl={user?.fotoUrl} size="h-8 w-8" />
              </div>
            </div>
          </header>
        )}

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
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative text-neutral-500 hover:text-neutral-700"
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {hayNoLeidas && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
                )}
              </button>
              {notifOpen && (
                <NotificationsPanel
                  notificaciones={notificaciones}
                  align="right"
                  onMarcarTodasLeidas={marcarTodasLeidas}
                  onClose={() => setNotifOpen(false)}
                />
              )}
            </div>
            <a
              href="https://api.whatsapp.com/send?phone=982040488"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-700"
              aria-label="Ayuda"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
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

        <main
          className={`flex-1 relative ${
            minimalMobile ? 'p-0 md:p-8' : 'p-5 pb-24 md:p-8 md:pb-8'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Barra de navegación inferior (solo mobile) */}
      {!minimalMobile && (
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
      )}
    </div>
  )
}
