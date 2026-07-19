import { useEffect, useState } from 'react';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calculateTimeLeft(targetDate: string): TimeLeft {
  const difference = new Date(targetDate).getTime() - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate),
  );

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  const units = [
    {
      value: timeLeft.days,
      singular: 'Tag',
      plural: 'Tage',
    },
    {
      value: timeLeft.hours,
      singular: 'Stunde',
      plural: 'Stunden',
    },
    {
      value: timeLeft.minutes,
      singular: 'Minute',
      plural: 'Minuten',
    },
    {
      value: timeLeft.seconds,
      singular: 'Sekunde',
      plural: 'Sekunden',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {units.map(({ value, singular, plural }) => (
        <div
          key={singular}
          className="min-w-28 rounded-2xl border border-black/5 bg-white px-5 py-4 text-black shadow-lg"
        >
          <div className="text-3xl font-bold tabular-nums sm:text-4xl">
            {value.toString().padStart(2, '0')}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {value === 1 ? singular : plural}
          </div>
        </div>
      ))}
    </div>
  );
}
