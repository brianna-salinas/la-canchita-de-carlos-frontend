import { useState } from 'react'
import { Wrench, X, Plus, Trash2 } from 'lucide-react'
import {
  useUpcomingMaintenance,
  useCancelMaintenanceBlock,
  type MaintenanceBlock,
} from '../hooks/useCalendario'
import { hourToNum } from '../../shared/utils/date'
import { getApiErrorMessage } from '../../shared/utils/api-error'

interface GrupoMantenimiento {
  date: string
  reason: string
  horaInicio: string
  horaFin: string
  ids: number[]
}

function agrupar(bloques: MaintenanceBlock[]): GrupoMantenimiento[] {
  const porFechaYMotivo = new Map<string, GrupoMantenimiento>()
  for (const b of bloques) {
    const clave = `${b.date}__${b.reason}`
    const existente = porFechaYMotivo.get(clave)
    if (existente) {
      existente.ids.push(b.id)
      if (b.time < existente.horaInicio) existente.horaInicio = b.time
      if (b.time >= existente.horaFin) existente.horaFin = `${String((hourToNum(b.time) + 1) % 24).padStart(2, '0')}:00`
    } else {
      porFechaYMotivo.set(clave, {
        date: b.date,
        reason: b.reason,
        horaInicio: b.time,
        horaFin: `${String((hourToNum(b.time) + 1) % 24).padStart(2, '0')}:00`,
        ids: [b.id],
      })
    }
  }
  return Array.from(porFechaYMotivo.values()).sort(
    (a, c) => a.date.localeCompare(c.date) || a.horaInicio.localeCompare(c.horaInicio),
  )
}

function formatFechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00`)
    .toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/^\w/, (c) => c.toUpperCase())
}

interface MantenimientosProgramadosModalProps {
  canchaId: number
  canchaNombre: string
  onClose: () => void
  onProgramarNuevo: () => void
}

export default function MantenimientosProgramadosModal({
  canchaId,
  canchaNombre,
  onClose,
  onProgramarNuevo,
}: MantenimientosProgramadosModalProps) {
  const { data: bloques = [], isLoading } = useUpcomingMaintenance(canchaId)
  const cancelar = useCancelMaintenanceBlock()
  const [cancelandoClave, setCancelandoClave] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const grupos = agrupar(bloques)

  async function cancelarGrupo(g: GrupoMantenimiento) {
    if (!window.confirm(`¿Cancelar el mantenimiento del ${formatFechaLarga(g.date)} (${g.horaInicio} a ${g.horaFin})?`)) return
    const clave = `${g.date}__${g.reason}`
    setCancelandoClave(clave)
    setError(null)
    try {
      await Promise.all(g.ids.map((id) => cancelar.mutateAsync(id)))
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cancelar el mantenimiento. Intenta de nuevo.'))
    } finally {
      setCancelandoClave(null)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/40 md:px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-800 w-full max-w-md max-h-[88vh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-5 md:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="font-sans font-bold text-lg text-neutral-900 dark:text-neutral-50 leading-tight">
                Mantenimientos programados
              </h2>
              <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 truncate">{canchaNombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 shrink-0"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 text-center py-6">Cargando...</p>
        )}

        {!isLoading && grupos.length === 0 && (
          <p className="font-sans text-sm text-neutral-400 dark:text-neutral-500 text-center py-6">
            No hay mantenimientos programados para esta cancha.
          </p>
        )}

        {error && <p className="font-sans text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 mb-3">{error}</p>}

        <div className="space-y-2 mb-4">
          {grupos.map((g) => {
            const clave = `${g.date}__${g.reason}`
            return (
              <div
                key={clave}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-50">
                    {formatFechaLarga(g.date)} · {g.horaInicio} a {g.horaFin}
                  </p>
                  {g.reason && (
                    <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{g.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => cancelarGrupo(g)}
                  disabled={cancelandoClave === clave}
                  aria-label="Cancelar este mantenimiento"
                  className="h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-danger hover:bg-danger/10 shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onProgramarNuevo}
          className="w-full h-11 rounded-lg border border-dashed border-brand-primary/50 text-brand-primary font-sans text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary/5"
        >
          <Plus className="h-4 w-4" />
          Programar nuevo mantenimiento
        </button>
      </div>
    </div>
  )
}
