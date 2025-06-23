import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Button,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import { packages } from '@/lib/packages';
import { ApiGetEventDatesResponse } from '../api/events/[eventId]/eventDates';
import { ApiPostSeatingResponse } from '../api/eventDates/[eventDateId]/seatings';
import { Seating } from '@prisma/client';
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

export default function BackendSeatingsPage({ session }: { session: Session }) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [eventDates, setEventDates] = useState<ApiGetEventDatesResponse>();
  const [newDate, setNewDate] = useState('');
  const [newDow, setNewDow] = useState('');
  const [createDateDialogOpen, setCreateDateDialogOpen] = useState(false);
  const [duplicateDateDialogOpen, setDuplicateDateDialogOpen] = useState(false);
  const [deleteDateDialogOpen, setDeleteDateDialogOpen] = useState(false);
  const [createSeatingDialogOpen, setCreateSeatingDialogOpen] = useState(false);
  const [selectedEventDateId, setSelectedEventDateId] = useState<string | null>(
    null
  );
  const [seatingData, setSeatingData] = useState({
    timeslot: '',
    availableVip: '10',
    availableStanding: '10',
    foodRequired: false,
    minimumSpend: '800',
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
      }
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
      }
    );
    setDuplicateDateDialogOpen(false);
    setNewDate('');
    setNewDow('');
    setEventDates((prev) => (prev ? [...prev, data] : [data]));
  };

  const handleDeleteDate = async () => {
    if (!selectedEventDateId) return;
    const { data }: { data: ApiDeleteEventDateResponse } = await axios.delete(
      `/api/eventDates/${selectedEventDateId}/duplicate`
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
        minimumSpend: Number(seatingData.minimumSpend),
        minimumSpendVip: Number(seatingData.minimumSpendVip),
        minimumSpendStanding: Number(seatingData.minimumSpendStanding),
        availableVip: Number(seatingData.availableVip),
        availableStanding: Number(seatingData.availableStanding),
      }
    );
    setCreateSeatingDialogOpen(false);
    setSeatingData({
      timeslot: '',
      availableVip: '10',
      availableStanding: '10',
      foodRequired: false,
      minimumSpend: '800',
      minimumSpendVip: '50',
      minimumSpendStanding: '50',
    });

    setEventDates((prev) =>
      prev
        ? prev.map((p) =>
            p.id == data.eventDateId
              ? { ...p, seatings: [...p.seatings, data] }
              : p
          )
        : undefined
    );
  };

  const handleUpdateSeating = (data: ApiPutSeatingResponse) => {
    setEventDates((prev) =>
      prev
        ? prev.map((p) =>
            p.id == data.eventDateId
              ? {
                  ...p,
                  seatings: p.seatings.map((s) => (s.id == data.id ? data : s)),
                }
              : p
          )
        : undefined
    );
  };

  const handleDeleteSeating = (eventDateId: string, seatingId: string) => {
    setEventDates((prev) =>
      prev
        ? prev.map((p) =>
            p.id == eventDateId
              ? { ...p, seatings: p.seatings.filter((s) => s.id !== seatingId) }
              : p
          )
        : undefined
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
          {/* <TextField
            label="Reservierungs Schwelle"
            type="number"
            fullWidth
            value={seatingData.minimumSpend}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                minimumSpend: e.target.value,
              })
            }
            margin="normal"
          /> */}
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
                  <InputAdornment position="end">p.P.</InputAdornment>
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
                  <InputAdornment position="end">p.P.</InputAdornment>
                ),
              },
            }}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={seatingData.foodRequired}
                onChange={(e) =>
                  setSeatingData({
                    ...seatingData,
                    foodRequired: e.target.checked,
                  })
                }
              />
            }
            label="Essen verpflichtend"
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
  onUpdate: (data: ApiPutSeatingResponse) => void;
}) {
  const [selectedPackages, setSelectedPackages] = useState(
    seating.availablePackageIds
  );
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seatingData, setSeatingData] = useState({
    timeslot: seating.timeslot,
    availableVip: `${seating.availableVip}`,
    availableStanding: `${seating.availableStanding}`,
    minimumSpend: `${seating.minimumSpend}`,
    foodRequired: seating.foodRequired,
    minimumSpendVip: `${seating.minimumSpendVip}`,
    minimumSpendStanding: `${seating.minimumSpendStanding}`,
  });

  const togglePackage = async (packageId: number) => {
    const newSelection = selectedPackages.includes(packageId)
      ? selectedPackages.filter((id) => id !== packageId)
      : [...selectedPackages, packageId];

    await axios.put(`/api/seatings/${seating.id}`, {
      availablePackageIds: newSelection,
    });

    setSelectedPackages(newSelection);
  };

  const handleUpdate = async () => {
    const { data }: { data: ApiPutSeatingResponse } = await axios.put(
      `/api/seatings/${seating.id}`,
      {
        ...seatingData,
        availableVip: Number(seatingData.availableVip),
        minimumSpend: Number(seatingData.minimumSpend),
        minimumSpendVip: Number(seatingData.minimumSpendVip),
        minimumSpendStanding: Number(seatingData.minimumSpendStanding),
        availableStanding: Number(seatingData.availableStanding),
      }
    );
    setUpdateDialogOpen(false);
    onUpdate(data);
  };

  const handleDelete = async () => {
    await axios.delete(`/api/seatings/${seating.id}`);
    onDelete();
  };

  return (
    <Box className="mb-4 p-3 border rounded-md bg-gray-50">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col md:flex-row font-semibold text-lg">
          <p>
            Timeslot: {seating.timeslot}
            <span className="hidden md:inline mr-1">,</span>
          </p>
          <p>
            Tische: {seating.availableVip}
            <span className="hidden md:inline mr-1">,</span>
          </p>
          <p>
            Stehtische: {seating.availableStanding}
            <span className="hidden md:inline mr-1">,</span>
          </p>
          <p>
            MVZ VIP: {seating.minimumSpendVip} €
            <span className="hidden md:inline mr-1">,</span>
          </p>
          <p>
            MVZ Stehtisch: {seating.minimumSpendStanding} €
            <span className="hidden md:inline mr-1">,</span>
          </p>
          <p>Essen: {seating.foodRequired ? 'Ja' : 'Nein'}</p>
        </div>
        <div className="flex gap-3">
          <Tooltip title="Bearbeiten">
            <button
              className="rounded border border-sky-600 text-sky-600 w-6 h-6 text-sm flex items-center justify-center"
              onClick={() => setUpdateDialogOpen(true)}
            >
              <EditIcon fontSize="inherit" />
            </button>
          </Tooltip>
          <Tooltip title="Löschen">
            <button
              className="rounded border border-red-600 text-red-600 w-6 h-6 text-sm flex items-center justify-center"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <DeleteOutlineIcon fontSize="inherit" />
            </button>
          </Tooltip>
        </div>
      </div>
      <Box className="flex flex-col sm:flex-row gap-2 mt-2 flex-wrap">
        {packages
          .sort((a, b) => a.sortId - b.sortId)
          .map((pkg) => {
            const isAssigned = selectedPackages.includes(pkg.id);
            return (
              <button
                key={pkg.name}
                onClick={() => togglePackage(pkg.id)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  isAssigned ? 'bg-black text-white' : 'bg-white text-gray-700'
                }`}
              >
                <Tooltip title={pkg.description}>
                  <p>{pkg.name}</p>
                </Tooltip>
              </button>
            );
          })}
      </Box>
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
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
          {/* <TextField
            label="Reservierungs Schwelle"
            type="number"
            fullWidth
            value={seatingData.minimumSpend}
            onChange={(e) =>
              setSeatingData({
                ...seatingData,
                minimumSpend: e.target.value,
              })
            }
            margin="normal"
          /> */}
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
                  <InputAdornment position="end">p.P.</InputAdornment>
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
                  <InputAdornment position="end">p.P.</InputAdornment>
                ),
              },
            }}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={seatingData.foodRequired}
                onChange={(e) =>
                  setSeatingData({
                    ...seatingData,
                    foodRequired: e.target.checked,
                  })
                }
              />
            }
            label="Essen verpflichtend"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleUpdate} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Dieses Seating wirklich löschen?"
        description="Alle Reservierungen für diesen Tag werden ebenfalls gelöscht."
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => handleDelete()}
      />
    </Box>
  );
}
