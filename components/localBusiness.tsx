import { events } from '@/lib/events';

export default function LocalBusiness() {
  const localBusinessWithHoursAndEvents = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'Weinzelt',
        url: 'https://dasweinzelt.de',
        logo: 'https://dasweinzelt.de/logo.png',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Düsseldorf',
          addressRegion: 'Nordrhein-Westfalen',
          addressCountry: 'DE',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '51.2251631',
          longitude: '6.7606443',
        },
        hasMap: 'https://www.google.com/maps?q=51.2251631,6.7606443',
        telephone: '+49-xxx-xxxxxxx',
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Friday',
            opens: '14:00',
            closes: '02:00',
            validFrom: '2025-07-11',
            validThrough: '2025-07-11',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Saturday',
            opens: '13:00',
            closes: '02:00',
            validFrom: '2025-07-12',
            validThrough: '2025-07-12',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Sunday',
            opens: '11:00',
            closes: '24:00',
            validFrom: '2025-07-13',
            validThrough: '2025-07-13',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Monday',
            opens: '14:00',
            closes: '24:00',
            validFrom: '2025-07-14',
            validThrough: '2025-07-14',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Tuesday',
            opens: '14:00',
            closes: '24:00',
            validFrom: '2025-07-15',
            validThrough: '2025-07-15',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Wednesday',
            opens: '14:00',
            closes: '24:00',
            validFrom: '2025-07-16',
            validThrough: '2025-07-16',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Thursday',
            opens: '14:00',
            closes: '24:00',
            validFrom: '2025-07-17',
            validThrough: '2025-07-17',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Friday',
            opens: '14:00',
            closes: '02:00',
            validFrom: '2025-07-18',
            validThrough: '2025-07-18',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Saturday',
            opens: '13:00',
            closes: '02:00',
            validFrom: '2025-07-19',
            validThrough: '2025-07-19',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Sunday',
            opens: '11:00',
            closes: '24:00',
            validFrom: '2025-07-20',
            validThrough: '2025-07-20',
          },
        ],
      },
      ...events.map((e) => ({
        '@type': 'Event',
        name: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        location: {
          '@type': 'Place',
          name: 'Weinzelt',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Düsseldorf',
            addressCountry: 'DE',
          },
        },
        image: `https://dasweinzelt.de${e.image}`,
        description: e.description,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(localBusinessWithHoursAndEvents),
      }}
    />
  );
}
