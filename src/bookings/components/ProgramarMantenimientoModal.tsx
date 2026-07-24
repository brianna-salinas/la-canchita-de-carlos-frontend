import { useMemo, useState } from 'react'
import { Wrench, X } from 'lucide-react'
import { useScheduleMaintenance } from '../hooks/useCalendario'
import type { Court } from '../hooks/useCalendario'
import { toISODate } from '../../shared/utils/date'
import { getApiErrorMessage } from '../../shared/utils/api-error'

const TOPE_FECHAS_SERIE = 60

function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00`)
  d.setDate(d.getDate() + dias)
  return toISODate(d)
}

function sumarMeses(fechaISO: string, meses: number): string {
  const d = new Date(`${fechaISO}T00:00:00`)
  const diaOriginal = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + meses)

  const ultimoDiaDelMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(diaOriginal, ultimoDiaDelMes))
  return toISODate(d)
}

type TipoRecurrencia = 'unica' | 'semanal' | 'mensual'

function generarFechas(tipo: TipoRecurrencia, inicio: string, repeticiones: number): string[] {
  if (tipo === 'unica') return [inicio]
  const total = Math.min(Math.max(repeticiones, 1), TOPE_FECHAS_SERIE)
  if (tipo === 'semanal') return Array.from({ length: total }, (_, i) => sumarDias(inicio, i * 7))
  return Array.from({ length: total }, (_, i) => sumarMeses(inicio, i))
}

const TIPOS_RECURRENCIA: { value: TipoRecurrencia; label: string }[] = [
  { value: 'unica', label: 'Única vez' },
  { value: 'semanal', label: 'Cada semana' },
  { value: 'mensual', label: 'Cada mes' },
]

function formatFechaCorta(iso: string): string {
  return new Date(`${iso}T00:00:00`)
    .toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
    .replace(/^\w/, (c) => c.toUpperCase())
}

interface ProgramarMantenimientoModalProps {
  canchas: Court[]
  /** Preselecciona la cancha (ej. abierto desde la ficha de esa cancha o desde una celda del Calendario). */
  canchaIdInicial?: number
  /** Preselecciona fecha/hora (ej. abierto desde una celda "Libre" del Calendario). */
  fechaInicial?: string
  horaInicial?: string
  onClose: () => void
  onProgramado?: () => void
}

export default function ProgramarMantenimientoModal({
  canchas,
  canchaIdInicial,
  fechaInicial,
  horaInicial,
  onClose,
  onProgramado,
}: ProgramarMantenimientoModalProps) {
  const [canchaId, setCanchaId] = useState<number | ''>(canchaIdInicial ?? canchas[0]?.id ?? '')
  const [fecha, setFecha] = useState(fechaInicial ?? toISODate(new Date()))
  const [horaInicio, setHoraInicio] = useState(horaInicial ?? '08:00')
  const [horaFin, setHoraFin] = useState(() => {
    const base = horaInicial ?? '08:00'
    const [h, m] = base.split(':')
    const siguiente = (Number(h) + 1) % 24
    return `${String(siguiente).padStart(2, '0')}:${m}`
  })
  const [tipo, setTipo] = useState<TipoRecurrencia>('unica')
  const [repeticiones, setRepeticiones] = useState(4)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const programarMantenimiento = useScheduleMaintenance()

  const canchaSeleccionada = canchas.find((c) => c.id === canchaId) ?? null

  const [canchaIdAnterior, setCanchaIdAnterior] = useState(canchaId)
  if (canchaId !== canchaIdAnterior) {
    setCanchaIdAnterior(canchaId)
    if (canchaSeleccionada?.openTime && horaInicio < canchaSeleccionada.openTime) {
      setHoraInicio(canchaSeleccionada.openTime)
    }
    if (canchaSeleccionada?.closeTime && horaFin > canchaSeleccionada.closeTime) {
      setHoraFin(canchaSeleccionada.closeTime)
    }
  }

  const fechas = useMemo(
    () => (fecha ? generarFechas(tipo, fecha, repeticiones) : []),
    [tipo, fecha, repeticiones],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!canchaId) {
      setError('Selecciona una cancha.')
      return
    }
    if (!fecha) {
      setError('Elige una fecha.')
      return
    }
    if (!horaInicio || !horaFin || horaFin <= horaInicio) {
      setError('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    if (tipo !== 'unica' && (repeticiones < 1 || repeticiones > TOPE_FECHAS_SERIE)) {
      setError(`La cantidad de repeticiones debe estar entre 1 y ${TOPE_FECHAS_SERIE}.`)
      return
    }
    if (
      canchaSeleccionada?.openTime &&
      canchaSeleccionada?.closeTime &&
      (horaInicio < canchaSeleccionada.openTime || horaFin > canchaSeleccionada.closeTime)
    ) {
      setError(`Esta cancha solo está disponible de ${canchaSeleccionada.openTime} a ${canchaSeleccionada.closeTime}.`)
      return
    }

    try {
      await programarMantenimiento.mutateAsync({
        courtId: Number(canchaId),
        dates: fechas,
        startTime: horaInicio,
        endTime: horaFin,
        reason: motivo.trim() || undefined,
      })
      onProgramado?.()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo programar el mantenimiento. Intenta de nuevo.'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/40 md:px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-800 w-full max-w-md max-h-[88vh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4" />
            </span>
            <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50">
              Programar Mantenimiento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/60"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Cancha</label>
            <select
              required
              value={canchaId}
              onChange={(e) => setCanchaId(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            >
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              min={toISODate(new Date())}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Hora Inicio</label>
              <input
                type="time"
                required
                value={horaInicio}
                min={canchaSeleccionada?.openTime}
                max={canchaSeleccionada?.closeTime}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
            <div>
              <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Hora Fin</label>
              <input
                type="time"
                required
                value={horaFin}
                min={canchaSeleccionada?.openTime}
                max={canchaSeleccionada?.closeTime}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          </div>
          {canchaSeleccionada?.openTime && canchaSeleccionada?.closeTime && (
            <p className="font-sans text-xs text-neutral-400 dark:text-neutral-500 -mt-1">
              Esta cancha atiende de {canchaSeleccionada.openTime} a {canchaSeleccionada.closeTime}.
            </p>
          )}

          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">Repetición</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_RECURRENCIA.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`h-10 rounded-lg font-sans text-xs font-semibold border transition-colors ${
                    tipo === t.value
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tipo !== 'unica' && (
            <div>
              <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
                Repeticiones ({tipo === 'semanal' ? 'semanas' : 'meses'})
              </label>
              <input
                type="number"
                min={1}
                max={TOPE_FECHAS_SERIE}
                value={repeticiones}
                onChange={(e) => setRepeticiones(Number(e.target.value) || 1)}
                className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          )}

          <div>
            <label className="font-sans text-sm text-neutral-600 dark:text-neutral-300 mb-1 block">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Mantenimiento de grass sintético"
              className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>

          {fechas.length > 0 && (
            <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/60 rounded-lg px-3 py-2">
              {fechas.length === 1
                ? `Se bloqueará el ${formatFechaCorta(fechas[0]!)}.`
                : `Se bloquearán ${fechas.length} fechas: del ${formatFechaCorta(fechas[0]!)} al ${formatFechaCorta(
                    fechas[fechas.length - 1]!,
                  )}.`}
            </p>
          )}

          {error && (
            <p className="font-sans text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={programarMantenimiento.isPending}
              className="flex-1 h-11 rounded-lg bg-brand-primary text-white font-sans text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {programarMantenimiento.isPending ? 'Programando...' : 'Programar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
