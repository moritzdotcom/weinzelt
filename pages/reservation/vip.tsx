import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import axios, { isAxiosError } from 'axios';
import { ApiGetReservationDataResponse } from '../api/reservationData';
import { packages, PackageType } from '@/lib/packages';
import ReservationError from '@/components/reservation/error';
import ReservationLoading from '@/components/reservation/loading';
import ReservationHeader from '@/components/reservation/header';
import PackageCard from '@/components/reservation/packageCard';
import ReservationConfirmationDialog from '@/components/reservation/confirmationDialog';
import ARGBConfirmation from '@/components/reservation/argbConfirmation';
import { useRouter } from 'next/router';
import Countdown from '@/components/countdown';

type SeatingType =
  ApiGetReservationDataResponse['eventDates'][number]['seatings'][number];

export default function VipReservationPage() {
  const reservationStartDate = '05.23.2025 18:00';
  const router = useRouter();
  const [data, setData] = useState<ApiGetReservationDataResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SeatingType | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(
    null
  );
  const [personCount, setPersonCount] = useState<string>('8');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string>();
  const [showCountdown, setShowCountdown] = useState(
    new Date(reservationStartDate) > new Date()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setShowCountdown(new Date(reservationStartDate) > new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (showCountdown)
    return (
      <section
        id="countdown"
        className="h-screen flex items-center bg-gradient-to-tr from-gray-100 to-blue-100 text-black text-center px-4"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <img src="/logo.png" alt="Logo" className="w-80 h-auto mb-4" />
          <p className="text-xl md:text-2xl">
            Reservierungsanfragen können ab dem <b>23.05.2025 um 18:00</b>{' '}
            abgegeben werden.
          </p>
          <Countdown targetDate={reservationStartDate} />
        </div>
      </section>
    );

  useEffect(() => {
    if (!router.isReady || !data) return;
    if (typeof router.query.date !== 'string') return;
    selectDate(router.query.date);
  }, [router.isReady, data]);

  useEffect(() => {
    axios
      .get('/api/reservationData?type=VIP')
      .then((res) => setData(res.data))
      .catch((e) => {
        if (isAxiosError(e)) {
          if (e.status == 404) {
            setFetchError(
              'Bald kannst du dein Erlebnis im Weinzelt reservieren. Wir freuen uns auf dich!'
            );
          } else {
            setFetchError(
              'Es ist ein unbekannter Fehler aufgetreten. Versuche es später nochmal.'
            );
          }
        }
      });
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    await axios.post('/api/reservationData', {
      type: 'VIP',
      name,
      email,
      packageName: selectedPackage?.name,
      packageDescription: selectedPackage?.description,
      packagePrice: selectedPackage?.price,
      people: Number(personCount),
      seatingId: selectedSlot?.id,
    });

    setSuccess(true);
    setDialogOpen(true);
    setLoading(false);
    // Reset form
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedPackage(null);
    setPersonCount('8');
    setName('');
    setEmail('');
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedPackage(null);
    setTimeout(() => {
      document
        .querySelector('#timeslots')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const selectTimeslot = (slot: SeatingType) => {
    setSelectedSlot(slot);
    setTimeout(() => {
      document
        .querySelector('#packages')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const selectPackage = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setTimeout(() => {
      document
        .querySelector('#contact')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  if (fetchError) return <ReservationError text={fetchError} />;

  if (!data) return <ReservationLoading />;

  const allBooked =
    [...data.eventDates].reduce(
      (a, b) =>
        a +
        b.seatings.reduce(
          (c, d) => c + (d.availableVip - d._count.reservations),
          0
        ),
      0
    ) === 0;

  const selectedDateData = [...data.eventDates].find(
    (d) => d.date === selectedDate
  );

  if (allBooked)
    return (
      <ReservationError text="Leider gibt es für dieses Jahr keine Tische mehr zu vergeben." />
    );

  return (
    <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
      <ReservationHeader>Tisch reservieren</ReservationHeader>

      <Grid
        id="date-selection"
        container
        spacing={2}
        justifyContent="center"
        mb={4}
      >
        {data.eventDates
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(({ date, dow, seatings }) => (
            <Grid key={date}>
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm border disabled:opacity-50 transition-all duration-300 ${
                  selectedDate === date
                    ? 'bg-black text-white'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                disabled={
                  seatings.reduce(
                    (a, b) => a + (b.availableVip - b._count.reservations),
                    0
                  ) === 0
                }
                onClick={() => selectDate(date)}
              >
                <span className="text-xs text-gray-500 mr-2">{dow}</span>
                <span>{date}</span>
              </button>
            </Grid>
          ))}
      </Grid>

      {selectedDate && selectedDateData && (
        <Box id="timeslots" className="mb-8">
          <Typography variant="h5" gutterBottom>
            Wähle einen Timeslot
          </Typography>
          <Grid container spacing={2}>
            {selectedDateData.seatings
              .sort((a, b) => a.timeslot.localeCompare(b.timeslot))
              .map((seat) => {
                const tablesLeft = seat.availableVip - seat._count.reservations;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={seat.timeslot}>
                    <button
                      className={`w-full rounded-full mb-2 px-4 py-2 text-sm font-medium disabled:opacity-50 shadow-sm border transition-all duration-300 ${
                        selectedSlot?.timeslot === seat.timeslot
                          ? 'bg-black text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                      onClick={() => selectTimeslot(seat)}
                      disabled={tablesLeft === 0}
                    >
                      {seat.timeslot}
                    </button>
                    <Typography
                      variant="body2"
                      className="text-center"
                      color={tablesLeft === 1 ? 'error' : 'textSecondary'}
                    >
                      {tablesLeft == 0
                        ? 'Sold Out'
                        : `Noch ${tablesLeft} Tisch${
                            tablesLeft === 1 ? '' : 'e'
                          } verfügbar`}
                    </Typography>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      )}

      {selectedSlot && (
        <Box id="packages" className="mb-8">
          <Typography variant="h5" gutterBottom>
            Wähle ein Package
          </Typography>
          <Grid container spacing={3}>
            {packages
              .filter(({ id }) => selectedSlot.availablePackageIds.includes(id))
              .map((pkg) => (
                <Grid size={{ xs: 12, sm: 6 }} key={pkg.name}>
                  <PackageCard
                    pkg={pkg}
                    selected={selectedPackage?.id === pkg.id}
                    onSelect={() => selectPackage(pkg)}
                  />
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {selectedPackage && (
        <Box id="contact" mt={6} className="space-y-4">
          <Typography variant="h5" gutterBottom>
            Kontaktdaten
          </Typography>
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
            label="Anzahl Personen"
            type="number"
            required
            value={personCount}
            onChange={(e) => setPersonCount(e.target.value)}
            fullWidth
            margin="normal"
          />
          <ARGBConfirmation />
          <button
            className="w-full rounded-full bg-black text-white py-3 font-semibold text-center hover:bg-gray-800 transition disabled:bg-gray-600"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !email.trim()}
          >
            Reservierung anfragen
          </button>
        </Box>
      )}

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
          Reservierungsanfrage erfolgreich gesendet!
        </Alert>
      </Snackbar>

      <ReservationConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}
