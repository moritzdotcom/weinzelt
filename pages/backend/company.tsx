import { Session } from '@/hooks/useSession';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'next/router';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { ApiGetEventsResponse } from '../api/events';
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  InputAdornment,
  MenuItem,
  Slide,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { motion } from 'framer-motion';
import SortButton from '@/components/sortButton';
import { ApiGetCompanyReservationsResponse } from '../api/events/[eventId]/companyReservations';
import { TransitionProps } from '@mui/material/transitions';
import { ReservationType } from '@prisma/client';
import { ApiGetReservationDataResponse } from '../api/reservationData';
import { translateType } from '@/lib/reservation';
import { Close } from '@mui/icons-material';
import EventSelector from '@/components/eventSelector';

export default function BackendCompanyPage({ session }: { session: Session }) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [selectedEventDateIndex, setSelectedEventDateIndex] = useState<
    number | null
  >(null);
  const [reservations, setReservations] =
    useState<ApiGetCompanyReservationsResponse>();
  const [sortOption, setSortOption] = useState<string>('Neuste zuerst');

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ApiGetCompanyReservationsResponse[number]>();

  function sortReservations(
    reservations: typeof filteredReservations,
    sortBy: string,
  ) {
    if (!reservations) return [];
    return [...reservations].sort((a, b) => {
      switch (sortBy) {
        case 'Preis absteigend':
          return b.budget * b.people - a.budget * a.people;
        case 'Preis aufsteigend':
          return a.budget * a.people - b.budget * b.people;
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

  const sortedEventDates = useMemo(() => {
    if (!selectedEvent) return undefined;
    return selectedEvent.eventDates.sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [selectedEvent]);

  const selectedEventDate = useMemo(() => {
    if (!sortedEventDates || selectedEventDateIndex == null) return undefined;
    return sortedEventDates[selectedEventDateIndex];
  }, [sortedEventDates, selectedEventDateIndex]);

  const filteredReservations = useMemo(() => {
    return reservations?.filter(
      (r) => r.seating.eventDateId == selectedEventDate?.id,
    );
  }, [selectedEventDate, reservations]);

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

  const handleDelete = async (id: string) => {
    await axios.delete(`/api/companyReservations/${id}`);
    setReservations((res) => (res ? res.filter((r) => r.id !== id) : []));
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  useEffect(() => {
    if (selectedEvent?.id) {
      axios
        .get(`/api/events/${selectedEvent?.id}/companyReservations`)
        .then((res) => {
          setReservations(res.data);
        });
    }
  }, [selectedEvent?.id]);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-16 overflow-x-hidden">
      <Typography variant="h4" gutterBottom>
        Firmen & Gruppenanfragen
      </Typography>

      <div className="my-7 flex items-center flex-col sm:flex-row justify-between gap-5">
        <EventSelector onChange={setSelectedEvent} />
        <button
          className="rounded-full bg-black text-white px-5 py-2 text-sm"
          onClick={() => setNewDialogOpen(true)}
        >
          Reservierung erstellen
        </button>
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
            {selectedEventDate?.dow}, {selectedEventDate?.date}
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
            <Typography>Keine Anfragen.</Typography>
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
              className="space-y-4"
            >
              {Object.entries(groupedByTimeslot).map(
                ([timeslot, reservations]) => (
                  <div key={timeslot}>
                    <Typography variant="h6" className="mt-6">
                      {timeslot}
                    </Typography>
                    {sortReservations(reservations, sortOption).map(
                      (reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          onSelect={() => {
                            setSelectedReservation(reservation);
                            setNewDialogOpen(true);
                          }}
                          onDelete={handleDelete}
                          onUpdate={(updatedReservation) => {
                            setReservations((res) =>
                              res?.map((r) =>
                                r.id === updatedReservation.id
                                  ? updatedReservation
                                  : r,
                              ),
                            );
                          }}
                          session={session}
                          variants={{
                            hidden: { opacity: 0, x: -50 },
                            show: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: 0.4, ease: 'easeOut' },
                            },
                          }}
                        />
                      ),
                    )}
                  </div>
                ),
              )}
            </motion.div>
          )}
        </div>
      </Fade>

      <NewReservationDialog
        open={newDialogOpen}
        onClose={() => {
          setSelectedReservation(undefined);
          setNewDialogOpen(false);
        }}
        onDelete={handleDelete}
        reservation={selectedReservation}
      />
    </Box>
  );
}

function ReservationCard({
  reservation,
  variants,
  onSelect,
  onUpdate,
  onDelete,
  session,
}: {
  reservation: ApiGetCompanyReservationsResponse[number];
  variants: any;
  onSelect: () => void;
  onUpdate: (reservation: ApiGetCompanyReservationsResponse[number]) => void;
  onDelete: (id: string) => void;
  session: Session;
}) {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success',
  });
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    onDelete(reservation.id);
  };

  const handleBecomeAccountable = () => {
    setLoading(true);
    axios
      .put(`/api/companyReservations/${reservation.id}`, {
        responsibleId: session.user.id,
      })
      .then(() => {
        setSnackbar({
          open: true,
          message:
            'Du bist jetzt Ansprechpartner für diese Reservierung. Bitte kontaktiere den Gast per Mail.',
          type: 'success',
        });
        onUpdate({ ...reservation, responsible: session.user });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Fehler beim Übernehmen der Reservierung.',
          type: 'error',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <motion.div variants={variants} transition={{ duration: 0.3 }}>
      <div className="mb-6 mt-3">
        <div className="p-4 border border-gray-200 rounded-xl shadow-sm">
          <p className="font-medium text-lg">
            {reservation.companyName ? `${reservation.companyName} - ` : ''}
            {reservation.name} ({reservation.people} Personen)
          </p>
          <p className="text-sm text-gray-500">{reservation.email}</p>
          <p className="text-lg mt-1 font-medium">
            Budget pro Kopf:{' '}
            <span className="font-bold">{reservation.budget} €</span> (
            {reservation.budget * reservation.people} € gesamt)
          </p>
          <p className="text-sm text-gray-500">
            Ansprechpartner:{' '}
            {reservation.responsible ? (
              reservation.responsible.name
            ) : (
              <button
                disabled={loading}
                onClick={handleBecomeAccountable}
                className="text-blue-500 underline disabled:text-blue-300"
              >
                Ansprechpartner werden
              </button>
            )}
          </p>
          <p className="text-sm text-gray-600">{reservation.text}</p>
          <div className="flex justify-between items-center mt-3">
            <button
              className="border border-black rounded-full py-2 px-3"
              onClick={onSelect}
            >
              Reservierung erstellen
            </button>
            <button
              className="border border-red-500 text-red-500 rounded-full py-2 px-3"
              onClick={handleDelete}
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={10000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Close fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.type}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function NewReservationDialog({
  open,
  reservation,
  onClose,
  onDelete,
}: {
  open: boolean;
  reservation?: ApiGetCompanyReservationsResponse[number];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<ReservationType>('VIP');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [tableCount, setTableCount] = useState('1');
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [minimumSpend, setMinimumSpend] = useState('1000');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<
    | ApiGetReservationDataResponse['eventDates'][number]['seatings'][number]
    | null
  >(null);

  const [data, setData] = useState<ApiGetReservationDataResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lade für den ausgewählten Type die verfügbaren Daten (Dates & Timeslots)
  useEffect(() => {
    setFetchError(undefined);
    setTableCount(
      reservation
        ? `${Math.ceil(reservation.people / (type === 'VIP' ? 8 : 16))}`
        : '1',
    );

    setDataLoading(true);
    axios
      .get<ApiGetReservationDataResponse>(`/api/reservationData`)
      .then((res) => {
        setData(res.data);
      })
      .catch((e) => {
        if (isAxiosError(e) && e.response?.status === 404) {
          setFetchError('Im Moment ist keine Veranstaltung aktiv.');
        } else {
          setFetchError('Fehler beim Laden, versuche es später erneut.');
        }
      })
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    if (!guestCount) return;
    setTableCount(
      `${Math.ceil(Number(guestCount) / (type === 'VIP' ? 8 : 16))}`,
    );
  }, [type, guestCount]);

  useEffect(() => {
    if (!reservation) return;
    setName(reservation.name);
    setEmail(reservation.email);
    setGuestCount(`${reservation.people}`);
    setTableCount(
      `${Math.ceil(reservation.people / (type === 'VIP' ? 8 : 16))}`,
    );
    setSelectedDate(reservation.seating.eventDate.date);
    setSelectedSlot(reservation.seating);
    setMinimumSpend(`${reservation.budget * reservation.people}`);
  }, [reservation]);

  // Wenn sich das Datum ändert, Timeslot zurücksetzen
  useEffect(() => {
    setSelectedSlot(reservation?.seating || null);
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      await axios.post('/api/reservations/company', {
        type,
        name,
        email,
        people: Number(guestCount),
        tableCount: Number(tableCount),
        seatingId: selectedSlot.id,
        minimumSpend: Number(minimumSpend),
      });
      setSuccess(true);
      reservation && onDelete(reservation.id);
      onClose();
    } catch {
      alert('Fehler beim Anlegen der Reservierung.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    // Formular zurücksetzen
    setType('VIP');
    setName('');
    setEmail('');
    setGuestCount('1');
    setTableCount('1');
    setPackageName('');
    setPackageDescription('');
    setMinimumSpend('1000');
    setSelectedDate('');
    setSelectedSlot(null);
    onClose();
  };

  const currentSlots =
    data?.eventDates.find((d) => d.date === selectedDate)?.seatings ?? [];

  const tablesAvailable = useMemo(() => {
    if (!selectedSlot) return 0;
    const reservedTables = selectedSlot.reservations
      .filter((r) => r.type == type)
      .reduce((a, b) => a + b.tableCount, 0);
    return (
      (type == 'VIP'
        ? selectedSlot.availableVip
        : selectedSlot.availableStanding) - reservedTables
    );
  }, [selectedSlot, type]);

  const isSubmitDisabled =
    loading ||
    !name.trim() ||
    !email.trim() ||
    !guestCount ||
    !selectedDate ||
    !selectedSlot;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="lg"
      slots={{ transition: Transition }}
      keepMounted
      onClose={handleCloseDialog}
      aria-describedby="new-reservation-dialog"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            px: 2,
            py: 1.5,
            bgcolor: '#f9f9f9',
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
          },
        },
      }}
    >
      <DialogTitle>Reservierung erstellen</DialogTitle>

      <DialogContent dividers>
        {dataLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : fetchError ? (
          <Typography color="error">{fetchError}</Typography>
        ) : (
          <Box
            component="form"
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {/* Typ */}
            <TextField
              select
              label="Reservierungstyp"
              value={type}
              onChange={(e) => setType(e.target.value as ReservationType)}
            >
              <MenuItem value="VIP">VIP</MenuItem>
              <MenuItem value="STANDING">Stehtisch</MenuItem>
            </TextField>

            {/* Datum */}
            <TextField
              select
              label="Datum"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {data?.eventDates.map((ed) => (
                <MenuItem key={ed.date} value={ed.date}>
                  {ed.dow}, {ed.date}
                </MenuItem>
              ))}
            </TextField>

            {/* Timeslot */}
            {currentSlots.length > 0 && (
              <div className="w-full">
                <TextField
                  select
                  fullWidth
                  label="Timeslot"
                  value={selectedSlot?.id || ''}
                  onChange={(e) => {
                    const slot =
                      currentSlots.find((s) => s.id === e.target.value) || null;
                    setSelectedSlot(slot);
                  }}
                  disabled={!selectedDate}
                >
                  {currentSlots.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.timeslot}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedSlot && (
                  <p className="text-sm text-gray-500 mt-2">
                    Noch <b>{tablesAvailable} </b>
                    {translateType(type)}e verfügbar
                  </p>
                )}
              </div>
            )}

            <Collapse in={Boolean(selectedSlot)}>
              <Box
                component="form"
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                {/* Kontaktdaten */}
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="E-Mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* Personen & Tische */}
                <TextField
                  label="Anzahl Personen"
                  type="number"
                  value={guestCount}
                  onChange={(e) =>
                    setGuestCount(
                      e.target.value
                        ? `${Math.max(1, Number(e.target.value))}`
                        : '',
                    )
                  }
                />
                <TextField
                  label="Anzahl Tische"
                  type="number"
                  error={Number(tableCount || 0) > tablesAvailable}
                  helperText={
                    Number(tableCount || 0) > tablesAvailable
                      ? 'Nicht genug Kapazität'
                      : undefined
                  }
                  value={tableCount}
                  onChange={(e) =>
                    setTableCount(
                      e.target.value
                        ? `${Math.max(1, Number(e.target.value))}`
                        : '',
                    )
                  }
                />
                <TextField
                  label="Mindestverzehr"
                  type="number"
                  value={minimumSpend}
                  onChange={(e) => setMinimumSpend(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">€</InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 3,
        }}
      >
        <button
          className="w-full border rounded py-2 px-4"
          onClick={handleCloseDialog}
          disabled={loading}
        >
          Abbrechen
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full border border-black bg-black text-white rounded py-2 px-4"
        >
          Speichern
        </button>
      </DialogActions>
    </Dialog>
  );
}
