import { useState, type ReactNode, type ChangeEvent } from 'react'
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
import { useNotifications, useMarkNotificationRead, type Notification } from '../hooks/useNotificaciones'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'

function NotificationsPanel({
  notificaciones,
  align,
  onMarcarTodasLeidas,
  onClose,
}: {
  notificaciones: Notification[]
  align: 'left' | 'right'
  onMarcarTodasLeidas: () => void
  onClose: () => void
}) {
  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Cerrar notificaciones"
        onClick={onClose}
      />
      <div
        className={`absolute top-full mt-2 w-80 max-w-[85vw] bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
          <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
            Notificaciones
          </p>
          <button
            onClick={onMarcarTodasLeidas}
            className="font-sans text-xs text-brand-primary hover:underline"
          >
            Marcar todas como leídas
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
          {notificaciones.length === 0 && (
            <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 text-center py-6">
              No tienes notificaciones.
            </p>
          )}
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 ${!n.read ? 'bg-brand-secondary/5 dark:bg-brand-secondary/10' : ''}`}
            >
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                  !n.read ? 'bg-brand-primary' : 'bg-transparent'
                }`}
              />
              <div className="min-w-0">
                <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {n.title}
                </p>
                <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {n.message}
                </p>
                <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1">{n.relativeTime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function UserAvatar({ fotoUrl, size = 'h-9 w-9' }: { fotoUrl?: string; size?: string }) {

  const [fallaCarga, setFallaCarga] = useState(false)
  const [fotoUrlAnterior, setFotoUrlAnterior] = useState(fotoUrl)
  if (fotoUrl !== fotoUrlAnterior) {
    setFotoUrlAnterior(fotoUrl)
    setFallaCarga(false)
  }

  if (fotoUrl && !fallaCarga) {
    return (
      <img
        src={fotoUrl}
        alt="Foto de perfil"
        onError={() => setFallaCarga(true)}
        className={`${size} rounded-full object-cover`}
      />
    )
  }
  return (
    <span
      className={`${size} rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0`}
    >
      <User className="h-1/2 w-1/2 text-neutral-500 dark:text-neutral-300" />
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
  searchPlaceholder?: string
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  mobileHero?: ReactNode
  minimalMobile?: boolean
  children: ReactNode
}

export default function AppShell({
  searchPlaceholder = 'Buscar reservas o clientes...',
  showSearch = true,
  searchValue,
  onSearchChange,
  mobileHero,
  minimalMobile = false,
  children,
}: AppShellProps) {
  const { user } = useAuth()
  const { data: notificaciones = [] } = useNotifications()
  const marcarLeida = useMarkNotificationRead()
  const [notifOpen, setNotifOpen] = useState(false)
  const hayNoLeidas = notificaciones.some((n) => !n.read)

  function marcarTodasLeidas() {
    notificaciones.filter((n) => !n.read).forEach((n) => marcarLeida.mutate(n.id))
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
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
                <ThemeToggle className="text-white/80 hover:text-white hover:bg-white/10" />
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
                      {user?.username ?? 'carlitos_admin'}
                    </p>
                    <p className="font-sans text-xs text-neutral-400 mt-0.5">
                      {user?.isOwner ? 'Administrador Principal' : 'Administrador'}
                    </p>
                  </div>
                  <UserAvatar fotoUrl={user?.photoUrl} />
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
                <ThemeToggle className="text-white/80 hover:text-white hover:bg-white/10" />
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
                <UserAvatar fotoUrl={user?.photoUrl} size="h-8 w-8" />
              </div>
            </div>
          </header>
        )}

        <header className="hidden md:flex items-center gap-4 px-8 py-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                {...(onSearchChange
                  ? { value: searchValue ?? '', onChange: (e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value) }
                  : {})}
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
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
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              aria-label="Ayuda"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
            <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 leading-none">
                  {user?.username ?? 'carlitos_admin'}
                </p>
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {user?.isOwner ? 'Administrador Principal' : 'Administrador'}
                </p>
              </div>
              <UserAvatar fotoUrl={user?.photoUrl} />
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

      {!minimalMobile && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-stretch z-30">
          {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 font-sans text-[11px] ${
                  isActive ? 'text-brand-primary' : 'text-neutral-400 dark:text-neutral-500'
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
