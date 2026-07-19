import { useState } from 'react'
import {
  CalendarDays,
  Wallet,
  ClipboardX,
  MoreVertical,
  BarChart3,
  Plus,
  AlertTriangle,
  CircleCheck,
  Eye,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import AppShell from '../../shared/components/AppShell'
import { useAlquileresHoy, calcularResumen } from '../hooks/usePanelData'
import { apiClient } from '../../shared/api/client'

const ESTADO_LABEL: Record<string, string> = {
  PAGADO: 'Pagado',
  PARCIAL: 'Parcial',
  PENDIENTE: 'Pendiente',
}

const ESTADO_BADGE: Record<string, string> = {
  PAGADO: 'bg-success/15 text-success',
  PARCIAL: 'bg-warning/15 text-warning',
  PENDIENTE: 'bg-danger/15 text-danger',
}

const ESTADO_BORDER: Record<string, string> = {
  PAGADO: 'border-success',
  PARCIAL: 'border-warning',
  PENDIENTE: 'border-danger',
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function PanelPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null)

  const hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Datos reales del fake API (json-server), no hardcodeados. Se
  // reemplaza por el fetch al backend real (US17-US19) en Sprint 2.
  const { data: alquileres = [], isLoading, isError } = useAlquileresHoy()
  const resumen = calcularResumen(alquileres)

  async function marcarComoPagado(id: number, montoTotal: number) {
    setMenuAbierto(null)
    try {
      await apiClient.patch(`/alquileres/${id}`, { estadoPago: 'PAGADO', montoPagado: montoTotal })
      await queryClient.invalidateQueries({ queryKey: ['alquileres'] })
    } catch {
      window.alert('No se pudo marcar como pagado. Intenta de nuevo.')
    }
  }

  async function eliminarAlquiler(id: number) {
    setMenuAbierto(null)
    if (!window.confirm('¿Eliminar este alquiler? Esta acción no se puede deshacer.')) return
    try {
      await apiClient.delete(`/alquileres/${id}`)
      await queryClient.invalidateQueries({ queryKey: ['alquileres'] })
    } catch {
      window.alert('No se pudo eliminar el alquiler. Intenta de nuevo.')
    }
  }

  // Ingreso obtenido vs. lo que se espera cobrar hoy en total.
  const montoEsperado = alquileres.reduce((sum, a) => sum + a.montoTotal, 0)
  const porcentajeCobrado =
    montoEsperado > 0 ? Math.round((resumen.ingresoHoy / montoEsperado) * 100) : 0

  // "Siguiente horario libre": la cancha que se desocupa más tarde
  // entre los alquileres de hoy.
  const proximaLibre = [...alquileres]
    .sort((a, b) => a.horaFin.localeCompare(b.horaFin))
    .at(-1)

  function SiguienteHorarioCard() {
    return (
      <div className="bg-brand-primary rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between gap-4 md:block">
          <div>
            <p className="font-sans text-xs tracking-wide uppercase text-white/70">
              Siguiente Horario Libre
            </p>
            <p className="font-sans font-bold text-2xl md:text-3xl mt-1">
              {proximaLibre ? proximaLibre.horaFin : '—'}
              {proximaLibre && (
                <span className="md:hidden"> - {proximaLibre.canchaNombre}</span>
              )}
            </p>
            <p className="hidden md:block font-sans text-sm text-white/80 mt-1">
              {proximaLibre ? proximaLibre.canchaNombre : 'Sin alquileres hoy'}
            </p>
          </div>
          <button className="shrink-0 h-10 px-5 md:w-full md:mt-4 rounded-lg bg-white text-brand-primary font-sans font-semibold text-sm hover:bg-white/90">
            Reservar Ya
          </button>
        </div>
      </div>
    )
  }

  function OcupacionCard() {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
            Ocupación Semanal
          </p>
          <BarChart3 className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
        </div>
        {/* Placeholder de gráfico: reemplazar por Chart.js/Recharts
            cuando el backend entregue datos reales de ocupación
            (US17-US19). */}
        <div className="h-32 rounded-lg bg-neutral-50 dark:bg-neutral-900" />
        <div className="flex justify-between mt-2">
          {DIAS_SEMANA.map((d, i) => (
            <span
              key={d + i}
              className={`font-sans text-xs w-6 text-center ${
                i === 5 ? 'font-bold text-neutral-900 dark:text-neutral-50' : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    )
  }

  function AvisoCard() {
    return (
      <div className="bg-brand-secondary/10 md:bg-brand-secondary/10 rounded-2xl border-l-4 border-brand-primary p-4">
        <div className="hidden md:block">
          <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
            Aviso del Sistema
          </p>
          <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            El mantenimiento de la Cancha 2 está programado para el lunes a
            las 08:00 AM.
          </p>
        </div>
        <div className="md:hidden flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-sans font-semibold text-sm text-warning">
              Aviso del Sistema
            </p>
            <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
              Mantenimiento programado para este domingo a las 23:00. El
              sistema no estará disponible por 1 hora.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppShell
      showSearch={false}
      mobileHero={
        <h1 className="font-sans font-bold text-3xl text-white leading-tight">
          Hoy, {hoy}
        </h1>
      }
    >
      <h1 className="hidden md:block font-sans font-bold text-4xl text-neutral-900 dark:text-neutral-50">
        Hoy, {hoy}
      </h1>
      <p className="hidden md:block font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1">
        Bienvenido de nuevo, Carlos. Tienes un día movido hoy.
      </p>

      {isError && (
        <p className="font-sans text-sm text-danger mt-4">
          No se pudieron cargar los datos del panel. Verifica que el fake API
          (json-server) esté corriendo en el puerto 3001.
        </p>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-3 md:gap-5 mt-5 md:mt-8">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 md:p-5">
          <div className="flex items-start justify-between">
            <p className="font-sans text-xs md:uppercase md:tracking-wide text-neutral-500 dark:text-neutral-400">
              Alquileres
            </p>
            <span className="hidden md:flex h-9 w-9 rounded-full bg-brand-secondary/20 items-center justify-center">
              <CalendarDays className="h-4 w-4 text-brand-primary" />
            </span>
          </div>
          <p className="font-sans font-bold text-2xl md:text-3xl text-neutral-900 dark:text-neutral-50 mt-2">
            {isLoading ? '—' : resumen.totalAlquileres}
          </p>
          <p className="hidden md:block font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1">hoy</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 md:p-5">
          <div className="flex items-start justify-between">
            <p className="font-sans text-xs md:uppercase md:tracking-wide text-neutral-500 dark:text-neutral-400">
              Ingreso hoy
            </p>
            <span className="hidden md:flex h-9 w-9 rounded-full bg-success/15 items-center justify-center">
              <Wallet className="h-4 w-4 text-success" />
            </span>
          </div>
          <p className="font-sans font-bold text-2xl md:text-3xl text-success mt-2">
            {isLoading ? '—' : `S/${resumen.ingresoHoy}`}
          </p>
          <div className="hidden md:flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60">
              <div
                className="h-1.5 rounded-full bg-brand-primary"
                style={{ width: `${porcentajeCobrado}%` }}
              />
            </div>
            <span className="font-sans text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
              {porcentajeCobrado}% cobrado
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 md:p-5">
          <div className="flex items-start justify-between">
            <p className="font-sans text-xs md:uppercase md:tracking-wide text-neutral-500 dark:text-neutral-400">
              Pendiente
            </p>
            <span className="hidden md:flex h-9 w-9 rounded-full bg-danger/15 items-center justify-center">
              <ClipboardX className="h-4 w-4 text-danger" />
            </span>
          </div>
          <p className="font-sans font-bold text-2xl md:text-3xl text-danger mt-2">
            {isLoading ? '—' : `S/${resumen.montoPendiente}`}
          </p>
          <p className="hidden md:block font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {resumen.cantidadPendientes} cobros pendientes
          </p>
        </div>
      </div>

      {/* ---------- MOBILE: apilado en una sola columna ---------- */}
      <div className="md:hidden mt-5 space-y-6">
        <SiguienteHorarioCard />

        <div>
          <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-3">
            Alquileres de hoy
          </h2>
          <div className="space-y-3">
            {isLoading && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">Cargando alquileres...</p>
            )}
            {!isLoading && alquileres.length === 0 && (
              <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
                No hay alquileres registrados hoy.
              </p>
            )}
            {alquileres.map((a) => (
              <div
                key={a.id}
                className={`bg-white dark:bg-neutral-800 rounded-xl border-l-4 p-4 flex items-center justify-between gap-3 shadow-sm ${ESTADO_BORDER[a.estadoPago]}`}
              >
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                    {a.canchaNombre} • {a.horaInicio} - {a.horaFin}
                  </p>
                  <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                    {a.clienteNombre}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs font-semibold ${ESTADO_BADGE[a.estadoPago]}`}
                >
                  {ESTADO_LABEL[a.estadoPago]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-3">
            Ocupación Semanal
          </h2>
          <OcupacionCard />
        </div>

        <AvisoCard />
      </div>

      {/* ---------- DESKTOP: tabla + columna lateral ---------- */}
      <div className="hidden md:grid grid-cols-3 gap-5 mt-6">
        <div className="col-span-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
              Alquileres de hoy
            </h2>
            <Link
              to="/reservas"
              className="font-sans text-sm text-brand-primary hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-neutral-100 dark:border-neutral-700/60">
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Cancha
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Horario
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Cliente
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Estado de Pago
                </th>
                <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-medium pb-2">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="font-sans text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
                    Cargando alquileres...
                  </td>
                </tr>
              )}
              {!isLoading && alquileres.length === 0 && (
                <tr>
                  <td colSpan={5} className="font-sans text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
                    No hay alquileres registrados hoy.
                  </td>
                </tr>
              )}
              {alquileres.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-neutral-50 last:border-0"
                >
                  <td className="font-sans text-sm text-neutral-700 dark:text-neutral-200 py-3">
                    {a.canchaNombre}
                  </td>
                  <td className="font-sans text-sm text-neutral-700 dark:text-neutral-200 py-3">
                    {a.horaInicio} - {a.horaFin}
                  </td>
                  <td className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50 py-3">
                    {a.clienteNombre}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 font-sans text-xs font-semibold ${ESTADO_BADGE[a.estadoPago]}`}
                    >
                      {ESTADO_LABEL[a.estadoPago]}
                    </span>
                  </td>
                  <td className="py-3 relative">
                    <button
                      onClick={() => setMenuAbierto(menuAbierto === a.id ? null : a.id)}
                      className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
                      aria-label="Más acciones"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuAbierto === a.id && (
                      <>
                        <button
                          aria-hidden
                          tabIndex={-1}
                          onClick={() => setMenuAbierto(null)}
                          className="fixed inset-0 z-10 cursor-default"
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg py-1">
                          {a.estadoPago !== 'PAGADO' && (
                            <button
                              onClick={() => marcarComoPagado(a.id, a.montoTotal)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50"
                            >
                              <CircleCheck className="h-4 w-4 text-success" />
                              Marcar como pagado
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setMenuAbierto(null)
                              navigate('/reservas')
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50"
                          >
                            <Eye className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                            Ver en Reservas
                          </button>
                          <button
                            onClick={() => eliminarAlquiler(a.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-danger hover:bg-danger/5"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Columna lateral */}
        <div className="space-y-5">
          <SiguienteHorarioCard />
          <OcupacionCard />
          <AvisoCard />
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
          © 2026 La Canchita de Carlos - Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <a
            href="#"
            className="font-sans text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
          >
            Términos
          </a>
          <a
            href="#"
            className="font-sans text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
          >
            Privacidad
          </a>
          <a
            href="https://api.whatsapp.com/send?phone=982040488"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
          >
            Soporte
          </a>
        </div>
      </div>

      <p className="md:hidden text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-8">
        Desarrollado por Brianna Salinas | 2026
      </p>

      {/* Botón flotante de acción rápida (solo mobile) */}
      <button
        aria-label="Nueva reserva"
        className="md:hidden fixed bottom-24 right-5 h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center z-30"
      >
        <Plus className="h-6 w-6" />
      </button>
    </AppShell>
  )
}
