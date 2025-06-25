import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  MenuItem,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Session } from '@/hooks/useSession';
import { ApiGetSpecialEventsResponse } from '../../api/specialEvents';
import { ApiGetEventsResponse } from '../../api/events';
import EventSelector from '@/components/eventSelector';
import Link from 'next/link';
import { compareEventDates } from '@/lib/eventDates';
import CopyButton from '@/components/copyButton';

type SpecialEvent = ApiGetSpecialEventsResponse[number];

export default function BackendSpecialEventsPage({
  session,
}: {
  session: Session;
}) {
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [specialEvents, setSpecialEvents] =
    useState<ApiGetSpecialEventsResponse>([]);
  const [selectedSpecialEvent, setSelectedSpecialEvent] =
    useState<ApiGetSpecialEventsResponse[number]>();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchSpecialEvents = async () => {
    const res = await axios.get('/api/specialEvents', {
      params: { eventId: selectedEvent?.id },
    });
    const sorted = res.data.sort((a: SpecialEvent, b: SpecialEvent) =>
      compareEventDates(a.eventDate.date, b.eventDate.date)
    );
    setLoading(false);
    setSpecialEvents(sorted);
  };

  useEffect(() => {
    if (!selectedEvent?.id) return;
    setLoading(true);
    fetchSpecialEvents();
  }, [selectedEvent]);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-16">
      <Box className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
        <Typography variant="h4" className="text-center">
          SpecialEvents verwalten
        </Typography>

        <div className="my-7 flex items-center flex-col sm:flex-row justify-between gap-5">
          <EventSelector onChange={setSelectedEvent} />
          <button
            className="rounded-full bg-black text-white px-6 py-2 text-sm font-medium shadow-sm hover:bg-gray-800 transition"
            onClick={() => setCreateDialogOpen(true)}
          >
            Neues Event erstellen
          </button>
        </div>
      </Box>
      {loading && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      )}
      <Grid container spacing={4}>
        {specialEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onSelect={() => setSelectedSpecialEvent(event)}
          />
        ))}
      </Grid>

      <NewEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchSpecialEvents}
        eventDates={selectedEvent?.eventDates}
      />

      <EditEventDialog
        open={Boolean(selectedSpecialEvent)}
        specialEvent={selectedSpecialEvent}
        onClose={() => setSelectedSpecialEvent(undefined)}
        onSuccess={fetchSpecialEvents}
        eventDates={selectedEvent?.eventDates}
      />
    </Box>
  );
}

function EventCard({
  event,
  onSelect,
}: {
  event: SpecialEvent;
  onSelect: () => void;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box className="rounded-2xl border border-gray-200 p-6 shadow-sm">
        <Box className="flex justify-between items-center mb-2">
          <Typography variant="h6" className="font-semibold">
            {event.name}
          </Typography>
          <Chip label={event._count.registrations} color="error" />
        </Box>
        <Typography className="text-sm text-gray-500 mb-2">
          {event.eventDate.date}: {event.startTime} - {event.endTime}
        </Typography>
        <Typography className="text-sm text-gray-500 mb-4">
          {event.description}
        </Typography>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={onSelect}
            className="px-4 py-2 w-full rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Event bearbeiten
          </button>
        </div>
        <CopyButton data={event.id} label="ID kopieren" />
        <CopyButton
          data={`https://www.dasweinzelt.de/events/${event.id}`}
          label="Link kopieren"
        />
        <Link
          href={`/backend/specialEvents/${event.id}`}
          className="w-full mt-3 py-2 rounded text-sky-600 transition flex items-center justify-center gap-2 border border-sky-600 text-sm hover:bg-sky-100"
        >
          Teilnehmer einsehen
        </Link>
      </Box>
    </Grid>
  );
}

function NewEventDialog({
  open,
  eventDates,
  onClose,
  onSuccess,
}: {
  open: boolean;
  eventDates: ApiGetEventsResponse[number]['eventDates'] | undefined;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventDateId, setEventDateId] = useState('');

  const handleCreate = async () => {
    await axios.post('/api/specialEvents', {
      name,
      description,
      startTime,
      endTime,
      eventDateId,
    });
    setName('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neues SpecialEvent erstellen</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <TextField
          select
          label="Tag wählen"
          fullWidth
          value={eventDateId || ''}
          onChange={(e) => setEventDateId(e.target.value)}
          margin="normal"
        >
          {eventDates?.map((date) => (
            <MenuItem key={date.id} value={date.id}>
              {date.dow}, {date.date}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Startzeit"
          type="time"
          fullWidth
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Endzeit"
          type="time"
          fullWidth
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Beschreibung"
          multiline
          rows={3}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <button
          className="px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100"
          onClick={onClose}
        >
          Abbrechen
        </button>
        <button
          className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          onClick={handleCreate}
          disabled={!name.trim() || !startTime || !endTime}
        >
          Erstellen
        </button>
      </DialogActions>
    </Dialog>
  );
}

function EditEventDialog({
  open,
  specialEvent,
  eventDates,
  onClose,
  onSuccess,
}: {
  open: boolean;
  specialEvent: SpecialEvent | undefined;
  eventDates: ApiGetEventsResponse[number]['eventDates'] | undefined;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventDateId, setEventDateId] = useState('');

  const handleUpdate = async () => {
    await axios.put(`/api/specialEvents/${specialEvent?.id}`, {
      name,
      description,
      startTime,
      endTime,
      eventDateId,
    });
    setName('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    onSuccess();
    onClose();
  };

  useEffect(() => {
    if (!specialEvent) return;
    setName(specialEvent.name);
    setDescription(specialEvent.description);
    setStartTime(specialEvent.startTime);
    setEndTime(specialEvent.endTime);
    setEventDateId(specialEvent.eventDateId);
  }, [specialEvent]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neues SpecialEvent erstellen</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <TextField
          select
          label="Tag wählen"
          fullWidth
          value={eventDateId || ''}
          onChange={(e) => setEventDateId(e.target.value)}
          margin="normal"
        >
          {eventDates?.map((date) => (
            <MenuItem key={date.id} value={date.id}>
              {date.dow}, {date.date}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Startzeit"
          type="time"
          fullWidth
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Endzeit"
          type="time"
          fullWidth
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Beschreibung"
          multiline
          rows={3}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <button
          className="px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100"
          onClick={onClose}
        >
          Abbrechen
        </button>
        <button
          className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          onClick={handleUpdate}
        >
          Speichern
        </button>
      </DialogActions>
    </Dialog>
  );
}
