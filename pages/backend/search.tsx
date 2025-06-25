import EventSelector from '@/components/eventSelector';
import { Session } from '@/hooks/useSession';
import {
  Box,
  Divider,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ApiGetEventsResponse } from '../api/events';
import { ApiGetReservationsResponse } from '../api/events/[eventId]/reservations';
import axios from 'axios';
import { translateState, translateType } from '@/lib/reservation';
import EditReservationDialog from '@/components/reservation/editDialog';

export default function BackendSearchReservationPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [reservations, setReservations] = useState<ApiGetReservationsResponse>(
    []
  );
  const [filteredReservations, setFilteredReservations] =
    useState<ApiGetReservationsResponse>([]);
  const [loading, setLoading] = useState(false);

  const [selectedReservation, setSelectedReservation] = useState<
    ApiGetReservationsResponse[number] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilter] = useState<{
    type?: string;
    state?: string;
  }>({});

  const sortReservations = (reservations: ApiGetReservationsResponse) => {
    return reservations.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate; // Sort by createdAt descending
    });
  };

  const fetchReservations = async () => {
    const res = await axios.get<ApiGetReservationsResponse>(
      `/api/events/${selectedEvent?.id}/reservations`
    );
    setLoading(false);
    setReservations(sortReservations(res.data));
    setFilteredReservations(sortReservations(res.data));
  };

  const handleSave = (
    updatedReservation: ApiGetReservationsResponse[number]
  ) => {
    axios
      .put<ApiGetReservationsResponse[number]>(
        `/api/reservations/${updatedReservation.id}`,
        updatedReservation
      )
      .then(() => {
        setFilteredReservations((prev) =>
          prev.map((r) =>
            r.id === updatedReservation.id ? updatedReservation : r
          )
        );
        setReservations((prev) =>
          prev.map((r) =>
            r.id === updatedReservation.id ? updatedReservation : r
          )
        );
        setSelectedReservation(null);
      })
      .catch((error) => {
        console.error('Error updating reservation:', error);
        alert(
          'Fehler beim Aktualisieren der Reservierung. Bitte versuche es später erneut.'
        );
      });
  };

  useEffect(() => {
    if (!searchQuery && !filters.type && !filters.state) {
      setFilteredReservations(reservations);
      return;
    }
    let filtered = [...reservations];
    if (searchQuery !== '') {
      filtered = filtered.filter(
        (reservation) =>
          reservation.name.toLowerCase().includes(searchQuery) ||
          reservation.email.toLowerCase().includes(searchQuery) ||
          reservation.packageName.toLowerCase().includes(searchQuery)
      );
    }
    if (filters.type || filters.state) {
      filtered = filtered.filter((reservation) => {
        const matchesType = !filters.type || reservation.type === filters.type;
        const matchesState =
          !filters.state || reservation.confirmationState === filters.state;
        return matchesType && matchesState;
      });
    }
    setFilteredReservations(filtered);
  }, [searchQuery, reservations, filters]);

  useEffect(() => {
    if (!selectedEvent?.id) return;
    setLoading(true);
    fetchReservations();
  }, [selectedEvent]);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  return (
    <Box className="mx-auto px-4 py-16">
      <Box className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-12">
        <Typography
          variant="h4"
          className="text-center"
          marginBottom={{ xs: 2, sm: 0 }}
        >
          Reservierung suchen
        </Typography>

        <EventSelector onChange={setSelectedEvent} />
      </Box>
      {loading ? (
        <Typography variant="body1" className="text-center">
          Lade Reservierungen...
        </Typography>
      ) : (
        <>
          {reservations.length > 0 ? (
            <>
              <Divider className="block sm:hidden!">Suchen & Filtern</Divider>
              <div className="flex flex-col sm:flex-row gap-4 my-8">
                <TextField
                  variant="outlined"
                  label="Suche"
                  type="search"
                  className="w-full sm:w-2/4"
                  placeholder="Name, E-Mail, Package..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                />
                <TextField
                  select
                  variant="outlined"
                  label="Typ filtern"
                  className="w-full sm:w-1/4"
                  value={filters.type || ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      type: e.target.value || undefined,
                    }))
                  }
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                  <MenuItem value="STANDING">Stehtisch</MenuItem>
                </TextField>
                <TextField
                  select
                  variant="outlined"
                  label="Status filtern"
                  className="w-full sm:w-1/4"
                  value={filters.state || ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      state: e.target.value || undefined,
                    }))
                  }
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="REQUESTED">Offen</MenuItem>
                  <MenuItem value="ACCEPTED">Bestätigt</MenuItem>
                  <MenuItem value="DECLINED">Abgelehnt</MenuItem>
                </TextField>
              </div>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Timeslot</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Gäste</TableCell>
                      <TableCell>Package</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReservations.map((reservation) => (
                      <TableRow
                        key={reservation.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {reservation.name}
                        </TableCell>
                        <TableCell>{reservation.email}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {reservation.seating.eventDate.dow},{' '}
                          {reservation.seating.eventDate.date} /{' '}
                          {reservation.seating.timeslot}
                        </TableCell>
                        <TableCell>{translateType(reservation.type)}</TableCell>
                        <TableCell>
                          {translateState(reservation.confirmationState)}
                        </TableCell>
                        <TableCell align="right">
                          {reservation.people}
                        </TableCell>
                        <TableCell>{reservation.packageName}</TableCell>
                        <TableCell>
                          <button
                            className="text-sky-700 hover:text-sky-900 transition underline"
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            Bearbeiten
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Typography variant="body1" className="text-center">
              Keine Reservierungen gefunden.
            </Typography>
          )}
        </>
      )}
      <EditReservationDialog
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onSave={handleSave}
      />
    </Box>
  );
}
