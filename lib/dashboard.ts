import { ApiGetEventDataResponse } from '@/pages/api/events/[eventId]/data';
import { translateState, translateType } from './reservation';

// types.ts
export interface Metrics {
  totalCount: number;
  vipCount: number;
  standingCount: number;
  paidCount: number;
  revenue: number;
  capacity: { x: string; y1: number; y2: number }[];
  vipCountByDay: { x: string; y: number }[];
  referralCodes: { x: string; y: number }[];
  lastTenReservations: {
    Name: string;
    Typ: string;
    Status: string;
    Personen: number;
    Datum: string;
    Timeslot: string;
    Eingegangen: string;
  }[];
}

export function calculateMetrics(eventData: ApiGetEventDataResponse): Metrics {
  // flatten alle Reservierungen
  const allReservations = eventData.eventDates.flatMap((d) =>
    d.seatings.flatMap((s) =>
      s.reservations.map((r) => ({ ...r, timeslot: s.timeslot, date: d.date })),
    ),
  );

  const totalCount = allReservations.reduce((a, b) => a + b.tableCount, 0);
  const vipCount = allReservations
    .filter((r) => r.type === 'VIP')
    .reduce((a, b) => a + b.tableCount, 0);
  const standingCount = allReservations
    .filter((r) => r.type === 'STANDING')
    .reduce((a, b) => a + b.tableCount, 0);
  const paidCount = allReservations
    .filter((r) => r.paymentStatus === 'PAID')
    .reduce((a, b) => a + b.tableCount, 0);

  const revenue = allReservations
    .filter((r) => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + (r.minimumSpend ?? 0), 0);

  const capacity: {
    [key: string]: {
      vip: number;
      standing: number;
      availableVip: number;
      availableStanding: number;
    };
  } = {};
  eventData.eventDates.forEach((date) => {
    const data = { vip: 0, standing: 0, availableVip: 0, availableStanding: 0 };
    date.seatings.forEach((s) => {
      data.vip += s.reservations
        .filter((r) => r.paymentStatus == 'PAID' && r.type == 'VIP')
        .reduce((a, b) => a + b.tableCount, 0);
      data.standing += s.reservations
        .filter((r) => r.paymentStatus == 'PAID' && r.type == 'STANDING')
        .reduce((a, b) => a + b.tableCount, 0);
      data.availableVip += s.availableVip;
      data.availableStanding += s.availableStanding;
    });
    capacity[date.date] = data;
  });

  const sortedCapacity = Object.entries(capacity)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      x: date,
      y1: (data.vip * 100) / data.availableVip,
      y2: (data.standing * 100) / data.availableStanding,
    }));

  const vipCountByDay: {
    [key: string]: { people: number };
  } = {};
  eventData.eventDates.forEach((date) => {
    const data = { people: 0 };
    date.seatings.forEach((s) => {
      s.reservations.forEach((r) => {
        if (r.type === 'VIP' && r.paymentStatus === 'PAID') {
          data.people += r.people;
        }
      });
    });
    vipCountByDay[date.date] = data;
  });

  const sortedVipCountByDay = Object.entries(vipCountByDay)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      x: date,
      y: data.people,
    }));

  const referralCodes: { [key: string]: number } = {};
  allReservations.forEach((reservation) => {
    if (reservation.referralCode?.code) {
      referralCodes[reservation.referralCode?.code] =
        (referralCodes[reservation.referralCode?.code] || 0) + 1;
    }
  });
  const sortedreferralCodes = Object.entries(referralCodes)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([code, count]) => ({
      x: code,
      y: count,
    }));

  const lastTenReservations = allReservations
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10)
    .map((reservation) => ({
      Name: reservation.name,
      Typ: translateType(reservation.type) || 'Unbekannt',
      Status: translateState(reservation.paymentStatus) || 'Unbekannt',
      Personen: reservation.people,
      Datum: reservation.date,
      Timeslot: reservation.timeslot,
      Eingegangen: new Date(reservation.createdAt).toLocaleString('de-DE', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    }));

  return {
    totalCount,
    vipCount,
    standingCount,
    paidCount,
    revenue,
    capacity: sortedCapacity,
    vipCountByDay: sortedVipCountByDay,
    referralCodes: sortedreferralCodes,
    lastTenReservations,
  };
}
