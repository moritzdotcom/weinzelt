import { ApiGetEventDataResponse } from '@/pages/api/events/[eventId]/data';
import { ApiGetPageVisitsResponse } from '@/pages/api/pageVisits';

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
  packageCounts: { x: string; y: number }[];
  dailyPageVisitData: { x: string; y: number }[];
  pageVisitsBySource: { x: string; y: number }[];
}

export function calculateMetrics(
  eventData: ApiGetEventDataResponse,
  pageVisits: ApiGetPageVisitsResponse
): Metrics {
  // flatten alle Reservierungen
  const allReservations = eventData.eventDates.flatMap((d) =>
    d.seatings.flatMap((s) => s.reservations)
  );

  const totalCount = allReservations.length;
  const vipCount = allReservations.filter((r) => r.type === 'VIP').length;
  const standingCount = allReservations.filter(
    (r) => r.type === 'STANDING'
  ).length;
  const acceptedCount = allReservations.filter(
    (r) => r.confirmationState === 'ACCEPTED'
  ).length;
  const paidCount = allReservations.filter((r) => r.payed).length;

  const paidPercentage =
    acceptedCount > 0 ? (paidCount / acceptedCount) * 100 : 0;

  const revenue = allReservations
    .filter((r) => r.confirmationState !== 'DECLINED')
    .reduce(
      (sum, r) => sum + (r.packagePrice ?? 0) + (r.totalFoodPrice ?? 0),
      0
    );

  const pageVisitsCount = pageVisits.length;
  const uniqueVisitors = new Set(pageVisits.map((v) => v.ip)).size;

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
    packageCounts: sortedPackageCounts,
    dailyPageVisitData,
    pageVisitsBySource: sortedPageVisitsBySource,
  };
}
