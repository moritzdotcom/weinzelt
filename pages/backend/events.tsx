import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Skeleton,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Session } from '@/hooks/useSession';

interface EventDate {
  date: string;
}

interface Event {
  id: string;
  name: string;
  current: boolean;
  createdAt: string;
  eventDates: EventDate[];
}

export default function BackendEventsPage({ session }: { session: Session }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEvents = async () => {
    const res = await axios.get('/api/events');
    const sorted = res.data.sort(
      (a: Event, b: Event) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setLoading(false);
    setEvents(sorted);
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, []);

  const handleActivate = async () => {
    if (!selectedEvent) return;
    await axios.post(`/api/events/${selectedEvent.id}/activate`);
    setConfirmDialogOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleDeactivate = async (eventId: string) => {
    await axios.post(`/api/events/${eventId}/deactivate`);
    fetchEvents();
  };

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
          Veranstaltungen verwalten
        </Typography>
        <button
          className="rounded-full bg-black text-white px-6 py-2 text-sm font-medium shadow-sm hover:bg-gray-800 transition"
          onClick={() => setCreateDialogOpen(true)}
        >
          Neue Veranstaltung erstellen
        </button>
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
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onActivate={() => {
              setSelectedEvent(event);
              setConfirmDialogOpen(true);
            }}
            onDeactivate={() => handleDeactivate(event.id)}
          />
        ))}
      </Grid>

      <NewEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchEvents}
      />

      {/* Dialog: Live schalten */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Veranstaltung live schalten</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du <strong>{selectedEvent?.name}</strong> für die
            Tischreservierung freischalten?
          </Typography>
          <Typography className="mt-2 text-sm text-gray-500">
            Das aktuell aktive Event wird dabei deaktiviert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <button
            className="px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100"
            onClick={() => setConfirmDialogOpen(false)}
          >
            Abbrechen
          </button>
          <button
            className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900"
            onClick={handleActivate}
          >
            Bestätigen
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EventCard({
  event,
  onActivate,
  onDeactivate,
}: {
  event: Event;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const start = event.eventDates.sort((a, b) => a.date.localeCompare(b.date))[0]
    ?.date;
  const end = event.eventDates.sort((a, b) => b.date.localeCompare(a.date))[0]
    ?.date;
  return (
    <Grid size={{ xs: 12, sm: 6 }} key={event.id}>
      <Box className="rounded-2xl border border-gray-200 p-6 shadow-sm">
        <Box className="flex justify-between items-center mb-2">
          <Typography variant="h6" className="font-semibold">
            {event.name}
          </Typography>
          {event.current && <Chip label="LIVE" color="success" />}
        </Box>
        <Typography className="text-sm text-gray-500 mb-2">
          Zeitraum: {start} - {end || start}
        </Typography>
        <div className="flex flex-wrap gap-2 mt-4">
          {!event.current && (
            <button
              onClick={onActivate}
              className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              Live schalten
            </button>
          )}
          {event.current && (
            <button
              onClick={onDeactivate}
              className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              Event deaktivieren
            </button>
          )}
          <Link href={`/backend/seatings?eventId=${event.id}`} passHref>
            <button className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition">
              Event bearbeiten
            </button>
          </Link>
        </div>
      </Box>
    </Grid>
  );
}

function NewEventDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newEventName, setNewEventName] = useState('');

  const handleCreate = async () => {
    await axios.post('/api/events', { name: newEventName });
    setNewEventName('');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neue Veranstaltung erstellen</DialogTitle>
      <DialogContent>
        <TextField
          label="Veranstaltungsname"
          fullWidth
          value={newEventName}
          onChange={(e) => setNewEventName(e.target.value)}
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
          disabled={!newEventName.trim()}
        >
          Erstellen
        </button>
      </DialogActions>
    </Dialog>
  );
}
