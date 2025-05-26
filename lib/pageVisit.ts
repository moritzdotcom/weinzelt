import { GetServerSideProps } from 'next';
import prisma from '@/lib/prismadb';
import geoip from 'geoip-lite';

export const trackPageVisit: GetServerSideProps = async ({
  req,
  query,
  res,
}) => {
  const source =
    (query.ref as string) || (query.utm_source as string) || 'Unbekannt';

  if (!req.cookies['pageVisitId']) {
    const forwarded = req.headers['x-forwarded-for'];
    const ipFromHeader =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : undefined;
    const ip = ipFromHeader ?? req.socket.remoteAddress ?? 'unknown';

    if (source) {
      // Geo-Lookup
      const geo = geoip.lookup(ip || '');
      const { country, region, city } = geo || {};
      const latitude = geo?.ll?.[0];
      const longitude = geo?.ll?.[1];

      // Dedupe nach IP+Quelle für den Tag…
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const exists = await prisma.pageVisit.findFirst({
        where: { source, ip, createdAt: { gte: todayStart } },
      });

      if (!exists) {
        const pageVisit = await prisma.pageVisit.create({
          data: {
            source,
            medium: (query.utm_medium as string) || null,
            campaign: (query.utm_campaign as string) || null,
            path: req.url || '/',
            ip,
            country,
            region,
            city,
            latitude,
            longitude,
          },
        });

        const maxAge = 24 * 60 * 60; // 1 Tag in Sekunden
        const value = encodeURIComponent(pageVisit.id);
        const cookie = [
          `pageVisitId=${value}`,
          `Path=/`,
          `HttpOnly`,
          `Max-Age=${maxAge}`,
          `SameSite=Lax`,
        ].join('; ');

        res.setHeader('Set-Cookie', cookie);
      }
    }
  }

  return { props: {} };
};
