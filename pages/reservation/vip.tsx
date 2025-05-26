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
import { calculatePackagePrice, packages, PackageType } from '@/lib/packages';
import ReservationError from '@/components/reservation/error';
import ReservationLoading from '@/components/reservation/loading';
import ReservationHeader from '@/components/reservation/header';
import PackageCard from '@/components/reservation/packageCard';
import ReservationConfirmationDialog from '@/components/reservation/confirmationDialog';
import ARGBConfirmation from '@/components/reservation/argbConfirmation';
import { useRouter } from 'next/router';
import ReservationCountdownSection from '@/components/reservation/countdown';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FoodOptionCard from '@/components/reservation/foodOptionCard';
import OrderSummary from '@/components/reservation/orderSummary';
import { isValidEmail } from '@/lib/validator';

type SeatingType =
  ApiGetReservationDataResponse['eventDates'][number]['seatings'][number];

export default function VipReservationPage() {
  const pricePerMenu = 65;
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
  const [argbChecked, setArgbChecked] = useState(false);
  const [foodData, setFoodData] = useState({
    meat: 8,
    vegetarian: 0,
  });

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
    if (!selectedPackage || !selectedSlot) return;

    setLoading(true);
    await axios.post('/api/reservationData', {
      type: 'VIP',
      name,
      email,
      packageName: selectedPackage.name,
      packageDescription: selectedPackage.description,
      packagePrice: Math.max(
        calculatePackagePrice(
          selectedPackage,
          Number(personCount),
          foodData.meat * pricePerMenu + foodData.vegetarian * pricePerMenu,
          selectedSlot.minimumSpend
        ),
        0
      ),
      people: Math.min(Number(personCount), 80),
      seatingId: selectedSlot.id,
      foodCountMeat: foodData.meat,
      foodCountVegetarian: foodData.vegetarian,
      totalFoodPrice: pricePerMenu * (foodData.meat + foodData.vegetarian),
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
    setFoodData({ meat: 8, vegetarian: 0 });
    setSubmitted(false);
    setArgbChecked(false);
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedPackage(null);
    setFoodData({ meat: Number(personCount), vegetarian: 0 });
    setTimeout(() => {
      document
        .querySelector('#timeslots')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const selectTimeslot = (slot: SeatingType) => {
    setSelectedSlot(slot);
    setSelectedPackage(null);
    setFoodData({
      meat: slot.foodRequired ? Number(personCount) : 0,
      vegetarian: 0,
    });
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
        .querySelector(
          selectedSlot?.foodRequired ? '#foodSelection' : '#contact'
        )
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
    if (personCount.length > 0) {
      setFoodData({
        meat: Number(personCount),
        vegetarian: 0,
      });
    }
  }, [personCount]);

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
              (d.availableVip -
                d.reservations
                  .filter(({ type }) => type == 'VIP')
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
                        (a, b) =>
                          a +
                          (b.availableVip -
                            b.reservations
                              .filter(({ type }) => type == 'VIP')
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
                      seat.availableVip -
                      seat.reservations
                        .filter(({ type }) => type == 'VIP')
                        .reduce((a, b) => a + b.tableCount, 0);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={seat.timeslot}>
                        <button
                          className={`w-full flex items-center justify-center gap-2 rounded-full mb-2 px-4 py-2 text-sm font-medium disabled:opacity-50 shadow-sm border transition-all duration-300 ${
                            selectedSlot?.timeslot === seat.timeslot
                              ? 'bg-black text-white'
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                          onClick={() => selectTimeslot(seat)}
                          disabled={tablesLeft === 0}
                        >
                          <p>{seat.timeslot}</p>
                          {seat.foodRequired && (
                            <RestaurantIcon fontSize="inherit" />
                          )}
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
                Wähle ein Getränke-Package
              </Typography>
              <Grid container spacing={3} alignItems="stretch">
                {packages
                  .filter(({ id }) =>
                    selectedSlot.availablePackageIds.includes(id)
                  )
                  .sort((a, b) => a.sortId - b.sortId)
                  .map((pkg) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={pkg.name}>
                      <PackageCard
                        pkg={pkg}
                        price={Math.max(
                          calculatePackagePrice(
                            pkg,
                            Number(personCount),
                            foodData.meat * pricePerMenu +
                              foodData.vegetarian * pricePerMenu,
                            selectedSlot.minimumSpend
                          ),
                          0
                        )}
                        selected={selectedPackage?.id === pkg.id}
                        onSelect={() => selectPackage(pkg)}
                      />
                    </Grid>
                  ))}
              </Grid>
            </Box>
          )}

          {selectedPackage && selectedSlot?.foodRequired && (
            <Box id="foodSelection" mt={6} className="space-y-4">
              <div className="flex flex-col gap-1">
                <h5 className="text-2xl">Wähle dein Essen</h5>
                <h5 className="text-lg text-neutral-500">
                  (Essen im ausgewählten Timeslot verpflichtend)
                </h5>
              </div>
              <div className="flex flex-col gap-5">
                <FoodOptionCard
                  title="3 Gänge Menu - Fleisch"
                  value={foodData.meat}
                  menuPrice={pricePerMenu}
                  onChange={(count) =>
                    setFoodData({
                      vegetarian: Number(personCount) - count,
                      meat: count,
                    })
                  }
                  maxValue={Number(personCount)}
                />
                <FoodOptionCard
                  title="3 Gänge Menu - Vegetarisch"
                  value={foodData.vegetarian}
                  menuPrice={pricePerMenu}
                  onChange={(count) =>
                    setFoodData({
                      meat: Number(personCount) - count,
                      vegetarian: count,
                    })
                  }
                  maxValue={Number(personCount)}
                />
              </div>
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
                error={Boolean(mailError)}
                helperText={mailError}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
              />
              <TextField
                label="Anzahl Personen"
                type="number"
                required
                error={Number(personCount) > 80}
                helperText={
                  Number(personCount) > 80 ? 'max. 80 Personen' : undefined
                }
                value={personCount}
                onChange={(e) => setPersonCount(e.target.value)}
                fullWidth
                margin="normal"
              />

              {selectedPackage && selectedSlot && (
                <OrderSummary
                  people={Number(personCount)}
                  pkg={selectedPackage}
                  drinksTotal={Math.max(
                    calculatePackagePrice(
                      selectedPackage,
                      Number(personCount),
                      foodData.meat * pricePerMenu +
                        foodData.vegetarian * pricePerMenu,
                      selectedSlot.minimumSpend
                    ),
                    0
                  )}
                  foodCount={foodData.meat + foodData.vegetarian}
                  menuPrice={pricePerMenu}
                />
              )}

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
