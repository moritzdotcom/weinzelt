import { ApiGetEventsResponse } from '@/pages/api/events';
import { TextField, MenuItem } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function EventSelector({
  onChange,
}: {
  onChange: (event: ApiGetEventsResponse[number]) => void;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ApiGetEventsResponse>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    const event = events.find((e) => e.id == selectedEventId);
    if (event) onChange(event);
  }, [selectedEventId, events]);

  useEffect(() => {
    axios.get<ApiGetEventsResponse>('/api/events').then(({ data }) => {
      setEvents(data);
      const preselect = router.query.eventId as string;
      if (preselect) {
        setSelectedEventId(preselect);
      } else if (data.length == 1) {
        setSelectedEventId(data[0].id);
      }
    });
  }, [router.query.eventId]);

  return (
    <TextField
      select
      label="Veranstaltung wählen"
      fullWidth
      sx={{ maxWidth: 'var(--container-md)' }}
      value={selectedEventId || ''}
      onChange={(e) => setSelectedEventId(e.target.value)}
    >
      {events.map((event) => (
        <MenuItem key={event.id} value={event.id}>
          {event.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
