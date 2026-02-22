import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ApiGetReservationResponse } from '../api/reservations/[reservationId]';

export default function ReservationSuccessPage() {
  const router = useRouter();
  const rid = useMemo(
    () => (typeof router.query.rid === 'string' ? router.query.rid : ''),
    [router.query.rid],
  );

  const [reservation, setReservation] =
    useState<ApiGetReservationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchReservation(id: string) {
    const r = await fetch(`/api/reservations/${id}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Failed to load reservation');
    return data.reservation as ApiGetReservationResponse;
  }

  useEffect(() => {
    if (!rid) return;

    let cancelled = false;
    let pollTimer: any = null;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const first = await fetchReservation(rid);
        if (cancelled) return;
        setReservation(first);
        setLoading(false);

        // Wenn nicht direkt PAID: kurz pollen (Webhook kann verzögert sein)
        if (first.paymentStatus !== 'PAID') {
          setPolling(true);

          const startedAt = Date.now();
          const maxMs = 25_000; // 25s
          const intervalMs = 2500;

          const poll = async () => {
            try {
              const next = await fetchReservation(rid);
              if (cancelled) return;
              setReservation(next);

              if (next.paymentStatus === 'PAID') {
                setPolling(false);
                return;
              }

              if (Date.now() - startedAt > maxMs) {
                setPolling(false);
                return;
              }

              pollTimer = setTimeout(poll, intervalMs);
            } catch (e: any) {
              if (cancelled) return;
              setPolling(false);
              setError(e.message || 'Polling failed');
            }
          };

          pollTimer = setTimeout(poll, intervalMs);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || 'Something went wrong');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [rid]);

  return (
    <main
      style={{
        maxWidth: 820,
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'system-ui',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Reservierung</h1>

      {loading && <p>Wird geladen…</p>}
      {error && (
        <div
          style={{
            padding: 14,
            border: '1px solid #f2c2c2',
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {!loading && reservation && (
        <>
          {reservation.paymentStatus === 'PAID' ? (
            <div
              style={{
                padding: 16,
                border: '1px solid #d9f2df',
                borderRadius: 12,
                marginTop: 16,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                ✅ Zahlung erfolgreich
              </div>
              <div style={{ marginTop: 6, opacity: 0.9 }}>
                Deine Reservierung ist jetzt verbindlich. Reservierungs-ID:{' '}
                <strong>{reservation.id}</strong>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: 16,
                border: '1px solid #e9e9e9',
                borderRadius: 12,
                marginTop: 16,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                ⏳ Zahlung wird geprüft
              </div>
              <div style={{ marginTop: 6, opacity: 0.9 }}>
                {polling
                  ? 'Wir warten noch kurz auf die Zahlungsbestätigung'
                  : 'Wenn du gerade bezahlt hast, kann es einen Moment dauern, bis die Bestätigung ankommt.'}
              </div>
            </div>
          )}

          <section
            style={{
              marginTop: 22,
              padding: 16,
              border: '1px solid #e9e9e9',
              borderRadius: 12,
            }}
          >
            <h2 style={{ fontSize: 18, margin: 0, marginBottom: 12 }}>
              Details
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <Row
                label="Seating"
                value={`${reservation.seating.eventDate.date} - ${
                  reservation.seating.timeslot
                }`}
              />
              <Row
                label="Typ"
                value={reservation.type === 'VIP' ? 'Tisch' : 'Stehtisch'}
              />
              <Row label="Personen" value={String(reservation.people)} />
              <Row
                label="Tische (à 10)"
                value={String(reservation.tableCount)}
              />
              <Row
                label="Mindestverzehr"
                value={`${reservation.minimumSpend} €`}
              />
              <Row
                label="Status"
                value={
                  reservation.paymentStatus === 'PAID'
                    ? 'Bezahlt'
                    : reservation.paymentStatus === 'PENDING_PAYMENT'
                      ? 'Offen'
                      : reservation.paymentStatus
                }
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                gap: 10,
              }}
            >
              <Link href="/" style={btnStyle('primary')}>
                Zur Startseite
              </Link>
            </div>
          </section>

          {reservation.paymentStatus !== 'PAID' && (
            <section
              style={{
                marginTop: 18,
                padding: 16,
                border: '1px solid #ffe7b3',
                borderRadius: 12,
              }}
            >
              <strong>Hinweis:</strong> Falls du die Zahlung abgeschlossen hast,
              aber der Status nicht auf „Bezahlt“ springt, öffne diese Seite in
              1-2 Minuten erneut oder melde dich kurz beim Support.
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function btnStyle(variant: 'primary' | 'ghost') {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 700,
  };
  if (variant === 'primary')
    return {
      ...base,
      border: '1px solid #111',
      background: '#111',
      color: '#fff',
    };
  return {
    ...base,
    border: '1px solid #e6e6e6',
    background: '#fff',
    color: '#111',
  };
}
