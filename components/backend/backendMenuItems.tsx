// /components/backend/backendMenuItems.tsx
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import PasswordIcon from '@mui/icons-material/Password';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import SearchIcon from '@mui/icons-material/Search';
import TableBarIcon from '@mui/icons-material/TableBar';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import MarkAsUnreadIcon from '@mui/icons-material/MarkAsUnread';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  BACKEND_PERMISSIONS,
  BackendPermissionKey,
} from '@/lib/backend/permissions';

export type BackendMenuItem = {
  href: string;
  title: string;
  description: string;
  Icon: SvgIconComponent;
  group: string;
  permission: BackendPermissionKey;
};

export const backendMenuItems: BackendMenuItem[] = [
  {
    href: '/backend/events',
    title: 'Veranstaltungen',
    description: 'Verwalte Veranstaltungen und Sichtbarkeit.',
    Icon: CelebrationRoundedIcon,
    group: 'Setup',
    permission: BACKEND_PERMISSIONS.EVENTS,
  },
  {
    href: '/backend/seatings',
    title: 'Seatings & Timeslots',
    description:
      'Plane Sitzbereiche, Kapazitäten, Timeslots und Mindestverzehr.',
    Icon: TableRestaurantIcon,
    group: 'Setup',
    permission: BACKEND_PERMISSIONS.SEATINGS,
  },
  {
    href: '/backend/users',
    title: 'Benutzer & Rechte',
    description:
      'Verwalte Backend-Benutzer und lege fest, welche Bereiche sichtbar sind.',
    Icon: ManageAccountsRoundedIcon,
    group: 'Setup',
    permission: BACKEND_PERMISSIONS.USERS,
  },
  {
    href: '/backend/reservations',
    title: 'Reservierungen',
    description:
      'Bestätige Zahlungen, storniere Reservierungen, und plane Tischbelegung.',
    Icon: AssignmentIcon,
    group: 'Reservierungen',
    permission: BACKEND_PERMISSIONS.RESERVATIONS,
  },
  {
    href: '/backend/reservations/search',
    title: 'Reservierungen suchen',
    description:
      'Finde und bearbeite Reservierungen schnell nach Name, E-Mail, Datum oder Buchungsdetails.',
    Icon: SearchIcon,
    group: 'Reservierungen',
    permission: BACKEND_PERMISSIONS.RESERVATION_SEARCH,
  },
  {
    href: '/backend/reservations/tableNumbers',
    title: 'Tischzuordnung',
    description: 'Weise Reservierungen den Tischen zu.',
    Icon: TableBarIcon,
    group: 'Reservierungen',
    permission: BACKEND_PERMISSIONS.RESERVATION_TABLE_NUMBERS,
  },
  {
    href: '/backend/reservations/company',
    title: 'Firmenbereich',
    description:
      'Verwalte Firmen & Gruppenanfragen und lege Firmenreservierungen an.',
    Icon: ApartmentIcon,
    group: 'Reservierungen',
    permission: BACKEND_PERMISSIONS.COMPANY_RESERVATIONS,
  },
  {
    href: '/backend/reservations/friendsFamily',
    title: 'Friends & Family',
    description:
      'Erstelle interne Einladungen und besondere Reservierungen für Gäste des Teams.',
    Icon: Diversity1Icon,
    group: 'Reservierungen',
    permission: BACKEND_PERMISSIONS.FRIENDS_FAMILY,
  },
  {
    href: '/backend/reservations/export',
    title: 'Reservierungen exportieren',
    description:
      'Filtere Reservierungen, wähle Spalten aus und exportiere eine Excel-Datei.',
    Icon: FileDownloadRoundedIcon,
    group: 'Reservierungen',
    permission: BACKEND_PERMISSIONS.RESERVATION_EXPORT,
  },
  {
    href: '/backend/dashboard',
    title: 'Statistiken',
    description:
      'Analysiere Reservierungen, Auslastung, Gästezahlen und Umsatzentwicklung.',
    Icon: LineAxisIcon,
    group: 'Reporting',
    permission: BACKEND_PERMISSIONS.DASHBOARD,
  },
  {
    href: '/backend/invoices',
    title: 'Rechnungen',
    description: 'Rechnungen erstellen, versenden, suchen und exportieren.',
    Icon: ReceiptOutlinedIcon,
    group: 'Reporting',
    permission: BACKEND_PERMISSIONS.INVOICES,
  },
  {
    href: '/backend/referralCodes',
    title: 'Referral Codes',
    description:
      'Lege Codes für Partner, Aktionen oder besondere Buchungskanäle an.',
    Icon: PasswordIcon,
    group: 'Marketing',
    permission: BACKEND_PERMISSIONS.REFERRAL_CODES,
  },
  {
    href: '/backend/specialEvents',
    title: 'WineEvents',
    description:
      'Pflege Sonderformate, Aktionen, Highlights und buchbare Zusatzveranstaltungen.',
    Icon: LocalActivityIcon,
    group: 'Marketing',
    permission: BACKEND_PERMISSIONS.SPECIAL_EVENTS,
  },
  {
    href: '/backend/newsletter',
    title: 'Newsletter',
    description:
      'Versende Newsletter und schau dir aktive Subscriptions und Click-Raten an.',
    Icon: MarkAsUnreadIcon,
    group: 'Marketing',
    permission: BACKEND_PERMISSIONS.NEWSLETTER,
  },
  {
    href: '/backend/impressions',
    title: 'Fotos hochladen',
    description:
      'Lade Impressionen hoch und verwalte Bilder für Galerie und Website.',
    Icon: AddAPhotoIcon,
    group: 'Marketing',
    permission: BACKEND_PERMISSIONS.IMPRESSIONS,
  },
];

export function groupBackendMenuItems(items: BackendMenuItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.group] = acc[item.group] || [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, BackendMenuItem[]>,
  );
}
