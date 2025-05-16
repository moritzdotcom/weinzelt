import { useEffect, useState } from 'react';

export default function Countdown({ targetDate }: { targetDate: string }) {
  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = new Date(targetDate).getTime() - now.getTime();

    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const formatUnit = (value: number, singular: string, plural: string) =>
    value === 1 ? singular : plural;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
        <div className="text-4xl font-bold">
          {timeLeft.days.toString().padStart(2, '0')}
        </div>
        <div className="text-sm font-semibold mt-1">
          {formatUnit(timeLeft.days, 'Tag', 'Tage')}
        </div>
      </div>
      <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
        <div className="text-4xl font-bold">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-sm font-semibold mt-1">
          {formatUnit(timeLeft.hours, 'Stunde', 'Stunden')}
        </div>
      </div>
      <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
        <div className="text-4xl font-bold">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-sm font-semibold mt-1">
          {formatUnit(timeLeft.minutes, 'Minute', 'Minuten')}
        </div>
      </div>
      <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
        <div className="text-4xl font-bold">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-sm font-semibold mt-1">
          {formatUnit(timeLeft.seconds, 'Sekunde', 'Sekunden')}
        </div>
      </div>
    </div>
  );
}
