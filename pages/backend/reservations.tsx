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
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { motion } from 'framer-motion';
import DownloadIcon from '@mui/icons-material/Download';

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
  const [snackbarOpen, setSnackbarOpen] = useState(false);

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

  const updateTableNumber = async (
    reservationId: string,
    tableNumber: string
  ) => {
    setReservations((res) =>
      res
        ? res.map((r) => (r.id == reservationId ? { ...r, tableNumber } : r))
        : undefined
    );
    if (tableNumber.length <= 0) return;
    await axios.put(`/api/reservations/${reservationId}`, { tableNumber });
    setSnackbarOpen(true);
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
      <Box className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
        <Typography variant="h4">Reservierungen</Typography>
        {selectedEventDate && (
          <button
            className="px-4 py-2 rounded-full bg-black text-white text-lg hover:bg-gray-800 flex items-center gap-1"
            onClick={() => {
              window.open(
                `/api/eventDates/${selectedEventDate.id}/pdf`,
                '_blank'
              );
            }}
          >
            <DownloadIcon fontSize="inherit" />
            Gästeliste {selectedEventDate.date} (PDF)
          </button>
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
                  <Typography variant="h6" className="mb-2">
                    {timeslot}
                  </Typography>
                  <div className="space-y-4">
                    {reservations.map((reservation) => {
                      const doubleBooking = reservations.find(
                        (r) =>
                          r.id !== reservation.id &&
                          r.tableNumber == reservation.tableNumber &&
                          reservation.tableNumber
                      );
                      return (
                        <motion.div
                          key={reservation.id}
                          variants={{
                            hidden: { opacity: 0, x: -30 },
                            show: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: 0.4 },
                            },
                          }}
                          className="p-4 border border-gray-200 rounded-xl shadow-sm"
                        >
                          <Box className="flex flex-col sm:flex-row gap-2 justify-between items-start mb-2">
                            <Typography variant="h6" className="font-medium">
                              {reservation.name} ({reservation.people} Personen)
                            </Typography>
                            <Typography className="text-xs px-2 py-1 border rounded-full border-gray-300 text-gray-600">
                              {reservation.seating.timeslot}
                            </Typography>
                          </Box>

                          <Typography className="text-sm text-gray-500">
                            {reservation.email}
                          </Typography>

                          <Typography className="text-sm mt-1 font-medium">
                            {reservation.packageName} -{' '}
                            {reservation.packagePrice} €
                          </Typography>

                          <Typography className="text-sm text-gray-600">
                            {reservation.packageDescription}
                          </Typography>

                          <Box className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <TextField
                              label="Tischnummer"
                              variant="outlined"
                              size="small"
                              error={Boolean(doubleBooking)}
                              value={reservation.tableNumber || ''}
                              onChange={(e) =>
                                updateTableNumber(
                                  reservation.id,
                                  e.target.value
                                )
                              }
                            />
                            {doubleBooking && (
                              <p className="text-red-600">
                                Tisch doppelt belegt!
                              </p>
                            )}
                          </Box>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </Fade>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Tischnummer gespeichert"
      />
    </Box>
  );
}
