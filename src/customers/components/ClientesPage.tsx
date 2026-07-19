import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  TrendingUp,
  Star,
  X,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useClientes, type Cliente } from '../hooks/useClientes'
import { useReservas } from '../../bookings/hooks/useCalendario'
import { apiClient } from '../../shared/api/client'
import { iniciales } from '../../shared/utils/format'

const PAGE_SIZE = 10
// Un cliente se considera VIP a partir de este número de alquileres
// registrados. Ajustable cuando el negocio defina el criterio real.
const UMBRAL_VIP = 10

// Formato DD/MM/AAAA, distinto del "11 jul 2026" que usan
// Reservas/Solicitudes — por eso no vive en shared/utils/format.
function formatFecha(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTelefono(telefono: string) {
  // Los números en db.json vienen como "51987654321" (sin +).
  // Los mostramos con formato "+51 987 654 321" cuando aplica.
  const solo = telefono.replace(/\D/g, '')
  if (solo.length === 11 && solo.startsWith('51')) {
    return `+51 ${solo.slice(2, 5)} ${solo.slice(5, 8)} ${solo.slice(8)}`
  }
  return telefono
}

interface ClienteConStats extends Cliente {
  totalAlquileres: number
  ultimoAlquiler: string | null
}

interface FormState {
  nombre: string
  telefono: string
  dni: string
}

const FORM_VACIO: FormState = { nombre: '', telefono: '', dni: '' }

export default function ClientesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: clientes = [], isLoading, isError } = useClientes()
  const { data: reservas = [] } = useReservas()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  // Cruza clientes con sus alquileres reales (mismo dataset que
  // Reservas/Calendario, queryKey ['alquileres']) para calcular el
  // conteo y la fecha del último alquiler sin datos hardcodeados.
  const clientesConStats: ClienteConStats[] = useMemo(() => {
    return clientes.map((c) => {
      const propios = reservas.filter((r) => r.clienteId === c.id)
      const ultimo = propios.reduce<string | null>((max, r) => {
        if (!max || r.fecha > max) return r.fecha
        return max
      }, null)
      return { ...c, totalAlquileres: propios.length, ultimoAlquiler: ultimo }
    })
  }, [clientes, reservas])

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientesConStats
    return clientesConStats.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.dni ?? '').includes(q),
    )
  }, [clientesConStats, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const clientesPagina = clientesFiltrados.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE,
  )

  const nuevosSinAlquileres = clientesConStats.filter((c) => c.totalAlquileres === 0).length
  const activos = clientesConStats.filter((c) => (c.estado ?? 'ACTIVO') === 'ACTIVO').length
  const fidelizacion = clientesConStats.length
    ? Math.round((activos / clientesConStats.length) * 100)
    : 0
  const clientesVip = clientesConStats.filter((c) => c.totalAlquileres >= UMBRAL_VIP).length

  function abrirNuevo() {
    setClienteEditando(null)
    setForm(FORM_VACIO)
    setModalAbierto(true)
  }

  function abrirEditar(c: Cliente) {
    setClienteEditando(c)
    setForm({ nombre: c.nombre, telefono: c.telefono, dni: c.dni ?? '' })
    setModalAbierto(true)
  }

  async function guardarCliente() {
    if (!form.nombre.trim() || !form.telefono.trim()) return
    setGuardando(true)
    try {
      // Se reemplaza por POST/PATCH /api/customers (RF09) cuando el
      // backend esté conectado (Sprint 2). Por ahora apunta al fake API.
      if (clienteEditando) {
        await apiClient.patch(`/clientes/${clienteEditando.id}`, form)
      } else {
        await apiClient.post('/clientes', form)
      }
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setModalAbierto(false)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCliente(id: number) {
    if (!window.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
    try {
      await apiClient.delete(`/clientes/${id}`)
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
    } catch {
      window.alert('No se pudo eliminar el cliente. Intenta de nuevo.')
    }
  }

  function verHistorial(c: Cliente) {
    navigate(`/reservas?cliente=${encodeURIComponent(c.nombre)}`)
  }

  return (
    <AppShell searchPlaceholder="Buscar clientes por nombre, DNI o teléfono...">
      {/* ================= DESKTOP ================= */}
      <div className="hidden md:flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50">
            Gestión de Clientes
          </h1>
          <p className="font-sans text-base text-neutral-500 dark:text-neutral-400 mt-1">
            Administra y visualiza la información de tus clientes registrados.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="h-11 px-4 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </div>

      {isError && (
        <p className="hidden md:block font-sans text-sm text-danger mt-4">
          No se pudieron cargar los clientes. Verifica que el fake API
          (json-server) esté corriendo en el puerto 3001.
        </p>
      )}

      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="text-left border-b border-neutral-100 dark:border-neutral-700/60">
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-5 py-3">Cliente</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Contacto</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Alquileres</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Último Alquiler</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3">Estado</th>
              <th className="font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold px-2 py-3 text-right pr-5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-8 font-sans text-sm text-neutral-400 dark:text-neutral-500">
                  Cargando clientes...
                </td>
              </tr>
            )}
            {!isLoading && clientesPagina.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 font-sans text-sm text-neutral-400 dark:text-neutral-500">
                  No hay clientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {clientesPagina.map((c) => {
              const activo = (c.estado ?? 'ACTIVO') === 'ACTIVO'
              return (
                <tr key={c.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {c.fotoUrl ? (
                        <img
                          src={c.fotoUrl}
                          alt={c.nombre}
                          className="h-9 w-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="h-9 w-9 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-xs font-bold flex items-center justify-center shrink-0">
                          {iniciales(c.nombre)}
                        </span>
                      )}
                      <div>
                        <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50">{c.nombre}</p>
                        <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
                          {c.dni ? `DNI: ${c.dni}` : 'DNI no registrado'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <span className="flex items-center gap-2 font-sans text-sm text-neutral-600 dark:text-neutral-300">
                      <MessageSquare className="h-4 w-4 text-success" />
                      {formatTelefono(c.telefono)}
                    </span>
                  </td>
                  <td className="px-2 py-4 font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {c.totalAlquileres}
                  </td>
                  <td className="px-2 py-4 font-sans text-sm text-neutral-700 dark:text-neutral-200">
                    {c.ultimoAlquiler ? formatFecha(c.ultimoAlquiler) : '—'}
                  </td>
                  <td className="px-2 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-semibold ${
                        activo ? 'bg-success/15 text-success' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center justify-end gap-3 pr-3">
                      <button
                        onClick={() => verHistorial(c)}
                        className="flex items-center gap-1 font-sans text-sm text-brand-primary hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        Historial
                      </button>
                      <button
                        onClick={() => abrirEditar(c)}
                        aria-label="Editar cliente"
                        className="text-neutral-400 dark:text-neutral-500 hover:text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarCliente(c.id)}
                        aria-label="Eliminar cliente"
                        className="text-neutral-400 dark:text-neutral-500 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {clientesFiltrados.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 dark:border-neutral-700/60">
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              Mostrando {(paginaActual - 1) * PAGE_SIZE + 1}-
              {Math.min(paginaActual * PAGE_SIZE, clientesFiltrados.length)} de{' '}
              {clientesFiltrados.length} clientes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  className={`h-8 w-8 rounded-lg font-sans text-sm font-semibold ${
                    n === paginaActual
                      ? 'bg-brand-primary text-white'
                      : 'border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">Clientes sin alquileres</p>
            <p className="font-sans text-xl font-bold text-neutral-900 dark:text-neutral-50">+{nuevosSinAlquileres}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">Fidelización (clientes activos)</p>
            <p className="font-sans text-xl font-bold text-neutral-900 dark:text-neutral-50">{fidelizacion}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">Clientes VIP (10+ alquileres)</p>
            <p className="font-sans text-xl font-bold text-neutral-900 dark:text-neutral-50">{clientesVip}</p>
          </div>
        </div>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden">
        <h1 className="font-sans font-bold text-2xl text-neutral-900 dark:text-neutral-50">Gestión de Clientes</h1>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar clientes por nombre, DNI o teléfono..."
            className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
          />
        </div>

        {isError && (
          <p className="font-sans text-sm text-danger mt-4">
            No se pudieron cargar los clientes. Verifica que el fake API
            (json-server) esté corriendo en el puerto 3001.
          </p>
        )}
        {isLoading && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 mt-4">Cargando clientes...</p>
        )}
        {!isLoading && clientesFiltrados.length === 0 && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 mt-4">
            No hay clientes que coincidan con la búsqueda.
          </p>
        )}

        <div className="space-y-4 mt-4">
          {clientesFiltrados.map((c) => {
            const activo = (c.estado ?? 'ACTIVO') === 'ACTIVO'
            return (
              <div key={c.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">{c.nombre}</p>
                    <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
                      {c.dni ? `DNI: ${c.dni}` : 'DNI no registrado'} · {formatTelefono(c.telefono)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-semibold ${
                      activo ? 'bg-success/15 text-success' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60">
                  <div>
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">Alquileres</p>
                    <p className="font-sans text-sm font-bold text-neutral-900 dark:text-neutral-50">{c.totalAlquileres}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">Último Alquiler</p>
                    <p className="font-sans text-sm font-bold text-neutral-900 dark:text-neutral-50">
                      {c.ultimoAlquiler ? formatFecha(c.ultimoAlquiler) : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60">
                  <button
                    onClick={() => verHistorial(c)}
                    className="flex items-center gap-1.5 font-sans text-sm font-medium text-brand-primary"
                  >
                    <Eye className="h-4 w-4" />
                    Historial
                  </button>
                  <button
                    onClick={() => abrirEditar(c)}
                    className="flex items-center gap-1.5 font-sans text-sm font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarCliente(c.id)}
                    className="text-danger"
                    aria-label="Eliminar cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-8">
          Desarrollado por Brianna Salinas | 2026
        </p>
      </div>

      <button
        onClick={abrirNuevo}
        aria-label="Nuevo cliente"
        className="md:hidden fixed bottom-24 right-5 h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modal Nuevo/Editar cliente — bottom sheet en mobile, diálogo centrado en desktop */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/40 md:px-4"
          onClick={() => setModalAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 w-full max-w-md max-h-[88vh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6"
          >
            <div className="md:hidden w-10 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
                {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setModalAbierto(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Teléfono</label>
                <input
                  type="text"
                  inputMode="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  placeholder="Ej. 51987654321"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">DNI (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  placeholder="Ej. 12345678"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCliente}
                disabled={guardando || !form.nombre.trim() || !form.telefono.trim()}
                className="flex-1 h-11 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
