import { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { ApiGetReservationDataResponse } from '../api/reservationData';
import ReservationError from '@/components/reservation/error';
import ReservationHeader from '@/components/reservation/header';
import { Add, Remove } from '@mui/icons-material';
import {
  Box,
  Grid,
  Typography,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
} from '@mui/material';
import { styled, SwitchProps } from '@mui/material';

type SeatingType =
  ApiGetReservationDataResponse['eventDates'][number]['seatings'][number];

// iOS style switch from MUI docs
const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 50,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(24px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#000000',
        opacity: 1,
        border: 0,
      },
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.5,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? '#39393D' : '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

export default function FriendsFamilyReservationPage() {
  // Reservation type state
  const [type, setType] = useState<'VIP' | 'STANDING'>('VIP');

  const [data, setData] = useState<ApiGetReservationDataResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string>();

  // Selection & contact state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SeatingType | null>(null);
  const [guestCount, setGuestCount] = useState<string>('1');
  const [packagePrice, setPackagePrice] = useState<string>('0');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const maxGuests = type === 'VIP' ? 10 : 20;

  // Fetch or load from cache on type change
  useEffect(() => {
    setFetchError(undefined);
    setSelectedDate(null);
    setSelectedSlot(null);
    setGuestCount('1');
    setPackagePrice('0');

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

  // Helper: determine if everything is booked
  const allBooked =
    data?.eventDates
      .flatMap((d) => d.seatings)
      .every((s) => {
        const free = type === 'VIP' ? s.availableVip : s.availableStanding;
        return (
          free -
            s.reservations
              .filter((r) => r.type == type)
              .reduce((a, b) => a + b.tableCount, 0) <=
          0
        );
      }) ?? false;

  const selectedDateData = data?.eventDates.find(
    (d) => d.date === selectedDate
  );

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setGuestCount('1');
    setPackagePrice('0');
    setTimeout(
      () =>
        document
          .querySelector('#timeslots')
          ?.scrollIntoView({ behavior: 'smooth' }),
      200
    );
  };

  const selectTimeslot = (slot: SeatingType) => {
    setSelectedSlot(slot);
    setTimeout(
      () =>
        document
          .querySelector('#contact')
          ?.scrollIntoView({ behavior: 'smooth' }),
      200
    );
  };

  const handleSubmit = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      await axios.post('/api/reservations/friendsAndFamily', {
        type,
        name,
        email,
        people: Number(guestCount),
        seatingId: selectedSlot.id,
        packagePrice: Number(packagePrice),
      });
      setSuccess(true);
      setDialogOpen(true);
    } catch {
      alert('Fehler beim Anlegen der Reservierung.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setName('');
    setEmail('');
    setGuestCount('1');
    setPackagePrice('0');
    setSelectedDate(null);
    setSelectedSlot(null);
    setDialogOpen(false);
  };

  return (
    <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
      <ReservationHeader>Friends &amp; Family Reservierung</ReservationHeader>

      {/* Type Switch */}
      <Box className="flex items-center justify-center mb-4 gap-3">
        <Typography className="mr-2">VIP-Tisch</Typography>
        <IOSSwitch
          checked={type === 'STANDING'}
          onChange={() => setType((t) => (t === 'VIP' ? 'STANDING' : 'VIP'))}
        />
        <Typography className="ml-2">Stehtisch</Typography>
      </Box>

      {/* Loading Spinner under switch */}
      {dataLoading && (
        <Box className="flex justify-center mb-4">
          <CircularProgress size={28} />
        </Box>
      )}

      {/* Fetch Error */}
      {fetchError && (
        <Typography variant="h6" gutterBottom>
          {fetchError}
        </Typography>
      )}

      {/* All booked */}
      {!dataLoading && data && allBooked && (
        <ReservationError text="Leider sind aktuell alle Plätze vergeben." />
      )}

      {/* Date Selection */}
      {!dataLoading && data && !allBooked && (
        <>
          <Grid
            container
            spacing={2}
            justifyContent="center"
            mb={4}
            id="date-selection"
          >
            {data.eventDates
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(({ date, dow, seatings }) => {
                const free = seatings.reduce(
                  (acc, s) =>
                    acc +
                    ((type === 'VIP' ? s.availableVip : s.availableStanding) -
                      s.reservations
                        .filter((r) => r.type == type)
                        .reduce((a, b) => a + b.tableCount, 0)),
                  0
                );
                return (
                  <Grid key={date}>
                    <button
                      className={`rounded-full px-4
                        py-2 text-sm font-medium shadow-sm border
                        transition-all duration-300
                        ${
                          selectedDate === date
                            ? 'bg-black text-white'
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      disabled={free === 0}
                      onClick={() => selectDate(date)}
                    >
                      <span className="text-xs text-gray-500 mr-2">{dow}</span>
                      {date}
                    </button>
                  </Grid>
                );
              })}
          </Grid>

          {/* Timeslot Selection */}
          {selectedDate && selectedDateData && (
            <Box id="timeslots" mb={8}>
              <Typography variant="h5" gutterBottom>
                Wähle deinen Timeslot
              </Typography>
              <Grid container spacing={2}>
                {selectedDateData.seatings
                  .sort((a, b) => a.timeslot.localeCompare(b.timeslot))
                  .map((s) => {
                    const free =
                      (type === 'VIP' ? s.availableVip : s.availableStanding) -
                      s.reservations
                        .filter((r) => r.type == type)
                        .reduce((a, b) => a + b.tableCount, 0);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.timeslot}>
                        <button
                          className={`w-full rounded-full mb-2 px-4
                            py-2 text-sm font-medium shadow-sm border
                            transition-all duration-300
                            ${
                              selectedSlot?.timeslot === s.timeslot
                                ? 'bg-black text-white'
                                : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          onClick={() => selectTimeslot(s)}
                          disabled={free === 0}
                        >
                          {s.timeslot}
                        </button>
                        <Typography
                          variant="body2"
                          className="text-center"
                          color={free === 1 ? 'error' : 'textSecondary'}
                        >
                          {free === 0
                            ? 'Ausgebucht'
                            : `Noch ${free} Tisch${free === 1 ? '' : 'e'} frei`}
                        </Typography>
                      </Grid>
                    );
                  })}
              </Grid>
            </Box>
          )}

          {/* Guest Count & Contact */}
          {selectedSlot && (
            <Box id="contact" mt={6} className="space-y-6">
              <Typography variant="h5" gutterBottom>
                Anzahl Gäste
              </Typography>
              <Box className="flex items-center justify-center gap-4 mt-8">
                <button
                  className="w-12 h-12 text-lg font-bold rounded-full border border-gray-400 hover:bg-gray-100 transition disabled:opacity-50"
                  disabled={Number(guestCount) <= 1}
                  onClick={() =>
                    setGuestCount((c) => String(Math.max(1, Number(c) - 1)))
                  }
                >
                  <Remove />
                </button>
                <Typography variant="h4" className="w-16 text-center">
                  {guestCount}
                </Typography>
                <button
                  className="w-12 h-12 text-lg font-bold rounded-full border border-gray-400 hover:bg-gray-100 transition disabled:opacity-50"
                  disabled={Number(guestCount) >= maxGuests}
                  onClick={() =>
                    setGuestCount((c) =>
                      String(Math.min(maxGuests, Number(c) + 1))
                    )
                  }
                >
                  <Add />
                </button>
              </Box>
              <Typography className="text-center text-gray-600">
                (max. {maxGuests} Gäste)
              </Typography>

              <Typography variant="h5" gutterBottom>
                Kontaktdaten
              </Typography>
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  label="Name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="E-Mail"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Mindestverzehr"
                  value={packagePrice}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">€</InputAdornment>
                      ),
                    },
                  }}
                  onChange={(e) => setPackagePrice(e.target.value)}
                  margin="normal"
                />
              </Box>

              <button
                className="w-full rounded-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                onClick={handleSubmit}
                disabled={loading || !name.trim() || !email.trim()}
              >
                Reservierung anlegen
              </button>
            </Box>
          )}
        </>
      )}

      {/* Success Snackbar & Dialog */}
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={() => setSuccess(false)}
      >
        <Alert
          onClose={() => setSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Deine Friends & Family-Reservierung ist bestätigt!
        </Alert>
      </Snackbar>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Friends & Family Reservierung bestätigt!</DialogTitle>
        <DialogContent>
          <Typography>
            Die Reservierung für <b className="italic">{name}</b> am{' '}
            <b className="italic">
              {selectedDate} / {selectedSlot?.timeslot}
            </b>
            <br />
            mit <b className="italic">{guestCount} Gästen</b> wurde bestätigt.
            <Typography sx={{ mt: 2 }}>
              Eine Bestätigungs-Mail an{' '}
              <b className="italic underline">{email}</b> wurde versandt.
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <button
            className="rounded-full px-4 py-2 m-3 bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
            onClick={handleCloseDialog}
          >
            Weitere Reservierung
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
