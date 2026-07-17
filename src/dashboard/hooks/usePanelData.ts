import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../shared/api/client";

export interface Alquiler {
  id: number;
  canchaId: number;
  canchaNombre: string;
  clienteId: number;
  clienteNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  estadoPago: "PAGADO" | "PARCIAL" | "PENDIENTE";
  montoTotal: number;
  montoPagado: number;
}

// Trae los alquileres desde el fake API (json-server). Se reemplaza por
// GET /api/bookings?fecha=hoy (US17-US19) cuando el backend esté
// conectado (Sprint 2); por ahora json-server no soporta filtrar por
// "hoy" dinámicamente, así que se trae todo el dataset de prueba y se
// trata como si fuera el día de hoy.
export function useAlquileresHoy() {
  return useQuery({
    queryKey: ["alquileres"],
    queryFn: async () => {
      const { data } = await apiClient.get<Alquiler[]>("/alquileres");
      return data;
    },
  });
}

// Deriva las tarjetas de resumen (alquileres, ingreso, pendiente) a
// partir de los alquileres traídos del fake API, en vez de tenerlas
// hardcodeadas.
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
