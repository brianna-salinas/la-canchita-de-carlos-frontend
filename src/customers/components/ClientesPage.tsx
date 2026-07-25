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
  TriangleAlert,
} from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useCustomers, type Customer } from '../hooks/useClientes'
import { useBookings } from '../../bookings/hooks/useCalendario'
import { apiClient } from '../../shared/api/client'
import { initials } from '../../shared/utils/format'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { isValidPhone } from '../../shared/utils/validation'

const PAGE_SIZE = 10
const UMBRAL_VIP = 10

function formatFecha(fecha: string) {
  const d = new Date(`${fecha}T00:00:00`)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTelefono(telefono: string) {

  const solo = telefono.replace(/\D/g, '')
  if (solo.length === 11 && solo.startsWith('51')) {
    return `+51 ${solo.slice(2, 5)} ${solo.slice(5, 8)} ${solo.slice(8)}`
  }
  return telefono
}

function whatsappLink(telefono: string) {
  const solo = telefono.replace(/\D/g, '')
  const conCodigo = solo.length === 9 && solo.startsWith('9') ? `51${solo}` : solo
  return `https://wa.me/${conCodigo}`
}

interface ClienteConStats extends Customer {
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

  const { data: clientes = [], isLoading, isError } = useCustomers()
  const { data: reservas = [] } = useBookings()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Customer | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [clienteAEliminar, setClienteAEliminar] = useState<Customer | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const clientesConStats: ClienteConStats[] = useMemo(() => {
    return clientes.map((c) => {
      const propios = reservas.filter((r) => r.customerId === c.id)
      const ultimo = propios.reduce<string | null>((max, r) => {
        if (!max || r.date > max) return r.date
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
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.documentNumber ?? '').includes(q),
    )
  }, [clientesConStats, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const clientesPagina = clientesFiltrados.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE,
  )

  const nuevosSinAlquileres = clientesConStats.filter((c) => c.totalAlquileres === 0).length
  const activos = clientesConStats.filter((c) => (c.status ?? 'ACTIVE') === 'ACTIVE').length
  const fidelizacion = clientesConStats.length
    ? Math.round((activos / clientesConStats.length) * 100)
    : 0
  const clientesVip = clientesConStats.filter((c) => c.totalAlquileres >= UMBRAL_VIP).length

  function abrirNuevo() {
    setClienteEditando(null)
    setForm(FORM_VACIO)
    setErrorModal(null)
    setModalAbierto(true)
  }

  function abrirEditar(c: Customer) {
    setClienteEditando(c)
    setForm({ nombre: c.name, telefono: c.phone, dni: c.documentNumber ?? '' })
    setErrorModal(null)
    setModalAbierto(true)
  }

  async function guardarCliente() {
    if (!form.nombre.trim()) {
      setErrorModal('El nombre no puede estar vacío.')
      return
    }
    if (!form.telefono.trim()) {
      setErrorModal('El teléfono no puede estar vacío.')
      return
    }
    if (!isValidPhone(form.telefono)) {
      setErrorModal('El teléfono no es válido (debe ser un celular peruano de 9 dígitos).')
      return
    }
    setErrorModal(null)
    setGuardando(true)
    try {

      const payload = { name: form.nombre.trim(), phone: form.telefono.trim(), documentNumber: form.dni.trim() || undefined }
      if (clienteEditando) {
        await apiClient.patch(`/customers/${clienteEditando.id}`, payload)
      } else {
        await apiClient.post('/customers', payload)
      }
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      setModalAbierto(false)
    } catch (err) {
      setErrorModal(getApiErrorMessage(err, 'No se pudo guardar el cliente. Intenta de nuevo.'))
    } finally {
      setGuardando(false)
    }
  }

  function pedirEliminarCliente(c: Customer) {
    setErrorEliminar(null)
    setClienteAEliminar(c)
  }

  async function confirmarEliminarCliente() {
    if (!clienteAEliminar) return
    setEliminando(true)
    setErrorEliminar(null)
    try {
      await apiClient.delete(`/customers/${clienteAEliminar.id}`)
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      setClienteAEliminar(null)
    } catch (err) {
      setErrorEliminar(getApiErrorMessage(err, 'No se pudo eliminar el cliente. Intenta de nuevo.'))
    } finally {
      setEliminando(false)
    }
  }

  function verHistorial(c: Customer) {
    navigate(`/reservas?cliente=${encodeURIComponent(c.name)}`)
  }

  return (
    <AppShell
      searchPlaceholder="Buscar clientes por nombre, DNI o teléfono..."
      searchValue={busqueda}
      onSearchChange={setBusqueda}
    >
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
          No se pudieron cargar los clientes. Verifica tu conexión o que el
          servidor esté disponible.
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
              const activo = (c.status ?? 'ACTIVE') === 'ACTIVE'
              return (
                <tr key={c.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-full bg-brand-secondary/25 text-brand-primary font-sans text-xs font-bold flex items-center justify-center shrink-0">
                        {initials(c.name)}
                      </span>
                      <div>
                        <p className="font-sans text-sm font-semibold text-neutral-900 dark:text-neutral-50">{c.name}</p>
                        <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
                          {c.documentNumber ? `DNI: ${c.documentNumber}` : 'DNI no registrado'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <a
                      href={whatsappLink(c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Escribir por WhatsApp"
                      className="flex items-center gap-2 font-sans text-sm text-neutral-600 dark:text-neutral-300 hover:text-success"
                    >
                      <MessageSquare className="h-4 w-4 text-success" />
                      {formatTelefono(c.phone)}
                    </a>
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
                        aria-label="Ver historial"
                        title="Ver historial"
                        className="text-neutral-400 dark:text-neutral-500 hover:text-brand-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => abrirEditar(c)}
                        aria-label="Editar cliente"
                        className="text-neutral-400 dark:text-neutral-500 hover:text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => pedirEliminarCliente(c)}
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
            No se pudieron cargar los clientes. Verifica tu conexión o que el
            servidor esté disponible.
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
            const activo = (c.status ?? 'ACTIVE') === 'ACTIVE'
            return (
              <div key={c.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-50">{c.name}</p>
                    <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500">
                      {c.documentNumber ? `DNI: ${c.documentNumber}` : 'DNI no registrado'} · {formatTelefono(c.phone)}
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
                  <a
                    href={whatsappLink(c.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Escribir por WhatsApp"
                    title="Escribir por WhatsApp"
                    className="text-success"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => verHistorial(c)}
                    aria-label="Ver historial"
                    title="Ver historial"
                    className="text-brand-primary"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => abrirEditar(c)}
                    aria-label="Editar cliente"
                    title="Editar cliente"
                    className="text-neutral-700 dark:text-neutral-200"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => pedirEliminarCliente(c)}
                    className="text-danger"
                    aria-label="Eliminar cliente"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="h-5 w-5" />
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

      {modalAbierto && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setModalAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5 md:p-6"
          >
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

            {errorModal && (
              <p className="font-sans text-sm text-danger mt-3" role="alert">
                {errorModal}
              </p>
            )}

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

      {clienteAEliminar && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setClienteAEliminar(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 rounded-2xl border border-danger/30 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="flex items-start gap-3 p-5 bg-danger/10">
              <span className="h-10 w-10 rounded-full bg-danger/20 text-danger flex items-center justify-center shrink-0">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-sans font-bold text-base text-danger">Esta acción es permanente</p>
                <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                  Vas a eliminar a <span className="font-semibold">{clienteAEliminar.name}</span> para siempre. No se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => setClienteAEliminar(null)}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {errorEliminar && (
                <p className="font-sans text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 mb-3" role="alert">
                  {errorEliminar}
                </p>
              )}
              <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300">
                También se perderá el historial de reservas asociado a este cliente.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-5">
                <button
                  onClick={() => setClienteAEliminar(null)}
                  disabled={eliminando}
                  className="h-11 sm:h-10 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans font-semibold text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 disabled:opacity-60 w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarCliente}
                  disabled={eliminando}
                  className="h-11 sm:h-10 px-4 rounded-lg bg-danger text-white font-sans font-semibold text-sm hover:bg-danger/90 disabled:opacity-60 w-full sm:w-auto"
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar para siempre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
