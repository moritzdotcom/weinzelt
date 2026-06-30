import EventSelector from '@/components/eventSelector';
import { Session } from '@/hooks/useSession';
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
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
import { ApiGetEventsResponse } from '../../api/events';
import { ApiGetReservationsResponse } from '../../api/events/[eventId]/reservations';
import axios from 'axios';
import { translateState, translateType } from '@/lib/reservation';
import EditReservationDialog from '@/components/reservation/editDialog';
import {
  CalendarMonth,
  Cancel,
  Edit,
  MoreVert,
  PaidRounded,
  ReceiptLong,
} from '@mui/icons-material';
import { Reservation, ReservationPaymentStatus } from '@prisma/client';
import { ReservationCancelDialog } from '@/components/reservation/cancelDialog';
import { ChangeReservationDateDialog } from '@/components/reservation/changeEventDateDialog';
import BackendHeader from '@/components/backend/header';
import { ApiPutReservationResponse } from '../../api/reservations/[reservationId]';

export default function BackendSearchReservationPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [reservations, setReservations] = useState<ApiGetReservationsResponse>(
    [],
  );
  const [filteredReservations, setFilteredReservations] =
    useState<ApiGetReservationsResponse>([]);
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);

  const [selectedReservation, setSelectedReservation] = useState<
    ApiGetReservationsResponse[number] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilter] = useState<{
    type?: string;
    state?: string;
  }>({});

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReservationId, setMenuReservationId] = useState<string | null>(
    null,
  );
  const [menuReservationPaymentStatus, setMenuReservationPaymentStatus] =
    useState<ReservationPaymentStatus>();
  const [markingAsPaidId, setMarkingAsPaidId] = useState<string | null>(null);

  const menuOpen = Boolean(menuAnchorEl);

  const openMenu = (
    e: React.MouseEvent<HTMLElement>,
    reservationId: string,
    paymentStatus: ReservationPaymentStatus,
  ) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuReservationId(reservationId);
    setMenuReservationPaymentStatus(paymentStatus);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuReservationId(null);
    setMenuReservationPaymentStatus(undefined);
  };

  const showInvoice = (reservationId: string) => {
    // passe den Pfad an deinen Endpoint an
    window.open(
      `/api/reservations/${reservationId}/invoice`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const sortReservations = (reservations: ApiGetReservationsResponse) => {
    return reservations.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate; // Sort by createdAt descending
    });
  };

  const fetchReservations = async () => {
    const res = await axios.get<ApiGetReservationsResponse>(
      `/api/events/${selectedEvent?.id}/reservations`,
    );
    setLoading(false);
    setReservations(sortReservations(res.data));
    setFilteredReservations(sortReservations(res.data));
  };

  const updateReservations = (
    updatedReservation: ApiGetReservationsResponse[number],
  ) => {
    setFilteredReservations((prev) =>
      prev.map((r) =>
        r.id === updatedReservation.id ? updatedReservation : r,
      ),
    );
    setReservations((prev) =>
      prev.map((r) =>
        r.id === updatedReservation.id ? updatedReservation : r,
      ),
    );
  };

  const handleMarkAsPaid = async (
    reservation: ApiGetReservationsResponse[number],
  ) => {
    setMarkingAsPaidId(reservation.id);
    const { data } = await axios.post<Reservation>(
      `/api/reservations/${reservation.id}/trackManualPayment`,
    );
    updateReservations({
      ...reservation,
      paymentStatus: data.paymentStatus,
      manualPaymentTrackedBy: data.manualPaymentTrackedBy,
    });
    setMarkingAsPaidId(null);
    closeMenu();
  };

  const handleSave = (
    updatedReservation: ApiGetReservationsResponse[number],
  ) => {
    axios
      .put<ApiPutReservationResponse>(
        `/api/reservations/${updatedReservation.id}`,
        updatedReservation,
      )
      .then(() => {
        updateReservations(updatedReservation);
        setSelectedReservation(null);
        setEditDialogOpen(false);
      })
      .catch((error) => {
        console.error('Error updating reservation:', error);
        alert(
          'Fehler beim Aktualisieren der Reservierung. Bitte versuche es später erneut.',
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
          reservation.email.toLowerCase().includes(searchQuery),
      );
    }
    if (filters.type || filters.state) {
      filtered = filtered.filter((reservation) => {
        const matchesType = !filters.type || reservation.type === filters.type;
        const matchesState =
          !filters.state || reservation.paymentStatus === filters.state;
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
      <BackendHeader
        title="Reservierung suchen"
        action={
          <Box sx={{ flex: 1 }}>
            <EventSelector onChange={setSelectedEvent} sx={{ minWidth: 300 }} />
          </Box>
        }
      />

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
                  <MenuItem value="DRAFT">Offen</MenuItem>
                  <MenuItem value="PENDING_PAYMENT">Ausstehend</MenuItem>
                  <MenuItem value="PAID">Bezahlt</MenuItem>
                  <MenuItem value="CANCELED">Storniert</MenuItem>
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
                      <TableCell>Rechnung</TableCell>
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
                          {translateState(reservation.paymentStatus)}
                        </TableCell>
                        <TableCell align="right">
                          {reservation.people}
                        </TableCell>
                        <TableCell>
                          {reservation.invoice?.sentAt
                            ? new Date(
                                reservation.invoice?.sentAt,
                              ).toLocaleDateString('de')
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) =>
                              openMenu(
                                e,
                                reservation.id,
                                reservation.paymentStatus,
                              )
                            }
                            aria-label="Optionen"
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
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
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menuReservationId) showInvoice(menuReservationId);
            closeMenu();
          }}
          disabled={menuReservationPaymentStatus !== 'PAID'}
        >
          <ListItemIcon>
            <ReceiptLong fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rechnung anzeigen</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            const r = filteredReservations.find(
              (x) => x.id === menuReservationId,
            );
            if (r) setSelectedReservation(r);
            setEditDialogOpen(true);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bearbeiten</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const r = filteredReservations.find(
              (x) => x.id === menuReservationId,
            );
            if (r) setSelectedReservation(r);
            setChangeDateDialogOpen(true);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reservierung umbuchen</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const r = filteredReservations.find(
              (x) => x.id === menuReservationId,
            );
            if (r) handleMarkAsPaid(r);
          }}
          disabled={
            menuReservationPaymentStatus !== 'PENDING_PAYMENT' ||
            markingAsPaidId == menuReservationId
          }
        >
          <ListItemIcon>
            <PaidRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Als bezahlt markieren</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const r = filteredReservations.find(
              (x) => x.id === menuReservationId,
            );
            if (r) setSelectedReservation(r);
            setCancelDialogOpen(true);
            closeMenu();
          }}
          disabled={menuReservationPaymentStatus === 'CANCELED'}
        >
          <ListItemIcon>
            <Cancel fontSize="small" />
          </ListItemIcon>
          <ListItemText>Stornieren</ListItemText>
        </MenuItem>
      </Menu>
      <EditReservationDialog
        open={editDialogOpen}
        reservation={selectedReservation}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedReservation(null);
        }}
        onSave={handleSave}
      />
      <ReservationCancelDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation!}
        onUpdate={(res) => {
          updateReservations(res);
          setSelectedReservation(null);
        }}
      />
      <ChangeReservationDateDialog
        open={changeDateDialogOpen}
        onClose={() => {
          setChangeDateDialogOpen(false);
          setSelectedReservation(null);
        }}
        eventId={selectedReservation?.seating.eventDate.eventId ?? ''}
        reservationId={selectedReservation?.id ?? ''}
        seatingId={selectedReservation?.seatingId ?? ''}
        reservationType={selectedReservation?.type ?? 'VIP'}
        reservationMinimumSpend={selectedReservation?.minimumSpend ?? 0}
        reservationPaymentStatus={selectedReservation?.paymentStatus ?? 'DRAFT'}
        tableCount={selectedReservation?.tableCount ?? 0}
        onChanged={(updated) => {
          setChangeDateDialogOpen(false);
          setSelectedReservation(null);
          setReservations((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
          );
        }}
      />
    </Box>
  );
}
