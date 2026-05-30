import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, CircularProgress } from '@mui/material';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import { SpecialEventCard } from '../specialEventCard';
import { SpecialEventRegistrationDialog } from '../specialEventRegistrationDialog';

export default function SpecialEventsSection() {
  const [events, setEvents] = useState<PublicSpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PublicSpecialEvent | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setError(false);

      const { data } =
        await axios.get<PublicSpecialEvent[]>('/api/specialEvents');

      setEvents(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  if (!loading && !error && events.length === 0) {
    return null;
  }

  return (
    <section id="wine-events" className="bg-stone-100 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            WineEvents 2026
          </p>

          <h2 className="text-4xl font-cocogoose text-black sm:text-5xl">
            Mehr als nur ein Glas Wein.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-gray-700">
            Entdecke unsere WineWalks, Tastings und besonderen Erlebnisse rund
            um das Weinzelt. Sichere dir frühzeitig deinen Platz - einige Events
            sind bewusst limitiert.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <CircularProgress />
          </div>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 6 }}>
            Die WineEvents konnten gerade nicht geladen werden.
          </Alert>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <SpecialEventCard
                key={event.id}
                event={event}
                onRegister={setSelectedEvent}
              />
            ))}
          </div>
        )}
      </div>

      <SpecialEventRegistrationDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        onRegistered={() => {
          void loadEvents();
        }}
      />
    </section>
  );
}
