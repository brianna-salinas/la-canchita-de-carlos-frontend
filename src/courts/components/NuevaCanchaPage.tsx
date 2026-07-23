import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ImagePlus, Info, Settings, Wallet, Save, CircleCheck } from 'lucide-react'
import AppShell from '../../shared/components/AppShell'
import { useTodasLasCanchas } from '../../bookings/hooks/useCalendario'
import { apiClient } from '../../shared/api/client'
import { getApiErrorMessage } from '../../shared/utils/api-error'
import { esPrecioValido } from '../../shared/utils/validation'

// El negocio solo maneja estos 4 tipos de cancha (antes había una lista
// genérica de deportes tipo "Fútbol 5/7/11", "Tenis Single", "Pádel", que no
// aplican a este negocio en particular).
const DEPORTES = ['Fútbol', 'Vóley', 'Básquet', 'Multiuso']

type EstadoOperativo = 'ACTIVA' | 'MANTENIMIENTO'

interface FormState {
  nombre: string
  deporte: string
  descripcion: string
  precioHora: string
  estado: EstadoOperativo
  habilitada: boolean
  fotoUrl: string
  // El horario de atención es opcional: si horarioConfigurado es false, la
  // cancha queda disponible las 24 horas (sin restricción de franja).
  horarioConfigurado: boolean
  horaApertura: string
  horaCierre: string
}

const FORM_VACIO: FormState = {
  nombre: '',
  deporte: '',
  descripcion: '',
  precioHora: '',
  estado: 'ACTIVA',
  habilitada: true,
  fotoUrl: '',
  horarioConfigurado: false,
  horaApertura: '08:00',
  horaCierre: '22:00',
}

export default function NuevaCanchaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)

  const { data: canchas = [] } = useTodasLasCanchas()

  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null)

  // Sincroniza el formulario con la cancha real una vez que `canchas`
  // (fuente externa asíncrona) llega. Es el caso legítimo de "sincronizar
  // con un sistema externo" que documenta React para useEffect, así que se
  // silencia puntualmente la regla que asume que todo setState en un
  // efecto podría evitarse derivándolo en el render.
  useEffect(() => {
    if (!editando || !id) return
    const cancha = canchas.find((c) => String(c.id) === id)
    if (cancha) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nombre: cancha.nombre,
        deporte: cancha.deporte,
        descripcion: cancha.descripcion ?? '',
        precioHora: String(cancha.precioHora ?? ''),
        estado: cancha.estado ?? 'ACTIVA',
        habilitada: cancha.habilitada ?? true,
        fotoUrl: cancha.fotoUrl ?? '',
        horarioConfigurado: Boolean(cancha.horaApertura && cancha.horaCierre),
        horaApertura: cancha.horaApertura ?? '08:00',
        horaCierre: cancha.horaCierre ?? '22:00',
      })
    }
  }, [editando, id, canchas])

  function subirFoto(archivo: File | undefined) {
    if (!archivo) return
    setFotoArchivo(archivo)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, fotoUrl: String(reader.result) }))
    }
    reader.readAsDataURL(archivo)
  }

  async function handleSubmit() {
    if (!form.nombre.trim()) {
      setError('El nombre de la cancha no puede estar vacío.')
      return
    }
    if (!form.deporte) {
      setError('Selecciona el tipo de deporte.')
      return
    }
    if (!esPrecioValido(form.precioHora)) {
      setError('El precio por hora debe ser un número mayor a cero.')
      return
    }
    if (form.horarioConfigurado && (!form.horaApertura || !form.horaCierre || form.horaApertura >= form.horaCierre)) {
      setError('El horario de atención no es válido: la apertura debe ser antes que el cierre.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      let canchaId = id ? Number(id) : null
      const openTime = form.horarioConfigurado ? form.horaApertura : null
      const closeTime = form.horarioConfigurado ? form.horaCierre : null

      if (editando && canchaId) {
        // OJO: el toggle "Habilitada para reservas" pausa/reanuda la cancha
        // (PATCH enabled), nunca la borra. "Eliminar" (en Canchas) es una
        // acción aparte, irreversible, que sí hace DELETE real. Antes este
        // toggle llamaba por error a DELETE al desactivarse, lo que borraba
        // la cancha para siempre con solo desmarcar la casilla al editar.
        await apiClient.patch(`/courts/${canchaId}`, {
          name: form.nombre.trim(),
          sport: form.deporte,
          description: form.descripcion.trim() || undefined,
          status: form.estado === 'MANTENIMIENTO' ? 'MAINTENANCE' : 'ACTIVE',
          openTime,
          closeTime,
          enabled: form.habilitada,
        })
        await apiClient.patch(`/courts/${canchaId}/precio`, {
          pricePerHour: Number(form.precioHora) || 0,
        })
      } else {
        const { data: creada } = await apiClient.post('/courts', {
          name: form.nombre.trim(),
          sport: form.deporte,
          surface: '',
          pricePerHour: Number(form.precioHora) || 0,
          openTime: openTime ?? undefined,
          closeTime: closeTime ?? undefined,
        })
        canchaId = creada.id
        if (form.descripcion.trim() || form.estado === 'MANTENIMIENTO' || !form.habilitada) {
          await apiClient.patch(`/courts/${canchaId}`, {
            description: form.descripcion.trim() || undefined,
            status: form.estado === 'MANTENIMIENTO' ? 'MAINTENANCE' : 'ACTIVE',
            enabled: form.habilitada,
          })
        }
      }

      if (fotoArchivo && canchaId) {
        const formData = new FormData()
        formData.append('foto', fotoArchivo)
        await apiClient.post(`/courts/${canchaId}/fotos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['canchas'] })
      navigate('/canchas')
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cancha. Intenta de nuevo.'))
    } finally {
      setGuardando(false)
    }
  }

  const tituloDesktop = editando ? 'Editar Cancha' : 'Registrar Nueva Cancha'
  const tituloMobile = 'Registrar / Editar Cancha'

  return (
    <AppShell searchPlaceholder="Buscar canchas, reservas o socios..." minimalMobile>
      {/* Barra superior mobile */}
      <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Volver" className="text-neutral-900 dark:text-neutral-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">{tituloMobile}</h1>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden px-4 py-4 pb-32 space-y-4 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        <label className="block bg-white dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 py-8 text-center cursor-pointer overflow-hidden">
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => subirFoto(e.target.files?.[0])}
          />
          {form.fotoUrl ? (
            <img src={form.fotoUrl} alt="Foto de la cancha" className="h-32 w-full object-cover rounded-xl" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-neutral-300 mx-auto" />
              <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 mt-2">Toca para subir portada</p>
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Recomendado: 800x600px (JPG/PNG)
              </p>
            </>
          )}
        </label>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Nombre de la cancha</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Cancha Principal"
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            />
          </div>
          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Tipo de Deporte</label>
            <select
              value={form.deporte}
              onChange={(e) => setForm({ ...form, deporte: e.target.value })}
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
            >
              <option value="">Selecciona un deporte</option>
              {DEPORTES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Precio por hora (S/.)</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={form.precioHora}
              onChange={(e) => setForm({ ...form, precioHora: e.target.value })}
              placeholder="S/.0.00"
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            />
          </div>
          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Descripción / Observaciones</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalles adicionales sobre la cancha..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">Configurar horario de atención</p>
              <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">
                Opcional. Si no lo activas, la cancha queda disponible las 24 horas.
              </p>
            </div>
            <button
              onClick={() => setForm({ ...form, horarioConfigurado: !form.horarioConfigurado })}
              aria-label="Configurar horario de atención"
              className={`shrink-0 block h-6 w-11 rounded-full relative overflow-hidden transition-colors ${
                form.horarioConfigurado ? 'bg-brand-primary' : 'bg-neutral-300'
              }`}
            >
              <span
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-neutral-800 transition-transform duration-200"
                style={{ transform: form.horarioConfigurado ? 'translateX(20px)' : 'translateX(0px)' }}
              />
            </button>
          </div>
          {form.horarioConfigurado && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Abre a las</label>
                <input
                  type="time"
                  value={form.horaApertura}
                  onChange={(e) => setForm({ ...form, horaApertura: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
                />
              </div>
              <div>
                <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Cierra a las</label>
                <input
                  type="time"
                  value={form.horaCierre}
                  onChange={(e) => setForm({ ...form, horaCierre: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50 mb-3">Estado Operativo</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setForm({ ...form, estado: 'ACTIVA' })}
              className={`h-11 rounded-lg font-sans font-semibold text-sm border ${
                form.estado === 'ACTIVA'
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Activa
            </button>
            <button
              onClick={() => setForm({ ...form, estado: 'MANTENIMIENTO' })}
              className={`h-11 rounded-lg font-sans font-semibold text-sm border ${
                form.estado === 'MANTENIMIENTO'
                  ? 'bg-warning/10 border-warning text-warning'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              En Mantenimiento
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">Habilitada para reservas</p>
            <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500">Este precio se aplicará por defecto a todas las reservas.</p>
          </div>
          <button
            onClick={() => setForm({ ...form, habilitada: !form.habilitada })}
            aria-label="Habilitada para reservas"
            className={`shrink-0 block h-6 w-11 rounded-full relative overflow-hidden transition-colors ${
              form.habilitada ? 'bg-brand-primary' : 'bg-neutral-300'
            }`}
          >
            <span
              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-neutral-800 transition-transform duration-200"
              style={{ transform: form.habilitada ? 'translateX(20px)' : 'translateX(0px)' }}
            />
          </button>
        </div>

        {error && <p className="font-sans text-sm text-danger">{error}</p>}

        <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 text-center pt-2">
          Los campos de nombre y tipo de deporte son obligatorios para la publicación.
        </p>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 space-y-2 z-20">
        <button
          onClick={handleSubmit}
          disabled={guardando}
          className="w-full h-12 rounded-full bg-brand-primary text-white font-sans font-semibold text-sm disabled:opacity-60"
        >
          {guardando ? (editando ? 'Guardando...' : 'Registrando...') : editando ? 'Guardar Cancha' : 'Registrar Cancha'}
        </button>
        <button
          onClick={() => navigate('/canchas')}
          className="w-full h-12 rounded-full border border-brand-primary text-brand-primary font-sans font-semibold text-sm"
        >
          Cancelar
        </button>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              <Link to="/canchas" className="hover:underline">Canchas</Link>
              <span className="mx-1.5">›</span>
              <span className="text-brand-primary font-medium">{tituloDesktop}</span>
            </p>
            <h1 className="font-sans font-bold text-3xl text-neutral-900 dark:text-neutral-50 mt-1">{tituloDesktop}</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/canchas')}
              className="h-11 px-5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-sans font-semibold text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={guardando}
              className="h-11 px-5 rounded-lg bg-brand-primary text-white font-sans font-semibold text-sm flex items-center gap-2 hover:bg-brand-primary/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {guardando ? (editando ? 'Guardando...' : 'Registrando...') : editando ? 'Guardar Cancha' : 'Registrar Cancha'}
            </button>
          </div>
        </div>

        {error && <p className="font-sans text-sm text-danger mt-4">{error}</p>}

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2 space-y-6">
            <section className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Info className="h-4 w-4" />
                </span>
                <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">Información General</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Nombre de la cancha</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej. Cancha Central Sintética"
                    className="w-full h-12 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Tipo de deporte</label>
                  <select
                    value={form.deporte}
                    onChange={(e) => setForm({ ...form, deporte: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
                  >
                    <option value="">Selecciona un deporte</option>
                    {DEPORTES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Descripción / Observaciones</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Detalla características adicionales, estado del césped, iluminación, etc."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Settings className="h-4 w-4" />
                </span>
                <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">Estado Operativo</h2>
              </div>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span
                    onClick={() => setForm({ ...form, estado: 'ACTIVA' })}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      form.estado === 'ACTIVA' ? 'border-brand-primary' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    {form.estado === 'ACTIVA' && <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" />}
                  </span>
                  <span className="font-sans text-sm text-neutral-700 dark:text-neutral-200" onClick={() => setForm({ ...form, estado: 'ACTIVA' })}>
                    Activa
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span
                    onClick={() => setForm({ ...form, estado: 'MANTENIMIENTO' })}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      form.estado === 'MANTENIMIENTO' ? 'border-brand-primary' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    {form.estado === 'MANTENIMIENTO' && <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" />}
                  </span>
                  <span className="font-sans text-sm text-neutral-700 dark:text-neutral-200" onClick={() => setForm({ ...form, estado: 'MANTENIMIENTO' })}>
                    En Mantenimiento
                  </span>
                </label>
              </div>
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </span>
                <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">Precios y Disponibilidad</h2>
              </div>
              <div className="grid grid-cols-2 gap-6 items-start">
                <div>
                  <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Precio por hora</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm text-neutral-500 dark:text-neutral-400">S/.</span>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={form.precioHora}
                      onChange={(e) => setForm({ ...form, precioHora: e.target.value })}
                      placeholder="0.00"
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                    />
                  </div>
                  <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 italic">
                    Este precio se aplicará por defecto a todas las reservas.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 block">Horario de atención</label>
                    <button
                      onClick={() => setForm({ ...form, horarioConfigurado: !form.horarioConfigurado })}
                      aria-label="Configurar horario de atención"
                      className={`shrink-0 block h-5 w-9 rounded-full relative overflow-hidden transition-colors ${
                        form.horarioConfigurado ? 'bg-brand-primary' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white dark:bg-neutral-800 transition-transform duration-200"
                        style={{ transform: form.horarioConfigurado ? 'translateX(16px)' : 'translateX(0px)' }}
                      />
                    </button>
                  </div>
                  {form.horarioConfigurado ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={form.horaApertura}
                        onChange={(e) => setForm({ ...form, horaApertura: e.target.value })}
                        className="w-full h-12 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
                      />
                      <span className="font-sans text-sm text-neutral-400">a</span>
                      <input
                        type="time"
                        value={form.horaCierre}
                        onChange={(e) => setForm({ ...form, horaCierre: e.target.value })}
                        className="w-full h-12 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
                      />
                    </div>
                  ) : (
                    <p className="h-12 flex items-center font-sans text-sm text-neutral-400 dark:text-neutral-500">
                      Sin restricción — disponible las 24 horas
                    </p>
                  )}
                  <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 italic">
                    Opcional. Actívalo solo si la cancha no debe reservarse a cualquier hora.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 items-start mt-6">
                <div>
                  <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1">Estado inicial</p>
                  <button
                    onClick={() => setForm({ ...form, habilitada: !form.habilitada })}
                    className="h-12 w-full flex items-center gap-3"
                  >
                    <span
                      className={`shrink-0 block h-6 w-11 rounded-full relative overflow-hidden transition-colors ${
                        form.habilitada ? 'bg-brand-primary' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-neutral-800 transition-transform duration-200"
                        style={{ transform: form.habilitada ? 'translateX(20px)' : 'translateX(0px)' }}
                      />
                    </span>
                    <span className="flex-1 min-w-0 text-left font-sans text-sm text-neutral-700 dark:text-neutral-200">
                      Habilitada para reservas
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-1">
            <section className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">Media</h2>
              </div>

              <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-2 block">Foto de la cancha</label>
              <label className="block border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl py-14 text-center cursor-pointer hover:border-brand-primary transition-colors overflow-hidden">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => subirFoto(e.target.files?.[0])}
                />
                {form.fotoUrl ? (
                  <img src={form.fotoUrl} alt="Foto de la cancha" className="h-48 w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <span className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-700/60 flex items-center justify-center mx-auto">
                      <ImagePlus className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
                    </span>
                    <p className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mt-3">
                      Toca para subir o arrastra una imagen
                    </p>
                    <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 mt-1">(JPG, PNG - Max. 5MB)</p>
                  </>
                )}
              </label>

              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mt-4 space-y-2">
                <p className="font-sans text-xs font-semibold text-neutral-500 dark:text-neutral-400">Recomendaciones:</p>
                {[
                  'Usa fotos de día con buena iluminación natural.',
                  'Captura la cancha completa desde un ángulo amplio.',
                  'Asegúrate de que la superficie esté limpia.',
                ].map((tip) => (
                  <p key={tip} className="flex items-start gap-2 font-sans text-xs text-neutral-500 dark:text-neutral-400">
                    <CircleCheck className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    {tip}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Info className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          <p className="font-sans text-sm italic text-neutral-400 dark:text-neutral-500">
            Todos los campos marcados con (*) son obligatorios para la publicación.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
