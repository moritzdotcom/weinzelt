import { ApiGetEventDataResponse } from '@/pages/api/events/[eventId]/data';
import { ApiGetPageVisitsResponse } from '@/pages/api/pageVisits';
import { translateState, translateType } from './reservation';

// types.ts
export interface Metrics {
  totalCount: number;
  vipCount: number;
  standingCount: number;
  acceptedCount: number;
  paidCount: number;
  paidPercentage: number;
  revenue: number;
  pageVisits: number;
  uniqueVisitors: number;
  allUnpaidMails: string[];
  capacity: { x: string; y1: number; y2: number }[];
  vipCountByDay: { x: string; y1: number; y2: number }[];
  packageCounts: { x: string; y: number }[];
  referralCodes: { x: string; y: number }[];
  dailyPageVisitData: { x: string; y: number }[];
  pageVisitsBySource: { x: string; y: number }[];
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

export function calculateMetrics(
  eventData: ApiGetEventDataResponse,
  pageVisits: ApiGetPageVisitsResponse
): Metrics {
  // flatten alle Reservierungen
  const allReservations = eventData.eventDates.flatMap((d) =>
    d.seatings.flatMap((s) =>
      s.reservations.map((r) => ({ ...r, timeslot: s.timeslot, date: d.date }))
    )
  );

  const totalCount = allReservations.reduce((a, b) => a + b.tableCount, 0);
  const vipCount = allReservations
    .filter((r) => r.type === 'VIP')
    .reduce((a, b) => a + b.tableCount, 0);
  const standingCount = allReservations
    .filter((r) => r.type === 'STANDING')
    .reduce((a, b) => a + b.tableCount, 0);
  const acceptedCount = allReservations
    .filter((r) => r.confirmationState === 'ACCEPTED')
    .reduce((a, b) => a + b.tableCount, 0);
  const paidCount = allReservations
    .filter((r) => r.payed)
    .reduce((a, b) => a + b.tableCount, 0);

  const paidPercentage =
    acceptedCount > 0 ? (paidCount / acceptedCount) * 100 : 0;

  const revenue = allReservations
    .filter((r) => r.confirmationState !== 'DECLINED')
    .reduce(
      (sum, r) => sum + (r.packagePrice ?? 0) + (r.totalFoodPrice ?? 0),
      0
    );

  const allUnpaidMails = allReservations
    .filter((r) => r.confirmationState === 'ACCEPTED' && !r.payed)
    .map((r) => r.email);
  const pageVisitsCount = pageVisits.length;
  const uniqueVisitors = new Set(pageVisits.map((v) => v.ip)).size;

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
        .filter((r) => r.confirmationState == 'ACCEPTED' && r.type == 'VIP')
        .reduce((a, b) => a + b.tableCount, 0);
      data.standing += s.reservations
        .filter(
          (r) => r.confirmationState == 'ACCEPTED' && r.type == 'STANDING'
        )
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
    [key: string]: { people: number; foodCount: number };
  } = {};
  eventData.eventDates.forEach((date) => {
    const data = { people: 0, foodCount: 0 };
    date.seatings.forEach((s) => {
      s.reservations.forEach((r) => {
        if (r.type === 'VIP' && r.confirmationState === 'ACCEPTED') {
          data.people += r.people;
          if (s.foodRequired) data.foodCount += r.people;
        }
      });
    });
    vipCountByDay[date.date] = data;
  });

  const sortedVipCountByDay = Object.entries(vipCountByDay)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      x: date,
      y1: data.people,
      y2: data.foodCount,
    }));

  const packageCounts: { [key: string]: number } = {};
  allReservations.forEach((reservation) => {
    if (reservation.packageName) {
      packageCounts[reservation.packageName] =
        (packageCounts[reservation.packageName] || 0) + 1;
    }
  });

  const sortedPackageCounts = Object.entries(packageCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([packageName, count]) => ({
      x: packageName,
      y: count,
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

  const dailyPageVisits: { [key: string]: number } = {};
  const pageVisitsBySource: { [key: string]: number } = {};
  pageVisits.forEach((visit) => {
    const date = new Date(visit.createdAt).toLocaleDateString('en-US');
    dailyPageVisits[date] = (dailyPageVisits[date] || 0) + 1;
    pageVisitsBySource[visit.source] =
      (pageVisitsBySource[visit.source] || 0) + 1;
  });
  const dailyPageVisitData = Object.entries(dailyPageVisits)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({
      x: new Date(date).toLocaleDateString('de-DE'),
      y: count,
    }));
  const sortedPageVisitsBySource = Object.entries(pageVisitsBySource)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([source, count]) => ({
      x: source,
      y: count,
    }));

  const lastTenReservations = allReservations
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)
    .map((reservation) => ({
      Name: reservation.name,
      Typ: translateType(reservation.type) || 'Unbekannt',
      Status: translateState(reservation.confirmationState) || 'Unbekannt',
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
    acceptedCount,
    paidCount,
    paidPercentage,
    revenue,
    pageVisits: pageVisitsCount,
    uniqueVisitors,
    allUnpaidMails,
    capacity: sortedCapacity,
    vipCountByDay: sortedVipCountByDay,
    packageCounts: sortedPackageCounts,
    referralCodes: sortedreferralCodes,
    dailyPageVisitData,
    pageVisitsBySource: sortedPageVisitsBySource,
    lastTenReservations,
  };
}
