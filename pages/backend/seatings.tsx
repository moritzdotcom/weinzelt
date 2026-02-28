import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import axios, { isAxiosError } from 'axios';
import {
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  InputAdornment,
  Stack,
  Collapse,
  Alert,
  Chip,
  CardContent,
  Card,
  Divider,
  IconButton,
} from '@mui/material';
import { ApiGetEventDatesResponse } from '../api/events/[eventId]/eventDates';
import { ApiPostSeatingResponse } from '../api/eventDates/[eventDateId]/seatings';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { Session } from '@/hooks/useSession';
import { ApiGetEventsResponse } from '../api/events';
import { ApiPutSeatingResponse } from '../api/seatings/[seatingId]';
import ConfirmDialog from '@/components/confirmDialog';
import { ApiDeleteEventDateResponse } from '../api/eventDates/[eventDateId]';
import EventSelector from '@/components/eventSelector';
import {
  ConfirmationNumberOutlined,
  EventSeatOutlined,
  LocalBarOutlined,
} from '@mui/icons-material';
import { ApiPutExternalTicketConfigResponse } from '../api/seatings/[seatingId]/externalTicketConfig';

type EventDate = ApiGetEventDatesResponse[number];
type Seating = EventDate['seatings'][number];
type ExternalTicketConfig = Seating['externalTicketConfig'];

export default function BackendSeatingsPage({ session }: { session: Session }) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [eventDates, setEventDates] = useState<EventDate[]>();
  const [newDate, setNewDate] = useState('');
  const [newDow, setNewDow] = useState('');
  const [createDateDialogOpen, setCreateDateDialogOpen] = useState(false);
  const [duplicateDateDialogOpen, setDuplicateDateDialogOpen] = useState(false);
  const [deleteDateDialogOpen, setDeleteDateDialogOpen] = useState(false);
  const [createSeatingDialogOpen, setCreateSeatingDialogOpen] = useState(false);
  const [selectedEventDateId, setSelectedEventDateId] = useState<string | null>(
    null,
  );
  const [seatingData, setSeatingData] = useState({
    timeslot: '',
    availableVip: '10',
    availableStanding: '10',
    minimumSpendVip: '50',
    minimumSpendStanding: '50',
  });

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  useEffect(() => {
    if (selectedEvent?.id) {
      axios.get(`/api/events/${selectedEvent.id}/eventDates`).then((res) => {
        setEventDates(res.data);
      });
    }
  }, [selectedEvent?.id]);

  const handleCreateDate = async () => {
    const { data } = await axios.post(
      `/api/events/${selectedEvent?.id}/eventDates`,
      {
        date: newDate,
        dow: newDow,
      },
    );
    setCreateDateDialogOpen(false);
    setNewDate('');
    setNewDow('');
    setEventDates((prev) => (prev ? [...prev, data] : [data]));
  };

  const handleDuplicateDate = async () => {
    if (!selectedEventDateId) return;
    const { data } = await axios.post(
      `/api/eventDates/${selectedEventDateId}/duplicate`,
      {
        date: newDate,
        dow: newDow,
      },
    );
    setDuplicateDateDialogOpen(false);
    setNewDate('');
    setNewDow('');
    setEventDates((prev) => (prev ? [...prev, data] : [data]));
  };

  const handleDeleteDate = async () => {
    if (!selectedEventDateId) return;
    const { data }: { data: ApiDeleteEventDateResponse } = await axios.delete(
      `/api/eventDates/${selectedEventDateId}`,
    );
    setDeleteDateDialogOpen(false);
    setEventDates((prev) => (prev ? prev.filter((p) => p.id !== data.id) : []));
  };

  const handleCreateSeating = async () => {
    if (!selectedEventDateId) return;
    const { data }: { data: ApiPostSeatingResponse } = await axios.post(
      `/api/eventDates/${selectedEventDateId}/seatings`,
      {
        ...seatingData,
        minimumSpendVip: Number(seatingData.minimumSpendVip),
        minimumSpendStanding: Number(seatingData.minimumSpendStanding),
        availableVip: Number(seatingData.availableVip),
        availableStanding: Number(seatingData.availableStanding),
      },
    );
    setCreateSeatingDialogOpen(false);
    setSeatingData({
      timeslot: '',
      availableVip: '10',
      availableStanding: '10',
      minimumSpendVip: '50',
      minimumSpendStanding: '50',
    });

    setEventDates((prev) =>
      prev
        ? prev.map((p) =>
            p.id == data.eventDateId
              ? {
                  ...p,
                  seatings: [
                    ...p.seatings,
                    { ...data, externalTicketConfig: null },
                  ],
                }
              : p,
          )
        : undefined,
    );
  };

  const handleUpdateSeating = (data: Partial<Seating>) => {
    setEventDates((prev) =>
      prev
        ? prev.map((p) =>
            p.id == data.eventDateId
              ? {
                  ...p,
                  seatings: p.seatings.map((s) =>
                    s.id == data.id ? { ...s, ...data } : s,
                  ),
                }
              : p,
          )
        : undefined,
    );
  };

  const handleDeleteSeating = (eventDateId: string, seatingId: string) => {
    setEventDates((prev) =>
      prev
        ? prev.map((p) =>
            p.id == eventDateId
              ? { ...p, seatings: p.seatings.filter((s) => s.id !== seatingId) }
              : p,
          )
        : undefined,
    );
  };

  return (
    <Box className="max-w-5xl mx-auto px-4 py-16">
      <Typography variant="h4" gutterBottom>
        Seatings & Timeslots verwalten
      </Typography>

      <div className="my-7 flex items-center flex-col sm:flex-row justify-between gap-5">
        <EventSelector onChange={setSelectedEvent} />
        <button
          className="rounded-full bg-black text-white px-5 py-2 text-sm"
          onClick={() => setCreateDateDialogOpen(true)}
        >
          Event-Tag hinzufügen
        </button>
      </div>

      {eventDates &&
        eventDates
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((date) => (
            <Box
              key={date.id}
              className="mb-6 p-4 border border-gray-200 rounded-xl"
            >
              <div className="flex flex-col sm:flex-row justify-between">
                <Typography variant="h6" gutterBottom>
                  {date.dow}, {date.date}
                </Typography>
                <div className="flex gap-3 items-center justify-between">
                  <button
                    className="mb-4 rounded-full border px-3 py-1 text-sm flex items-center gap-1"
                    onClick={() => {
                      setSelectedEventDateId(date.id);
                      setDuplicateDateDialogOpen(true);
                    }}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                    <p>Tag duplizieren</p>
                  </button>
                  <button
                    className="mb-4 rounded-full border border-red-600 text-red-600 px-3 py-1 text-sm flex items-center gap-1"
                    onClick={() => {
                      setSelectedEventDateId(date.id);
                      setDeleteDateDialogOpen(true);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="inherit" />
                    <p>Löschen</p>
                  </button>
                </div>
              </div>
              {date.seatings
                .sort((a, b) => a.timeslot.localeCompare(b.timeslot))
                .map((seat) => (
                  <SeatingCard
                    key={seat.id}
                    seating={seat}
                    onDelete={() => handleDeleteSeating(date.id, seat.id)}
                    onUpdate={handleUpdateSeating}
                  />
                ))}
              <button
                className="mx-auto rounded-full border px-4 py-1 text-sm flex items-center gap-1"
                onClick={() => {
                  setSelectedEventDateId(date.id);
                  setCreateSeatingDialogOpen(true);
                }}
              >
                <AddIcon fontSize="inherit" />
                Seating hinzufügen
              </button>
            </Box>
          ))}

      <Dialog
        open={createDateDialogOpen}
        onClose={() => setCreateDateDialogOpen(false)}
      >
        <DialogTitle>Neuen Event-Tag hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Datum (DD.MM.YY)"
            fullWidth
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Wochentag (z.B. MO)"
            fullWidth
            value={newDow}
            onChange={(e) => setNewDow(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDateDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCreateDate} variant="contained">
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={duplicateDateDialogOpen}
        onClose={() => setDuplicateDateDialogOpen(false)}
      >
        <DialogTitle>Event-Tag duplizieren</DialogTitle>
        <DialogContent>
          <TextField
            label="Datum (DD.MM.YY)"
            fullWidth
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Wochentag (z.B. MO)"
            fullWidth
            value={newDow}
            onChange={(e) => setNewDow(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDateDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleDuplicateDate} variant="contained">
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={createSeatingDialogOpen}
        onClose={() => setCreateSeatingDialogOpen(false)}
      >
        <DialogTitle>Neues Seating hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Timeslot (z. B. 11:00 - 15:00)"
            fullWidth
            value={seatingData.timeslot}
            onChange={(e) =>
              setSeatingData({ ...seatingData, timeslot: e.target.value })
            }
            margin="normal"
          />
          <TextField
            label="Verfügbare Tische"
            type="number"
            fullWidth
            value={seatingData.availableVip}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                availableVip: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            label="Verfügbare Stehtische"
            type="number"
            fullWidth
            value={seatingData.availableStanding}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                availableStanding: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            label="Mindestverzehr VIP"
            type="number"
            fullWidth
            value={seatingData.minimumSpendVip}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                minimumSpendVip: e.target.value,
              })
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">pro Tisch</InputAdornment>
                ),
              },
            }}
            margin="normal"
          />
          <TextField
            label="Mindestverzehr Stehtisch"
            type="number"
            fullWidth
            value={seatingData.minimumSpendStanding}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                minimumSpendStanding: e.target.value,
              })
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">pro Tisch</InputAdornment>
                ),
              },
            }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSeatingDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCreateSeating} variant="contained">
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDateDialogOpen}
        title="Diesen Event Tag wirklich löschen?"
        description="Alle Seatings und Reservierungen für diesen Tag werden ebenfalls gelöscht."
        onCancel={() => setDeleteDateDialogOpen(false)}
        onConfirm={() => handleDeleteDate()}
      />
    </Box>
  );
}

function SeatingCard({
  seating,
  onDelete,
  onUpdate,
}: {
  seating: Seating;
  onDelete: () => void;
  onUpdate: (data: Partial<Seating>) => void;
}) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketDeleteOpen, setTicketDeleteOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [seatingData, setSeatingData] = useState({
    timeslot: seating.timeslot,
    availableVip: `${seating.availableVip}`,
    availableStanding: `${seating.availableStanding}`,
    minimumSpendVip: `${seating.minimumSpendVip}`,
    minimumSpendStanding: `${seating.minimumSpendStanding}`,
  });

  const [ticketData, setTicketData] = useState({
    name: seating.externalTicketConfig?.name ?? '',
    ticketPrice: seating.externalTicketConfig
      ? `${seating.externalTicketConfig.ticketPrice}`
      : '',
    required: seating.externalTicketConfig?.required ?? true,
    ticketPerPerson: seating.externalTicketConfig?.ticketPerPerson ?? true,
  });

  const hasTicket = !!seating.externalTicketConfig;

  const ticketAddOnText = useMemo(() => {
    if (!hasTicket) return null;
    const cfg = seating.externalTicketConfig!;
    const mode = cfg.ticketPerPerson ? 'pro Person' : 'pro Reservierung';
    const req = cfg.required ? 'Pflicht' : 'Optional';
    return `${cfg.ticketPrice} € • ${mode} • ${req}`;
  }, [hasTicket, seating.externalTicketConfig]);

  const handleUpdate = async () => {
    setError(null);
    try {
      const { data }: { data: ApiPutSeatingResponse } = await axios.put(
        `/api/seatings/${seating.id}`,
        {
          ...seatingData,
          availableVip: Number(seatingData.availableVip),
          minimumSpendVip: Number(seatingData.minimumSpendVip),
          minimumSpendStanding: Number(seatingData.minimumSpendStanding),
          availableStanding: Number(seatingData.availableStanding),
        },
      );
      setUpdateDialogOpen(false);
      onUpdate(data);
    } catch (e) {
      setError(
        isAxiosError(e)
          ? (e.response?.data?.error ?? e.message)
          : 'Unbekannter Fehler',
      );
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await axios.delete(`/api/seatings/${seating.id}`);
      onDelete();
    } catch (e) {
      setError(
        isAxiosError(e)
          ? (e.response?.data?.error ?? e.message)
          : 'Unbekannter Fehler',
      );
    }
  };

  // --- ExternalTicketConfig actions ---
  const handleUpsertTicket = async () => {
    setError(null);
    try {
      const payload = {
        name: ticketData.name.trim(),
        ticketPrice: Number(ticketData.ticketPrice),
        required: ticketData.required,
        ticketPerPerson: ticketData.ticketPerPerson,
      };

      // Empfehlung: upsert endpoint
      const { data }: { data: ApiPutExternalTicketConfigResponse } =
        await axios.put(
          `/api/seatings/${seating.id}/externalTicketConfig`,
          payload,
        );

      setTicketDialogOpen(false);

      // Sitzplatz neu in Parent-State updaten:
      onUpdate({
        ...seating,
        externalTicketConfig: data,
      });
    } catch (e) {
      setError(
        isAxiosError(e)
          ? (e.response?.data?.error ?? e.message)
          : 'Unbekannter Fehler',
      );
    }
  };

  const handleDeleteTicket = async () => {
    setError(null);
    try {
      await axios.delete(`/api/seatings/${seating.id}/externalTicketConfig`);
      setTicketDeleteOpen(false);

      onUpdate({
        ...seating,
        externalTicketConfig: null,
      });
    } catch (e) {
      setError(
        isAxiosError(e)
          ? (e.response?.data?.error ?? e.message)
          : 'Unbekannter Fehler',
      );
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {seating.timeslot}
              </Typography>

              <Chip size="small" label={`${seating.availableVip} Tische`} />
              <Chip
                size="small"
                label={`${seating.availableStanding} Stehtische`}
              />

              {hasTicket ? (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<ConfirmationNumberOutlined />}
                  label="Externes Ticket"
                />
              ) : null}
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mt: 0.5 }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Getränkeguthaben VIP
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 650 }}>
                  {seating.minimumSpendVip} €{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    / Tisch
                  </Typography>
                </Typography>
              </Box>

              <Divider
                flexItem
                orientation="vertical"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Getränkeguthaben Stehtisch
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 650 }}>
                  {seating.minimumSpendStanding} €{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    / Tisch
                  </Typography>
                </Typography>
              </Box>
            </Stack>

            <Collapse in={!!error}>
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {error}
              </Alert>
            </Collapse>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Bearbeiten">
              <IconButton
                size="small"
                onClick={() => setUpdateDialogOpen(true)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Löschen">
              <IconButton
                size="small"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* External ticket block */}
        <Divider sx={{ my: 2 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 0.25 }}
            >
              <ConfirmationNumberOutlined fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Externe Veranstaltung
              </Typography>
            </Stack>

            {hasTicket ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  {seating.externalTicketConfig!.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ticketAddOnText}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Kein Ticket konfiguriert.
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={hasTicket ? 'outlined' : 'contained'}
              startIcon={hasTicket ? <EditIcon /> : <AddIcon />}
              onClick={() => {
                setTicketData({
                  name: seating.externalTicketConfig?.name ?? '',
                  ticketPrice: seating.externalTicketConfig
                    ? `${seating.externalTicketConfig.ticketPrice}`
                    : '',
                  required: seating.externalTicketConfig?.required ?? true,
                  ticketPerPerson:
                    seating.externalTicketConfig?.ticketPerPerson ?? true,
                });
                setTicketDialogOpen(true);
              }}
            >
              {hasTicket ? 'Ticket bearbeiten' : 'Ticket hinzufügen'}
            </Button>

            {hasTicket ? (
              <Button
                size="small"
                color="error"
                variant="text"
                onClick={() => setTicketDeleteOpen(true)}
              >
                Entfernen
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>

      {/* Seating edit dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>Seating bearbeiten</DialogTitle>
        <DialogContent>
          <TextField
            label="Timeslot (z. B. 11:00 - 15:00)"
            fullWidth
            value={seatingData.timeslot}
            onChange={(e) =>
              setSeatingData({ ...seatingData, timeslot: e.target.value })
            }
            margin="normal"
          />
          <TextField
            label="Verfügbare Tische"
            type="number"
            fullWidth
            value={seatingData.availableVip}
            onChange={(e) =>
              setSeatingData({ ...seatingData, availableVip: e.target.value })
            }
            margin="normal"
          />
          <TextField
            label="Verfügbare Stehtische"
            type="number"
            fullWidth
            value={seatingData.availableStanding}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                availableStanding: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            label="Getränkeguthaben VIP"
            type="number"
            fullWidth
            value={seatingData.minimumSpendVip}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                minimumSpendVip: e.target.value,
              })
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">pro Tisch</InputAdornment>
                ),
              },
            }}
            margin="normal"
          />
          <TextField
            label="Getränkeguthaben Stehtisch"
            type="number"
            fullWidth
            value={seatingData.minimumSpendStanding}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                minimumSpendStanding: e.target.value,
              })
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">pro Tisch</InputAdornment>
                ),
              },
            }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleUpdate} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket config dialog */}
      <Dialog
        open={ticketDialogOpen}
        onClose={() => setTicketDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>Externes Ticket konfigurieren</DialogTitle>
        <DialogContent>
          <TextField
            label="Name (z. B. Konzertticket)"
            fullWidth
            value={ticketData.name}
            onChange={(e) =>
              setTicketData({ ...ticketData, name: e.target.value })
            }
            margin="normal"
          />

          <TextField
            label="Ticketpreis"
            type="number"
            fullWidth
            value={ticketData.ticketPrice}
            onChange={(e) =>
              setTicketData({ ...ticketData, ticketPrice: e.target.value })
            }
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">€</InputAdornment>,
              },
            }}
            margin="normal"
          />

          <Button
            size="small"
            variant={ticketData.required ? 'contained' : 'outlined'}
            color="info"
            onClick={() =>
              setTicketData({ ...ticketData, required: !ticketData.required })
            }
          >
            {ticketData.required ? 'Pflicht' : 'Optional'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTicketDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleUpsertTicket}
            variant="contained"
            disabled={!ticketData.name.trim() || !ticketData.ticketPrice}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialogs (deine existierenden) */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Dieses Seating wirklich löschen?"
        description="Alle Reservierungen für diesen Tag werden ebenfalls gelöscht."
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => handleDelete()}
      />

      <ConfirmDialog
        open={ticketDeleteOpen}
        title="Externes Ticket entfernen?"
        description="Die Ticket-Konfiguration wird entfernt. Bestehende Reservierungen bleiben unverändert."
        onCancel={() => setTicketDeleteOpen(false)}
        onConfirm={() => handleDeleteTicket()}
      />
    </Card>
  );
}
