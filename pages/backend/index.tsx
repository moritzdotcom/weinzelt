import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Grid } from '@mui/material';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import PasswordIcon from '@mui/icons-material/Password';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import SearchIcon from '@mui/icons-material/Search';

export default function Backend({ session }: { session: Session }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 mt-10 mb-5 flex flex-col gap-7">
      <div>
        <img src="/logo.png" alt="WEINZELT" className="w-64 mx-auto mb-6" />
        <h2 className="text-2xl text-center font-light text-gray-600">
          Backend
        </h2>
      </div>
      <Grid container spacing={4} justifyContent="center">
        <LinkItem
          href="/backend/events"
          text="Veranstaltungen"
          Icon={CelebrationRoundedIcon}
        />
        <LinkItem
          href="/backend/seatings"
          text="Seatings & Timeslots"
          Icon={TableRestaurantIcon}
        />
        <LinkItem
          href="/backend/reservations"
          text="Bestätigte Reservierungen"
          Icon={AssignmentIcon}
        />
        <LinkItem
          href="/backend/requests"
          text="Reservierungsanfragen"
          Icon={QuestionAnswerIcon}
        />
        <LinkItem
          href="/backend/search"
          text="Reservierungen suchen"
          Icon={SearchIcon}
        />
        <LinkItem
          href="/backend/company"
          text="Firmenbereich"
          Icon={ApartmentIcon}
        />
        <LinkItem
          href="/backend/friendsFamily"
          text="Friends & Family Reservierung"
          Icon={Diversity1Icon}
        />
        <LinkItem
          href="/backend/dashboard"
          text="Statistiken"
          Icon={LineAxisIcon}
        />
        <LinkItem
          href="/backend/referralCodes"
          text="Referral Codes"
          Icon={PasswordIcon}
        />
        <LinkItem
          href="/backend/specialEvents"
          text="Special Events"
          Icon={LocalActivityIcon}
        />
      </Grid>
    </div>
  );
}

function LinkItem({
  href,
  text,
  Icon,
}: {
  href: string;
  text: string;
  Icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="w-full bg-gray-50 rounded-md shadow flex gap-3 items-center px-4 py-5 text-xl text-gray-900"
    >
      <Icon fontSize="large" />
      <p>{text}</p>
    </Link>
  );
}
