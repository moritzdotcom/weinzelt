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
import { motion } from 'framer-motion';
import DownloadIcon from '@mui/icons-material/Download';
import ReservationCard from '@/components/reservation/card';

export default function BackendReservationsPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ApiGetEventsResponse>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventDateIndex, setSelectedEventDateIndex] = useState<
    number | null
  >(null);
  const [reservations, setReservations] =
    useState<ApiGetReservationsResponse>();

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
        r.confirmationState == 'ACCEPTED' &&
        r.seating.eventDateId == selectedEventDate?.id
    );
  }, [selectedEventDate, reservations]);

  const sortedReservationsByTimeslot = useMemo(() => {
    if (!filteredReservations) return [];
    const grouped: { [timeslot: string]: typeof filteredReservations } = {};
    filteredReservations.forEach((res) => {
      if (!grouped[res.seating.timeslot]) grouped[res.seating.timeslot] = [];
      grouped[res.seating.timeslot].push(res);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredReservations]);

  const updateReservation = (
    reservation: ApiGetReservationsResponse[number]
  ) => {
    setReservations((res) =>
      res
        ? res.map((r) => (r.id == reservation.id ? reservation : r))
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
      <Box className="flex flex-col md:flex-row gap-3 justify-between items-center mb-6">
        <Typography variant="h4">Reservierungen</Typography>
        {selectedEventDate && (
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <button
              className="px-4 py-2 rounded-full bg-black text-white text-lg hover:bg-neutral-600 flex items-center gap-1"
              onClick={() => {
                window.open(
                  `/api/eventDates/${selectedEventDate.id}/guestListPdf`,
                  '_blank'
                );
              }}
            >
              <DownloadIcon fontSize="inherit" />
              Gästeliste {selectedEventDate.date}
            </button>
            <button
              className="px-4 py-2 rounded-full bg-black text-white text-lg hover:bg-neutral-600 flex items-center gap-1"
              onClick={() => {
                window.open(
                  `/api/eventDates/${selectedEventDate.id}/tablesPdf`,
                  '_blank'
                );
              }}
            >
              <DownloadIcon fontSize="inherit" />
              Tischbelegung {selectedEventDate.date}
            </button>
          </div>
        )}
      </Box>

      <div className="my-7">
        <TextField
          select
          label="Veranstaltung wählen"
          sx={{ width: { xs: '100%', sm: '50%' } }}
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

          {!filteredReservations ? (
            <Box className="flex justify-center items-center">
              <CircularProgress />
            </Box>
          ) : filteredReservations.length === 0 ? (
            <Typography>Keine bestätigten Anfragen.</Typography>
          ) : (
            <motion.div
              key={`${selectedEventDate?.id}`}
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
              className="space-y-8"
            >
              {sortedReservationsByTimeslot.map(([timeslot, reservations]) => (
                <div key={timeslot}>
                  <h6 className="text-2xl font-bold mb-4">{timeslot}</h6>
                  <div className="space-y-4">
                    {reservations
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((reservation) => {
                        const doubleBooking = reservations.find(
                          (r) =>
                            r.id !== reservation.id &&
                            r.tableNumber == reservation.tableNumber &&
                            reservation.tableNumber
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
            </motion.div>
          )}
        </div>
      </Fade>
    </Box>
  );
}
