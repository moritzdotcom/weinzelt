import { useEffect, useState } from 'react';
import axios from 'axios';
import { BackendKpisResponse } from '@/pages/api/backend/kpis';

export default function BackendKpiSection() {
  const [data, setData] = useState<BackendKpisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadKpis() {
      try {
        setLoading(true);

        const res = await axios.get<BackendKpisResponse>('/api/backend/kpis');

        if (!cancelled) {
          setData(res.data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadKpis();

    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = [
    {
      label: 'Auslastung',
      value: data?.occupancyRate ?? 0,
      hint: 'Reservierte Plätze über alle aktiven Seatings',
      format: 'percent' as const,
    },
    {
      label: 'Bestätigte Gäste',
      value: data?.confirmedGuests ?? 0,
      hint: 'Personen aus bezahlten Reservierungen',
      format: 'number' as const,
    },
    {
      label: 'Reservierter Mindestverzehr',
      value: data?.reservedMinimumSpend ?? 0,
      hint: 'Erwarteter Umsatz aus gebuchten Paketen',
      format: 'currency' as const,
    },
    {
      label: 'Manuelle Rechnungen',
      value: data?.manualInvoicesOpen ?? 0,
      hint: 'Offen für Firmen & Friends-and-Family',
      format: 'number' as const,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          hint={kpi.hint}
          format={kpi.format}
          loading={loading}
        />
      ))}
    </section>
  );
}

function useCountUp(
  target: number,
  options?: {
    duration?: number;
    enabled?: boolean;
  },
) {
  const { duration = 700, enabled = true } = options ?? {};
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let frameId: number;
    const startTime = performance.now();
    const startValue = 0;
    const difference = target - startValue;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out, damit es hochwertiger wirkt
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setValue(startValue + difference * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration, enabled]);

  return value;
}

type KpiFormat = 'number' | 'percent' | 'currency';

function formatKpiValue(value: number, format: KpiFormat) {
  if (format === 'percent') {
    return `${Math.round(value)} %`;
  }

  if (format === 'currency') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 0,
  }).format(value);
}

function KpiCard({
  label,
  value,
  hint,
  loading,
  format = 'number',
}: {
  label: string;
  value: number;
  hint: string;
  loading?: boolean;
  format?: KpiFormat;
}) {
  const animatedValue = useCountUp(value, {
    duration: 750,
    enabled: !loading,
  });

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-gray-500">{label}</p>

      {loading ? (
        <div className="mt-3 space-y-3">
          <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 tabular-nums">
            {formatKpiValue(animatedValue, format)}
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-400">{hint}</p>

          {format === 'percent' && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-700"
                style={{ width: `${Math.min(Math.round(value), 100)}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
