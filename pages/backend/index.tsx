import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import PasswordIcon from '@mui/icons-material/Password';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import SearchIcon from '@mui/icons-material/Search';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import MarkAsUnreadIcon from '@mui/icons-material/MarkAsUnread';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import BackendKpiSection from '@/components/backend/kpiSection';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';

const menuItems = [
  {
    href: '/backend/events',
    title: 'Veranstaltungen',
    description: 'Verwalte Veranstaltungen und Sichtbarkeit.',
    Icon: CelebrationRoundedIcon,
    group: 'Setup',
  },
  {
    href: '/backend/seatings',
    title: 'Seatings & Timeslots',
    description:
      'Plane Sitzbereiche, Kapazitäten, Timeslots und Mindestverzehr.',
    Icon: TableRestaurantIcon,
    group: 'Setup',
  },
  {
    href: '/backend/reservations',
    title: 'Reservierungen',
    description:
      'Bestätige Zahlungen, storniere Reservierungen, und plane Tischbelegung.',
    Icon: AssignmentIcon,
    group: 'Reservierungen',
  },
  {
    href: '/backend/reservations/search',
    title: 'Reservierungen suchen',
    description:
      'Finde und bearbeite Reservierungen schnell nach Name, E-Mail, Datum oder Buchungsdetails.',
    Icon: SearchIcon,
    group: 'Reservierungen',
  },
  {
    href: '/backend/reservations/company',
    title: 'Firmenbereich',
    description:
      'Verwalte Firmen & Gruppenanfragen und lege Firmenreservierungen an.',
    Icon: ApartmentIcon,
    group: 'Reservierungen',
  },
  {
    href: '/backend/reservations/friendsFamily',
    title: 'Friends & Family',
    description:
      'Erstelle interne Einladungen und besondere Reservierungen für Gäste des Teams.',
    Icon: Diversity1Icon,
    group: 'Reservierungen',
  },
  {
    href: '/backend/reservations/export',
    title: 'Reservierungen exportieren',
    description:
      'Filtere Reservierungen, wähle Spalten aus und exportiere eine Excel-Datei.',
    Icon: FileDownloadRoundedIcon,
    group: 'Reservierungen',
  },
  {
    href: '/backend/dashboard',
    title: 'Statistiken',
    description:
      'Analysiere Reservierungen, Auslastung, Gästezahlen und Umsatzentwicklung.',
    Icon: LineAxisIcon,
    group: 'Reporting',
  },
  {
    href: '/backend/invoices',
    title: 'Rechnungen',
    description: 'Rechnungen erstellen, versenden, suchen und exportieren.',
    Icon: ReceiptOutlinedIcon,
    group: 'Reporting',
  },
  {
    href: '/backend/referralCodes',
    title: 'Referral Codes',
    description:
      'Lege Codes für Partner, Aktionen oder besondere Buchungskanäle an.',
    Icon: PasswordIcon,
    group: 'Marketing',
  },
  {
    href: '/backend/specialEvents',
    title: 'WineEvents',
    description:
      'Pflege Sonderformate, Aktionen, Highlights und buchbare Zusatzveranstaltungen.',
    Icon: LocalActivityIcon,
    group: 'Marketing',
  },
  {
    href: '/backend/newsletter',
    title: 'Newsletter',
    description:
      'Versende Newsletter und schau dir aktive Subscriptions und Click-Raten an.',
    Icon: MarkAsUnreadIcon,
    group: 'Marketing',
  },
  {
    href: '/backend/impressions',
    title: 'Fotos hochladen',
    description:
      'Lade Impressionen hoch und verwalte Bilder für Galerie und Website.',
    Icon: AddAPhotoIcon,
    group: 'Marketing',
  },
];

export default function Backend({ session }: { session: Session }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  const groupedItems = menuItems.reduce(
    (acc, item) => {
      acc[item.group] = acc[item.group] || [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof menuItems>,
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col items-center text-center gap-3">
        <img src="/logo.png" alt="WEINZELT" className="w-56" />

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-3">
            Backend
          </p>
          <h1 className="text-3xl font-semibold text-gray-950">
            Hallo {session.user?.name}
          </h1>
          <p className="mt-2 text-gray-500">
            Noch{' '}
            <b>
              {Math.round(
                Math.max(
                  0,
                  (new Date('2026-07-17T14:00').getTime() -
                    new Date().getTime()) /
                    1000 /
                    60 /
                    60 /
                    24,
                ),
              )}{' '}
              Tage
            </b>{' '}
            bis zum Weinzelt
          </p>
        </div>
      </header>

      <BackendKpiSection />

      <section className="flex flex-col gap-8">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">{group}</h2>
              <div className="mt-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item) => (
                <LinkItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function LinkItem({
  href,
  title,
  description,
  Icon,
}: {
  href: string;
  title: string;
  description: string;
  Icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-gray-950 group-hover:text-white">
          <Icon fontSize="small" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
