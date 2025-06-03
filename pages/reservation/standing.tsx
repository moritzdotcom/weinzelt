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
import ReservationError from '@/components/reservation/error';
import ReservationLoading from '@/components/reservation/loading';
import ReservationHeader from '@/components/reservation/header';
import ReservationConfirmationDialog from '@/components/reservation/confirmationDialog';
import { Add, Remove } from '@mui/icons-material';
import ARGBConfirmation from '@/components/reservation/argbConfirmation';
import { useRouter } from 'next/router';
import ReservationCountdownSection from '@/components/reservation/countdown';
import { isValidEmail } from '@/lib/validator';
import ReferralCodeField from '@/components/reservation/referralCodeField';
import { ApiGetReferralCodeResponse } from '../api/referralCodes/getCode';

type SeatingType =
  ApiGetReservationDataResponse['eventDates'][number]['seatings'][number];

export default function StandingReservationPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiGetReservationDataResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SeatingType | null>(null);
  const [personCount, setPersonCount] = useState<string>('8');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string>();
  const [argbChecked, setArgbChecked] = useState(false);
  const [referralCode, setReferralCode] =
    useState<ApiGetReferralCodeResponse | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [mailError, setMailError] = useState('');

  useEffect(() => {
    if (!router.isReady || !data) return;
    if (typeof router.query.date !== 'string') return;
    selectDate(router.query.date);
  }, [router.isReady, data]);

  useEffect(() => {
    axios
      .get('/api/reservationData')
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
    setSubmitted(true);
    if (!validateInputs()) return;

    setLoading(true);
    await axios.post('/api/reservationData', {
      type: 'STANDING',
      name,
      email,
      packageName: 'Stehtisch',
      packageDescription: `Stehtisch für ${personCount} Personen`,
      packagePrice: Number(personCount) * 50,
      people: Number(personCount),
      seatingId: selectedSlot?.id,
      referralCodeId: referralCode?.id,
    });

    setSuccess(true);
    setDialogOpen(true);
    setLoading(false);
    // Reset form
    setSelectedDate(null);
    setSelectedSlot(null);
    setPersonCount('8');
    setName('');
    setEmail('');
    setReferralCode(null);
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
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
        .querySelector('#contact')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const validateInputs = () => {
    setMailError('');
    if (!isValidEmail(email)) {
      setMailError('Ungültige Email');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!submitted) return;
    validateInputs();
  }, [email, submitted]);

  const allBooked = data
    ? [...data.eventDates].reduce(
        (a, b) =>
          a +
          b.seatings.reduce(
            (c, d) =>
              c +
              (d.availableStanding -
                d.reservations
                  .filter(({ type }) => type == 'STANDING')
                  .reduce((a, b) => a + b.tableCount, 0)),
            0
          ),
        0
      ) === 0
    : false;

  const selectedDateData = data
    ? [...data.eventDates].find((d) => d.date === selectedDate)
    : undefined;

  if (allBooked)
    return (
      <ReservationError text="Leider gibt es für dieses Jahr keine Tische mehr zu vergeben." />
    );

  return (
    <ReservationCountdownSection startDate="2025-05-23T16:00:00Z">
      {!data ? (
        fetchError ? (
          <ReservationError text={fetchError} />
        ) : (
          <ReservationLoading />
        )
      ) : (
        <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
          <ReservationHeader>Stehtisch reservieren</ReservationHeader>

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
                        (a, b) =>
                          a +
                          (b.availableStanding -
                            b.reservations
                              .filter(({ type }) => type == 'STANDING')
                              .reduce((a, b) => a + b.tableCount, 0)),
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
                    const tablesLeft =
                      seat.availableStanding -
                      seat.reservations
                        .filter(({ type }) => type == 'STANDING')
                        .reduce((a, b) => a + b.tableCount, 0);
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
            <Box id="contact" mt={6} className="space-y-6">
              <Typography variant="h5" gutterBottom>
                Anzahl Personen
              </Typography>
              <Box className="flex items-center justify-center gap-4 mt-16 sm:mt-8">
                <button
                  onClick={() =>
                    setPersonCount((prev) =>
                      Math.max(5, Math.min(16, parseInt(prev) - 1)).toString()
                    )
                  }
                  disabled={Number(personCount) <= 5}
                  className="w-12 h-12 text-lg font-bold rounded-full border border-gray-400 hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center"
                >
                  <Remove />
                </button>
                <Typography variant="h4" className="w-16 text-center">
                  {personCount}
                </Typography>
                <button
                  onClick={() =>
                    setPersonCount((prev) =>
                      Math.max(5, Math.min(16, parseInt(prev) + 1)).toString()
                    )
                  }
                  disabled={Number(personCount) >= 16}
                  className="w-12 h-12 text-lg font-bold rounded-full border border-gray-400 hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center"
                >
                  <Add />
                </button>
              </Box>

              <p className="text-center text-gray-600 mb-16 sm:mb-8">
                Mindestverzehr: <b>50€ pro Person</b>
              </p>

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
                error={Boolean(mailError)}
                helperText={mailError}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
              />
              <ReferralCodeField onValidCode={setReferralCode} />
              <div className="rounded-md bg-emerald-50 border border-gray-300 p-4 my-4">
                <Typography variant="body1" className="text-emerald-800">
                  Bitte hab Verständnis, dass die Tische pünktlich geräumt
                  werden müssen. Selbstverständlich kannst du{' '}
                  <b>
                    nach der Reservierung mit deiner Gruppe im Weinzelt bleiben
                  </b>
                  .
                </Typography>
              </div>
              <ARGBConfirmation onChecked={setArgbChecked} />
              <button
                className="w-full rounded-full bg-black text-white py-3 font-semibold text-center hover:bg-gray-800 transition disabled:bg-gray-600"
                onClick={handleSubmit}
                disabled={
                  loading || !name.trim() || !email.trim() || !argbChecked
                }
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
      )}
    </ReservationCountdownSection>
  );
}
