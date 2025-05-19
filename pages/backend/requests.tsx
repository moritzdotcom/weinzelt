import { Session } from '@/hooks/useSession';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
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
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { ConfirmationState, ReservationType } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  translateState,
  translateStateAdj,
  translateType,
} from '@/lib/reservation';
import SortButton from '@/components/sortButton';

export default function BackendRequestsPage({ session }: { session: Session }) {
  const router = useRouter();
  const [events, setEvents] = useState<ApiGetEventsResponse>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedConfirmationState, setSelectedConfirmationState] =
    useState<ConfirmationState>('REQUESTED');
  const [selectedReservationType, setSelectedReservationType] =
    useState<ReservationType>('VIP');
  const [selectedEventDateIndex, setSelectedEventDateIndex] = useState<
    number | null
  >(null);
  const [reservations, setReservations] =
    useState<ApiGetReservationsResponse>();
  const [sortOption, setSortOption] = useState<string>('Neuste zuerst');

  function sortReservations(
    reservations: typeof filteredReservations,
    sortBy: string
  ) {
    if (!reservations) return [];
    return [...reservations].sort((a, b) => {
      switch (sortBy) {
        case 'Preis absteigend':
          return b.packagePrice - a.packagePrice;
        case 'Preis aufsteigend':
          return a.packagePrice - b.packagePrice;
        case 'Neuste zuerst':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'Personen aufsteigend':
          return a.people - b.people;
        case 'Personen absteigend':
          return b.people - a.people;
        default:
          return 0;
      }
    });
  }

  const selectedEvent = useMemo(
    () => events.filter((e) => e.id == selectedEventId)[0],
    [selectedEventId, events]
  );

  const sortedEventDates = useMemo(() => {
    if (!selectedEvent) return undefined;
    return selectedEvent.eventDates.sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [selectedEvent]);

  const selectedEventDate = useMemo(() => {
    if (!sortedEventDates || selectedEventDateIndex == null) return undefined;
    return sortedEventDates[selectedEventDateIndex];
  }, [sortedEventDates, selectedEventDateIndex]);

  const filteredReservations = useMemo(() => {
    return reservations?.filter(
      (r) =>
        r.confirmationState == selectedConfirmationState &&
        r.type == selectedReservationType &&
        r.seating.eventDateId == selectedEventDate?.id
    );
  }, [
    selectedEventDate,
    reservations,
    selectedConfirmationState,
    selectedReservationType,
  ]);

  const groupedByTimeslot = useMemo(() => {
    if (!filteredReservations) return {};
    const map: Record<string, typeof filteredReservations> = {};
    filteredReservations
      .sort((a, b) => a.seating.timeslot.localeCompare(b.seating.timeslot))
      .forEach((r) => {
        const key = r.seating.timeslot;
        if (!map[key]) map[key] = [];
        map[key].push(r);
      });
    return map;
  }, [filteredReservations]);

  const acceptedPerSeating = useMemo(() => {
    if (!reservations) return {};
    const counts: Record<string, number> = {};
    reservations.forEach((r) => {
      if (
        r.confirmationState === 'ACCEPTED' &&
        r.type == selectedReservationType
      ) {
        const id = r.seatingId;
        counts[id] = (counts[id] || 0) + r.tableCount;
      }
    });
    return counts;
  }, [reservations, selectedReservationType]);

  const updateState = async (
    reservationId: string,
    state: ConfirmationState
  ) => {
    setReservations((res) =>
      res
        ? res.map((r) =>
            r.id == reservationId ? { ...r, confirmationState: state } : r
          )
        : undefined
    );
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  useEffect(() => {
    axios
      .get('/api/events')
      .then(({ data }: { data: ApiGetEventsResponse }) => {
        setEvents(data);
        const preselect = router.query.eventId as string;
        if (preselect) {
          setSelectedEventId(preselect);
          setSelectedEventDateIndex(0);
        } else if (data.length == 1) {
          setSelectedEventId(data[0].id);
          setSelectedEventDateIndex(0);
        }
      });
  }, [router.query.eventId]);

  useEffect(() => {
    if (selectedEventId) {
      axios.get(`/api/events/${selectedEventId}/reservations`).then((res) => {
        setReservations(res.data);
      });
    }
  }, [selectedEventId]);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-16 overflow-x-hidden">
      <Typography variant="h4" gutterBottom>
        Reservierungsanfragen
      </Typography>

      <div className="my-7 flex flex-col sm:flex-row items-center gap-5">
        <TextField
          select
          label="Veranstaltung wählen"
          fullWidth
          value={selectedEventId || ''}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setSelectedEventDateIndex(0);
          }}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Reservierungs Typ"
          fullWidth
          value={selectedReservationType}
          onChange={(e) => {
            setSelectedReservationType(e.target.value as ReservationType);
          }}
        >
          {['VIP', 'STANDING'].map((state) => (
            <MenuItem key={state} value={state}>
              {translateType(state as ReservationType)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Reservierungs Status"
          fullWidth
          value={selectedConfirmationState}
          onChange={(e) => {
            setSelectedConfirmationState(e.target.value as ConfirmationState);
          }}
        >
          {['REQUESTED', 'ACCEPTED', 'DECLINED'].map((state) => (
            <MenuItem key={state} value={state}>
              {translateState(state as ConfirmationState)}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <Fade in={Boolean(selectedEventDate)} timeout={300}>
        <div>
          <div className="flex justify-between items-center text-2xl font-semibold max-w-sm mx-auto mb-5">
            <button
              onClick={() =>
                setSelectedEventDateIndex((i) => (i == null ? null : i - 1))
              }
              className="disabled:opacity-0 transition-opacity"
              disabled={selectedEventDateIndex === 0}
            >
              <ArrowBackIosIcon fontSize="inherit" />
            </button>
            {selectedEventDate?.date}
            <button
              onClick={() =>
                setSelectedEventDateIndex((i) => (i == null ? null : i + 1))
              }
              className="disabled:opacity-0 transition-opacity"
              disabled={
                selectedEventDateIndex === (sortedEventDates?.length || 0) - 1
              }
            >
              <ArrowForwardIosIcon fontSize="inherit" />
            </button>
          </div>
          <div className="flex justify-end text-sky-600">
            <SortButton
              options={[
                'Preis absteigend',
                'Preis aufsteigend',
                'Neuste zuerst',
                'Personen aufsteigend',
                'Personen absteigend',
              ]}
              defaultSelected="Neuste zuerst"
              onChange={setSortOption}
            />
          </div>
          {!filteredReservations ? (
            <Box className="flex justify-center items-center">
              <CircularProgress />
            </Box>
          ) : filteredReservations?.length === 0 ? (
            <Typography>
              Keine {translateStateAdj(selectedConfirmationState)} Anfragen.
            </Typography>
          ) : (
            <motion.div
              key={`${selectedReservationType}${selectedConfirmationState}${selectedEventDate?.id}`}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {Object.entries(groupedByTimeslot).map(
                ([timeslot, reservations]) => (
                  <div key={timeslot}>
                    <Typography variant="h6" className="mt-6">
                      {timeslot}
                      <span className="text-gray-500 ml-2">
                        ({acceptedPerSeating[reservations[0].seatingId] || 0}/
                        {selectedReservationType == 'VIP'
                          ? reservations[0].seating.availableVip
                          : reservations[0].seating.availableStanding}
                        )
                      </span>
                    </Typography>
                    {sortReservations(reservations, sortOption).map(
                      (reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          onUpdateState={(state) =>
                            updateState(reservation.id, state)
                          }
                          selectedType={selectedReservationType}
                          reservationsAccepted={
                            acceptedPerSeating[reservation.seatingId]
                          }
                          variants={{
                            hidden: { opacity: 0, x: -50 },
                            show: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: 0.4, ease: 'easeOut' },
                            },
                          }}
                        />
                      )
                    )}
                  </div>
                )
              )}
            </motion.div>
          )}
        </div>
      </Fade>
    </Box>
  );
}

function ReservationCard({
  reservation,
  onUpdateState,
  selectedType,
  reservationsAccepted,
  variants,
}: {
  reservation: ApiGetReservationsResponse[number];
  onUpdateState: (state: ConfirmationState) => void;
  selectedType: ReservationType;
  reservationsAccepted: number;
  variants: any;
}) {
  const [animating, setAnimating] = useState<null | 'left' | 'right'>(null);

  const seaitingFull =
    (selectedType == 'VIP'
      ? reservation.seating.availableVip
      : reservation.seating.availableStanding) -
      reservationsAccepted <
    reservation.tableCount;

  const handleAction = (state: ConfirmationState) => {
    setAnimating(state === 'ACCEPTED' ? 'left' : 'right');
  };

  const handleAnimationComplete = () => {
    if (animating) {
      const newState = animating === 'left' ? 'ACCEPTED' : 'DECLINED';
      axios
        .put(`/api/reservations/${reservation.id}`, {
          confirmationState: newState,
        })
        .then(() => {
          onUpdateState(newState);
        })
        .catch((e) => {
          alert('Fehler');
        });
    }
  };

  return (
    <motion.div
      variants={variants}
      animate={
        animating === 'left'
          ? { x: '-100%', opacity: 0, height: 0 }
          : animating === 'right'
          ? { x: '100%', opacity: 0, height: 0 }
          : { x: 0, opacity: 1, height: 'full' }
      }
      transition={{ duration: 0.3 }}
      onAnimationComplete={handleAnimationComplete}
    >
      <div className="mb-6 mt-3">
        <div className="p-4 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-lg">
              {reservation.name} ({reservation.people} Personen)
            </span>
            <span className="text-xs px-2 py-1 border rounded-full text-gray-600 border-gray-300">
              {translateState(reservation.confirmationState)}
            </span>
          </div>

          <p className="text-sm text-gray-500">{reservation.email}</p>
          <p className="text-sm mt-1 font-medium">
            {reservation.packageName} ({reservation.packagePrice} €)
          </p>
          <p className="text-sm text-gray-600">
            {reservation.packageDescription}
          </p>

          <div className="flex gap-3 mt-4">
            {reservation.confirmationState !== 'ACCEPTED' && (
              <button
                className="px-4 py-2 text-sm rounded-full border border-green-600 text-green-600 hover:text-green-700 hover:border-green-700 disabled:border-gray-500 disabled:text-gray-500"
                onClick={() => handleAction('ACCEPTED')}
                disabled={!!animating || seaitingFull}
              >
                {seaitingFull ? 'Timeslot Voll' : 'Bestätigen'}
              </button>
            )}
            {reservation.confirmationState !== 'DECLINED' && (
              <button
                className="px-4 py-2 text-sm rounded-full border border-red-600 text-red-600 hover:text-red-700 hover:border-red-700"
                onClick={() => handleAction('DECLINED')}
                disabled={!!animating}
              >
                Ablehnen
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
