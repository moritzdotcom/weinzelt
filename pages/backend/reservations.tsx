import { Session } from '@/hooks/useSession';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiGetEventsResponse } from '../api/events';
import { ApiGetReservationsResponse } from '../api/events/[eventId]/reservations';
import {
  Box,
  CircularProgress,
  Fade,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import DownloadIcon from '@mui/icons-material/Download';
import ReservationCard from '@/components/reservation/card';
import useElementHeight from '@/hooks/useElementHeight';

type PaymentStatusFilter = 'PAID' | 'PENDING_PAYMENT' | 'CANCELED';

export default function BackendReservationsPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ApiGetEventsResponse>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusFilter>('PAID');

  const [reservations, setReservations] =
    useState<ApiGetReservationsResponse>();

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [selectedEventId, events],
  );

  const sortedEventDates = useMemo(() => {
    if (!selectedEvent) return [];
    // copy before sort to avoid mutating state object
    return [...selectedEvent.eventDates].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [selectedEvent]);

  const updateReservation = (
    reservation: ApiGetReservationsResponse[number],
  ) => {
    setReservations((res) =>
      res
        ? res.map((r) => (r.id === reservation.id ? reservation : r))
        : undefined,
    );
  };

  // 1) payment filter (no eventDate filter here, we want ALL eventDates)
  const paymentFilteredReservations = useMemo(() => {
    if (!reservations) return undefined;
    return reservations.filter((r) => r.paymentStatus === paymentStatus);
  }, [reservations, paymentStatus]);

  // 2) group reservations by eventDateId
  const reservationsByEventDateId = useMemo(() => {
    if (!paymentFilteredReservations) return undefined;

    const map = new Map<string, ApiGetReservationsResponse>();
    for (const r of paymentFilteredReservations) {
      const key = r.seating.eventDateId;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }, [paymentFilteredReservations]);

  // 3) build render sections in eventDate order; inside each eventDate: group by timeslot
  const sections = useMemo(() => {
    if (!reservationsByEventDateId) return [];

    return sortedEventDates.map((ed) => {
      const list = reservationsByEventDateId.get(ed.id) ?? [];

      const byTimeslot: Record<string, typeof list> = {};
      for (const r of list) {
        const key = r.seating.timeslot;
        if (!byTimeslot[key]) byTimeslot[key] = [];
        byTimeslot[key].push(r);
      }

      const timeslots = Object.entries(byTimeslot).sort((a, b) =>
        a[0].localeCompare(b[0]),
      );

      return {
        eventDate: ed,
        total: list.length,
        timeslots,
      };
    });
  }, [reservationsByEventDateId, sortedEventDates]);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady, router]);

  useEffect(() => {
    axios
      .get('/api/events')
      .then(({ data }: { data: ApiGetEventsResponse }) => {
        setEvents(data);
        const preselect = router.query.eventId as string | undefined;
        if (preselect) {
          setSelectedEventId(preselect);
        } else if (data.length === 1) {
          setSelectedEventId(data[0].id);
        }
      });
  }, [router.query.eventId]);

  useEffect(() => {
    if (selectedEventId) {
      setReservations(undefined); // show loader on event change
      axios.get(`/api/events/${selectedEventId}/reservations`).then((res) => {
        setReservations(res.data);
      });
    }
  }, [selectedEventId]);

  return (
    <Box className="overflow-x-hidden overflow-y-auto h-screen">
      <Box className="max-w-5xl mx-auto px-4 mt-12">
        <Box className="flex flex-col md:flex-row gap-3 justify-between items-center mb-6">
          <Typography variant="h4">Reservierungen</Typography>
        </Box>

        {/* Filters */}
        <div className="my-7 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <TextField
            select
            label="Veranstaltung wählen"
            sx={{ width: { xs: '100%', sm: '50%' } }}
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Payment Status"
            sx={{ width: { xs: '100%', sm: '50%' } }}
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as PaymentStatusFilter)
            }
          >
            <MenuItem value="PAID">Bezahlt</MenuItem>
            <MenuItem value="PENDING_PAYMENT">Offen</MenuItem>
            <MenuItem value="CANCELED">Storniert</MenuItem>
          </TextField>
        </div>

        <Fade in={Boolean(selectedEventId)} timeout={300}>
          <div>
            {!paymentFilteredReservations ? (
              <Box className="flex justify-center items-center">
                <CircularProgress />
              </Box>
            ) : paymentFilteredReservations.length === 0 ? (
              <Typography>Keine Reservierungen für diesen Status.</Typography>
            ) : (
              <motion.div
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.05 } },
                }}
                initial="hidden"
                animate="show"
                className="space-y-10"
              >
                {sections
                  .filter((s) => s.total > 0)
                  .map((s) => {
                    return (
                      <EventDateSection
                        key={s.eventDate.id}
                        section={s}
                        updateReservation={updateReservation}
                      />
                    );
                  })}
              </motion.div>
            )}
          </div>
        </Fade>
      </Box>
    </Box>
  );
}

function EventDateSection({
  section,
  updateReservation,
}: {
  section: {
    eventDate: {
      id: string;
      date: string;
      dow: string;
    };
    total: number;
    timeslots: [string, ApiGetReservationsResponse][];
  };
  updateReservation: (reservation: ApiGetReservationsResponse[number]) => void;
}) {
  const { eventDate, total, timeslots } = section;
  const { ref: headerRef, height: headerH } =
    useElementHeight<HTMLDivElement>();
  return (
    <section className="space-y-6">
      {/* sticky header per eventDate */}
      <div
        ref={headerRef}
        className="sticky top-0 z-20 -mx-4 px-4 py-3 border-b"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.85)',
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xl font-semibold">
            {eventDate.dow}, {eventDate.date}{' '}
            <span className="text-sm font-normal text-neutral-500">
              ({total})
            </span>
          </div>

          <div className="flex flex-row gap-2">
            <button
              className="px-4 py-2 rounded-full bg-black text-white text-base hover:bg-neutral-600 flex items-center gap-1"
              onClick={() => {
                window.open(
                  `/api/eventDates/${eventDate.id}/guestListPdf`,
                  '_blank',
                );
              }}
            >
              <DownloadIcon fontSize="inherit" />
              Gästeliste
            </button>
            <button
              className="px-4 py-2 rounded-full bg-black text-white text-base hover:bg-neutral-600 flex items-center gap-1"
              onClick={() => {
                window.open(
                  `/api/eventDates/${eventDate.id}/tablesPdf`,
                  '_blank',
                );
              }}
            >
              <DownloadIcon fontSize="inherit" />
              Tischbelegung
            </button>
          </div>
        </div>
      </div>

      {/* timeslots */}
      <div className="space-y-8">
        {timeslots.map(([timeslot, list]) => (
          <div key={timeslot} className="space-y-4">
            <div
              className="sticky z-10 -mx-4 px-4 py-2 border-b"
              style={{
                top: headerH,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.88)',
              }}
            >
              <h6 className="text-lg font-semibold">{timeslot}</h6>
            </div>

            <div className="space-y-4">
              {list
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((reservation) => {
                  const doubleBooking = list.find(
                    (r) =>
                      r.id !== reservation.id &&
                      r.tableNumber === reservation.tableNumber &&
                      reservation.tableNumber,
                  );

                  return (
                    <ReservationCard
                      key={reservation.id}
                      doubleBooking={doubleBooking}
                      reservation={reservation}
                      onUpdate={updateReservation}
                    />
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
