import { Session } from '@/hooks/useSession';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiGetEventsResponse } from '../api/events';
import { ApiGetReservationsResponse } from '../api/events/[eventId]/reservations';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { motion } from 'framer-motion';
import DownloadIcon from '@mui/icons-material/Download';
import { translateType } from '@/lib/reservation';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

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
  const [notifying, setNotifying] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

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
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (tableNumber.length <= 0) return;

    debounceTimeout.current = setTimeout(async () => {
      await axios.put(`/api/reservations/${reservationId}`, { tableNumber });
      setSnackbarOpen(true);
    }, 1000);
  };

  const notifyReservation = async (id: string) => {
    setNotifying(true);
    await axios.post(`/api/reservations/${id}/notify`);

    setReservations((res) =>
      res
        ? res.map((r) => (r.id == id ? { ...r, notified: new Date() } : r))
        : undefined
    );
    setNotifying(false);
  };

  const onPaymentConfirmed = (id: string) => {
    setReservations((res) =>
      res ? res.map((r) => (r.id == id ? { ...r, payed: true } : r)) : undefined
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
                            updateTableNumber={updateTableNumber}
                            notifyReservation={notifyReservation}
                            notifying={notifying}
                            onPaymentConfirmed={onPaymentConfirmed}
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Tischnummer gespeichert"
      />
    </Box>
  );
}

function ReservationCard({
  reservation,
  doubleBooking,
  updateTableNumber,
  notifyReservation,
  notifying,
  onPaymentConfirmed,
}: {
  reservation: ApiGetReservationsResponse[number];
  doubleBooking?: ApiGetReservationsResponse[number];
  updateTableNumber: (id: string, value: string) => void;
  notifyReservation: (id: string) => void;
  notifying: boolean;
  onPaymentConfirmed: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirm = async () => {
    await axios.put(`/api/reservations/${reservation.id}`, { payed: true });
    onPaymentConfirmed(reservation.id);
    setDialogOpen(false);
  };

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
      <Box className="flex flex-row gap-2 justify-between items-start mb-1 flex-wrap">
        <div className="flex flex-col sm:flex-row gap-1">
          <h6 className="text-xl font-medium">{reservation.name}</h6>
          <h6 className="text-xl font-medium">
            ({reservation.people} Personen)
          </h6>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          <Tooltip
            title={
              reservation.payed ? 'Zahlung erhalten' : 'Zahlung ausstehend'
            }
          >
            <IconButton size="small" onClick={() => setDialogOpen(true)}>
              {reservation.payed ? (
                <CheckCircleIcon color="success" />
              ) : (
                <HourglassEmptyIcon color="warning" />
              )}
            </IconButton>
          </Tooltip>
          <p className="text-sm px-2 py-1 border rounded-full border-gray-300 text-gray-600">
            {translateType(reservation.type)}
          </p>
        </div>
      </Box>

      <Typography className="text-sm text-gray-500">
        {reservation.email}
      </Typography>

      <Typography className="text-sm mt-1 font-medium">
        {reservation.packageName} - {reservation.packagePrice} €
      </Typography>

      <Typography className="text-sm text-gray-600">
        {reservation.packageDescription}
      </Typography>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
        <Box className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <TextField
            label="Tischnummer"
            variant="outlined"
            size="small"
            error={Boolean(doubleBooking)}
            value={reservation.tableNumber || ''}
            onChange={(e) => updateTableNumber(reservation.id, e.target.value)}
          />
          {doubleBooking && (
            <p className="text-red-600">Tisch doppelt belegt!</p>
          )}
        </Box>
        {reservation.notified ? (
          <Tooltip
            title={`Benachrichtigt am: ${new Date(
              reservation.notified
            ).toLocaleDateString('de')}`}
          >
            <button className="border bg-neutral-400 text-white px-3 py-2 rounded-full flex items-center gap-1 text-base cursor-default!">
              <CheckIcon fontSize="inherit" />
              <span>Benachrichtigt</span>
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => notifyReservation(reservation.id)}
            disabled={notifying}
            className="border border-sky-500 text-sky-500 px-3 py-2 rounded-full flex items-center gap-1 text-base"
          >
            <MailOutlineIcon fontSize="inherit" />
            <span>Benachrichtigen</span>
          </button>
        )}
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Zahlungseingang bestätigen</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Möchtest du den Zahlungseingang für{' '}
            <strong>{reservation.name}</strong> bestätigen?
          </Typography>
        </DialogContent>
        <DialogActions>
          <button
            className="border rounded px-3 py-2"
            onClick={() => setDialogOpen(false)}
          >
            Abbrechen
          </button>
          <button
            className="bg-black text-white rounded border border-black px-3 py-2"
            onClick={handleConfirm}
          >
            Bestätigen
          </button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
