import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

interface ReservationData {
  dates: {
    date: string;
    dow: string;
    seatings: {
      timeslot: string;
      available: number;
    }[];
  }[];
}

interface PackageOption {
  name: string;
  description: string;
  strikePrice?: number;
  price: number;
  image: string;
}

export default function ReservationPage() {
  const [data, setData] = useState<ReservationData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [personCount, setPersonCount] = useState<string>('1');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    axios.get('/api/reservations').then((res) => setData(res.data));
    setIsClient(true);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    await axios.post('/api/reservations', {
      date: selectedDate,
      slot: selectedSlot,
      package: selectedPackage,
      personCount,
      name,
      email,
    });
    setSuccess(true);
    setDialogOpen(true);
    setLoading(false);
    // Reset form
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedPackage(null);
    setPersonCount('1');
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

  const selectTimeslot = (slot: string) => {
    setSelectedSlot(slot);
    setTimeout(() => {
      document
        .querySelector('#packages')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const selectPackage = (pkg: string) => {
    setSelectedPackage(pkg);
    setTimeout(() => {
      document
        .querySelector('#contact')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  if (!data)
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );

  const allBooked =
    [...data.dates].reduce(
      (a, b) => a + b.seatings.reduce((c, d) => c + d.available, 0),
      0
    ) === 0;
  const selectedDateData = [...data.dates].find((d) => d.date === selectedDate);

  const packages: PackageOption[] = [
    {
      name: 'Champagner Package',
      description:
        'Inklusive 3 Flaschen Champagner, 3 Flaschen Wein, bevorzugter Einlass.',
      strikePrice: 800,
      price: 800,
      image: '/packages/champagner.png',
    },
    {
      name: 'Sommelier Package',
      description:
        'Raritäten-Verkostung mit persönlichem Sommelier, 6 Top-Weine, bevorzugter Einlass.',
      strikePrice: 550,
      price: 550,
      image: '/packages/sommelier.png',
    },
    {
      name: 'Party Package',
      description:
        '2 Flaschen Wein nach Wahl, 1 Flasche Belvedere inkl. Mischgetränken, bevorzugter Einlass.',
      strikePrice: 480,
      price: 480,
      image: '/packages/party.png',
    },
    {
      name: 'Magnum Package',
      description:
        '2 Flaschen Wein nach Wahl, 1 Flasche Belvedere inkl. Mischgetränken, bevorzugter Einlass.',
      strikePrice: 480,
      price: 480,
      image: '/packages/magnum.png',
    },
    {
      name: 'Individuell',
      description:
        'Kein Paket - Mindestverzehr 65€ pro Person, bevorzugter Einlass.',
      price: 0,
      image: '/packages/individual.png',
    },
  ];

  return (
    <Box className="max-w-4xl mx-auto px-4 py-16 font-sans text-gray-800">
      <Box className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Weinzelt Logo"
          className="mx-auto h-20 mb-12"
        />
        <Typography variant="h4" gutterBottom>
          Tisch reservieren
        </Typography>
      </Box>

      {allBooked ? (
        <Typography className="text-center">
          Leider gibt es für dieses Jahr keine Tische mehr zu vergeben.
        </Typography>
      ) : (
        <Grid
          id="date-selection"
          container
          spacing={2}
          justifyContent="center"
          mb={4}
        >
          {data.dates
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(({ date, dow, seatings }) => (
              <Grid key={date}>
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm border disabled:opacity-50 transition-all duration-300 ${
                    selectedDate === date
                      ? 'bg-black text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  disabled={seatings.reduce((a, b) => a + b.available, 0) === 0}
                  onClick={() => selectDate(date)}
                >
                  <span className="text-xs text-gray-500 mr-2">{dow}</span>
                  <span>{date}</span>
                </button>
              </Grid>
            ))}
        </Grid>
      )}

      {selectedDate && selectedDateData && (
        <Box id="timeslots" className="mb-8">
          <Typography variant="h5" gutterBottom>
            Wähle einen Timeslot
          </Typography>
          <Grid container spacing={2}>
            {selectedDateData.seatings.map(({ timeslot, available }) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={timeslot}>
                <button
                  className={`w-full rounded-full mb-2 px-4 py-2 text-sm font-medium disabled:opacity-50 shadow-sm border transition-all duration-300 ${
                    selectedSlot === timeslot
                      ? 'bg-black text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  onClick={() => selectTimeslot(timeslot)}
                  disabled={available === 0}
                >
                  {timeslot}
                </button>
                <Typography
                  variant="body2"
                  className="text-center"
                  color={available === 1 ? 'error' : 'textSecondary'}
                >
                  {available == 0
                    ? 'Sold Out'
                    : `Noch ${available} Tisch${
                        available === 1 ? '' : 'e'
                      } verfügbar`}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {isClient && selectedSlot && (
        <Box id="packages" className="mb-8">
          <Typography variant="h5" gutterBottom>
            Wähle ein Package
          </Typography>
          <Grid container spacing={3}>
            {packages.map((pkg) => (
              <Grid size={{ xs: 12, sm: 6 }} key={pkg.name}>
                <div
                  className={`rounded-xl overflow-hidden border-2 shadow-sm cursor-pointer transition-all duration-300 ${
                    selectedPackage === pkg.name
                      ? 'border-black bg-gray-100'
                      : 'border-white'
                  }`}
                  onClick={() => selectPackage(pkg.name)}
                >
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>
                    <p className="text-sm mb-2 text-gray-600">
                      {pkg.description}
                    </p>
                    <div className="flex gap-3 items-center">
                      {pkg.strikePrice && (
                        <s className="text-gray-500">{pkg.strikePrice} €</s>
                      )}
                      <p className="font-bold">
                        {pkg.name === 'Individuell'
                          ? Number(personCount) * 65
                          : pkg.price}{' '}
                        €
                      </p>
                    </div>
                  </div>
                </div>
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
          <button
            className="w-full mt-5 rounded-full bg-black text-white py-3 font-semibold text-center hover:bg-gray-900 transition"
            onClick={handleSubmit}
            disabled={loading}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Buchungsanfrage gesendet</DialogTitle>
        <DialogContent>
          <Typography>
            Vielen Dank! Ihre Anfrage wurde übermittelt. Sie erhalten in Kürze
            eine Rückmeldung von uns. Bitte beachten Sie: Ihre Reservierung ist
            noch nicht bestätigt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <button
            className="rounded-full px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
            onClick={() => setDialogOpen(false)}
          >
            Weitere Reservierung
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
