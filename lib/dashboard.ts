import { ApiGetEventDataResponse } from '@/pages/api/events/[eventId]/data';
import { translateState, translateType } from './reservation';

// types.ts
export interface Metrics {
  totalCount: number;
  vipCount: number;
  standingCount: number;
  paidCount: number;
  revenue: number;
  accountsReceivable: number;
  totalUtilizationPercent: number;
  standingUtilizationPercent: number;
  vipUtilizationPercent: number;
  capacity: { x: string; y1: number; y2: number }[];
  reservationCountByDay: { x: string; y: number }[];
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
      s.reservations
        .filter(
          (r) =>
            r.paymentStatus === 'PAID' || r.paymentStatus === 'PENDING_PAYMENT',
        )
        .map((r) => ({ ...r, timeslot: s.timeslot, date: d.date })),
    ),
  );

  const totalCount = allReservations.length;
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

  const accountsReceivable = allReservations
    .filter((r) => r.paymentStatus === 'PENDING_PAYMENT')
    .reduce((sum, r) => sum + (r.minimumSpend ?? 0), 0);

  const capacity: {
    [key: string]: {
      vip: number;
      standing: number;
      availableVip: number;
      availableStanding: number;
    };
  } = {};

  let standingCapacity = 0;
  let vipCapacity = 0;
  let standingUtilization = 0;
  let vipUtilization = 0;

  eventData.eventDates.forEach((date) => {
    const data = { vip: 0, standing: 0, availableVip: 0, availableStanding: 0 };
    date.seatings.forEach((s) => {
      const vip = s.reservations
        .filter(
          (r) =>
            ['PAID', 'PENDING_PAYMENT'].includes(r.paymentStatus) &&
            r.type == 'VIP',
        )
        .reduce((a, b) => a + b.tableCount, 0);
      const standing = s.reservations
        .filter(
          (r) =>
            ['PAID', 'PENDING_PAYMENT'].includes(r.paymentStatus) &&
            r.type == 'STANDING',
        )
        .reduce((a, b) => a + b.tableCount, 0);
      data.vip += vip;
      data.standing += standing;
      data.availableVip += s.availableVip;
      data.availableStanding += s.availableStanding;

      vipUtilization += vip;
      standingUtilization += standing;
      vipCapacity += s.availableVip;
      standingCapacity += s.availableStanding;
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

  const totalUtilizationPercent =
    (vipUtilization + standingUtilization) / (vipCapacity + standingCapacity);
  const standingUtilizationPercent = standingUtilization / standingCapacity;
  const vipUtilizationPercent = vipUtilization / vipCapacity;

  const reservationCountByDay: {
    [key: string]: { count: number };
  } = {};
  eventData.eventDates.forEach((date) => {
    const data = { count: 0 };
    date.seatings.forEach((s) => {
      s.reservations.forEach((r) => {
        if (
          r.paymentStatus === 'PAID' ||
          r.paymentStatus === 'PENDING_PAYMENT'
        ) {
          data.count += 1;
        }
      });
    });
    reservationCountByDay[date.date] = data;
  });

  const sortedReservationCountByDay = Object.entries(reservationCountByDay)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      x: date,
      y: data.count,
    }));

  const vipCountByDay: {
    [key: string]: { people: number };
  } = {};
  eventData.eventDates.forEach((date) => {
    const data = { people: 0 };
    date.seatings.forEach((s) => {
      s.reservations.forEach((r) => {
        if (
          (r.type === 'VIP' || r.paymentStatus === 'PENDING_PAYMENT') &&
          r.paymentStatus === 'PAID'
        ) {
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
    accountsReceivable,
    totalUtilizationPercent,
    standingUtilizationPercent,
    vipUtilizationPercent,
    reservationCountByDay: sortedReservationCountByDay,
    capacity: sortedCapacity,
    vipCountByDay: sortedVipCountByDay,
    referralCodes: sortedreferralCodes,
    lastTenReservations,
  };
}
