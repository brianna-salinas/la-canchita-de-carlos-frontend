import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../shared/api/client";
import { mapBookingToAlquiler, type BookingApiRow, type Cancha } from "../../bookings/hooks/useCalendario";
import { toISODate, hourToNum, getWeekDates } from "../../shared/utils/date";

export interface Alquiler {
  id: number;
  canchaId: number;
  canchaNombre: string;
  clienteId: number | null;
  clienteNombre: string;
  tipo?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  estadoPago: "PAGADO" | "PARCIAL" | "PENDIENTE";
  montoTotal: number;
  montoPagado: number;
  tipoReserva?: "UNICA" | "MULTIDIA" | "RECURRENTE";
  serieId?: string;
  serieModoPago?: "INDIVIDUAL" | "ACUMULADO";
  serieEtiqueta?: string;
  serieTotalFechas?: number;
  serieIndice?: number;
}

// Antes esto traía TODOS los bookings de siempre (sin filtrar por fecha ni
// por estado), así que: (a) los totales "de hoy" incluían reservas de
// cualquier día, y (b) un alquiler cancelado (botón "Eliminar") seguía
// apareciendo en la lista porque nunca se excluía por status. Ahora se pide
// solo el rango de hoy al backend (from/to) y además se descarta CANCELLED
// por si el backend algún día deja de filtrar por fecha exacta.
export function useAlquileresHoy() {
  const isoHoy = toISODate(new Date());
  return useQuery({
    queryKey: ["alquileres", "hoy", isoHoy],
    queryFn: async () => {
      const { data } = await apiClient.get("/bookings", {
        params: { from: isoHoy, to: isoHoy },
      });
      return (data as BookingApiRow[])
        .map(mapBookingToAlquiler)
        .filter((a) => a.estado !== "CANCELLED");
    },
  });
}

export function calcularResumen(alquileres: Alquiler[]) {
  const totalAlquileres = alquileres.length;
  const ingresoHoy = alquileres.reduce((sum, a) => sum + a.montoPagado, 0);
  const pendientes = alquileres.filter((a) => a.estadoPago !== "PAGADO");
  const montoPendiente = pendientes.reduce(
    (sum, a) => sum + (a.montoTotal - a.montoPagado),
    0,
  );

  return {
    totalAlquileres,
    ingresoHoy,
    montoPendiente,
    cantidadPendientes: pendientes.length,
  };
}

// Antes decía siempre "Tienes un día movido hoy", sin importar cuántas
// reservas hubiera (incluso con una sola reserva de prueba). Ahora la frase
// depende de cuántos alquileres activos hay hoy.
export function fraseDelDia(totalAlquileresHoy: number): string {
  if (totalAlquileresHoy === 0) return "Tienes el día libre hoy.";
  if (totalAlquileresHoy === 1) return "Tienes una reserva hoy. Día tranquilo.";
  if (totalAlquileresHoy <= 3) return "Tienes algunas reservas hoy.";
  return "Tienes un día movido hoy.";
}

export interface ProximaLibre {
  horaInicio: string;
  canchaNombre: string;
  canchaId: number;
}

// Antes tomaba el horaFin más tardío entre los alquileres de hoy (el
// "último" de la lista), sin importar la hora actual ni si esa franja ya
// había pasado o seguía ocupada. Ahora calcula, a partir de la hora actual,
// la próxima hora en punto (hora actual + 1) que esté libre en alguna
// cancha, respetando el horario de atención de cada una y las reservas
// activas de hoy.
export function calcularSiguienteHorarioLibre(
  canchas: Cancha[],
  alquileresHoyActivos: Alquiler[],
  ahora: Date = new Date(),
): ProximaLibre | null {
  const horaInicioBusqueda = ahora.getHours() + 1;

  let mejor: ProximaLibre | null = null;

  for (const cancha of canchas) {
    // El horario de atención es opcional: si la cancha no lo configuró, no
    // tiene restricción (cuenta como abierta todo el día).
    const apertura = hourToNum(cancha.horaApertura ?? "00:00");
    const cierre = hourToNum(cancha.horaCierre ?? "24:00");
    const inicio = Math.max(horaInicioBusqueda, apertura);

    for (let h = inicio; h < cierre; h++) {
      const horaStr = `${String(h).padStart(2, "0")}:00`;
      const ocupada = alquileresHoyActivos.some(
        (a) =>
          a.canchaId === cancha.id &&
          hourToNum(a.horaInicio) <= h &&
          hourToNum(a.horaFin) > h,
      );
      if (!ocupada) {
        if (!mejor || horaStr < mejor.horaInicio) {
          mejor = { horaInicio: horaStr, canchaNombre: cancha.nombre, canchaId: cancha.id };
        }
        break;
      }
    }
  }

  return mejor;
}

export interface OcupacionDia {
  fecha: Date;
  porcentaje: number;
}

// Antes era un placeholder gris fijo, sin datos. Ahora calcula, para cada
// día de la semana actual (lunes a domingo), qué porcentaje de las horas
// disponibles de todas las canchas está ocupado por reservas activas
// (no canceladas).
export function calcularOcupacionSemanal(
  reservas: Alquiler[],
  canchas: Cancha[],
  ahora: Date = new Date(),
): OcupacionDia[] {
  const horasDisponiblesPorDia = canchas.reduce((sum, c) => {
    const apertura = hourToNum(c.horaApertura ?? "00:00");
    const cierre = hourToNum(c.horaCierre ?? "24:00");
    return sum + Math.max(0, cierre - apertura);
  }, 0);

  return getWeekDates(ahora).map((fecha) => {
    const iso = toISODate(fecha);
    const reservasDia = reservas.filter(
      (r) => r.fecha === iso && r.estado !== "CANCELLED",
    );
    const horasOcupadas = reservasDia.reduce(
      (sum, r) => sum + Math.max(0, hourToNum(r.horaFin) - hourToNum(r.horaInicio)),
      0,
    );
    const porcentaje =
      horasDisponiblesPorDia > 0
        ? Math.min(100, Math.round((horasOcupadas / horasDisponiblesPorDia) * 100))
        : 0;
    return { fecha, porcentaje };
  });
}
