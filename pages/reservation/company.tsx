import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import axios, { isAxiosError } from 'axios';
import ReservationError from '@/components/reservation/error';
import ReservationLoading from '@/components/reservation/loading';
import ReservationHeader from '@/components/reservation/header';
import ReservationConfirmationDialog from '@/components/reservation/confirmationDialog';
import ARGBConfirmation from '@/components/reservation/argbConfirmation';
import { ApiGetReservationDatesResponse } from '../api/reservationDates';
import { isValidEmail } from '@/lib/validator';
import AddressInput, {
  defaultAddress,
} from '@/components/reservation/addressInput';
import { Address } from '@/lib/reservation';

type SeatingType =
  ApiGetReservationDatesResponse['eventDates'][number]['seatings'][number];

export default function CompanyReservationPage() {
  const [data, setData] = useState<ApiGetReservationDatesResponse | null>(null);
  const [fetchError, setFetchError] = useState<string>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<SeatingType | null>(null);
  const [personCount, setPersonCount] = useState<string>('8');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [argbChecked, setArgbChecked] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [mailError, setMailError] = useState('');

  const [billingAddress, setBillingAddress] = useState<Address>(() =>
    defaultAddress('DE'),
  );
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<Address>(() =>
    defaultAddress('DE'),
  );

  // Lade verfügbare Termine
  useEffect(() => {
    axios
      .get<ApiGetReservationDatesResponse>('/api/reservationDates')
      .then((res) => setData(res.data))
      .catch((e) => {
        if (isAxiosError(e) && e.response?.status === 404) {
          setFetchError(
            'Bald kannst du dein Erlebnis im Weinzelt reservieren. Wir freuen uns auf dich!',
          );
        } else {
          setFetchError(
            'Es ist ein unbekannter Fehler aufgetreten. Versuche es später nochmal.',
          );
        }
      });
  }, []);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!validateInputs()) return;
    if (!selectedDate || !selectedSlot) return;

    setLoading(true);
    try {
      await axios.post(`/api/seatings/${selectedSlot.id}/companyReservation`, {
        name,
        companyName,
        email,
        people: Number(personCount),
        budget: Number(budget),
        text,
        shippingAddress,
        billingAddress,
        shippingSameAsBilling,
      });
      setSuccess(true);
      setDialogOpen(true);
      // Formular zurücksetzen
      setSelectedDate('');
      setSelectedSlot(null);
      setPersonCount('8');
      setName('');
      setCompanyName('');
      setEmail('');
      setBudget('');
      setText('');
      setArgbChecked(false);
      setShippingSameAsBilling(true);
      setBillingAddress(defaultAddress('DE'));
      setShippingAddress(defaultAddress('DE'));
    } catch (error) {
      console.error(error);
      alert('Beim Senden deiner Anfrage ist ein Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
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

  if (!data)
    return fetchError ? (
      <ReservationError text={fetchError} />
    ) : (
      <ReservationLoading />
    );

  if (fetchError) return <ReservationError text={fetchError} />;

  // Lese Timeslots für das gewählte Datum
  const currentSlots =
    data.eventDates.find((d) => d.date === selectedDate)?.seatings ?? [];

  const isSubmitDisabled =
    loading ||
    !selectedDate ||
    !selectedSlot ||
    !name.trim() ||
    !email.trim() ||
    Number(personCount) < 8 ||
    !budget ||
    !argbChecked;

  return (
    <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
      <ReservationHeader>
        Anfrage für große Gruppen & Firmenkunden
      </ReservationHeader>

      {/* Datumsauswahl */}
      <Box className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
        <TextField
          select
          fullWidth
          label="Datum"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedSlot(null);
          }}
          margin="normal"
        >
          {data.eventDates.map((d) => (
            <MenuItem key={d.date} value={d.date}>
              {d.dow}, {d.date}
            </MenuItem>
          ))}
        </TextField>

        {/* Timeslot-Auswahl */}
        <TextField
          select
          fullWidth
          label="Timeslot"
          value={selectedSlot?.timeslot || ''}
          onChange={(e) => {
            const slot = currentSlots.find(
              (s) => s.timeslot === e.target.value,
            );
            setSelectedSlot(slot || null);
          }}
          margin="normal"
          disabled={!selectedDate}
        >
          {currentSlots.map((s) => (
            <MenuItem key={s.timeslot} value={s.timeslot}>
              {s.timeslot}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Kontaktdaten & Budget */}
      <div id="contact" className="mt-8 flex flex-col gap-3">
        <Typography variant="h5">Kontaktdaten</Typography>
        <div className="flex flex-col gap-6">
          <TextField
            fullWidth
            label="Firma"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          />
          <TextField
            fullWidth
            label="Anzahl Personen"
            helperText="Mindestens 8 Personen"
            error={Boolean(personCount) && Number(personCount) < 8}
            type="number"
            required
            value={personCount}
            onChange={(e) => setPersonCount(e.target.value)}
          />
          <TextField
            fullWidth
            label="Budget (pro Person)"
            type="number"
            required
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">€ p.P.</InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Details zur Reservierung"
            placeholder="Gerne gehen wir auf alle Wünsche ein. Nenne uns hierfür kurz den Anlass oder welche Leistungen gewünscht sind."
            multiline
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxRows={4}
            minRows={2}
          />
        </div>
        <AddressInput
          submitted={submitted}
          billingAddress={billingAddress}
          onBillingAddressChange={setBillingAddress}
          shippingSameAsBilling={shippingSameAsBilling}
          onShippingSameAsBillingChange={setShippingSameAsBilling}
          shippingAddress={shippingAddress}
          onShippingAddressChange={setShippingAddress}
        />

        <ARGBConfirmation onChecked={setArgbChecked} />

        <button
          className="w-full rounded-full bg-black text-white py-3 font-semibold text-center hover:bg-gray-800 transition disabled:bg-gray-600"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          Reservierung anfragen
        </button>
      </div>

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
