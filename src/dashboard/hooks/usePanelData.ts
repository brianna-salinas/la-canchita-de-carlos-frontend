import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../shared/api/client";
import { mapBookingRow, type BookingApiRow, type Court } from "../../bookings/hooks/useCalendario";
import { toISODate, hourToNum, getWeekDates } from "../../shared/utils/date";

export interface Booking {
  id: number;
  courtId: number;
  courtName: string;
  customerId: number | null;
  customerName: string;
  type?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: "PAID" | "PARTIAL" | "PENDING";
  totalAmount: number;
  paidAmount: number;
  bookingType?: "SINGLE" | "MULTIDAY" | "RECURRING";
  seriesId?: string;
  seriesPaymentMode?: "INDIVIDUAL" | "LUMP_SUM";
  seriesLabel?: string;
  seriesTotalDates?: number;
  seriesIndex?: number;
}

export function useTodayBookings() {
  const isoHoy = toISODate(new Date());
  return useQuery({
    queryKey: ["bookings", "today", isoHoy],
    queryFn: async () => {
      const { data } = await apiClient.get("/bookings", {
        params: { from: isoHoy, to: isoHoy },
      });
      return (data as BookingApiRow[])
        .map(mapBookingRow)
        .filter((b) => b.status !== "CANCELLED");
    },
  });
}

export function calculateSummary(bookings: Booking[]) {
  const totalBookings = bookings.length;
  const todayRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const pending = bookings.filter((b) => b.paymentStatus !== "PAID");
  const pendingAmount = pending.reduce(
    (sum, b) => sum + (b.totalAmount - b.paidAmount),
    0,
  );

  return {
    totalBookings,
    todayRevenue,
    pendingAmount,
    pendingCount: pending.length,
  };
}

export function dayPhrase(totalBookingsToday: number): string {
  if (totalBookingsToday === 0) return "Tienes el día libre hoy.";
  if (totalBookingsToday === 1) return "Tienes una reserva hoy. Día tranquilo.";
  if (totalBookingsToday <= 3) return "Tienes algunas reservas hoy.";
  return "Tienes un día movido hoy.";
}

export interface NextFreeSlot {
  startTime: string;
  courtName: string;
  courtId: number;
}

export function calculateNextFreeSlot(
  courts: Court[],
  activeBookingsToday: Booking[],
  now: Date = new Date(),
): NextFreeSlot | null {
  const searchStartHour = now.getHours() + 1;

  let best: NextFreeSlot | null = null;

  for (const court of courts) {

    const openHour = hourToNum(court.openTime ?? "00:00");
    const closeHour = hourToNum(court.closeTime ?? "24:00");
    const start = Math.max(searchStartHour, openHour);

    for (let h = start; h < closeHour; h++) {
      const hourStr = `${String(h).padStart(2, "0")}:00`;
      const isBusy = activeBookingsToday.some(
        (b) =>
          b.courtId === court.id &&
          hourToNum(b.startTime) <= h &&
          hourToNum(b.endTime) > h,
      );
      if (!isBusy) {
        if (!best || hourStr < best.startTime) {
          best = { startTime: hourStr, courtName: court.name, courtId: court.id };
        }
        break;
      }
    }
  }

  return best;
}

export interface DayOccupancy {
  date: Date;
  percentage: number;
}

export function calculateWeeklyOccupancy(
  bookings: Booking[],
  courts: Court[],
  now: Date = new Date(),
): DayOccupancy[] {
  const availableHoursPerDay = courts.reduce((sum, c) => {
    const openHour = hourToNum(c.openTime ?? "00:00");
    const closeHour = hourToNum(c.closeTime ?? "24:00");
    return sum + Math.max(0, closeHour - openHour);
  }, 0);

  return getWeekDates(now).map((date) => {
    const iso = toISODate(date);
    const bookingsForDay = bookings.filter(
      (b) => b.date === iso && b.status !== "CANCELLED",
    );
    const busyHours = bookingsForDay.reduce(
      (sum, b) => sum + Math.max(0, hourToNum(b.endTime) - hourToNum(b.startTime)),
      0,
    );
    const percentage =
      availableHoursPerDay > 0
        ? Math.min(100, Math.round((busyHours / availableHoursPerDay) * 100))
        : 0;
    return { date, percentage };
  });
}
