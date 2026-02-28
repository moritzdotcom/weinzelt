import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ApiGetReservationResponse } from '../api/reservations/[reservationId]';

export default function ReservationCancelPage() {
  const router = useRouter();
  const rid = useMemo(
    () => (typeof router.query.rid === 'string' ? router.query.rid : ''),
    [router.query.rid],
  );

  const [reservation, setReservation] =
    useState<ApiGetReservationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReservation(id: string) {
    const r = await fetch(`/api/reservations/${id}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Failed to load reservation');
    return data.reservation as ApiGetReservationResponse;
  }

  async function cancelReservation(id: string) {
    const r = await fetch(`/api/reservations/${id}/cancelPayment`, {
      method: 'POST',
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Failed to cancel reservation');
    return data.reservation as ApiGetReservationResponse;
  }

  async function retryPay(id: string) {
    const r = await fetch(`/api/stripe/checkoutExisting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Failed to start checkout');
    window.location.href = data.url;
  }

  useEffect(() => {
    if (!rid) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await loadReservation(rid);
        if (cancelled) return;
        setReservation(r);
        setLoading(false);

        // Wenn nicht bezahlt: markieren als canceled (optional)
        if (r.paymentStatus !== 'PAID' && r.paymentStatus !== 'CANCELED') {
          try {
            const updated = await cancelReservation(rid);
            if (cancelled) return;
            setReservation((prev) =>
              prev ? { ...prev, paymentStatus: updated.paymentStatus } : prev,
            );
          } catch (e: any) {
            // nicht hart failen, UI trotzdem anzeigen
            console.warn(e);
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || 'Something went wrong');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
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
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Zahlung abgebrochen</h1>

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

      {!loading && (
        <div
          style={{
            padding: 16,
            border: '1px solid #e9e9e9',
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            ❌ Keine Zahlung durchgeführt
          </div>
          <div style={{ marginTop: 6, opacity: 0.9 }}>
            Deine Reservierung ist erst nach erfolgreicher Zahlung verbindlich.
          </div>

          {reservation && (
            <div style={{ marginTop: 14, opacity: 0.95 }}>
              <div>
                Reservierungs-ID: <strong>{reservation.id}</strong>
              </div>
              <div>
                Seating:{' '}
                <strong>{`${reservation.seating.eventDate.date} - ${
                  reservation.seating.timeslot
                }`}</strong>
              </div>
              <div>
                Summe:{' '}
                <strong>
                  {reservation.minimumSpend +
                    reservation.externalTicketPrice +
                    5.9}{' '}
                  €
                </strong>{' '}
                · {reservation.people} Personen ·{' '}
                {reservation.type === 'VIP' ? 'VIP' : 'Standing'}
              </div>
              <div>
                Status: <strong>{reservation.paymentStatus}</strong>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            {reservation && reservation.paymentStatus !== 'PAID' && (
              <button
                onClick={async () => {
                  if (!reservation) return;
                  try {
                    setBusy(true);
                    await retryPay(reservation.id);
                  } catch (e: any) {
                    setError(e.message || 'Retry failed');
                    setBusy(false);
                  }
                }}
                disabled={busy}
                style={btn}
              >
                {busy ? 'Weiterleiten…' : 'Erneut bezahlen'}
              </button>
            )}

            <Link href="/" style={linkBtn}>
              Zur Startseite
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #111',
  background: '#111',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const linkBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #e6e6e6',
  background: '#fff',
  color: '#111',
  fontWeight: 800,
  textDecoration: 'none',
};
