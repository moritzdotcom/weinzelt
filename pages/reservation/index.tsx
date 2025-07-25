import { Box, Typography } from '@mui/material';
import ReservationHeader from '@/components/reservation/header';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ReservationCountdownSection from '@/components/reservation/countdown';
import { GetServerSideProps } from 'next';
import { trackPageVisit } from '@/lib/pageVisit';

export default function ReservationPage() {
  const router = useRouter();
  const [dateParam, setDateParam] = useState<string>();

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.date !== 'string') return;
    setDateParam(router.query.date);
  }, [router.isReady]);

  return (
    <ReservationCountdownSection startDate="2025-05-23T16:00:00Z">
      <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
        <ReservationHeader>
          Wähle deinen Tisch für das Weinzelt
        </ReservationHeader>

        <div className="rounded-md bg-emerald-50 border border-gray-300 p-4">
          <Typography variant="body1" className="text-emerald-800">
            Das Weinzelt ist für alle geöffnet. Eine Tischreservierung ist für
            den Besuch des Weinzelt <b>nicht erforderlich</b>.
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <Link
            href={{
              query: dateParam ? { date: dateParam } : {},
              pathname: '/reservation/vip',
            }}
            className="no-underline"
          >
            <Box className="rounded-lg overflow-hidden shadow-lg border border-gray-400 hover:shadow-xl hover:scale-105 transition cursor-pointer">
              <Image
                src="/reservation/vip.png"
                alt="VIP Tisch"
                width={600}
                height={400}
                className="w-full h-64 object-cover"
              />
              <Box className="p-5">
                <h6 className="text-lg font-cocogoose mb-2">VIP Tisch</h6>
                <Typography variant="body2" color="textSecondary">
                  Unser exklusives Erlebnis für bis zu 8 Personen - perfekt für
                  Genießer und besondere Abende.
                </Typography>
              </Box>
            </Box>
          </Link>

          <Link
            href={{
              query: dateParam ? { date: dateParam } : {},
              pathname: '/reservation/standing',
            }}
            className="no-underline"
          >
            <Box className="rounded-lg overflow-hidden shadow-lg border border-gray-400 hover:shadow-xl hover:scale-105 transition cursor-pointer">
              <Image
                src="/reservation/standing.png"
                alt="Stehtisch"
                width={600}
                height={400}
                className="w-full h-64 object-cover"
              />
              <Box className="p-5">
                <h6 className="text-lg font-cocogoose mb-2">Stehtisch</h6>
                <Typography variant="body2" color="textSecondary">
                  Die easy-going Variante für bis zu 16 Personen direkt im
                  Weinzelt - locker, gesellig, stimmungsvoll.
                </Typography>
              </Box>
            </Box>
          </Link>
        </div>

        <Typography variant="body2" className="mt-12 text-center text-gray-600">
          Für Firmenanfragen oder größere Gruppen kontaktiere uns bitte unter{' '}
          <a
            href="mailto:reservierung@dasweinzelt.de"
            className="text-black font-medium underline"
          >
            reservierung@dasweinzelt.de
          </a>{' '}
          oder nutze unser{' '}
          <a
            href="/reservation/company"
            className="text-black font-medium underline"
          >
            Kontaktformular
          </a>
          .
        </Typography>
      </Box>
    </ReservationCountdownSection>
  );
}

export const getServerSideProps: GetServerSideProps = async (props) => {
  await trackPageVisit(props);
  return { props: {} };
};
