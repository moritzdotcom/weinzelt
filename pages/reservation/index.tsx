import { Box, Typography } from '@mui/material';
import ReservationHeader from '@/components/reservation/header';
import Link from 'next/link';
import Image from 'next/image';

export default function ReservationPage() {
  return (
    <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
      <ReservationHeader>Wähle deinen Tisch für das Weinzelt</ReservationHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <Link href="/reservation/vip" className="no-underline">
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
                Unser exklusives Erlebnis für bis zu 10 Personen - perfekt für
                Genießer und besondere Abende.
              </Typography>
            </Box>
          </Box>
        </Link>

        <Link href="/reservation/standing" className="no-underline">
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
          href="mailto:reservierungen@dasweinzelt.de"
          className="text-black font-medium underline"
        >
          reservierungen@dasweinzelt.de
        </a>
        .
      </Typography>
    </Box>
  );
}
